# PLAN-004 Implementation Notes

**Status**: Complete (pending typecheck/lint/manual test on owner's Windows PC)
**Date**: 2026-07-26

## What was built

Full Accounts & Sync feature across the stack:

| Layer | File(s) |
|-------|---------|
| DB schema | `packages/db/schema/accounts.ts` (new); `packages/db/schema/games.ts` (+ `source`, `accountId`) |
| Migration | `packages/api/migrations/0001_fair_jigsaw.sql` (accounts table + games cols + indexes) |
| Repository | `packages/db/repositories/accounts-repository.ts` (new); `games-repository.ts` (+ `listBySource`/`listByAccount`/`countBy*`); `types.ts` (extended) |
| Integrations | `packages/api/src/integrations/{chesscom,lichess,oauth,oauth-store,pgn,types}.ts` (all new) |
| API routes | `packages/api/src/routes/{accounts,auth}.ts` (new); `routes/games.ts` (GET filters); `server.ts` (registers both) |
| SPA client | `apps/desktop/src/web/lib/api.ts` (AccountDTO, GameDTO+source/accountId, fetchAccounts/createAccount/syncAccount/...) |
| SPA UI | `pages/accounts.tsx` (rewritten); `components/accounts/{AccountCard,AddAccountModal,PlayerDatabaseDrawer,index}.tsx` (new) |
| Dashboard wiring | `components/dashboard/{GamesTable,ConnectedAccountsCard,index}.tsx` |

## Key design decisions

1. **No `account_stats` table (A1-002 deferred).** The plan proposed a denormalized
   stats table; instead, ratings are fetched **live** from the platform
   (`GET /accounts/:id/stats` → Chess.com `/pub/player/:user/stats` or Lichess
   `/api/account`) and W/D/L is computed from the synced `games` rows. This keeps
   a single source of truth and avoids a sync job to keep stats fresh. If live
   fetch latency or rate limits become a problem, add a cache later.

2. **Lichess OAuth via loopback callback.** The provider redirects to
   `/auth/lichess/callback` on the in-process Elysia server (loopback), not a
   custom URI scheme. The pending PKCE verifier lives in an in-memory map keyed
   by `state` (10-min TTL) — fine for a single-user desktop app with one server
   process. The popup page self-closes; the SPA **also polls** `GET /accounts`
   as a robust fallback because `window.opener.postMessage` may be unavailable
   when the popup opens in the system browser outside the Electrobun webview.

3. **`client_id = "chess-coach"`.** Lichess doesn't require pre-registration for
   PKCE flows; any identifying string works. Change `DEFAULT_CLIENT_ID` in
   `oauth.ts` if a real client id is registered later.

4. **Games are deduped by exact PGN.** `insertSyncedGames` loads the account's
   existing games and skips any whose `pgn` matches. This makes re-syncing a
   Chess.com boundary month or a Lichess export idempotent. (PGN byte-equality
   is reliable here because each platform emits a canonical PGN.)

5. **Tokens stored in plaintext.** `accounts.access_token` is unencrypted.
   Hardening (OS keychain / app-level encryption) is a follow-up — see below.

6. **Chess.com sync walks newest→oldest**, skipping months fully older than
   `lastSyncedAt`'s month (boundary month re-fetched in full, dedup handles
   overlap). Lichess sync passes `since=lastSyncedAt(ms)` so the platform only
   returns newer games.

## Deferred / out of scope

- **Token encryption at rest** — follow-up hardening (OS keychain integration
  or symmetric encryption keyed off a machine secret).
- **A5-005 "account switcher dropdown"** — the drawer opens per-card from the
  Accounts page, so an in-drawer switcher wasn't needed. If the drawer is ever
  reused from the dashboard, add a `Select` there.
- **Real opening-performance charting** — `OpeningsTab` shows minimal W/D/L bars
  per opening. Rich charts pending a charting-lib decision (the `chart.tsx` UI
  component exists if we want to upgrade later).
- **Lichess token refresh** — Lichess personal/OAuth tokens don't expire unless
  revoked, so `refreshToken`/`tokenExpiresAt` are unused today; `setTokens`
  exists for when we add an expiring-token provider.

## Manual smoke test (run on Windows PC)

1. `bun install`, `bun run check-types`, `bun run lint` — fix anything flagged.
2. Start desktop: `bun run dev --filter=@chess-coach/desktop`.
3. **Chess.com**: Accounts → Add → Chess.com → enter a real username → Connect.
   Card should appear with live ratings + "0 games synced".
4. **Chess.com sync**: click Sync → wait → card shows "N games synced"; the
   dashboard's Chess.com tab now lists them with parsed headers; the Account
   badge reads "Chess.com".
5. **Lichess OAuth**: Accounts → Add → Lichess → Connect with Lichess → popup
   opens lichess.org → authorize → popup self-closes, card appears. If the
   popup is blocked or opens in a system browser, the SPA polls and still
   completes within ~1.5 s.
6. **Lichess sync**: Sync → games flow into the Lichess dashboard tab.
7. **Player database drawer**: click "Database" on a card → Overview (W/D/L bar),
   Ratings (live table), Openings (per-opening W/D/L).
8. **Incremental sync**: Sync again → "Synced 0 new games" (dedup working).
9. **Remove**: dropdown → Remove account → confirm → card gone; synced games
   remain (orphaned: `account_id` retained, source retained).

## Known follow-ups

- The `dashboard-stats.ts::opponentName` has a pre-existing operator-precedence
  quirk (`||` vs `? :`) unrelated to this plan; flagged for a future fix.
- `fetchGames` now takes an optional `{ source?, accountId? }` filter; the
  dashboard still passes it bare to `useQuery({ queryFn: fetchGames })`, which
  works (the React Query context is accepted as the ignored `filter` arg since
  it has no `.source`/`.accountId`). If that ever feels fragile, wrap in an
  arrow: `queryFn: () => fetchGames()`.
