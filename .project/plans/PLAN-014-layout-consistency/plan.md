# PLAN-014: Layout Consistency

**Status**: TODO
**Created**: 2026-07-26

## Problem
1. Pages don't take the full available width — content is centered with inconsistent max-widths
2. Accounts page has everything centered in a narrow column
3. Settings page jumps when expanding collapsible sections (layout shift)
4. The board page, engines page, and other pages use different max-width constraints

## Approach
1. Establish a consistent page layout pattern: full-width container with max-width
2. Remove or increase the narrow `max-w-3xl`/`max-w-4xl` constraints on content pages
3. Use a consistent spacing/padding system across all pages
4. Prevent layout shift in collapsible sections by using min-height or separate layout

## Tasks

| Task ID | Title | Status |
|---------|-------|--------|
| T14-001 | Define standard page layout component (full-width container) | TODO |
| T14-002 | Update all pages to use consistent max-width (`max-w-7xl` or full) | TODO |
| T14-003 | Fix Settings page layout shift on section expand/collapse | TODO |
| T14-004 | Fix Accounts page to use full width for cards | TODO |
| T14-005 | Fix Databases/Files pages to use consistent layout | TODO |
| T14-006 | Ensure sidebar push layout doesn't break page widths | TODO |

## Files Affected
- `apps/desktop/src/web/pages/dashboard.tsx`
- `apps/desktop/src/web/pages/accounts.tsx`
- `apps/desktop/src/web/pages/engines.tsx`
- `apps/desktop/src/web/pages/databases.tsx`
- `apps/desktop/src/web/pages/files.tsx`
- `apps/desktop/src/web/pages/settings.tsx`
- `apps/desktop/src/web/pages/board.tsx`
- `apps/desktop/src/web/pages/game-review.tsx`
- A new `apps/desktop/src/web/components/layout/PageContainer.tsx` (shared wrapper)

## Notes
- The pawn-appetite reference uses `Container` with `size="xl"` for consistent width
- Settings sections should animate height, not reflow content
- Consider using CSS Grid for page layouts instead of flex with max-width
