# PLAN-011: Engine Pipeline Fix

**Status**: DONE
**Created**: 2026-07-26
**Priority**: CRITICAL

## Problem
The engine download works (Stockfish 18 appears in the Engines page), but analyzing a game returns 503:
```
{"error":"Engine unavailable","message":"No engine configured. Add an engine via Settings → Engines, or drop a Stockfish binary in the repo's `binaries/` directory."}
```

Root cause analysis:
1. The engine gets downloaded to `APP_DATA_DIR/engines/stockfish-18/` and stored in DB with `isActive: true`
2. The `engine/index.ts` `getEngine()` tries `engineRepository.getActive()` first
3. This fails silently (try/catch swallows errors), then falls back to `resolveStockfishPath()` which only looks in `binaries/`
4. The downloaded engine's path is not in any of the probed locations

## Approach
1. Fix the engine path resolution to use the DB-stored path
2. Ensure downloaded engines are properly marked as executable
3. Add better error logging for engine startup failures
4. Make the engine card clickable to show path/status details

## Tasks

| Task ID | Title | Status |
|---------|-------|--------|
| T11-001 | Fix `getEngine()` to properly use active engine from DB with error logging | DONE |
| T11-002 | Ensure `chmod +x` works on downloaded engines (verify on desktop) | DONE |
| T11-003 | Add engine status validation endpoint (check if binary is usable) | DONE |
| T11-004 | Make EngineCard clickable to show details (path, options, status) | DONE |
| T11-005 | Add engine health check on app startup | DONE |
| T11-006 | Surface engine path in the engine details view | DONE |

## Files Affected
- `packages/api/src/engine/index.ts` (modify — fix getEngine, add logging)
- `packages/api/src/routes/engines.ts` (modify — add health check endpoint)
- `apps/desktop/src/web/components/engines/EngineCard.tsx` (modify — clickable, show details)
- `apps/desktop/src/web/pages/engines.tsx` (modify — add EngineDetailSheet)

## Notes
- The pawn-appetite reference has a robust engine manager in `src-tauri/src/engines/`
- Key difference: pawn-appetite spawns engines per-session, not a singleton
- For desktop, a singleton is fine — just need to fix the path resolution
- The `EngineUnavailableError` should include the actual path that was tried
