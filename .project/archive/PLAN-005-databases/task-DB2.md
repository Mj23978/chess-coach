# DB2: Databases Page UI

**Status**: DONE
**Completed**: 2026-07-25
**Agent**: main

## Objective
Grid/list of databases with search + sort, a create flow, and a detail drawer
(rename, explore, dedup, export, delete).

## Approach
- `pages/databases.tsx` — full rewrite. `useQuery(["databases"])` source of
  truth; grid/list toggle, client-side search + sort, drawer + modals state.
- `components/databases/`:
  - `GenericHeader.tsx` — reusable title + search + sort + actions header.
  - `DatabaseCard.tsx` — grid (square card) + list (row) variants, with a
    kebab menu (open/rename/delete).
  - `DatabaseDrawer.tsx` — right-side `Sheet`. Inline rename/description,
    explore-games list with per-row remove, export (download + copy),
    dedup, delete (confirm).
  - `DatabaseModals.tsx` — `CreateDatabaseModal` (name/type/description) and
    `AddGamesModal` (paste-PGN tab + existing-games picker tab).
  - `utils.ts` — `formatBytes`, `formatRelative`.
  - `index.ts` — barrel.

## Files Affected
- apps/desktop/src/web/pages/databases.tsx (rewritten)
- apps/desktop/src/web/components/databases/* (new — 6 files)

## Notes
- All mutations invalidate `["databases"]` (and `["database-games", id]`).
- Drawer's "Add games" delegates to the page-level AddGamesModal (opened via
  `onAddGames` callback) so the modal sits above the Sheet (z-[60]).
- AddGamesModal splits multiple pasted games on blank-line gaps.
- Uses native `confirm`/`alert` for now; swap for design-system dialogs later.
