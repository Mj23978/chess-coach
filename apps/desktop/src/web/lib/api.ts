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

/** Shape returned by the /games endpoints in @repo/api. */
export interface GameDTO {
  id: string;
  title: string | null;
  white: string | null;
  black: string | null;
  result: string | null;
  pgn: string;
  createdAt: string;
}
