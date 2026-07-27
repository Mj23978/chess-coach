# PLAN-013: Dialog & Modal Improvements

**Status**: TODO
**Created**: 2026-07-26

## Problem
Dialogs and modals don't close when clicking outside. Users must click the Cancel/Close button explicitly.

## Approach
The Radix Dialog component already supports closing on overlay click by default. The issue is likely that some modals are implemented as raw `<div className="fixed inset-0 ...">` instead of using the `Dialog` component, or the overlay click handler is missing.

## Tasks

| Task ID | Title | Status |
|---------|-------|--------|
| T13-001 | Audit all modals/dialogs for outside-click behavior | TODO |
| T13-002 | Replace raw overlay divs with proper Dialog/Sheet components | TODO |
| T13-003 | Ensure all Dialogs use `onOpenChange` for outside-click closing | TODO |
| T13-004 | Add Escape key handling to all modals | TODO |

## Files Affected
- `apps/desktop/src/web/pages/engines.tsx` (CatalogModal, AddEngineModal — raw divs)
- `apps/desktop/src/web/components/layout/AppShell.tsx` (KeybindingsModal — raw div)
- Any other modals using raw overlay patterns

## Notes
- The `Dialog` component from `@repo/ui/components/dialog.tsx` uses Radix under the hood
- Radix Dialog closes on overlay click by default when `onOpenChange` is provided
- The `confirm()` calls (e.g., delete engine) should be replaced with proper confirmation dialogs
- The import PGN modal already uses proper Dialog — use it as reference
