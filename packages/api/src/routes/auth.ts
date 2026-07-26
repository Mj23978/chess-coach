/**
 * Auth routes — browser-facing endpoints for the Lichess OAuth callback.
 *
 *   GET /auth/lichess/callback?code=&state=
 *     Exchanges the code for a token (PKCE), fetches the Lichess username,
 *     upserts the account with the token, and returns a self-closing HTML
 *     page. The SPA opens the authorize URL in a popup; this callback is the
 *     popup's final landing page.
 *
 *   GET /auth/lichess/start
 *     Optional convenience: generate a PKCE handshake and return the authorize
 *     URL as JSON (the SPA normally drives this through POST /accounts).
 *
 * The pending PKCE state lives in integrations/oauth-store. The desktop SPA
 * also polls GET /accounts as a robust fallback, because `window.opener`
 * postMessage may be unavailable when the popup opens in a system browser
 * outside the webview.
 */
import { Elysia } from "elysia";
import { accountRepository } from "@repo/db";
import { consumeLichessState, startLichessPkce } from "../integrations/oauth-store";
import { exchangeLichessCode } from "../integrations/oauth";
import { getAccount } from "../integrations/lichess";

/** Build the loopback callback URL from the incoming request's Host header. */
function redirectUriFromRequest(req: Request): string {
  const host =
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    "localhost";
  const proto =
    req.headers.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}/auth/lichess/callback`;
}

/** Minimal HTML page that signals success to the opener and self-closes. */
function closePopupPage(success: boolean, message: string): string {
  const payload = JSON.stringify({ type: "lichess-oauth", success, message });
  return `<!doctype html><html><head><meta charset="utf-8"><title>Connecting…</title>
<style>body{font:14px system-ui,sans-serif;text-align:center;padding:48px;color:#333}</style></head>
<body>
<p>${escapeHtml(message)}</p>
<script>
try { window.opener && window.opener.postMessage(${payload}, "*"); } catch (e) {}
setTimeout(function(){ try { window.close(); } catch (e) {} }, 600);
</script>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const authRoutes = new Elysia({ prefix: "/auth" })
  /** Optional: start a handshake from a URL (returns the authorize URL as JSON). */
  .get("/lichess/start", ({ request }) => {
    const redirectUri = redirectUriFromRequest(request);
    const { authUrl, state } = startLichessPkce(redirectUri);
    return { authUrl, state };
  })
  /** The OAuth provider redirects here with ?code=&state=. */
  .get("/lichess/callback", async ({ request, query, set }) => {
    const code = typeof query.code === "string" ? query.code : "";
    const state = typeof query.state === "string" ? query.state : "";
    if (!code || !state) {
      set.headers["content-type"] = "text/html; charset=utf-8";
      return closePopupPage(false, "Missing OAuth code or state.");
    }

    const pending = consumeLichessState(state);
    if (!pending) {
      set.headers["content-type"] = "text/html; charset=utf-8";
      return closePopupPage(
        false,
        "This authorization link expired. Please try connecting again.",
      );
    }

    let token: { access_token: string };
    try {
      token = await exchangeLichessCode({
        code,
        verifier: pending.verifier,
        redirectUri: pending.redirectUri,
      });
    } catch (err) {
      set.headers["content-type"] = "text/html; charset=utf-8";
      return closePopupPage(
        false,
        err instanceof Error ? err.message : "Token exchange failed.",
      );
    }

    let username: string;
    let platformUserId: string | undefined;
    try {
      const acct = await getAccount(token.access_token);
      username = acct.username;
      platformUserId = acct.id;
    } catch (err) {
      set.headers["content-type"] = "text/html; charset=utf-8";
      return closePopupPage(
        false,
        err instanceof Error ? err.message : "Could not read Lichess account.",
      );
    }

    // Upsert: a Lichess identity is unique by (platform, username).
    const existing = await accountRepository.getByPlatform("lichess", username);
    if (existing) {
      await accountRepository.setTokens(existing.id, {
        accessToken: token.access_token,
      });
    } else {
      await accountRepository.create({
        platform: "lichess",
        username,
        platformUserId,
        accessToken: token.access_token,
      });
    }

    set.headers["content-type"] = "text/html; charset=utf-8";
    return closePopupPage(true, `Connected ${username}. You can close this window.`);
  });
