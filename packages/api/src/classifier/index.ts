/**
 * classifyGame — orchestrates the engine + classifier to produce per-move
 * analysis for a single PGN.
 *
 * Flow:
 *   1. Parse the PGN with chess.js; collect the N+1 FENs (start + before each
 *      move) and the N UCI moves.
 *   2. Ask the engine to evaluate each FEN at MultiPV ≥ 2 (required for the
 *      Brilliant/Great/Best branches). Scores come back from the side-to-move's
 *      perspective.
 *   3. Run `getMovesClassification` to label each move.
 *   4. Project to the `MoveAnalysis[]` shape stored in the DB `analysis`
 *      column: { san, evalCp, mate, classification } per move, white-relative.
 *
 * The engine is lazy/optional — if no Stockfish binary is present, this throws
 * `EngineUnavailableError` and the route returns 503 (review of pre-analyzed
 * games still works).
 */
import { Chess } from "chess.js";
import { analyze, EngineUnavailableError } from "../engine";
import type { PositionEval } from "../engine/types";
import { getMovesClassification } from "./moveClassification";
import { computeAccuracy } from "./accuracy";
import type { MoveClassification } from "./types";

export { EngineUnavailableError } from "../engine";
export { MoveClassification } from "./types";

/** One move's analysis — matches `MoveAnalysis` in packages/db/schema/games.ts. */
export interface MoveAnalysis {
  san: string;
  /** Centipawn eval, WHITE-relative (+ = good for white). */
  evalCp?: number;
  /** Mate score, WHITE-relative plies (positive = white mates). */
  mate?: number;
  classification?: MoveClassification;
}

/** Result of classifying a whole game. */
export interface GameAnalysis {
  moves: MoveAnalysis[];
  /** Per-player accuracy % (0-100). */
  accuracy: { white: number; black: number };
}

export interface ClassifyGameOptions {
  /** Search depth per position (default 18). */
  depth?: number;
  /** MultiPV (default 3 — enables Brilliant/Great/Best). */
  multiPv?: number;
  /** Optional progress callback: 0..1. */
  onProgress?: (fraction: number) => void;
}

/**
 * Analyze and classify a PGN game. Throws on invalid PGN or engine failure.
 */
export async function classifyGame(
  pgn: string,
  opts: ClassifyGameOptions = {},
): Promise<GameAnalysis> {
  const { depth = 18, multiPv = 3, onProgress } = opts;

  // 1. Parse the PGN and build the FEN/move lists in chess-kit's convention:
  //    fens has N+1 entries (start + before each move), uciMoves has N.
  const game = new Chess();
  game.loadPgn(pgn);
  const verbose = game.history({ verbose: true });
  if (verbose.length === 0) {
    return { moves: [], accuracy: { white: 100, black: 100 } };
  }
  const fens: string[] = [verbose[0]!.before];
  const uciMoves: string[] = [];
  for (const m of verbose) {
    uciMoves.push(`${m.from}${m.to}${m.promotion ?? ""}`);
    fens.push(m.before === fens[fens.length - 1] ? m.after : m.before);
  }
  // The last position (after the final move) is needed by the classifier's
  // per-position win-% array; chess-kit pushes history[last].after as the
  // final element. Fix the fens array to match:
  fens[fens.length - 1] = verbose[verbose.length - 1]!.after;
  // And we need one more "before" — rebuild cleanly:
  const fensFixed: string[] = verbose.map((m) => m.before);
  fensFixed.push(verbose[verbose.length - 1]!.after);

  // 2. Evaluate each position with the engine.
  const rawPositions: PositionEval[] = [];
  for (let i = 0; i < fensFixed.length; i++) {
    const eval_ = await analyze(fensFixed[i]!, { depth, multiPv });
    // Ensure at least one line exists (the classifier reads lines[0]).
    if (eval_.lines.length === 0) {
      throw new Error(`Engine returned no lines for position ${i}`);
    }
    rawPositions.push(eval_);
    onProgress?.((i + 1) / fensFixed.length);
  }

  // 3. Classify.
  const classified = getMovesClassification(
    rawPositions,
    uciMoves,
    fensFixed,
  );
  const accuracy = computeAccuracy(classified);

  // 4. Project to MoveAnalysis[] (white-relative evals + SAN + label).
  // The classifier's win-% is side-to-move-relative; we flip cp/mate to
  // white-relative for storage so the review UI can render one eval bar.
  const moves: MoveAnalysis[] = verbose.map((m, i) => {
    const pos = classified[i + 1]!; // the position AFTER move i
    const line = pos.lines[0]!;
    const sideToMoveIsWhite = m.color === "w";
    return {
      san: m.san,
      evalCp:
        line.cp !== undefined
          ? sideToMoveIsWhite
            ? line.cp
            : -line.cp
          : undefined,
      mate:
        line.mate !== undefined
          ? sideToMoveIsWhite
            ? line.mate
            : -line.mate
          : undefined,
      classification: pos.moveClassification,
    };
  });

  return { moves, accuracy };
}
