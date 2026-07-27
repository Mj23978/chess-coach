# T11-001: Fix getEngine() DB Path Resolution

**Status**: TODO
**Priority**: CRITICAL

## Objective
Fix the engine singleton so it properly loads the active engine from the database instead of silently falling back to `resolveStockfishPath()`.

## Current Bug
```typescript
// packages/api/src/engine/index.ts — getEngine()
try {
  const { engineRepository } = await import("@repo/db");
  const activeEngine = await engineRepository.getActive();
  if (activeEngine?.path && activeEngine.exists) {
    enginePath = activeEngine.path;
  }
} catch {
  // DB not initialized or no active engine — SILENTLY FAILS
}
```

The `catch` block swallows all errors, including the case where the DB query succeeds but the engine path is wrong or the binary doesn't exist.

## Fix
1. Add error logging to the catch block
2. Log the resolved engine path when found
3. Log why the engine failed to start (path not found, permission denied, etc.)
4. Include the tried paths in the `EngineUnavailableError` message

## Acceptance Criteria
- When an engine is downloaded and activated, `/games/:id/analyze` works
- Error messages include the actual path that was tried
- Console logs show engine resolution steps for debugging
