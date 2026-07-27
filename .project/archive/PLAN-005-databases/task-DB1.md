# DB1: Database Schema

**Status**: DONE
**Completed**: 2026-07-25
**Agent**: main

## Objective
Two tables: `databases` (named game collections) + `database_games` junction.

## Approach
- `packages/db/schema/databases.ts` — `DatabasesTable` (name, type, description,
  denormalized `gameCount`/`storageBytes`, `isIndexed` placeholder) and
  `DatabaseGamesTable` junction with composite PK `(database_id, game_id)`.
- **No DB-level FK constraints** (matches repo convention — `games.account_id`
  does the same). Referential integrity is app-enforced in the repository.
- Registered in `schema.pg.ts` barrel.
- Migration artifacts committed by hand (no bun/drizzle-kit on this VPS):
  `packages/api/migrations/0002_databases.sql` + `0002_snapshot.json` + journal
  entry. The follow-up Windows agent should run `bun run db:generate` to
  reconcile (expect no diff, or a trivial corrective migration).

## Files Affected
- packages/db/schema/databases.ts (new)
- packages/db/schema.pg.ts (modified — added export)
- packages/api/migrations/0002_databases.sql (new)
- packages/api/migrations/meta/0002_snapshot.json (new)
- packages/api/migrations/meta/_journal.json (modified — added entry)

## Notes
- Composite PK makes `addGames` idempotent (ON CONFLICT DO NOTHING).
- `gameCount`/`storageBytes` are recomputed from the live join on every
  membership mutation — see repository. Kept denormalized only to avoid a
  COUNT join when rendering the grid.
