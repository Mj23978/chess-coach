/**
 * chess.js helpers for the move classifier: piece-sacrifice detection (the
 * "Brilliant" heuristic), simple-recapture detection (suppresses "Great" on
 * trivial recaptures), and material-difference computation.
 *
 * Ported from chess-kit's `src/lib/chess.ts` — only the three functions the
 * classifier imports, plus their private helpers. Unchanged logic; only
 * relative imports and dropped the react-chessboard types from the original.
 */
import { Chess, type PieceSymbol, type Square } from "chess.js";

/** Parse a UCI move string into chess.js's {from,to,promotion} param shape. */
export const uciMoveParams = (
  uciMove: string,
): { from: Square; to: Square; promotion?: string } => ({
  from: uciMove.slice(0, 2) as Square,
  to: uciMove.slice(2, 4) as Square,
  promotion: uciMove.slice(4, 5) || undefined,
});

/**
 * Is `uciMoves[1]` a trivial same-square recapture of `uciMoves[0]`? Such
 * trades are excluded from "Great" classification (recapturing freely isn't
 * noteworthy).
 */
export const isSimplePieceRecapture = (
  fen: string,
  uciMoves: [string, string],
): boolean => {
  const game = new Chess(fen);
  const moves = uciMoves.map((uciMove) => uciMoveParams(uciMove));
  if (moves[0]!.to !== moves[1]!.to) return false;
  const piece = game.get(moves[0]!.to);
  if (piece) return true;
  return false;
};

/**
 * Did the played move, followed by the engine's best-line PV, result in the
 * mover being down material? This is the chess.com "sacrifice" heuristic that
 * (combined with maintaining advantage) produces a "Brilliant" label.
 *
 * Walks `[playedMove, ...pv]` on a fresh game, tracking captured pieces per
 * side; cancels out mutual captures; returns false if the net is just an
 * equal pawn trade, true if the mover ends up down material.
 */
export const getIsPieceSacrifice = (
  fen: string,
  playedMove: string,
  bestLinePvToPlay: string[],
): boolean => {
  if (!bestLinePvToPlay.length) return false;

  const game = new Chess(fen);
  const whiteToPlay = game.turn() === "w";
  const startingMaterialDifference = getMaterialDifference(fen);

  let moves = [playedMove, ...bestLinePvToPlay];
  // The sacrifice check expects an even number of plies (so each side's
  // captures are comparable); drop a trailing odd ply.
  if (moves.length % 2 === 1) {
    moves = moves.slice(0, -1);
  }
  // Tolerance: stop tracking once two consecutive non-capturing moves occur.
  let nonCapturingMovesTemp = 1;

  const capturedPieces: { w: PieceSymbol[]; b: PieceSymbol[] } = {
    w: [],
    b: [],
  };
  for (const move of moves) {
    try {
      const fullMove = game.move(uciMoveParams(move));
      if (fullMove.captured) {
        capturedPieces[fullMove.color].push(fullMove.captured);
        nonCapturingMovesTemp = 1;
      } else {
        nonCapturingMovesTemp--;
        if (nonCapturingMovesTemp < 0) break;
      }
    } catch {
      // Illegal move in the PV (engines occasionally emit slightly off lines
      // near the end) — bail out as "not a sacrifice".
      return false;
    }
  }

  // Cancel out pairwise captures (a traded knight for knight isn't a sacrifice).
  for (const p of capturedPieces.w.slice(0)) {
    if (capturedPieces.b.includes(p)) {
      capturedPieces.b.splice(capturedPieces.b.indexOf(p), 1);
      capturedPieces.w.splice(capturedPieces.w.indexOf(p), 1);
    }
  }

  // Equal-ish pawn trades are not sacrifices.
  if (
    Math.abs(capturedPieces.w.length - capturedPieces.b.length) <= 1 &&
    capturedPieces.w.concat(capturedPieces.b).every((p) => p === "p")
  ) {
    return false;
  }

  const endingMaterialDifference = getMaterialDifference(game.fen());
  const materialDiff = endingMaterialDifference - startingMaterialDifference;
  const materialDiffPlayerRelative = whiteToPlay ? materialDiff : -materialDiff;

  return materialDiffPlayerRelative < 0;
};

/** Sum of material on the board, white-positive (pawn=1, N=B=3, R=5, Q=9). */
export const getMaterialDifference = (fen: string): number => {
  const game = new Chess(fen);
  const board = game.board().flat();
  return board.reduce((acc, square) => {
    if (!square) return acc;
    const piece = square.type;
    if (square.color === "w") {
      return acc + getPieceValue(piece);
    }
    return acc - getPieceValue(piece);
  }, 0);
};

const getPieceValue = (piece: PieceSymbol): number => {
  switch (piece) {
    case "p":
      return 1;
    case "n":
      return 3;
    case "b":
      return 3;
    case "r":
      return 5;
    case "q":
      return 9;
    default:
      return 0; // king
  }
};
