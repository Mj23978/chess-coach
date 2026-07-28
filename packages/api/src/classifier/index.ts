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
  /** Search depth per position (default 15 — the "fast" tier). */
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
  const { depth = 15, multiPv = 3, onProgress } = opts;

  // 1. Parse the PGN and build the FEN/move lists in chess-kit's convention:
  //    fensFixed has N+1 entries: [before move 1, before move 2, ..., after last move].
  //    uciMoves has N entries.
  //
  //    We replay the game with a Chess instance so we can detect terminal
  //    positions (checkmate/stalemate/draw) directly — the engine prints
  //    `bestmove (none)` on those and returns empty lines, so we must NOT ask
  //    it to search them (it would also waste time and previously aborted the
  //    whole game with a 60s timeout on the final mating ply).
  const game = new Chess();
  game.loadPgn(pgn);
  const verbose = game.history({ verbose: true });
  if (verbose.length === 0) {
    return { moves: [], accuracy: { white: 100, black: 100 } };
  }
  const uciMoves: string[] = verbose.map(
    (m) => `${m.from}${m.to}${m.promotion ?? ""}`,
  );
  const fensFixed: string[] = verbose.map((m) => m.before);
  fensFixed.push(verbose[verbose.length - 1]!.after);

  // Re-walk the game to know each position's game-over state. chess.js only
  // reports isCheckmate()/isDraw() for the CURRENT position, so we replay move
  // by move (on a fresh instance) and snapshot the flags into a parallel array.
  const replay = new Chess();
  const terminalFlags: Array<{
    checkmate: boolean;
    stalemate: boolean;
    draw: boolean;
  }> = [];
  // Position 0 is the start position (never terminal in a real game).
  terminalFlags.push({
    checkmate: replay.isCheckmate(),
    stalemate: replay.isStalemate(),
    draw: replay.isDraw(),
  });
  for (const m of verbose) {
    replay.move({ from: m.from, to: m.to, promotion: m.promotion });
    terminalFlags.push({
      checkmate: replay.isCheckmate(),
      stalemate: replay.isStalemate(),
      draw: replay.isDraw(),
    });
  }

  // 2. Evaluate each position. Terminal positions (checkmate/stalemate/draw)
  //    are synthesized locally — the engine has nothing to say about them and
  //    asking wastes time (and previously timed out the whole analysis).
  const rawPositions: PositionEval[] = [];
  for (let i = 0; i < fensFixed.length; i++) {
    const fen = fensFixed[i]!;
    const t = terminalFlags[i]!;
    if (t.checkmate || t.stalemate || t.draw) {
      let mate: number | undefined;
      let cp: number | undefined;
      if (t.checkmate) {
        // Side to move is checkmated → mate=0 from side-to-move's perspective
        // (the side to move has been mated; 0 plies because it's over now).
        mate = 0;
      } else {
        // Stalemate / other draw → equal eval.
        cp = 0;
      }
      rawPositions.push({
        fen,
        lines: [
          {
            multiPv: 1,
            depth: 0,
            cp,
            mate,
            pv: [],
          },
        ],
        terminal: true,
      });
      onProgress?.((i + 1) / fensFixed.length);
      continue;
    }
    const eval_ = await analyze(fen, { depth, multiPv });
    // Ensure at least one line exists (the classifier reads lines[0]).
    if (eval_.lines.length === 0) {
      throw new Error(`Engine returned no lines for position ${i}: ${fen}`);
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
