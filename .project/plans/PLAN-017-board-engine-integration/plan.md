# PLAN-017: Board Engine Integration & Win Bar

**Status**: TODO
**Created**: 2026-07-26
**Priority**: HIGH

## Problem
1. The chess win bar (eval bar) doesn't update when pieces move during play
2. The engine doesn't actually play moves in Play mode — it's configured but not used
3. The eval bar shows 50/50 even after moves are made

Root cause: The PlayGameView board works but the eval bar isn't connected to engine analysis. The engine is only invoked for the `/games/:id/analyze` endpoint, not for live play evaluation.

## Approach
1. Connect the play session to engine evaluation for real-time eval updates
2. Update the eval bar to react to position changes
3. Ensure the engine plays its moves correctly when configured as a player

## Tasks

| Task ID | Title | Status |
|---------|-------|--------|
| T17-001 | Add real-time eval to play sessions (engine evaluates each position) | TODO |
| T17-002 | Update PlayGameView to display eval bar with live engine scores | TODO |
| T17-003 | Ensure engine correctly plays when configured as a player side | TODO |
| T17-004 | Fix eval bar animation/transitions for smooth updates | TODO |
| T17-005 | Add eval display (cp/mate) alongside the bar | TODO |
| T17-006 | Handle engine unavailability gracefully during play | TODO |

## Files Affected
- `packages/api/src/play/sessions.ts` (modify — add eval tracking)
- `packages/api/src/routes/play.ts` (modify — include eval in snapshots)
- `apps/desktop/src/web/lib/play-api.ts` (modify — add eval to SessionSnapshot)
- `apps/desktop/src/web/components/board/PlayGameView.tsx` (modify — add eval bar)
- `apps/desktop/src/web/components/board/EvalBar.tsx` (new — reusable eval bar)

## Notes
- The pawn-appetite reference evaluates each position after a move
- Eval should be from white's perspective (positive = white advantage)
- The eval bar should animate smoothly between values
- Consider debouncing eval updates to avoid flicker
- The engine singleton can handle play evaluations — just need to add the API surface
