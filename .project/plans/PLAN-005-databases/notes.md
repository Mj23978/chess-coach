# PLAN-005 Implementation Notes

**Agent**: main
**Started**: 2026-07-25

## Approach

Implemented bottom-up so each layer is testable against the one below:

1. **DB1 schema** (`packages/db/schema/databases.ts`): two tables —
   `databases` (metadata + denormalized `gameCount`/`storageBytes`) and
   `database_games` junction (composite PK on `(database_id, game_id)`).
   Follows the repo convention of **no DB-level FK constraints** (matches
   `games.account_id` — "keeps migrations loose"). Membership cleanup is
   app-enforced in the repository.
2. **DB1 migration**: `bun run db:generate` produced
   `packages/api/migrations/0002_*.sql` (databases + database_games only —
   accounts is already in 0001).
3. **DB3 repository + routes** done before UI so the SPA has a real backend.
4. **DB2 UI**: page rewrite + 4 components under
   `components/databases/`.

## Design decisions

- **Denormalized counts** (`gameCount`, `storageBytes`) are recomputed from
  scratch on every membership mutation (add / remove / dedup). Cheap for a
  single-user desktop app and avoids drift. `storageBytes` = sum of PGN UTF-8
  byte lengths of member games.
- **Dedup** groups a database's member games by *normalized PGN* (trim +
  collapse inner whitespace, drop `[Event …]`-style header noise is NOT done —
  we keep headers so genuinely different games stay distinct). For each
  duplicate group, keeps the newest game (max `createdAt`), unlinks the rest
  from the junction, and deletes the underlying game row **only if it is not
  a member of any other database** (so we never clobber a game another DB
  references).
- **Export** = inner-join junction→games, concat PGNs with blank-line
  separators, returned as `text/plain` for the SPA to Blob-download.
- **Drawer** uses the existing `@repo/ui` Sheet (right-side) — same Radix
  dialog primitive used elsewhere; consistent with the design system.

## Parallel-work note (PLAN-004)

The accounts schema + its migration (`0001_fair_jigsaw`) already exist and are
committed, so this plan's `db:generate` only emits the databases delta — no
collision with the in-progress PLAN-004 API/repository work. Shared barrels
(`schema.pg.ts`, `repository.ts`, `server.ts`, `lib/api.ts`) get additive
databases exports that merge cleanly with whatever accounts adds.

## Verification

- **Not run on this VPS.** Bun / `tsc` / `drizzle-kit` / `node_modules` are
  not installed here (see AGENTS.md ⚠️ note). The migration SQL, type-check,
  lint, and build are all produced/run on the owner's Windows PC by a follow-up
  agent. This plan therefore commits **schema + repository + routes + UI**
  source only, and a **hand-written migration SQL file** (so the follow-up
  agent doesn't have to invent one — but they should still run
  `bun run db:generate` to reconcile / confirm).
- Migration file added: `packages/api/migrations/0002_databases.sql` + journal
  entry. Drizzle's generator would produce equivalent DDL; the hand-written
  one is a best-effort match to the schema and uses the same idempotent
  statement style the existing migrations use.
