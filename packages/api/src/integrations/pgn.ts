/**
 * Server-side PGN helpers — the @repo/api counterpart to the SPA's
 * `lib/chess.ts::pgnHeaders`. Both use chess.js; this one runs on the Bun
 * server (e.g. inside the account-sync flow) to pull storage fields out of a
 * raw PGN without re-implementing a parser.
 *
 * `loadPgn` throws on malformed input — callers should wrap in try/catch and
 * skip the game (it is normal for a tiny fraction of platform PGNs to be
 * unparseable).
 */
import { Chess } from "chess.js";

export interface ParsedPgn {
  white?: string;
  black?: string;
  /** PGN `Result` tag value ("1-0" | "0-1" | "1/2-1/2" | "*"). */
  result?: string;
  /** PGN `Date` (or `UTCDate`) tag, e.g. "2024.06.01". */
  date?: string;
  /** ECO code, e.g. "C50". */
  eco?: string;
  /** Human-readable opening name. */
  opening?: string;
  /** Time control tag, e.g. "600+5". */
  timeControl?: string;
  /** Game termination reason. */
  termination?: string;
}

/**
 * Parse a PGN blob into a denormalized header object. Returns `null` if the
 * PGN cannot be parsed (so callers can skip without crashing a whole sync).
 */
export function parsePgnForStorage(pgn: string): ParsedPgn | null {
  try {
    const game = new Chess();
    game.loadPgn(pgn);
    const h = game.getHeaders();
    const result = (h.Result ?? "").trim();
    const date = (h.UTCDate ?? h.Date ?? "").trim();
    const eco = (h.ECO ?? "").trim();
    const opening = (h.Opening ?? "").trim();
    const timeControl = (h.TimeControl ?? "").trim();
    const termination = (h.Termination ?? "").trim();
    return {
      white: (h.White ?? "").trim() || undefined,
      black: (h.Black ?? "").trim() || undefined,
      result: result || undefined,
      date: date || undefined,
      eco: eco || undefined,
      opening: opening || undefined,
      timeControl: timeControl || undefined,
      termination: termination || undefined,
    };
  } catch {
    return null;
  }
}
