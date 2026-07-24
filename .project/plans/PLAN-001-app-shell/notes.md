# PLAN-001: App Shell & Navigation — Implementation Notes

**Status**: DONE
**Completed**: 2026-07-24
**Agent**: main

## What was built

### Layout shell (`apps/desktop/src/web/components/layout/`)
- **AppShell.tsx** — root layout: `TitleBar` (top) + `SidebarProvider` wrapping
  `NavigationRail` (left) + `SidebarInset` (main content). Owns the keybindings
  modal placeholder (Phase 8 will replace it).
- **NavigationRail.tsx** — `@repo/ui` Sidebar in `collapsible="icon"` mode.
  Main nav: Dashboard, Board, Engines, Databases, Files, Accounts, Train.
  Footer: Keybindings (opens modal), Settings. Active state via `useLocation()`.
  When collapsed to icon-rail, tooltips show the label.
- **TitleBar.tsx** — custom window chrome. File/Edit/View dropdown menus (via
  `@repo/ui` DropdownMenu), center search bar (placeholder), window controls
  (minimize/maximize/close — TODO: wire to Electrobun APIs). Sidebar toggle
  button mirrors Ctrl+B.
- **index.ts** — barrel exports.

### Routes wired in `App.tsx`
All Phase 1 routes registered, wrapped in `<AppShell>`:
`/`, `/games/:id`, `/board`, `/engines`, `/databases`, `/files`, `/accounts`,
`/train`, `/settings`.

### Placeholder pages
`board.tsx`, `databases.tsx`, `files.tsx`, `accounts.tsx`, `train.tsx` — card
grids describing future functionality. Ready to be fleshed out in their phases.

### Engines page (`engines.tsx`)
Full engine management UI (moved out of `settings.tsx`): list configured
engines, Download Engine (catalog modal), Add Local Engine (path modal),
activate/remove. Self-contained — no longer imports from settings.

### Settings page (`settings.tsx`) — slimmed
Reduced to an "About" card. Engine management removed (now at `/engines`).
Phase 8 will add Appearance / Engine defaults / Sync / Keybindings sections.

### Cleanup
- Removed redundant "← Dashboard" back-links (nav rail handles navigation)
  from `engines.tsx`, `game-review.tsx`.
- Removed the local Import modal + Settings button from `dashboard.tsx`;
  Import PGN is now triggered via the App-level modal (opened from the
  TitleBar File menu and the dashboard Import button). `App.tsx` invalidates
  the `games` query on successful import.
- Updated `game-review.tsx` header (dropped the stale back-link).

## Dependencies added
- `lucide-react` added to the desktop app (`catalog:`) and to the root
  workspace catalog (`^0.485.0`). `@repo/ui` already had it.

## @repo/ui fixes (required by the Sidebar)
The Sidebar component (`packages/ui/components/sidebar.tsx`) was ported from
shadcn/ui but its dependencies were never created during the Aksam migration:
- **`packages/ui/hooks/use-mobile.ts`** (new) — `useIsMobile()` hook
  (matchMedia on 768px breakpoint). Barrel `hooks/index.ts` added.
- **`packages/ui/components/tooltip.tsx`** — replaced the stub (which only
  exported `Tooltip`/`TooltipProvider` as pass-throughs) with a real
  Radix-based implementation exporting `Tooltip`, `TooltipTrigger`,
  `TooltipContent`, `TooltipProvider`. Required because Sidebar's
  icon-collapsed mode renders a tooltip per menu item.

These two fixes are what unblocked the Sidebar import. The remaining
`@repo/ui` typecheck errors (letter-glitch, light-rays, mode-toggle, etc.)
are pre-existing and unrelated — they come from the original Aksam
migration and aren't used by chess-coach.

## Verification
- `bun --filter=@chess-coach/desktop run typecheck` → **clean (exit 0)**
- `bun install` → resolves `lucide-react@catalog:` correctly.
- Biome `format --write` applied to all changed files (tabs).

## Known gaps / TODOs for later phases
- Window controls (minimize/maximize/close) in TitleBar currently `console.log`
  — wire to Electrobun's `window`/`app` APIs (Phase 8 or an Electrobun task).
- Keybindings modal is a static placeholder — Phase 8 (S2) implements the
  real shortcut editor + `useKeyboardShortcuts` hook.
- Search bar in TitleBar is non-functional — global search is a later feature.
- The Sidebar's Ctrl+B shortcut works out-of-the-box (built into SidebarProvider).
