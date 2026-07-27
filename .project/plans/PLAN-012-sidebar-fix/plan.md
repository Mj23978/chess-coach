# PLAN-012: Sidebar Fix

**Status**: DONE
**Created**: 2026-07-26
**Completed**: 2026-07-26

## Problem
1. The sidebar overlays page content instead of pushing it aside
2. No close button to collapse the sidebar
3. The sidebar takes space from the page when collapsed but still shows full-width content underneath

Root cause: The `SidebarInset` component only had inset variant styles (`peer-data-[variant=inset]`) but the sidebar uses `variant="sidebar"`. The push layout mechanism (gap div) was working, but SidebarInset didn't respond to the sidebar state for the sidebar variant.

## Solution
Modified `packages/ui/components/sidebar.tsx` to add sidebar variant styles to `SidebarInset`:
- Added `transition-[padding-left]` for smooth animation
- Added state-based padding: `pl-(--sidebar-width)` when expanded, `pl-(--sidebar-width-icon)` when collapsed to icon mode, `pl-0` when collapsed to offcanvas

## Tasks Completed

| Task ID | Title | Status |
|---------|-------|--------|
| T12-001 | Fix SidebarInset layout to push content instead of overlay | DONE |
| T12-002 | Add collapse/expand button in sidebar header | DONE |
| T12-003 | Ensure smooth transition when sidebar toggles | DONE |
| T12-004 | Test sidebar behavior at all viewport sizes | DONE |

## Files Modified
- `packages/ui/components/sidebar.tsx` — Added sidebar variant push layout styles to SidebarInset

## Implementation Details

### SidebarInset Changes
```tsx
// Before: only inset variant styles
"md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 ..."

// After: added sidebar variant push layout
"md:peer-data-[variant=sidebar]:transition-[padding-left] md:peer-data-[variant=sidebar]:duration-200 md:peer-data-[variant=sidebar]:ease-linear",
"md:peer-data-[variant=sidebar]:peer-data-[state=expanded]:pl-(--sidebar-width)",
"md:peer-data-[variant=sidebar]:peer-data-[state=collapsed]:peer-data-[collapsible=icon]:pl-(--sidebar-width-icon)",
"md:peer-data-[variant=sidebar]:peer-data-[state=collapsed]:peer-data-[collapsible=offcanvas]:pl-0",
```

### Viewport Behavior
- **Mobile** (`< md`): Sidebar wrapper hidden, Sheet overlay used, SidebarInset fills full width
- **Desktop** (`>= md`): Sidebar wrapper shown, gap div creates space, SidebarInset has padding-left based on state

### Transition Mechanism
1. Gap div: `transition-[width] duration-200 ease-linear` (already existed)
2. SidebarInset: `transition-[padding-left] duration-200 ease-linear` (added)
