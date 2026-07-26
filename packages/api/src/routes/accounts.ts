/**
 * Accounts routes — connected Chess.com / Lichess identities + game sync.
 *
 *   GET    /accounts            list all accounts (+ games-synced count)
 *   POST   /accounts            add an account
 *        chess.com: { platform, username } → validate via pubapi, create row
 *        lichess:   { platform }           → { requiresOAuth, authUrl }
 *   GET    /accounts/:id        one account (+ games-synced count)
 *   PATCH  /accounts/:id        rename username
 *   DELETE /accounts/:id        remove account (synced games are orphaned)
 *   POST   /accounts/:id/sync   pull new games from the platform, dedup, insert
 *   GET    /accounts/:id/stats  live ratings + W/L/D + games count
 *
 * Sync is incremental (chess.com: monthly archives vs lastSyncedAt; lichess:
 * `since` = lastSyncedAt) and idempotent (dedup by exact PGN). Long-running —
 * the SPA shows a spinner, mirroring /games/:id/analyze.
 */
import { Elysia, t } from "elysia";
import { accountRepository, gameRepository } from "@repo/db";
import type { Account, GameSource } from "@repo/db";
import { getPlayerProfile, getPlayerStats, syncChessComGames } from "../integrations/chesscom";
import { getAccount, syncLichessGames } from "../integrations/lichess";
import { parsePgnForStorage } from "../integrations/pgn";
import { startLichessPkce } from "../integrations/oauth-store";
import type { SyncedGame, RatingSnapshot } from "../integrations/types";

/** Strip token secrets from an account row before returning it over HTTP. */
function publicAccount(a: Account) {
  const { accessToken: _at, refreshToken: _rt, ...rest } = a;
  return rest;
}

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

/** Which side the account user played in a synced game. */
function inferSide(
  white: string,
  black: string,
  username: string,
): "white" | "black" | undefined {
  const u = username.toLowerCase();
  if (!u) return undefined;
  if (white && white.toLowerCase() === u) return "white";
  if (black && black.toLowerCase() === u) return "black";
  return undefined;
}

/** Insert a batch of normalized games for an account, deduping by PGN. */
async function insertSyncedGames(
  account: Account,
  games: SyncedGame[],
  source: GameSource,
): Promise<{ inserted: number; fetched: number }> {
  const existing = await gameRepository.listByAccount(account.id);
  const seen = new Set(existing.map((g) => g.pgn));
  let inserted = 0;
  for (const g of games) {
    if (seen.has(g.pgn)) continue;
    const parsed = parsePgnForStorage(g.pgn);
    const white = g.white || parsed?.white || "Unknown";
    const black = g.black || parsed?.black || "Unknown";
    const result = (g.result || parsed?.result || "*") as
      | "1-0"
      | "0-1"
      | "1/2-1/2"
      | "*";
    await gameRepository.create({
      pgn: g.pgn,
      title: `${white} vs. ${black}`,
      white,
      black,
      side: inferSide(white, black, account.username),
      result,
      tags: g.timeControl ? [g.timeControl] : undefined,
      source,
      accountId: account.id,
    });
    seen.add(g.pgn);
    inserted++;
  }
  return { inserted, fetched: games.length };
}

export const accountsRoutes = new Elysia({ prefix: "/accounts" })
  // List all accounts with games-synced counts (no live external calls).
  .get("/", async () => {
    const accounts = await accountRepository.list();
    const withCounts = await Promise.all(
      accounts.map(async (a) => ({
        ...publicAccount(a),
        gamesCount: await gameRepository.countByAccount(a.id),
      })),
    );
    return { accounts: withCounts };
  })

  // Get one account (+ games-synced count).
  .get("/:id", async ({ params: { id }, set }) => {
    const account = await accountRepository.getById(id);
    if (!account) {
      set.status = 404;
      return { error: "Account not found" };
    }
    return { account: { ...publicAccount(account), gamesCount: await gameRepository.countByAccount(id) } };
  })

  // Add an account.
  //   chess.com → validate + create.
  //   lichess   → return the OAuth authorize URL (SPA opens it).
  .post(
    "/",
    async ({ body, request, set }) => {
      const { platform } = body;

      if (platform === "chess.com") {
        const username = (body.username ?? "").trim();
        if (!username) {
          set.status = 400;
          return { error: "username is required for chess.com" };
        }
        // Validate the handle against the pubapi (also resolves canonical name).
        let profile: { username: string; playerId?: string };
        try {
          profile = await getPlayerProfile(username);
        } catch (err) {
          set.status = 400;
          return {
            error: "Could not find that Chess.com username",
            message: err instanceof Error ? err.message : String(err),
          };
        }
        // Idempotent: return the existing account if already connected.
        const existing = await accountRepository.getByPlatform(
          "chess.com",
          profile.username,
        );
        const account = existing
          ? await accountRepository.getById(existing.id)
          : await accountRepository.create({
              platform: "chess.com",
              username: profile.username,
              platformUserId: profile.playerId,
            });
        return { account: account ? publicAccount(account) : null };
      }

      if (platform === "lichess") {
        const redirectUri = redirectUriFromRequest(request);
        const { authUrl, state } = startLichessPkce(redirectUri);
        return { requiresOAuth: true, authUrl, state };
      }

      set.status = 400;
      return { error: `Unsupported platform: ${platform}` };
    },
    {
      body: t.Object({
        platform: t.Union([t.Literal("chess.com"), t.Literal("lichess")]),
        username: t.Optional(t.String()),
      }),
    },
  )

  // Rename username.
  .patch(
    "/:id",
    async ({ params: { id }, body, set }) => {
      const existing = await accountRepository.getById(id);
      if (!existing) {
        set.status = 404;
        return { error: "Account not found" };
      }
      const account = await accountRepository.update(id, { username: body.username });
      return { account: account ? publicAccount(account) : null };
    },
    {
      body: t.Object({ username: t.String({ minLength: 1 }) }),
    },
  )

  // Delete (synced games are orphaned: account_id kept, source kept).
  .delete("/:id", async ({ params: { id }, set }) => {
    const existing = await accountRepository.getById(id);
    if (!existing) {
      set.status = 404;
      return { error: "Account not found" };
    }
    await accountRepository.delete(id);
    return { success: true };
  })

  // Sync new games from the platform (incremental + idempotent).
  .post("/:id/sync", async ({ params: { id }, set }) => {
    const account = await accountRepository.getById(id);
    if (!account) {
      set.status = 404;
      return { error: "Account not found" };
    }

    let fetched: SyncedGame[] = [];
    try {
      if (account.platform === "chess.com") {
        fetched = await syncChessComGames({
          username: account.username,
          lastSyncedAt: account.lastSyncedAt,
        });
        const { inserted, fetched: total } = await insertSyncedGames(
          account,
          fetched,
          "chesscom",
        );
        const updated = await accountRepository.touchSynced(account.id);
        return { synced: inserted, fetched: total, account: updated ? publicAccount(updated) : null };
      }

      if (account.platform === "lichess") {
        if (!account.accessToken) {
          set.status = 400;
          return { error: "Lichess account has no access token — reconnect it." };
        }
        fetched = await syncLichessGames({
          username: account.username,
          lastSyncedAt: account.lastSyncedAt,
          accessToken: account.accessToken,
        });
        const { inserted, fetched: total } = await insertSyncedGames(
          account,
          fetched,
          "lichess",
        );
        const updated = await accountRepository.touchSynced(account.id);
        return { synced: inserted, fetched: total, account: updated ? publicAccount(updated) : null };
      }

      set.status = 400;
      return { error: "Unknown platform" };
    } catch (err) {
      set.status = 502;
      return {
        error: "Sync failed",
        message: err instanceof Error ? err.message : String(err),
      };
    }
  })

  // Live ratings + W/L/D + games count for an account.
  .get("/:id/stats", async ({ params: { id }, set }) => {
    const account = await accountRepository.getById(id);
    if (!account) {
      set.status = 404;
      return { error: "Account not found" };
    }

    const games = await gameRepository.listByAccount(account.id);
    let wins = 0;
    let losses = 0;
    let draws = 0;
    for (const g of games) {
      const side = inferSide(g.white ?? "", g.black ?? "", account.username);
      if (!side || !g.result) continue;
      if (g.result === "1/2-1/2") draws++;
      else if (side === "white" && g.result === "1-0") wins++;
      else if (side === "black" && g.result === "0-1") wins++;
      else if (side === "white" && g.result === "0-1") losses++;
      else if (side === "black" && g.result === "1-0") losses++;
    }

    let ratings: RatingSnapshot[] = [];
    let ratingsError: string | undefined;
    try {
      if (account.platform === "chess.com") {
        ratings = (await getPlayerStats(account.username)).ratings;
      } else if (account.platform === "lichess" && account.accessToken) {
        ratings = (await getAccount(account.accessToken)).ratings;
      }
    } catch (err) {
      ratingsError = err instanceof Error ? err.message : String(err);
    }

    return {
      accountId: account.id,
      platform: account.platform,
      username: account.username,
      ratings,
      ratingsError,
      gamesCount: games.length,
      results: { wins, losses, draws },
    };
  });
