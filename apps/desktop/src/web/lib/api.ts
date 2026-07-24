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
  createdAt: string;
  updatedAt: string;
}

/** `GET /games` returns `{ games: GameDTO[] }`. */
export async function fetchGames(): Promise<GameDTO[]> {
  const data = await api<{ games: GameDTO[] }>("/games");
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
