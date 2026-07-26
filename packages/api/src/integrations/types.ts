/**
 * Shared types for the platform integration clients (Chess.com / Lichess).
 *
 * Both syncers normalize downloaded games into `SyncedGame`, which the account
 * route turns into `games` rows (with `source` + `accountId`). Keeping the
 * clients pure (no DB access) makes them easy to test and reuse.
 */

/**
 * Normalized representation of one downloaded game, before it becomes a `games`
 * row. `pgn` is the canonical movetext+headers blob; the rest are denormalized
 * for fast display / filtering without re-parsing.
 */
export interface SyncedGame {
  /** Full PGN (headers + movetext), exactly as served by the platform. */
  pgn: string;
  white: string;
  black: string;
  /** PGN result tag value: "1-0" | "0-1" | "1/2-1/2" | "*". */
  result: string;
  /** ISO timestamp the game ended / was played (best-effort). */
  playedAt?: string;
  /** Platform time-control descriptor, e.g. "600+5" or "blitz". */
  timeControl?: string;
  /** ECO code, e.g. "C50". */
  eco?: string;
  /** Human-readable opening name, e.g. "Italian Game". */
  opening?: string;
  /** Permalink to the game on the platform. */
  sourceUrl?: string;
}

/** Per-time-control rating snapshot returned by the stats endpoints. */
export interface RatingSnapshot {
  /** Time-control key, e.g. "blitz" | "rapid" | "bullet" | "daily". */
  key: string;
  /** Current/last rating. */
  rating: number;
  /** Number of games played in this mode (when known). */
  games?: number;
}

/** Result of syncing an account. */
export interface SyncResult {
  /** Games newly inserted into the DB (after dedup). */
  synced: number;
  /** Games the platform served in this run (before dedup). */
  fetched: number;
}
