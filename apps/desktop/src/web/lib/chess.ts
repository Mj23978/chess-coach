/**
 * Chess logic helpers for the SPA, built on chess.js.
 *
 * chess.js owns move generation/validation/PGN parsing; this module adapts its
 * output to the shapes chessground and the classifier expect:
 *  - `legalDests(fen)` → chessground `Dests` (Map<square, target squares>).
 *  - `travelGame(pgn)` → the ordered list of { fen, uci, san } positions a game
 *    walks through, which is what the engine evaluates and the classifier
 *    labels.
 *
 * We use chess.js (not chessops) here because the classifier ported from
 * chess-kit also uses chess.js for its sacrifice/recapture heuristics — one
 * source of truth for move logic in the renderer.
 */
import { Chess, type Square, type Move } from "chess.js";
import type { Dests, Key } from "@lichess-org/chessground/types";

/** chess.js square names are already chessground keys (e.g. "e4"). */
const toKey = (s: Square): Key => s as Key;

/**
 * Build chessground legal-destination map for the side to move in `fen`.
 * Returns `null` if the FEN is invalid (caller can decide to skip rendering).
 */
export function legalDests(fen: string): Dests | null {
  let game: Chess;
  try {
    game = new Chess(fen);
  } catch {
    return null;
  }
  const dests: Dests = new Map();
  // chess.js `moves({ verbose: true })` returns legal moves from the current
  // turn's pieces; group their `from`→`to`.
  for (const m of game.moves({ verbose: true })) {
    const from = toKey(m.from);
    const to = toKey(m.to);
    const arr = dests.get(from);
    if (arr) arr.push(to);
    else dests.set(from, [to]);
  }
  return dests;
}

/** Color of the side to move in `fen` ("white" | "black"), or null if invalid. */
export function turnColor(fen: string): "white" | "black" | null {
  try {
    const g = new Chess(fen);
    return g.turn() === "w" ? "white" : "black";
  } catch {
    return null;
  }
}

/** True if `fen` is a valid, parseable chess position. */
export function isValidFen(fen: string): boolean {
  try {
    new Chess(fen);
    return true;
  } catch {
    return false;
  }
}

export interface GamePosition {
  /** FEN BEFORE the move at this index (the position being evaluated). */
  fen: string;
  /** The move played from this position, in UCI (e.g. "e2e4", "e7e8q"). */
  uci: string;
  /** The same move in SAN (e.g. "e4", "Nf3", "O-O", "exd8=Q"). */
  san: string;
  /** 1-based ply index (1 = white's first move). */
  ply: number;
  /** Display move number, e.g. move 1 covers plies 1 (white) + 2 (black). */
  moveNumber: number;
  color: "white" | "black";
}

/**
 * Walk a PGN and return the ordered list of positions the game visits.
 *
 * Each entry holds the FEN BEFORE that ply (`.before` on chess.js Move) plus
 * the ply itself. chess.js `history({ verbose: true })` already reconstructs
 * each Move's before/after FEN, so no manual replay is needed.
 *
 * Throws if the PGN is malformed (caller shows an error in the UI).
 */
export function travelGame(pgn: string): GamePosition[] {
  const game = new Chess();
  game.loadPgn(pgn); // throws on invalid PGN
  const moves: Move[] = game.history({ verbose: true });
  return moves.map((m, i) => ({
    fen: m.before,
    uci: `${m.from}${m.to}${m.promotion ?? ""}`,
    san: m.san,
    ply: i + 1,
    // Ply 1 = move 1 white; ply 2 = move 1 black; ply 3 = move 2 white; ...
    moveNumber: Math.floor(i / 2) + 1,
    color: m.color === "w" ? "white" : "black",
  }));
}

/** Final FEN of a PGN (the position after the last move). */
export function finalFen(pgn: string): string | null {
  try {
    const g = new Chess();
    g.loadPgn(pgn);
    const hist = g.history({ verbose: true });
    return hist.length ? hist[hist.length - 1]!.after : g.fen();
  } catch {
    return null;
  }
}

/** Result string parsed from PGN headers, or null. */
export function pgnResult(pgn: string): string | null {
  try {
    const g = new Chess();
    g.loadPgn(pgn);
    return g.getHeaders()["Result"] ?? null;
  } catch {
    return null;
  }
}

/** PGN headers as a plain object. */
export function pgnHeaders(pgn: string): Record<string, string> {
  try {
    const g = new Chess();
    g.loadPgn(pgn);
    return g.getHeaders();
  } catch {
    return {};
  }
}
