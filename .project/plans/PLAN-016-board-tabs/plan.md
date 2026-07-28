# PLAN-016: Board Tabs Persistence

**Status**: DONE
**Created**: 2026-07-26
**Completed**: 2026-07-28

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
| T16-001 | Persist board tabs to localStorage (survive page navigation) | DONE |
| T16-002 | Change "+" to directly create a new Play tab | DONE |
| T16-003 | Add tab type selector as dropdown or right-click menu | DONE |
| T16-004 | Fix tab content isolation (each tab renders independently) | DONE |
| T16-005 | Add tab reordering (drag or move left/right) | DONE |
| T16-006 | Restore active tab from localStorage on mount | DONE |

## Files Affected
- `apps/desktop/src/web/pages/board.tsx` (modified — localStorage persistence, new tab logic)
- `apps/desktop/src/web/components/board/TabBar.tsx` (modified — dropdown on "+", drag-to-reorder)
- `apps/desktop/src/web/lib/usePersistentState.ts` (created — reusable localStorage hook)
- `apps/desktop/src/web/components/board/NewTabModal.tsx` (no longer used — can be removed)

## Implementation Notes

### usePersistentState Hook
Created a reusable hook at `lib/usePersistentState.ts` that:
- Wraps `useState` with automatic localStorage persistence
- Handles JSON serialization/deserialization with error boundaries
- Falls back to initial value if stored data is corrupt or missing

### TabBar Redesign
The "+" button is now split into two parts:
1. **Left half (Plus icon)**: Directly creates a new Play tab (browser-like behavior)
2. **Right half (ChevronDown)**: Opens a dropdown menu with tab type options (Play, FEN)

### Drag-to-Reorder
Tabs can be reordered by dragging. Implemented via HTML5 drag-and-drop API:
- Each tab has `draggable={true}` when `onMoveTab` is provided
- Drag events communicate the source index via `dataTransfer`
- Drop handler calculates the target index and calls `onMoveTab(from, to)`

### Content Isolation
Each `PlayGameView` instance uses `key={activeTab.id}` to ensure React treats different tabs as separate component instances, preventing state bleed between tabs.

### Persistence Keys
- `chess-coach.board-tabs` — stores the array of tab objects
- `chess-coach.board-tabs.active` — stores the active tab ID
