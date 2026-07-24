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
 *
 * Engine selection:
 *  - First checks for an active engine in the database (user-configured).
 *  - Falls back to a binary in the `binaries/` directory (dev/bundled).
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
 * 
 * Selection order:
 *  1. Active engine from database (user-configured)
 *  2. Fallback binary in binaries/ directory
 */
function getEngine(): Promise<UciEngine> {
  if (!enginePromise) {
    enginePromise = (async () => {
      // Try to get active engine from database
      let enginePath: string | null = null;
      try {
        // Dynamic import to avoid circular dependency
        const { engineRepository } = await import("@repo/db");
        const activeEngine = await engineRepository.getActive();
        if (activeEngine?.path && activeEngine.exists) {
          enginePath = activeEngine.path;
        }
      } catch {
        // DB not initialized or no active engine
      }
      
      // Fallback to bundled binary
      if (!enginePath) {
        enginePath = resolveStockfishPath();
      }
      
      if (!enginePath) {
        throw new EngineUnavailableError(
          "No engine configured. Add an engine via Settings → Engines, " +
            "or drop a Stockfish binary in the repo's `binaries/` directory.",
        );
      }
      // Sensible desktop defaults. Threads/Hash are tuned low so the engine
      // doesn't hog the machine during review; MultiPV is set per-analyze.
      const eng = await UciEngine.create(enginePath);
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
