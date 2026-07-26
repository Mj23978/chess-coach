/**
 * Tiny fetch-based API client for the SPA. The base URL comes from the env
 * shim (window.__CHESS_COACH_API_BASE__). Replace with Eden Treaty once auth
 * + routes are typed if you want end-to-end types.
 */
import { env } from "@repo/env";

export const API_BASE = env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");

export async function api<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}

/** Per-move analysis stored in the `analysis` JSON column. Mirrors the
 *  `MoveAnalysis` interface in packages/db/schema/games.ts. */
export interface MoveAnalysisDTO {
  san: string;
  /** Centipawn eval, WHITE-relative (+ = good for white). */
  evalCp?: number;
  /** Mate score, WHITE-relative plies (positive = white mates). */
  mate?: number;
  classification?:
    | "brilliant"
    | "great"
    | "best"
    | "excellent"
    | "good"
    | "inaccuracy"
    | "mistake"
    | "blunder";
}

/** Where a game came from (mirrors `GameSource` in @repo/db). */
export type GameSource = "local" | "chesscom" | "lichess";

/** Shape returned by the /games endpoints in @repo/api. */
export interface GameDTO {
  id: string;
  title: string | null;
  white: string | null;
  black: string | null;
  side: "white" | "black" | null;
  result: string | null;
  pgn: string;
  analysis: MoveAnalysisDTO[] | null;
  tags: string[] | null;
  /** Origin of the game (defaults to "local"). */
  source: GameSource;
  /** Owning account id for synced games (null for local games). */
  accountId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** `GET /games` returns `{ games: GameDTO[] }`. Optional filters by
 *  `source` ("local"|"chesscom"|"lichess") or `accountId`. */
export async function fetchGames(
  filter?: { source?: GameSource; accountId?: string },
): Promise<GameDTO[]> {
  const qs = new URLSearchParams();
  if (filter?.source) qs.set("source", filter.source);
  if (filter?.accountId) qs.set("accountId", filter.accountId);
  const tail = qs.toString() ? `?${qs.toString()}` : "";
  const data = await api<{ games: GameDTO[] }>(`/games${tail}`);
  return data.games;
}

/** `GET /games/:id` returns `{ game: GameDTO }`. */
export async function fetchGame(id: string): Promise<GameDTO> {
  const data = await api<{ game: GameDTO }>(`/games/${id}`);
  return data.game;
}

/** `POST /games` — create a game from a pasted PGN. */
export async function createGame(input: {
  pgn: string;
  title?: string;
  white?: string;
  black?: string;
  side?: "white" | "black";
  result?: string;
  tags?: string[];
}): Promise<GameDTO> {
  const data = await api<{ game: GameDTO }>("/games", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.game;
}

/** Result of `POST /games/:id/analyze`. */
export interface AnalyzeResult {
  game: GameDTO;
  accuracy: { white: number; black: number };
}

/**
 * Kick off engine + classifier analysis for a stored game. Long-running (one
 * engine eval per position); the SPA shows a spinner. Returns 503 if no
 * Stockfish binary is staged — surface that to the user.
 */
export async function analyzeGame(
  id: string,
  opts?: { depth?: number; multiPv?: number },
): Promise<AnalyzeResult> {
  return api<AnalyzeResult>(`/games/${id}/analyze`, {
    method: "POST",
    body: JSON.stringify(opts ?? {}),
  });
}

// ============================================================================
// Engine Management API
// ============================================================================

export interface EngineDTO {
  id: string;
  name: string;
  version: string | null;
  path: string | null;
  exists: boolean;
  isActive: boolean;
  elo: number | null;
  image: string | null;
  options: UciOptionDTO[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface UciOptionDTO {
  name: string;
  type: "check" | "spin" | "combo" | "string" | "button" | "filename";
  default?: string | number | boolean;
  min?: number;
  max?: number;
  vars?: string[];
  value?: string | number | boolean;
}

export interface CatalogEngineDTO {
  name: string;
  version: string;
  os: string;
  downloadUrl: string;
  pathInArchive: string;
  elo: number;
  downloadSize: number;
  image: string;
}

/** `GET /engines` — list all configured engines. */
export async function fetchEngines(): Promise<EngineDTO[]> {
  const data = await api<{ engines: EngineDTO[] }>("/engines");
  return data.engines;
}

/** `GET /engines/catalog` — list downloadable engines for this platform. */
export async function fetchEngineCatalog(): Promise<{
  engines: CatalogEngineDTO[];
  platform: string;
}> {
  return api<{ engines: CatalogEngineDTO[]; platform: string }>("/engines/catalog");
}

/** `POST /engines` — add an engine from a local path. */
export async function addLocalEngine(input: {
  path: string;
  name?: string;
  version?: string;
}): Promise<EngineDTO> {
  const data = await api<{ engine: EngineDTO }>("/engines", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.engine;
}

/** `POST /engines/download` — download an engine from the catalog. */
export async function downloadEngine(catalogIndex: number): Promise<EngineDTO> {
  const data = await api<{ engine: EngineDTO }>("/engines/download", {
    method: "POST",
    body: JSON.stringify({ catalogIndex }),
  });
  return data.engine;
}

/** `POST /engines/:id/activate` — set an engine as active. */
export async function activateEngine(id: string): Promise<EngineDTO> {
  const data = await api<{ engine: EngineDTO }>(`/engines/${id}/activate`, {
    method: "POST",
  });
  return data.engine;
}

/** `DELETE /engines/:id` — remove an engine config. */
export async function deleteEngine(id: string): Promise<void> {
  await api(`/engines/${id}`, { method: "DELETE" });
}

// ============================================================================
// Databases API (PLAN-005)
// ============================================================================

/** Kind of collection. Mirrors `DatabaseType` in packages/db/schema/databases.ts. */
export type DatabaseType = "games" | "repertoire" | "puzzles";

/** Shape returned by the /databases endpoints in @repo/api. */
export interface DatabaseDTO {
  id: string;
  name: string;
  type: DatabaseType;
  description: string | null;
  isIndexed: boolean;
  gameCount: number;
  storageBytes: number;
  createdAt: string;
  updatedAt: string;
}

/** `GET /databases` — list all databases. */
export async function fetchDatabases(): Promise<DatabaseDTO[]> {
  const data = await api<{ databases: DatabaseDTO[] }>("/databases");
  return data.databases;
}

/** `GET /databases/:id`. */
export async function fetchDatabase(id: string): Promise<DatabaseDTO> {
  const data = await api<{ database: DatabaseDTO }>(`/databases/${id}`);
  return data.database;
}

/** `POST /databases` — create a database. */
export async function createDatabase(input: {
  name: string;
  description?: string;
  type?: DatabaseType;
}): Promise<DatabaseDTO> {
  const data = await api<{ database: DatabaseDTO }>("/databases", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.database;
}

/** `PATCH /databases/:id` — rename / re-describe. */
export async function updateDatabase(
  id: string,
  input: { name?: string; description?: string | null },
): Promise<DatabaseDTO> {
  const data = await api<{ database: DatabaseDTO }>(`/databases/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return data.database;
}

/** `DELETE /databases/:id`. */
export async function deleteDatabase(id: string): Promise<void> {
  await api(`/databases/${id}`, { method: "DELETE" });
}

/** `GET /databases/:id/games` — member games. */
export async function fetchDatabaseGames(id: string): Promise<GameDTO[]> {
  const data = await api<{ games: GameDTO[] }>(`/databases/${id}/games`);
  return data.games;
}

/** `POST /databases/:id/games` — add existing games and/or PGN blobs. */
export async function addDatabaseGames(
  id: string,
  input: { gameIds?: string[]; pgns?: string[] },
): Promise<DatabaseDTO> {
  const data = await api<{ database: DatabaseDTO }>(`/databases/${id}/games`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.database;
}

/** `DELETE /databases/:id/games` — unlink games. */
export async function removeDatabaseGames(
  id: string,
  gameIds: string[],
): Promise<DatabaseDTO> {
  const data = await api<{ database: DatabaseDTO }>(`/databases/${id}/games`, {
    method: "DELETE",
    body: JSON.stringify({ gameIds }),
  });
  return data.database;
}

/** `GET /databases/:id/export` — database as a single PGN blob. */
export async function exportDatabasePgn(id: string): Promise<string> {
  const res = await fetch(`${API_BASE}/databases/${id}/export`, {
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${text}`);
  }
  return res.text();
}

/** `POST /databases/:id/dedup` — remove duplicate games. */
export async function dedupDatabase(
  id: string,
): Promise<{ database: DatabaseDTO; removed: number }> {
  return api<{ database: DatabaseDTO; removed: number }>(
    `/databases/${id}/dedup`,
    { method: "POST" },
  );
}

// ============================================================================
// Accounts & Sync API
// ============================================================================

/** Platform identifier (mirrors `AccountPlatform` in @repo/db). */
export type AccountPlatform = "chess.com" | "lichess";

/** One connected Chess.com / Lichess identity (secrets stripped server-side). */
export interface AccountDTO {
  id: string;
  platform: AccountPlatform;
  username: string;
  platformUserId: string | null;
  tokenExpiresAt: string | null;
  lastSyncedAt: string | null;
  /** Games synced from this account (joined server-side). */
  gamesCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Per-time-control rating snapshot from the platform. */
export interface RatingSnapshot {
  key: string;
  rating: number;
  games?: number;
}

/** `GET /accounts/:id/stats` — live ratings + W/L/D + games count. */
export interface AccountStatsDTO {
  accountId: string;
  platform: AccountPlatform;
  username: string;
  ratings: RatingSnapshot[];
  /** Present if the live ratings fetch failed (e.g. revoked Lichess token). */
  ratingsError?: string;
  gamesCount: number;
  results: { wins: number; losses: number; draws: number };
}

/** `POST /accounts/:id/sync` result. */
export interface SyncResultDTO {
  synced: number;
  fetched: number;
  account: AccountDTO;
}

/** `POST /accounts` response — either a created account or an OAuth URL. */
export type CreateAccountResponse =
  | { account: AccountDTO }
  | { requiresOAuth: true; authUrl: string; state: string };

/** `GET /accounts` — list all connected accounts. */
export async function fetchAccounts(): Promise<AccountDTO[]> {
  const data = await api<{ accounts: AccountDTO[] }>("/accounts");
  return data.accounts;
}

/** `GET /accounts/:id`. */
export async function fetchAccount(id: string): Promise<AccountDTO> {
  const data = await api<{ account: AccountDTO }>(`/accounts/${id}`);
  return data.account;
}

/** `GET /accounts/:id/stats` — live ratings + W/L/D. */
export async function fetchAccountStats(id: string): Promise<AccountStatsDTO> {
  return api<AccountStatsDTO>(`/accounts/${id}/stats`);
}

/**
 * `POST /accounts` — add an account.
 *  - Chess.com: `{ platform, username }` → validates + creates the row.
 *  - Lichess: `{ platform }` → returns `{ requiresOAuth, authUrl }`; the SPA
 *    opens `authUrl` and then polls `fetchAccounts()` for the new row.
 */
export async function createAccount(input: {
  platform: AccountPlatform;
  username?: string;
}): Promise<CreateAccountResponse> {
  return api<CreateAccountResponse>("/accounts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** `PATCH /accounts/:id` — rename username. */
export async function updateAccount(
  id: string,
  patch: { username: string },
): Promise<AccountDTO> {
  const data = await api<{ account: AccountDTO }>(`/accounts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return data.account;
}

/** `DELETE /accounts/:id`. */
export async function deleteAccount(id: string): Promise<void> {
  await api(`/accounts/${id}`, { method: "DELETE" });
}

/** `POST /accounts/:id/sync` — pull new games (long-running). */
export async function syncAccount(id: string): Promise<SyncResultDTO> {
  return api<SyncResultDTO>(`/accounts/${id}/sync`, { method: "POST" });
}
