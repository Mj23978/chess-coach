# PLAN-013: Dialog & Modal Improvements

**Status**: ✅ COMPLETE
**Priority**: Medium
**Started**: 2026-07-27
**Completed**: 2026-07-27

## Problem

Modals/dialogs didn't close on outside click — users had to click Cancel/Close
buttons. Several modals used raw overlay `<div>` patterns with inconsistent
behavior: some had `onClick` on the backdrop, others didn't. Escape key
handling was also inconsistent.

## Approach

1. **Created shared `ModalShell` component** (`components/ui/modal-shell.tsx`)
   wrapping Radix Dialog for consistent behavior across all modals.

2. **Replaced all raw overlay modals** with `ModalShell`:
   - `ImportPgnModal` — raw overlay → ModalShell
   - `AddAccountModal` — raw overlay (no outside-click!) → ModalShell
   - `DatabaseModals.tsx` — local ModalShell → shared ModalShell
   - `FileModals.tsx` — local ModalShell → shared ModalShell
   - `CreateFileModal` (files/) — raw overlay (no outside-click!) → ModalShell
   - `CatalogModal` (engines) — raw overlay → ModalShell
   - `AddEngineModal` (engines) — raw overlay → ModalShell
   - `RenameModal` (AccountCard) — raw overlay → ModalShell
   - `ConfirmModal` (AccountCard) — raw overlay → ModalShell
   - `KeybindingsModal` (AppShell) — raw overlay → ModalShell

3. **Added Escape key handling** to `EngineDetailSheet` (the one non-Dialog
   overlay) via a document-level `keydown` listener.

## Files Changed

| File | Change |
|------|--------|
| `components/ui/modal-shell.tsx` | **NEW** — shared ModalShell component |
| `components/import-pgn-modal.tsx` | Replace raw overlay with ModalShell |
| `components/accounts/AddAccountModal.tsx` | Replace raw overlay (missing outside-click!) with ModalShell |
| `components/accounts/AccountCard.tsx` | Replace RenameModal + ConfirmModal raw overlays with ModalShell |
| `components/databases/DatabaseModals.tsx` | Replace local ModalShell with shared ModalShell |
| `components/files/FileModals.tsx` | Replace local ModalShell with shared ModalShell |
| `components/files/CreateFileModal.tsx` | Replace raw overlay (missing outside-click!) with ModalShell |
| `components/engines/EngineDetailSheet.tsx` | Add useEffect for document-level Escape key |
| `pages/engines.tsx` | Replace CatalogModal + AddEngineModal raw overlays with ModalShell |
| `components/layout/AppShell.tsx` | Replace KeybindingsModal raw overlay with ModalShell |

## Verification

After merging, test on Windows PC:
- Open any modal (Import PGN, Add Account, Create Database, etc.)
- Click outside the modal → should close
- Press Escape → should close
- Verify no modals are missing close behavior
