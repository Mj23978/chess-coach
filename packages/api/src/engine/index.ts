/**
 * Engine manager — a singleton UCI engine with a serialized request queue.
 *
 * v1 keeps a single long-lived Stockfish process and serves analyses one at a
 * time (per-tab multiplexing à la pawn-appetite is overkill until we add live
 * play). The queue guarantees the engine only ever `go`es for one request;
 * concurrent callers await their turn.
 *
 * The manager is LAZY: the engine binary isn't spawned until the first
 * `analyze()` call, so an app without a Stockfish binary still boots and can
 * review games whose `analysis` column was already populated.
 */
import { UciEngine } from "./process";
import { resolveStockfishPath } from "./resolve";
import type { AnalyzeOptions, PositionEval } from "./types";

export type { PositionEval, LineEval, AnalyzeOptions } from "./types";

let enginePromise: Promise<UciEngine> | null = null;

/** Serialize analyze() calls so the single engine process is never concurrent. */
let chain: Promise<unknown> = Promise.resolve();

/**
 * Lazily boot the singleton engine. Resolves to the same promise on repeat
 * calls. Throws if no binary is resolvable.
 */
function getEngine(): Promise<UciEngine> {
  if (!enginePromise) {
    enginePromise = (async () => {
      const path = resolveStockfishPath();
      if (!path) {
        throw new EngineUnavailableError(
          "No Stockfish binary found. Drop one in the repo's `binaries/` " +
            "directory (stockfish-win.exe / stockfish-macos[-arm64] / " +
            "stockfish-linux) and restart.",
        );
      }
      // Sensible desktop defaults. Threads/Hash are tuned low so the engine
      // doesn't hog the machine during review; MultiPV is set per-analyze.
      const eng = await UciEngine.create(path);
      await eng.setOption("Threads", "2");
      await eng.setOption("Hash", "128");
      return eng;
    })();
  }
  return enginePromise;
}

/** Thrown when no Stockfish binary is available. Routes translate this to 503. */
export class EngineUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EngineUnavailableError";
  }
}

/**
 * Analyze a single position. Calls are serialized through the chain so the
 * engine handles them one at a time. The returned `PositionEval` has scores
 * from the side-to-move's perspective (UCI convention).
 */
export function analyze(fen: string, opts?: AnalyzeOptions): Promise<PositionEval> {
  const run = async (): Promise<PositionEval> => {
    const eng = await getEngine();
    return eng.analyze(fen, opts);
  };
  // Chain: each caller awaits the previous one's completion before starting.
  const result = chain.then(run, run);
  // Keep the chain alive regardless of rejection (a failed analyze shouldn't
  // break the next queued caller). Swallow the rejection on the chain itself
  // so Node doesn't emit unhandled-rejection for the placeholder.
  chain = result.catch(() => {});
  return result;
}

/**
 * Free the engine process (graceful quit + kill). Tests call this between
 * runs; the desktop main never needs to.
 */
export async function shutdownEngine(): Promise<void> {
  if (enginePromise) {
    try {
      const eng = await enginePromise;
      await eng.terminate();
    } catch {
      /* ignore */
    }
    enginePromise = null;
    chain = Promise.resolve();
  }
}
