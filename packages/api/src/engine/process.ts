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
  private stdout: import("node:stream").Readable;
  /** Buffered stdout lines waiting to be read by a consumer. */
  private lineQueue: string[] = [];
  private lineWaiters: Array<(line: string | null) => void> = [];
  private terminated = false;
  private readonly knownOptions = new Set<string>();

  private constructor(
    proc: Subprocess<"pipe", "pipe", "pipe">,
    stdin: import("node:stream").Writable,
    stdout: import("node:stream").Readable,
  ) {
    this.proc = proc;
    this.stdin = stdin;
    this.stdout = stdout;
    // Wire stdout into a line-buffered async reader. Each full line resolves
    // the next waiter in FIFO order; null signals EOF (process exited).
    let buf = "";
    this.stdout.on("data", (chunk: Buffer) => {
      buf += chunk.toString("utf-8");
      let idx: number;
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx).replace(/\r$/, "");
        buf = buf.slice(idx + 1);
        this.dispatchLine(line);
      }
    });
    this.stdout.on("end", () => {
      if (buf.length) this.dispatchLine(buf);
      // Wake all waiters with EOF.
      while (this.lineWaiters.length) this.lineWaiters.shift()!(null);
    });
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

  /** Send a raw UCI command (newline appended). */
  private send(cmd: string): void {
    this.stdin.write(`${cmd}\n`);
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
    // Bun.spawn returns .stdin/.stdout as Web ReadableStream / WritableStream,
    // not Node.js streams. Convert them so we can use the Node.js
    // EventEmitter API (.on("data"), .on("end")) in the constructor.
    //
    // Readable.fromWeb() wraps a Web ReadableStream into a Node.js Readable,
    // and process.stdin-style .write() works on the Web WritableStream directly
    // (Bun's WritableStream implements the Node.js .write() interface).
    const stdin = proc.stdin as unknown as import("node:stream").Writable;
    const stdout = Readable.fromWeb(
      proc.stdout as unknown as import("node:stream/web").ReadableStream<Uint8Array>,
    );
    // CRITICAL: drain stderr continuously. Stockfish (and other UCI engines)
    // write diagnostics to stderr — e.g. Stockfish 18 prints a sizable
    // `INFO: ... NNUE evaluation ...` block at startup and may emit more during
    // search. The OS pipe buffer is small (~4KB on Windows); if nobody reads
    // stderr, it fills and the engine BLOCKS on its next stderr write, which
    // also stalls its stdout output. The observable symptom is exactly the
    // handshake succeeding (the initial stderr burst fits in the buffer) but
    // the first `go` producing no `info`/`bestmove` lines until the 60s
    // analyze timeout fires. Draining stderr prevents this deadlock.
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

    const eng = new UciEngine(proc, stdin, stdout);

    try {
      eng.send("uci");
      // Wait for uciok (10s).
      await eng.waitFor("uciok", 10_000);
      eng.send("isready");
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
    this.send(`setoption name ${name} value ${value}`);
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
    // Configure MultiPV before each search — engines apply it at the next go.
    await this.setOption("MultiPV", multiPv);
    this.send(`position fen ${fen}`);
    const goCmd =
      movetime != null
        ? `go movetime ${movetime}`
        : `go depth ${depth}`;
    this.send(goCmd);

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
      this.send("quit");
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
