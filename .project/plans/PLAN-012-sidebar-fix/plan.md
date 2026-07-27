# PLAN-012: Sidebar Fix

**Status**: TODO
**Created**: 2026-07-26

## Problem
1. The sidebar overlays page content instead of pushing it aside
2. No close button to collapse the sidebar
3. The sidebar takes space from the page when collapsed but still shows full-width content underneath

Root cause: The `SidebarInset` wrapper and the sidebar layout CSS need adjustment. The sidebar should use a push layout where content shifts when sidebar opens/closes.

## Approach
1. Fix the sidebar push layout using the @repo/ui Sidebar components properly
2. Add a visible close/collapse button in the sidebar header or rail
3. Ensure the content area resizes smoothly when sidebar toggles

## Tasks

| Task ID | Title | Status |
|---------|-------|--------|
| T12-001 | Fix SidebarInset layout to push content instead of overlay | TODO |
| T12-002 | Add collapse/expand button in sidebar header | TODO |
| T12-003 | Ensure smooth transition when sidebar toggles | TODO |
| T12-004 | Test sidebar behavior at all viewport sizes | TODO |

## Files Affected
- `apps/desktop/src/web/components/layout/AppShell.tsx` (modify — fix SidebarProvider config)
- `apps/desktop/src/web/components/layout/NavigationRail.tsx` (modify — add close button)
- `packages/ui/components/sidebar.tsx` (may need CSS fixes for push layout)

## Notes
- The @repo/ui Sidebar component supports `collapsible="icon"` which should push content
- Check if `SidebarInset` has the correct margin-left when sidebar is open
- The sidebar rail (`SidebarRail`) provides a thin strip that can be used to toggle
- Reference: shadcn/ui sidebar examples show the push layout pattern
