/**
 * Core move classifier — assigns a chess.com-style quality label to each move
 * of a game from the engine's per-position evaluations.
 *
 * Ported from chess-kit's `src/lib/engine/helpers/moveClassification.ts`.
 * Algorithm (evaluated per move in priority order):
 *   1. Opening   — position is a known book position (skipped until the ECO
 *                  data set is ported in Phase 4; always falls through).
 *   2. Forced    — previous position had only one legal line (multipv length 1).
 *   3. Brilliant — a piece sacrifice that maintains advantage (chess-kit
 *                  "Splendid"; relabeled to match the DB schema union).
 *   4. Great     — the move swung the game decisively or was the only good
 *                  move (chess-kit "Perfect"; relabeled).
 *   5. Best      — equals the engine's bestmove.
 *   6. fallback  — by win-percentage delta: Blunder / Mistake / Inaccuracy /
 *                  Good / Excellent.
 *
 * The Brilliant and Great branches require MultiPV ≥ 2 (the alternate-line
 * logic reads `prevPosition.lines[1]`), which is why the analyze route sets
 * MultiPV=3 by default.
 *
 * One adaptation beyond the enum relabel: the opening-lookup branch is gated
 * on an injectable `openings` map so this module works standalone before the
 * ECO data ships in Phase 4.
 */
import type { LineEval, PositionEval } from "./types";
import { MoveClassification } from "./types";
import {
  getLineWinPercentage,
  getPositionWinPercentage,
} from "./winPercentage";
import {
  getIsPieceSacrifice,
  isSimplePieceRecapture,
} from "./chess-helpers";

/** Opening FEN → name map. Empty by default; Phase 4 wires the ECO data. */
export interface OpeningBook {
  /** Look up an opening by the board-placement part of a FEN. */
  getByBoard?(boardFen: string): string | undefined;
}

export interface ClassifyOptions {
  openings?: OpeningBook;
}

/**
 * Classify every move of a game.
 *
 * @param rawPositions  Engine eval for each position the game visits, INCLUDING
 *                       the starting position at index 0 (before move 1). The
 *                       classifier reads `positions[index]` as the position
 *                       AFTER move `index`, so the caller must pass N+1 evals
 *                       for an N-move game (chess-kit's convention).
 * @param uciMoves       The game's moves in UCI, length N (no entry for the
 *                       starting position).
 * @param fens           FEN BEFORE each move, length N+1 (same indexing as
 *                       rawPositions).
 */
export const getMovesClassification = (
  rawPositions: PositionEval[],
  uciMoves: string[],
  fens: string[],
  options: ClassifyOptions = {},
): PositionEval[] => {
  const openings = options.openings;
  const positionsWinPercentage = rawPositions.map(getPositionWinPercentage);
  let currentOpening: string | undefined;

  const positions = rawPositions.map((rawPosition, index) => {
    if (index === 0) return rawPosition; // starting position — no move to label

    // 1. Opening (book) — skip if no openings data wired yet.
    if (openings?.getByBoard) {
      const currentBoard = fens[index]!.split(" ")[0]!;
      const opening = openings.getByBoard(currentBoard);
      if (opening) {
        currentOpening = opening;
        return {
          ...rawPosition,
          opening: opening,
          moveClassification: MoveClassification.Opening,
        };
      }
    }

    const prevPosition = rawPositions[index - 1]!;

    // 2. Forced — only one line available in the previous position.
    if (prevPosition.lines.length === 1) {
      return {
        ...rawPosition,
        opening: currentOpening,
        moveClassification: MoveClassification.Forced,
      };
    }

    const playedMove = uciMoves[index - 1]!;

    // The best line that does NOT start with the played move (the "second
    // choice") — used by Brilliant/Great to gauge how unique the played move is.
    const lastPositionAlternativeLine: LineEval | undefined =
      prevPosition.lines.find((line) => line.pv[0] !== playedMove);
    const lastPositionAlternativeLineWinPercentage = lastPositionAlternativeLine
      ? getLineWinPercentage(lastPositionAlternativeLine)
      : undefined;

    const bestLinePvToPlay = rawPositions[index]!.lines[0]?.pv ?? [];

    const lastPositionWinPercentage = positionsWinPercentage[index - 1]!;
    const positionWinPercentage = positionsWinPercentage[index]!;

    const sideToMove = fens[index - 1]!.split(" ")[1];
    const isWhiteMove = sideToMove === "w";

    // 3. Brilliant (sacrifice that holds).
    if (
      isSplendidMove(
        lastPositionWinPercentage,
        positionWinPercentage,
        isWhiteMove,
        playedMove,
        bestLinePvToPlay,
        fens[index - 1]!,
        lastPositionAlternativeLineWinPercentage,
      )
    ) {
      return {
        ...rawPosition,
        opening: currentOpening,
        moveClassification: MoveClassification.Brilliant,
      };
    }

    // 4. Great (game-swinging or uniquely good).
    const fenTwoMovesAgo = index > 1 ? fens[index - 2]! : null;
    const uciNextTwoMoves: [string, string] | null =
      index > 1 ? [uciMoves[index - 2]!, uciMoves[index - 1]!] : null;
    if (
      isPerfectMove(
        lastPositionWinPercentage,
        positionWinPercentage,
        isWhiteMove,
        lastPositionAlternativeLineWinPercentage,
        fenTwoMovesAgo,
        uciNextTwoMoves,
      )
    ) {
      return {
        ...rawPosition,
        opening: currentOpening,
        moveClassification: MoveClassification.Great,
      };
    }

    // 5. Best (matches the engine's bestmove).
    if (playedMove === prevPosition.bestMove) {
      return {
        ...rawPosition,
        opening: currentOpening,
        moveClassification: MoveClassification.Best,
      };
    }

    // 6. Fallback by win-% delta.
    const moveClassification = getMoveBasicClassification(
      lastPositionWinPercentage,
      positionWinPercentage,
      isWhiteMove,
    );
    return {
      ...rawPosition,
      opening: currentOpening,
      moveClassification,
    };
  });

  return positions;
};

const getMoveBasicClassification = (
  lastPositionWinPercentage: number,
  positionWinPercentage: number,
  isWhiteMove: boolean,
): MoveClassification => {
  const winPercentageDiff =
    (positionWinPercentage - lastPositionWinPercentage) *
    (isWhiteMove ? 1 : -1);
  if (winPercentageDiff < -20) return MoveClassification.Blunder;
  if (winPercentageDiff < -10) return MoveClassification.Mistake;
  if (winPercentageDiff < -5) return MoveClassification.Inaccuracy;
  if (winPercentageDiff < -2) return MoveClassification.Good;
  return MoveClassification.Excellent;
};

const isSplendidMove = (
  lastPositionWinPercentage: number,
  positionWinPercentage: number,
  isWhiteMove: boolean,
  playedMove: string,
  bestLinePvToPlay: string[],
  fen: string,
  lastPositionAlternativeLineWinPercentage: number | undefined,
): boolean => {
  if (lastPositionAlternativeLineWinPercentage === undefined) return false;
  const winPercentageDiff =
    (positionWinPercentage - lastPositionWinPercentage) *
    (isWhiteMove ? 1 : -1);
  if (winPercentageDiff < -2) return false;

  const isPieceSacrifice = getIsPieceSacrifice(fen, playedMove, bestLinePvToPlay);
  if (!isPieceSacrifice) return false;

  if (
    isLosingOrAlternateCompletelyWinning(
      positionWinPercentage,
      lastPositionAlternativeLineWinPercentage,
      isWhiteMove,
    )
  ) {
    return false;
  }
  return true;
};

const isLosingOrAlternateCompletelyWinning = (
  positionWinPercentage: number,
  lastPositionAlternativeLineWinPercentage: number,
  isWhiteMove: boolean,
): boolean => {
  const isLosing = isWhiteMove
    ? positionWinPercentage < 50
    : positionWinPercentage > 50;
  const isAlternateCompletelyWinning = isWhiteMove
    ? lastPositionAlternativeLineWinPercentage > 97
    : lastPositionAlternativeLineWinPercentage < 3;
  return isLosing || isAlternateCompletelyWinning;
};

const isPerfectMove = (
  lastPositionWinPercentage: number,
  positionWinPercentage: number,
  isWhiteMove: boolean,
  lastPositionAlternativeLineWinPercentage: number | undefined,
  fenTwoMovesAgo: string | null,
  uciMoves: [string, string] | null,
): boolean => {
  if (lastPositionAlternativeLineWinPercentage === undefined) return false;
  const winPercentageDiff =
    (positionWinPercentage - lastPositionWinPercentage) *
    (isWhiteMove ? 1 : -1);
  if (winPercentageDiff < -2) return false;

  if (fenTwoMovesAgo && uciMoves && isSimplePieceRecapture(fenTwoMovesAgo, uciMoves))
    return false;

  if (
    isLosingOrAlternateCompletelyWinning(
      positionWinPercentage,
      lastPositionAlternativeLineWinPercentage,
      isWhiteMove,
    )
  ) {
    return false;
  }

  const hasChangedGameOutcome = getHasChangedGameOutcome(
    lastPositionWinPercentage,
    positionWinPercentage,
    isWhiteMove,
  );
  const isTheOnlyGoodMove = getIsTheOnlyGoodMove(
    positionWinPercentage,
    lastPositionAlternativeLineWinPercentage,
    isWhiteMove,
  );
  return hasChangedGameOutcome || isTheOnlyGoodMove;
};

const getHasChangedGameOutcome = (
  lastPositionWinPercentage: number,
  positionWinPercentage: number,
  isWhiteMove: boolean,
): boolean => {
  const winPercentageDiff =
    (positionWinPercentage - lastPositionWinPercentage) *
    (isWhiteMove ? 1 : -1);
  return (
    winPercentageDiff > 10 &&
    ((lastPositionWinPercentage < 50 && positionWinPercentage > 50) ||
      (lastPositionWinPercentage > 50 && positionWinPercentage < 50))
  );
};

const getIsTheOnlyGoodMove = (
  positionWinPercentage: number,
  lastPositionAlternativeLineWinPercentage: number,
  isWhiteMove: boolean,
): boolean => {
  const winPercentageDiff =
    (positionWinPercentage - lastPositionAlternativeLineWinPercentage) *
    (isWhiteMove ? 1 : -1);
  return winPercentageDiff > 10;
};
