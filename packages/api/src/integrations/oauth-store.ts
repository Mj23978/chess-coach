/**
 * In-memory store for pending Lichess PKCE handshakes.
 *
 * chess-coach is a single-user desktop app with one server process, so an
 * in-process `Map` keyed by `state` is sufficient (no shared cache needed).
 * Entries expire after 10 minutes; `consume` deletes on read to prevent replay.
 *
 * Two routes cooperate:
 *  - POST /accounts {platform:"lichess"} → `startLichessPkce()` stores the
 *    verifier + redirectUri and returns the authorize URL.
 *  - GET /auth/lichess/callback → `consumeLichessState()` retrieves & deletes
 *    the verifier so the code can be exchanged.
 */
import {
  buildLichessAuthUrl,
  generatePkce,
  generateState,
} from "./oauth";

const TTL_MS = 10 * 60 * 1000;

interface PendingAuth {
  verifier: string;
  redirectUri: string;
  createdAt: number;
}

const pending = new Map<string, PendingAuth>();

/** Opportunistically drop expired entries. */
function sweep(): void {
  const now = Date.now();
  for (const [k, v] of pending) {
    if (now - v.createdAt > TTL_MS) pending.delete(k);
  }
}

export interface StartPkceResult {
  authUrl: string;
  state: string;
}

/**
 * Begin a Lichess OAuth handshake. `redirectUri` is the loopback callback URL
 * on this server (e.g. `http://127.0.0.1:<port>/auth/lichess/callback`).
 */
export function startLichessPkce(redirectUri: string): StartPkceResult {
  sweep();
  const { verifier, challenge } = generatePkce();
  const state = generateState();
  pending.set(state, { verifier, redirectUri, createdAt: Date.now() });
  const authUrl = buildLichessAuthUrl({ redirectUri, state, challenge });
  return { authUrl, state };
}

/**
 * Retrieve (and delete) the pending handshake for `state`. Returns null if the
 * state is unknown or expired.
 */
export function consumeLichessState(state: string): PendingAuth | null {
  sweep();
  const entry = pending.get(state);
  if (!entry) return null;
  pending.delete(state);
  if (Date.now() - entry.createdAt > TTL_MS) return null;
  return entry;
}
