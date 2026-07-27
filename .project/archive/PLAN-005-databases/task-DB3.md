# DB3: Database API Routes

**Status**: DONE
**Completed**: 2026-07-25
**Agent**: main

## Objective
Full `/databases` REST surface for game collections.

## Endpoints
```
GET    /databases              list all (newest first)
POST   /databases              create
GET    /databases/:id          one
PATCH  /databases/:id          rename / re-describe
DELETE /databases/:id          delete + manual cascade of junction rows
GET    /databases/:id/games    member games (for "Explore games")
POST   /databases/:id/games    add by gameIds AND/OR create-from-PGN (pgns[])
DELETE /databases/:id/games    unlink (body { gameIds })
GET    /databases/:id/export   database as text/plain PGN blob
POST   /databases/:id/dedup    remove duplicate games
```

## Approach
- `packages/api/src/routes/databases.ts` — Elysia routes delegating to
  `databaseRepository`. Body validation via `t.Object`.
- Registered in `server.ts` alongside games/engines/play/accounts/auth.
- Repository (`packages/db/repositories/databases-repository.ts`) holds the
  real logic: membership add/remove (idempotent), lazy `recomputeStats`,
  `deduplicate` (normalized-PGN grouping, deletes orphan games only),
  `exportPgn` (join + concat).
- SPA client in `apps/desktop/src/web/lib/api.ts` mirrors every endpoint.

## Files Affected
- packages/api/src/routes/databases.ts (new)
- packages/api/src/server.ts (modified — register routes)
- packages/db/repositories/databases-repository.ts (new)
- packages/db/repository.ts (modified — export databaseRepository)
- apps/desktop/src/web/lib/api.ts (modified — databases client)

## Notes
- Export endpoint returns raw `text/plain` (not JSON) so the SPA can
  Blob-download it; sets `content-disposition` for a filename hint.
- Dedup deletes a loser game row only when it's referenced by no OTHER
  database (guards shared games).
