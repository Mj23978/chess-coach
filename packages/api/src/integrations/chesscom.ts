/**
 * Chess.com public-API client.
 *
 * Chess.com's pubapi needs no auth — only a descriptive `User-Agent` header
 * (they reject default fetch UAs). All endpoints are documented at
 * https://www.chess.com/news/view/pubapi-overview. Responses are validated with
 * zod where it matters; the shape is intentionally permissive so changes to
 * optional fields don't break sync.
 *
 * The syncer is pure I/O + parsing: it returns normalized `SyncedGame[]` and
 * leaves DB insertion/dedup to the account route.
 */
import { z } from "zod";
import type { RatingSnapshot, SyncedGame } from "./types";

const CHESS_COM_BASE = "https://api.chess.com";

/**
 * Chess.com requires a descriptive User-Agent. Include a contact-ish token even
 * though there's no real org behind this; some clients hit 403 without it.
 */
const USER_AGENT =
  process.env.CHESS_COM_USER_AGENT ?? "chess-coach/0.1 (+desktop)";

/** Per-mode stats object (last/best rating + W/L/D record). */
const perModeSchema = z
  .object({
    last: z.object({ rating: z.number(), date: z.number().optional() }).optional(),
    best: z.object({ rating: z.number() }).optional(),
    record: z
      .object({ win: z.number(), loss: z.number(), draw: z.number() })
      .optional(),
  })
  .partial();

/** Subset of the /stats payload we care about. `.passthrough()` ignores extras. */
const statsSchema = z
  .object({
    chess_daily: perModeSchema.optional(),
    chess_rapid: perModeSchema.optional(),
    chess_bullet: perModeSchema.optional(),
    chess_blitz: perModeSchema.optional(),
  })
  .passthrough();

/** One entry in an archive fetch (`/games/{YYYY}/{MM}`). */
const archiveGameSchema = z.object({
  url: z.string().url().optional(),
  pgn: z.string(),
  time_control: z.string().optional(),
  time_class: z.string().optional(),
  end_time: z.number().optional(),
  white: z.object({ username: z.string().optional(), rating: z.number().optional() }).partial().optional(),
  black: z.object({ username: z.string().optional(), rating: z.number().optional() }).partial().optional(),
});

const archivesSchema = z.object({
  archives: z.array(z.string().url()),
});

export interface ChessComStats {
  /** Best-effort rating snapshot per time control. */
  ratings: RatingSnapshot[];
}

/** Fetch JSON with the required UA. Throws on non-2xx. */
async function getJson<T>(pathOrUrl: string): Promise<T> {
  const url = pathOrUrl.startsWith("http")
    ? pathOrUrl
    : `${CHESS_COM_BASE}${pathOrUrl}`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Chess.com ${res.status} for ${url}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

/** Player profile (for resolving the canonical username / player id). */
export async function getPlayerProfile(username: string): Promise<{
  username: string;
  playerId?: string;
  joined?: number;
}> {
  const raw = await getJson<unknown>(
    `/pub/player/${encodeURIComponent(username.toLowerCase())}`,
  );
  const parsed = z
    .object({
      username: z.string(),
      player_id: z.union([z.string(), z.number()]).optional(),
      joined: z.number().optional(),
    })
    .passthrough()
    .parse(raw);
  return {
    username: parsed.username,
    playerId: parsed.player_id != null ? String(parsed.player_id) : undefined,
    joined: parsed.joined,
  };
}

/** Ratings per time control (bullet/blitz/rapid/daily). */
export async function getPlayerStats(username: string): Promise<ChessComStats> {
  const raw = await getJson<unknown>(
    `/pub/player/${encodeURIComponent(username.toLowerCase())}/stats`,
  );
  const parsed = statsSchema.parse(raw);
  const ratings: RatingSnapshot[] = [];
  for (const [key, mode] of Object.entries(parsed)) {
    if (!mode) continue;
    const rating = mode.last?.rating ?? mode.best?.rating;
    if (rating != null) {
      const games =
        mode.record != null
          ? mode.record.win + mode.record.loss + mode.record.draw
          : undefined;
      ratings.push({ key, rating, games });
    }
  }
  return { ratings };
}

/** List monthly archive URLs (oldest → newest). */
export async function listGameArchives(username: string): Promise<string[]> {
  const raw = await getJson<unknown>(
    `/pub/player/${encodeURIComponent(username.toLowerCase())}/games/archives`,
  );
  return archivesSchema.parse(raw).archives;
}

/** Parse a YYYY/MM archive URL into a comparable month key ("2024-06"). */
function archiveMonthKey(url: string): string | null {
  const m = url.match(/\/games\/(\d{4})\/(\d{2})$/);
  return m ? `${m[1]}-${m[2]}` : null;
}

function monthKeyFromDate(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Normalize one raw archive game into a SyncedGame. */
function normalizeArchiveGame(raw: unknown): SyncedGame | null {
  const parsed = archiveGameSchema.safeParse(raw);
  if (!parsed.success) return null;
  const g = parsed.data;
  if (!g.pgn) return null;
  const white = g.white?.username ?? "";
  const black = g.black?.username ?? "";
  return {
    pgn: g.pgn,
    white,
    black,
    result: extractResultFromPgn(g.pgn),
    playedAt: g.end_time
      ? new Date(g.end_time * 1000).toISOString()
      : undefined,
    timeControl: g.time_class ?? g.time_control,
    sourceUrl: g.url,
  };
}

/** Cheap regex pull of the [Result "..."] header without a full parse. */
function extractResultFromPgn(pgn: string): string {
  const m = pgn.match(/\[Result\s+"([^"]*)"\]/);
  return m?.[1] ?? "*";
}

/**
 * Walk archives and return normalized games, incrementally.
 *
 * Incremental strategy: skip any monthly archive whose month is entirely older
 * than the month containing `lastSyncedAt`. The boundary month (and all later
 * months) is fetched in full; per-game dedup against already-stored games is
 * the route's job (so re-syncing a month is idempotent).
 *
 * Newest-first: Chess.com returns archives oldest→newest, but we walk
 * newest→oldest so a partial/early-terminated sync still grabs recent games.
 */
export async function syncChessComGames(
  account: { username: string; lastSyncedAt: Date | null },
  opts?: { onProgress?: (fetched: number) => void },
): Promise<SyncedGame[]> {
  const archives = (await listGameArchives(account.username)).slice().reverse();
  const cutoffKey = account.lastSyncedAt
    ? monthKeyFromDate(account.lastSyncedAt)
    : null;

  const out: SyncedGame[] = [];
  for (const url of archives) {
    // Skip months fully older than the last sync.
    if (cutoffKey) {
      const mk = archiveMonthKey(url);
      if (mk && mk < cutoffKey) continue;
    }
    const payload = await getJson<{ games: unknown[] }>(url);
    for (const raw of payload.games ?? []) {
      const norm = normalizeArchiveGame(raw);
      if (norm) out.push(norm);
    }
    opts?.onProgress?.(out.length);
  }
  return out;
}
