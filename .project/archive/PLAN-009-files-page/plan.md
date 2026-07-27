# PLAN-009: Files Page

**Status**: DONE
**Started**: 2026-07-26
**Completed**: 2026-07-26
**Agent**: main

## Objective

Implement Phase 6 of the roadmap - a Files page for importing and organizing PGN files, repertoires, tournaments, and puzzles.

## Tasks

| Task ID | Title | Status |
|---------|-------|--------|
| FL1-001 | Create files table schema | DONE |
| FL1-002 | Run db:generate migration | DONE |
| FL1-003 | Run db:push to apply | DONE |
| FL2-001 | Create FilesPage component | DONE |
| FL2-002 | Create FileCard component | DONE |
| FL2-003 | Create AddFileModal component | DONE |
| FL2-004 | Add type picker (game/repertoire/tournament/puzzle) | DONE |
| FL2-005 | Add PGN paste/file upload | DONE |
| FL3-001 | Add GET /files endpoint | DONE |
| FL3-002 | Add POST /files endpoint | DONE |
| FL3-003 | Add GET /files/:id endpoint | DONE |
| FL3-004 | Add PATCH /files/:id endpoint | DONE |
| FL3-005 | Add DELETE /files/:id endpoint | DONE |

## Approach

Follow the established patterns from PLAN-005 (Databases):

1. **Schema** (`packages/db/schema/files.ts`):
   - `files` table with id, name, type, description, pgn (text), gameCount, storageBytes, createdAt, updatedAt
   - Type: "games" | "repertoire" | "tournament" | "puzzle"

2. **Repository** (`packages/db/repositories/files-repository.ts`):
   - CRUD operations matching databases-repository pattern
   - PGN parsing to extract game count and compute storage bytes

3. **API Routes** (`packages/api/src/routes/files.ts`):
   - GET /files, POST /files, GET /files/:id, PATCH /files/:id, DELETE /files/:id

4. **UI Components** (`apps/desktop/src/web/components/files/`):
   - FilesPage.tsx - main page with grid/list view, search, sort
   - FileCard.tsx - individual file card
   - FileDrawer.tsx - detail panel with rename, view games, export, delete
   - FileModals.tsx - create modal with PGN paste/upload
   - Reuse GenericHeader from databases components

5. **API Client** (`apps/desktop/src/web/lib/api.ts`):
   - Add fetchFiles, createFile, updateFile, deleteFile, exportFilePgn

## Files Affected

- packages/db/schema/files.ts (new)
- packages/db/schema.pg.ts (modify)
- packages/db/repositories/files-repository.ts (new)
- packages/db/repository.ts (modify)
- packages/api/src/routes/files.ts (new)
- packages/api/src/server.ts (modify)
- apps/desktop/src/web/pages/files.tsx (rewrite)
- apps/desktop/src/web/components/files/index.ts (new)
- apps/desktop/src/web/components/files/FileCard.tsx (new)
- apps/desktop/src/web/components/files/FileDrawer.tsx (new)
- apps/desktop/src/web/components/files/FileModals.tsx (new)
- apps/desktop/src/web/lib/api.ts (modify)

## Notes

- Files are simpler than databases - no junction table needed, PGN stored directly
- Reuse GenericHeader and utility functions from databases components
- Migration will be created manually (no db:generate/db:push on VPS)
