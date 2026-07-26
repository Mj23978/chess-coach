/**
 * Lichess OAuth helpers (PKCE / S256).
 *
 * Lichess desktop/installed apps authorize with the authorization-code +
 * PKCE flow — no client secret. The `client_id` is any identifying string
 * (no pre-registration); `redirect_uri` must be a loopback URL and must match
 * exactly between the authorize URL and the token exchange.
 *
 * Flow (orchestrated by routes/auth.ts):
 *   1. SPA → `GET /auth/lichess/start` → API generates {verifier, challenge,
 *      state}, stores verifier+redirectUri keyed by state (in-memory, 10m TTL),
 *      returns the authorize URL.
 *   2. SPA opens the URL (popup/new window). User authorizes on lichess.org.
 *   3. Lichess redirects to `redirect_uri` = `/auth/lichess/callback?code=&state=`
 *      on the in-process Elysia server.
 *   4. API looks up the verifier by state, exchanges the code for a token,
 *      fetches the Lichess username, and upserts the account with the token.
 *      Returns a self-closing HTML page. The SPA also polls the accounts list
 *      as a robust fallback (postMessage may be unavailable across the
 *      webview↔system-browser boundary).
 */
import { createHash, randomBytes } from "node:crypto";

const LICHESS_BASE = "https://lichess.org";

/** Scopes requested for game sync. Add more (e.g. `preference:read`) as needed. */
export const DEFAULT_LICHESS_SCOPE = "game:read";

/** The Lichess client id sent in the authorize/token requests. */
export const DEFAULT_CLIENT_ID = "chess-coach";

/** A URL-safe random string (43–128 chars per RFC 7636). */
function randomBase64Url(bytes: number): string {
  return randomBytes(bytes).toString("base64url");
}

/** PKCE pair: a high-entropy verifier and its S256 challenge. */
export function generatePkce(): { verifier: string; challenge: string } {
  const verifier = randomBase64Url(48);
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

/** Opaque state token used to bind authorize → callback. */
export function generateState(): string {
  return randomBase64Url(24);
}

export interface BuildAuthUrlOptions {
  clientId?: string;
  redirectUri: string;
  state: string;
  challenge: string;
  scope?: string;
}

/** Build the lichess.org `/oauth/authorize` URL for the PKCE flow. */
export function buildLichessAuthUrl(opts: BuildAuthUrlOptions): string {
  const {
    clientId = DEFAULT_CLIENT_ID,
    redirectUri,
    state,
    challenge,
    scope = DEFAULT_LICHESS_SCOPE,
  } = opts;
  const url = new URL(`${LICHESS_BASE}/oauth/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scope);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);
  return url.toString();
}

export interface ExchangeOptions {
  code: string;
  verifier: string;
  redirectUri: string;
  clientId?: string;
}

export interface LichessTokenResponse {
  access_token: string;
  token_type: string;
  /** Lichess does not return a refresh token for this flow. */
  expires_in?: number;
}

/** Exchange an authorization code for an access token. Throws on failure. */
export async function exchangeLichessCode(
  opts: ExchangeOptions,
): Promise<LichessTokenResponse> {
  const { code, verifier, redirectUri, clientId = DEFAULT_CLIENT_ID } = opts;
  const res = await fetch(`${LICHESS_BASE}/api/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      code_verifier: verifier,
      client_id: clientId,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Lichess token exchange failed (${res.status}): ${body.slice(0, 200)}`);
  }
  return (await res.json()) as LichessTokenResponse;
}
