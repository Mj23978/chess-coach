/**
 * Lichess API client.
 *
 * Lichess personal/OAuth tokens grant scoped access. We use:
 *  - `GET /api/account` (Bearer) → the authenticated user's profile + perfs.
 *  - `GET /api/user/:username` → public profile (no token).
 *  - `GET /api/games/user/:username` → a streamed PGN export of a user's games.
 *
 * The games export is a single `text/x-chess-pgn` body containing many
 * concatenated PGN games. We split it on `[Event` boundaries (see
 * `splitPgnStream`) and parse headers out of each game with chess.js.
 *
 * Lichess personal tokens do not expire unless revoked, so `tokenExpiresAt` is
 * left null; the OAuth token-exchange response has no `refresh_token`.
 */
import { Chess } from "chess.js";
import type { RatingSnapshot, SyncedGame } from "./types";

const LICHESS_BASE = "https://lichess.org";

/** Account/profile payload subset. `.passthrough()` keeps extras. */
function parseAccount(raw: unknown): {
  id: string;
  username: string;
  ratings: RatingSnapshot[];
} {
  const r = raw as Record<string, any>;
  const perfs = (r.perfs ?? {}) as Record<string, { games?: number; rating?: number }>;
  const ratings: RatingSnapshot[] = [];
  for (const [key, perf] of Object.entries(perfs)) {
    if (perf && typeof perf.rating === "number") {
      ratings.push({ key, rating: perf.rating, games: perf.games });
    }
  }
  return { id: String(r.id ?? r.username ?? ""), username: String(r.username ?? ""), ratings };
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

/** Authenticated user (from OAuth token). */
export async function getAccount(token: string): Promise<{
  id: string;
  username: string;
  ratings: RatingSnapshot[];
}> {
  const res = await fetch(`${LICHESS_BASE}/api/account`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    throw new Error(`Lichess /api/account ${res.status}`);
  }
  return parseAccount(await res.json());
}

/** Public profile by username (no token needed). */
export async function getAccountByUsername(
  username: string,
): Promise<{ id: string; username: string; ratings: RatingSnapshot[] }> {
  const res = await fetch(
    `${LICHESS_BASE}/api/user/${encodeURIComponent(username)}`,
  );
  if (!res.ok) {
    throw new Error(`Lichess /api/user/${username} ${res.status}`);
  }
  return parseAccount(await res.json());
}

/**
 * Split a concatenated PGN stream (many games in one body) into individual
 * PGN blobs. A new game starts at a `[Event` header that follows movetext.
 */
export function splitPgnStream(text: string): string[] {
  const games: string[] = [];
  let current: string[] = [];
  let seenMovetext = false;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (line.startsWith("[Event") && seenMovetext) {
      flush();
    }
    current.push(line);
    if (!line.startsWith("[") && line.length > 0) seenMovetext = true;
  }
  flush();
  return games.filter(Boolean);

  function flush() {
    const g = current.join("\n").trim();
    if (g) games.push(g);
    current = [];
    seenMovetext = false;
  }
}

/** Pull header values out of a single PGN blob (tolerant; returns "" if absent). */
function header(pgn: string, name: string): string {
  const m = pgn.match(new RegExp(`\\[${name}\\s+"([^"]*)"\\]`));
  return m?.[1] ?? "";
}

function parsePgnDate(pgn: string): string | undefined {
  // Lichess uses UTCDate "YYYY.MM.DD" + UTCTime "HH:MM:SS".
  const date = header(pgn, "UTCDate") || header(pgn, "Date");
  const time = header(pgn, "UTCTime");
  if (!date) return undefined;
  const iso = date.replace(/\./g, "-");
  return time ? `${iso}T${time}Z` : `${iso}`;
}

/** Normalize one Lichess PGN into a SyncedGame (null if it lacks movetext). */
function normalizeLichessPgn(pgn: string): SyncedGame | null {
  // Reject games that are headers-only (no movetext) by checking chess.js load.
  let movetextOk = false;
  try {
    const g = new Chess();
    g.loadPgn(pgn);
    movetextOk = g.history().length > 0;
  } catch {
    return null;
  }
  if (!movetextOk) return null;
  return {
    pgn,
    white: header(pgn, "White"),
    black: header(pgn, "Black"),
    result: header(pgn, "Result") || "*",
    playedAt: parsePgnDate(pgn),
    timeControl: header(pgn, "TimeControl"),
    eco: header(pgn, "ECO") || undefined,
    opening: header(pgn, "Opening") || undefined,
    sourceUrl: siteUrl(pgn),
  };
}

/** The `[Site "https://lichess.org/XXXX"]` value, if present. */
function siteUrl(pgn: string): string | undefined {
  const url = header(pgn, "Site");
  return url || undefined;
}

export interface LichessGameFetchOptions {
  /** Only games after this Unix-epoch millisecond timestamp. */
  since?: number;
  /** Cap on number of games (default 100). Lichess enforces ≤1000. */
  max?: number;
  /** Include `[Opening]` / `[ECO]` headers (default true). */
  opening?: boolean;
  onProgress?: (fetched: number) => void;
}

/**
 * Stream a user's games and return normalized SyncedGame[].
 *
 * Uses the authenticated token when provided (includes private games + lifts
 * rate limits); falls back to public export otherwise. `since` is in ms.
 */
export async function listGames(
  username: string,
  opts: LichessGameFetchOptions = {},
): Promise<SyncedGame[]> {
  const { since, max = 100, opening = true, onProgress } = opts;
  const url = new URL(`${LICHESS_BASE}/api/games/user/${encodeURIComponent(username)}`);
  if (since != null) url.searchParams.set("since", String(since));
  url.searchParams.set("max", String(max));
  url.searchParams.set("moves", "true");
  url.searchParams.set("opening", opening ? "true" : "false");
  url.searchParams.set("clocks", "false");
  url.searchParams.set("evals", "false");

  const res = await fetch(url, {
    headers: { Accept: "application/x-chess-pgn" },
  });
  if (!res.ok) {
    throw new Error(`Lichess games export ${res.status} for ${username}`);
  }
  const text = await res.text();
  const blobs = splitPgnStream(text);
  const games: SyncedGame[] = [];
  for (const blob of blobs) {
    const norm = normalizeLichessPgn(blob);
    if (norm) games.push(norm);
    onProgress?.(games.length);
  }
  return games;
}

/**
 * Sync a Lichess account's games incrementally.
 *
 * Incremental: pass the account's `lastSyncedAt` as `since` (ms) so Lichess
 * only returns games played after the last sync. Per-game dedup against
 * already-stored games is the route's job.
 */
export async function syncLichessGames(
  account: {
    username: string;
    lastSyncedAt: Date | null;
    accessToken: string | null;
  },
  opts?: { max?: number; onProgress?: (fetched: number) => void },
): Promise<SyncedGame[]> {
  return listGames(account.username, {
    since: account.lastSyncedAt
      ? account.lastSyncedAt.getTime()
      : undefined,
    max: opts?.max,
    onProgress: opts?.onProgress,
  });
}
