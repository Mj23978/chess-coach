# PLAN-015: Settings Persistence

**Status**: TODO
**Created**: 2026-07-26

## Problem
Settings page changes (theme, board colors, etc.) are purely local state — nothing persists or actually applies. Changing theme/color has no visual effect.

## Approach
1. Create a `settings` table in the DB to persist user preferences
2. Create a React context that loads settings on app mount and provides them globally
3. Apply theme changes via CSS variables / Tailwind dark mode
4. Apply board style changes to the Chessboard component

## Tasks

| Task ID | Title | Status |
|---------|-------|--------|
| T15-001 | Create `settings` table schema (key-value store) | TODO |
| T15-002 | Add GET/PATCH /settings API routes | TODO |
| T15-003 | Create SettingsContext provider (loads on mount, exposes settings) | TODO |
| T15-004 | Apply theme (light/dark/system) via CSS class on `<html>` | TODO |
| T15-005 | Apply board style (brown/blue/green/purple) to Chessboard component | TODO |
| T15-006 | Apply show-coordinates and highlight-last-move to Chessboard | TODO |
| T15-007 | Wire Settings page to use SettingsContext instead of local state | TODO |
| T15-008 | Persist engine defaults (analysisDepth, autoAnalyze) | TODO |

## Files Affected
- `packages/db/schema/settings.ts` (new)
- `packages/db/schema/pg.ts` (modify — export settings)
- `packages/api/src/routes/settings.ts` (new)
- `apps/desktop/src/web/lib/settings-context.tsx` (new)
- `apps/desktop/src/web/App.tsx` (modify — wrap with SettingsProvider)
- `apps/desktop/src/web/pages/settings.tsx` (modify — use context)
- `apps/desktop/src/web/components/Chessboard.tsx` (modify — accept boardStyle prop)

## Notes
- Simple key-value schema: `{ key: string, value: string }` — easy to extend
- Theme can be applied via `document.documentElement.classList.toggle('dark')`
- Board style maps to chessground theme presets (brown, blue, green, purple)
- The pawn-appetite reference stores settings in Tauri's store plugin
