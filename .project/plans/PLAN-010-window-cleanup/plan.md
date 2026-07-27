# PLAN-010: Window Chrome Cleanup

**Status**: TODO
**Created**: 2026-07-26

## Problem
The SPA renders its own TitleBar with minimize/maximize/close buttons and File/Edit/View menus. The Electrobun desktop window already provides these natively (OS title bar + traffic lights on macOS). This creates duplicate, non-functional window controls and a confusing menu bar.

## Approach
1. **Remove the custom TitleBar entirely** — Electrobun manages window chrome
2. **Add a minimal drag region** if needed for the top of the window (Electrobun's `app-drag` CSS class)
3. **Keep essential menu actions** (Import PGN, Export PGN) as keyboard shortcuts or toolbar buttons, not menu-bar items

## Tasks

| Task ID | Title | Status |
|---------|-------|--------|
| T10-001 | Remove TitleBar component and its imports from AppShell | TODO |
| T10-002 | Add minimal app-drag region at top of sidebar for window dragging | TODO |
| T10-003 | Move File menu actions to keyboard shortcuts + toolbar buttons | TODO |
| T10-004 | Remove Edit/View menus (unused functionality) | TODO |
| T10-005 | Update AppShell layout to account for removed TitleBar | TODO |

## Files Affected
- `apps/desktop/src/web/components/layout/TitleBar.tsx` (delete)
- `apps/desktop/src/web/components/layout/AppShell.tsx` (modify)
- `apps/desktop/src/web/components/layout/NavigationRail.tsx` (modify — add drag region)
- `apps/desktop/src/web/lib/useKeyboardShortcuts.ts` (modify — add more shortcuts)

## Notes
- Electrobun provides `app-drag` CSS class for draggable regions
- The native window controls (minimize/maximize/close) are handled by the OS
- File menu items (New Game, Import PGN, Export PGN) can become keyboard shortcuts
- The search bar in the title bar can move to a global Cmd+K/Ctrl+K palette
