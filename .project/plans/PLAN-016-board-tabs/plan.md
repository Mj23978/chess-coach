# PLAN-016: Board Tabs Persistence

**Status**: TODO
**Created**: 2026-07-26

## Problem
1. Board tabs don't persist when navigating away — going to Settings and back loses all tabs
2. Clicking "+" opens a modal instead of directly creating a new tab with a default page
3. When switching between tabs, content isn't properly separated (both tabs show same content)

## Approach
1. Persist tab state to localStorage or the DB so tabs survive navigation
2. Change "+" behavior: directly create a new "Play" tab (like browsers open a blank page)
3. Keep the modal as a secondary option (e.g., right-click "+" or a dropdown)
4. Fix tab content isolation by ensuring each tab has a unique key

## Tasks

| Task ID | Title | Status |
|---------|-------|--------|
| T16-001 | Persist board tabs to localStorage (survive page navigation) | TODO |
| T16-002 | Change "+" to directly create a new Play tab | TODO |
| T16-003 | Add tab type selector as dropdown or right-click menu | TODO |
| T16-004 | Fix tab content isolation (each tab renders independently) | TODO |
| T16-005 | Add tab reordering (drag or move left/right) | TODO |
| T16-006 | Restore active tab from localStorage on mount | TODO |

## Files Affected
- `apps/desktop/src/web/pages/board.tsx` (modify — localStorage persistence, new tab logic)
- `apps/desktop/src/web/components/board/TabBar.tsx` (modify — add dropdown on "+")
- `apps/desktop/src/web/components/board/NewTabModal.tsx` (modify — make optional)

## Notes
- Browser-like behavior: "+" opens a blank tab immediately
- The modal can become a "new tab" menu with Play/FEN/Analysis/Import options
- Each tab needs a stable ID that survives re-renders
- Consider using `useReducer` for complex tab state management
