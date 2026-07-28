/**
 * UciEngine — spawns and drives a native UCI chess engine (Stockfish) as a
 * child process from the Electrobun Bun main, speaking UCI over stdio.
 *
 * This is a TypeScript port of pawn-appetite's `EngineProcess` + the reader
 * loop in `manager.rs`, scoped to the synchronous "analyze one position"
 * flow the coach app needs. It deliberately does NOT implement pawn-appetite's
 * per-tab engine multiplexing — v1 has a single shared engine with a serialized
 * request queue (see `engine/index.ts`).
 *
 * Lifecycle:
 *   const eng = await UciEngine.create(binaryPath);
 *   await eng.setOption("Threads", "2");
 *   const eval = await eng.analyze(fen, { depth: 18, multiPv: 3 });
 *   await eng.terminate();
 *
 * The handshake (uci→uciok, isready→readyok) happens in `create()` with the
 * same timeouts pawn-appetite uses (10s for uciok, 5s for readyok), so a
 * missing or wrong-architecture binary fails fast with a clear error instead
 * of hanging the request.
 */
import { Subprocess } from "bun";
import { Readable } from "node:stream";
import { parseBestmove, parseInfoLine } from "./uci";
import type { AnalyzeOptions, LineEval, PositionEval } from "./types";

/** Windows-only: suppress the console window when spawning the engine. */
const CREATE_NO_WINDOW = 0x08000000;

export class UciEngine {
  private proc: Subprocess<"pipe", "pipe", "pipe">;
  private stdin: import("node:stream").Writable;
  /** Buffered stdout lines waiting to be read by a consumer. */
  private lineQueue: string[] = [];
  private lineWaiters: Array<(line: string | null) => void> = [];
  private terminated = false;
  private readonly knownOptions = new Set<string>();
  private stdoutLineCount = 0;

  private constructor(
    proc: Subprocess<"pipe", "pipe", "pipe">,
    stdin: import("node:stream").Writable,
  ) {
    this.proc = proc;
    this.stdin = stdin;
    // Drive stdout with Bun's NATIVE Web ReadableStream reader rather than
    // wrapping it through Readable.fromWeb(). We pull bytes directly via
    // getReader().read() in a background pump, line-buffer them, and dispatch
    // one line per pending waiter (FIFO); null signals EOF. This avoids
    // Node-stream-bridge quirks where flowing-mode `data` events can stall
    // when the Web source needs backpressure pulls — which produced exactly
    // the symptom of the handshake (a small burst) succeeding but the search
    // (a continuous stream) receiving no lines until the 60s timeout.
    const reader = (
      proc.stdout as unknown as import("node:stream/web").ReadableStream<Uint8Array>
    ).getReader();
    let buf = "";
    const decoder = new TextDecoder("utf-8");
    (async () => {
      try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let idx: number;
          while ((idx = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, idx).replace(/\r$/, "");
            buf = buf.slice(idx + 1);
            this.stdoutLineCount++;
            if (this.stdoutLineCount <= 40) {
              console.log(`[engine:stdout #${this.stdoutLineCount}] ${line}`);
            }
            this.dispatchLine(line);
          }
        }
        console.log(`[engine:stdout] EOF after ${this.stdoutLineCount} total lines`);
        if (buf.length) this.dispatchLine(buf);
        while (this.lineWaiters.length) this.lineWaiters.shift()!(null);
      } catch (err) {
        console.error("[engine:stdout] pump error:", err);
        while (this.lineWaiters.length) this.lineWaiters.shift()!(null);
      }
    })();
  }

  /** Dispatch one parsed line to the next waiting reader. */
  private dispatchLine(line: string): void {
    const waiter = this.lineWaiters.shift();
    if (waiter) waiter(line);
    else this.lineQueue.push(line);
  }

  /**
   * Read the next line from the engine's stdout. Resolves `null` on EOF.
   * Multiple concurrent consumers are served FIFO.
   */
  private nextLine(timeoutMs: number): Promise<string | null> {
    return new Promise<string | null>((resolve, reject) => {
      const timer = setTimeout(() => {
        // Drop this waiter from the queue on timeout so a later line doesn't
        // resolve an already-rejected promise.
        const i = this.lineWaiters.indexOf(settle);
        if (i >= 0) this.lineWaiters.splice(i, 1);
        reject(new Error(`Engine did not respond within ${timeoutMs}ms`));
      }, timeoutMs);
      const settle = (line: string | null) => {
        clearTimeout(timer);
        resolve(line);
      };
      if (this.lineQueue.length) {
        settle(this.lineQueue.shift()!);
      } else {
        this.lineWaiters.push(settle);
      }
    });
  }

  /**
   * Send a raw UCI command (newline appended) and flush.
   *
   * IMPORTANT: Bun's spawned-process stdin is a `FileSink`, whose `.write()`
   * is SYNCHRONOUS but only writes to an internal buffer — it does NOT push to
   * the underlying pipe until you call `.flush()`. Without the flush, commands
   * (e.g. `position ...` + `go`) sit in the buffer and the engine never
   * receives them. The UCI handshake happened to survive because Bun's first
   * sink write triggers an initial drain, but rapid follow-up writes (`go`
   * right after `position`) coalesce in the buffer and never reach the engine,
   * which then produces zero `info`/`bestmove` lines and the analyze loop
   * times out at 60s. `await flush()` is the documented way to guarantee
   * delivery.
   */
  private async send(cmd: string): Promise<void> {
    console.log(`[engine:stdin >>>] ${cmd}`);
    // Bun.spawn's stdin is a FileSink: write() is sync but buffers; flush()
    // pushes to the pipe. Guard for both Bun (FileSink) and Node (Writable)
    // shapes, and log once which shape we're driving so a missing flush is
    // visible in diagnostics.
    const stdinAny = this.stdin as {
      flush?: () => unknown;
      write?: (data: string, cb?: (err?: Error) => void) => unknown;
    };
    const writeRes = stdinAny.write ? stdinAny.write(`${cmd}\n`) : undefined;
    if (typeof stdinAny.flush === "function") {
      await stdinAny.flush.call(this.stdin);
    } else {
      // Node-style Writable: write is async; if it returned a promise-like,
      // await it; otherwise yield a tick to let it drain.
      if (writeRes && typeof (writeRes as { then?: (f: (v: unknown) => void) => void }).then === "function") {
        await writeRes;
      } else {
        await new Promise((r) => setTimeout(r, 0));
      }
    }
  }

  /**
   * Spawn the engine binary at `path` and complete the UCI handshake.
   * Throws if the engine doesn't answer `uciok`/`readyok` in time, which is
   * the symptom of a missing binary or an architecture mismatch (e.g. ARM
   * binary on x86).
   */
  static async create(path: string): Promise<UciEngine> {
    const isWin = process.platform === "win32";
    const proc = Bun.spawn({
      cmd: [path],
      stdin: "pipe",
      stdout: "pipe",
      stderr: "pipe",
      // Hide the engine's console window on Windows (pawn-appetite's
      // CREATE_NO_WINDOW). Bun exposes this via `windowsHide`.
      windowsHide: true,
      // Keep the engine attached to this process so it dies with the app.
      onExit: () => {},
    });
    // Bun.spawn returns .stdin as a FileSink and .stdout/.stderr as Web
    // ReadableStreams. We read stdout NATIVELY via getReader() inside the
    // constructor (see UciEngine ctor), and drain stderr here through
    // Readable.fromWeb() — stderr is fire-and-forget, so the Node bridge is
    // fine there.
    const stdin = proc.stdin as unknown as import("node:stream").Writable;
    // CRITICAL: drain stderr continuously. Stockfish (and other UCI engines)
    // write diagnostics to stderr — e.g. Stockfish 18 prints a sizable
    // `INFO: ... NNUE evaluation ...` block at startup and may emit more during
    // search. The OS pipe buffer is small (~4KB on Windows); if nobody reads
    // stderr, it fills and the engine BLOCKS on its next stderr write, which
    // also stalls its stdout output. Draining stderr prevents this deadlock.
    const stderr = Readable.fromWeb(
      proc.stderr as unknown as import("node:stream/web").ReadableStream<Uint8Array>,
    );
    let stderrBuf = "";
    stderr.on("data", (chunk: Buffer) => {
      stderrBuf += chunk.toString("utf-8");
      let idx: number;
      while ((idx = stderrBuf.indexOf("\n")) >= 0) {
        const line = stderrBuf.slice(0, idx).replace(/\r$/, "").trim();
        stderrBuf = stderrBuf.slice(idx + 1);
        if (line) console.log(`[engine:stderr] ${line}`);
      }
    });
    stderr.on("end", () => {
      if (stderrBuf.trim()) console.log(`[engine:stderr] ${stderrBuf.trim()}`);
    });

    const eng = new UciEngine(proc, stdin);

    // Diagnostics: record the exact shape of the Bun-provided stdin so we can
    // confirm flush()/write() semantics. FileSink has flush(); a plain Node
    // Writable does not.
    console.log(
      `[engine] stdio shapes — stdin: ${stdin.constructor?.name ?? typeof stdin} ` +
        `(hasFlush=${typeof (stdin as { flush?: unknown }).flush === "function"}), ` +
        `pid=${(proc as { pid?: number }).pid}`
    );

    try {
      await eng.send("uci");
      // Wait for uciok (10s).
      await eng.waitFor("uciok", 10_000);
      await eng.send("isready");
      await eng.waitFor("readyok", 5_000);
    } catch (err) {
      await eng.terminate();
      throw new Error(
        `Failed to initialize UCI engine at ${path}: ${(err as Error).message}. ` +
          `Check the binary exists and matches this OS/architecture (${
            isWin ? "win64" : process.platform
          }).`,
      );
    }
    return eng;
  }

  /**
   * Read lines until one contains `needle`, then return. Other lines are
   * discarded (handshake output isn't useful post-init). Times out after
   * `timeoutMs` to avoid hanging on a dead engine.
   */
  private async waitFor(needle: string, timeoutMs: number): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (true) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        throw new Error(`Engine did not send "${needle}" in time`);
      }
      const line = await this.nextLine(remaining);
      if (line === null) throw new Error(`Engine exited before sending "${needle}"`);
      if (line.includes(needle)) return;
    }
  }

  /** Set a UCI option (e.g. "Threads", "Hash", "MultiPV"). */
  async setOption(name: string, value: string | number): Promise<void> {
    // UCI requires setoption AFTER uciok but BEFORE go; we cache which we've
    // sent to avoid redundant repeats (pawn-appetite does the same).
    const key = `${name}=${value}`;
    if (this.knownOptions.has(key)) return;
    await this.send(`setoption name ${name} value ${value}`);
    this.knownOptions.add(key);
  }

  /**
   * Analyze one position. Sends `position fen ...` then `go ...`, collects
   * the deepest `info ... pv ...` line per MultiPV index until `bestmove`,
   * and returns them sorted by multiPv.
   *
   * The score/cp/mate in each line are from the SIDE-TO-MOVE's perspective
   * (UCI convention). Callers that need white-relative can flip for black.
   */
  async analyze(fen: string, opts: AnalyzeOptions = {}): Promise<PositionEval> {
    const { depth = 18, movetime, multiPv = 1 } = opts;
    // Diagnostics: confirm the child is still alive before issuing the search.
    // If it exited after the handshake, the pending read would hang until the
    // 60s timeout with no other clue.
    const pid = (this.proc as { pid?: number }).pid;
    const exited = (this.proc as { exited?: unknown }).exited;
    console.log(
      `[engine] analyze() begin — pid=${pid}, multiPv=${multiPv}, depth=${depth}, ` +
        `hasExitedSignal=${exited !== undefined}, terminated=${this.terminated}`
    );
    // Configure MultiPV before each search — engines apply it at the next go.
    await this.setOption("MultiPV", multiPv);
    await this.send(`position fen ${fen}`);
    const goCmd =
      movetime != null
        ? `go movetime ${movetime}`
        : `go depth ${depth}`;
    await this.send(goCmd);
    console.log("[engine] search started — waiting for info/bestmove lines...");

    // Collect the deepest line per MultiPV index. Each new `info` line at the
    // same/greater depth overwrites the previous for that index; the final
    // `bestmove` line ends the search.
    const bestByPv = new Map<number, LineEval>();
    let bestMove: string | undefined;
    let nodes: number | undefined;
    let nps: number | undefined;
    let sawAnyLine = false;
    let hitEof = false;

    while (true) {
      const line = await this.nextLine(60_000);
      if (line === null) {
        hitEof = true; // process exited / closed stdout
        break;
      }
      sawAnyLine = true;
      const trimmed = line.trim();
      const bm = parseBestmove(trimmed);
      if (bm !== null) {
        bestMove = bm;
        break;
      }
      const info = parseInfoLine(trimmed);
      if (info) {
        const prev = bestByPv.get(info.multiPv);
        // Keep the deepest line per MultiPV slot (later = deeper in Stockfish).
        if (!prev || info.depth >= prev.depth) {
          bestByPv.set(info.multiPv, {
            multiPv: info.multiPv,
            depth: info.depth,
            cp: info.cp,
            mate: info.mate,
            pv: info.pv,
          });
        }
      } else {
        // Capture nodes/nps from non-pv info lines as a side benefit.
        const n = / nodes (\d+)/.exec(trimmed);
        if (n) nodes = Number(n[1]);
        const s = / nps (\d+)/.exec(trimmed);
        if (s) nps = Number(s[1]);
      }
    }

    // If the search ended without a bestmove, surface a clear error rather than
    // returning an empty/ambiguous result. The two usual causes: the engine
    // process died (EOF — check [engine:stderr] logs for a crash), or no output
    // arrived at all within the 60s per-line timeout (stderr pipe deadlock, or
    // a position the engine can't search).
    if (!bestMove) {
      if (!sawAnyLine) {
        throw new Error(
          hitEof
            ? `Engine process exited without producing any output for position: ${fen}`
            : `Engine produced no info/bestmove lines within 60s for position: ${fen}`,
        );
      }
      throw new Error(
        `Engine ended search without a bestmove for position: ${fen}`,
      );
    }

    const lines = [...bestByPv.values()].sort((a, b) => a.multiPv - b.multiPv);
    return { fen, lines, bestMove, nodes, nps };
  }

  /** Gracefully terminate the engine (quit + kill fallback). */
  async terminate(): Promise<void> {
    if (this.terminated) return;
    this.terminated = true;
    try {
      await this.send("quit");
    } catch {
      // ignore — stdin may already be closed
    }
    // Give the process a moment to exit, then force-kill.
    setTimeout(() => {
      try {
        this.proc.kill();
      } catch {
        /* already dead */
      }
    }, 1000);
  }
}

/** Re-export the no-window flag for tests / diagnostics. */
export const _CREATE_NO_WINDOW = CREATE_NO_WINDOW;
