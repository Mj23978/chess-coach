/**
 * Engine types shared by the UCI process wrapper, the analyze route, and the
 * classifier. These mirror chess-kit's `PositionEval` / `LineEval` shapes so
 * the ported classifier can consume engine output without adaptation.
 */

/** A single principal-variation line from the engine (one of MultiPV). */
export interface LineEval {
  /** 1-based MultiPV index (1 = best line). */
  multiPv: number;
  /** Depth searched (plies). */
  depth: number;
  /** Centipawn score from the side-to-move's perspective (+ = good for mover). */
  cp?: number;
  /** Forced-mate score from the side-to-move's perspective (mate >0 = mover wins). */
  mate?: number;
  /** Principal variation as UCI moves, e.g. ["e2e4","e7e5"]. */
  pv: string[];
}

/** Full evaluation of one position: all MultiPV lines + the chosen best move. */
export interface PositionEval {
  /** FEN of the position this eval describes (before any PV move). */
  fen: string;
  /** MultiPV lines, indexed by `multiPv`. `lines[0]` is the best line. */
  lines: LineEval[];
  /** The engine's final bestmove (UCI). Equals `lines[0].pv[0]` unless stale. */
  bestMove?: string;
  /** Nodes searched, if reported. */
  nodes?: number;
  /** Nodes per second, if reported. */
  nps?: number;
  /**
   * True if this is a terminal position (checkmate/stalemate) — the engine
   * returned no legal moves. `lines` will be empty; the classifier synthesizes
   * a mate/draw eval from the game state instead of reading `lines[0]`.
   */
  terminal?: boolean;
}

/** Options for analyzing a single position. */
export interface AnalyzeOptions {
  /** Search depth in plies. Mutually exclusive with movetime. */
  depth?: number;
  /** Search time in milliseconds. Mutually exclusive with depth. */
  movetime?: number;
  /** Number of principal variations to return (≥2 enables Best/Brilliant). */
  multiPv?: number;
}
