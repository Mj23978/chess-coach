# Chess-Coach Development Roadmap

> Last updated: 2026-07-26 — Post-first-test cleanup
> 
> This roadmap tracks all features and tasks for the chess-coach desktop app.
> Completed phases are archived; active work focuses on critical fixes and the
> core game analysis pipeline.

---

## Status Legend

- `TODO` - Not started, available for pickup
- `IN_PROGRESS` - Currently being worked on
- `BLOCKED` - Blocked by another task
- `DONE` - Completed
- `DEFERRED` - Moved to future phase

---

## Archived Features (Implemented)

These features are complete and shipped. Plan files are in `.project/archive/`.

| Phase | Feature | Plan | Status |
|-------|---------|------|--------|
| 1 | App Shell & Navigation Rail | PLAN-001 | ✅ Complete |
| 2 | Dashboard Redesign (Welcome, Time Controls, Games Table) | PLAN-002 | ✅ Complete |
| 4 | Accounts & Sync (Chess.com, Lichess OAuth) | PLAN-004 | ✅ Complete |
| 5 | Databases Page (CRUD, Export, Dedup) | PLAN-005 | ✅ Complete |
| 6 | Files Page (PGN Import, CRUD) | PLAN-009 | ✅ Complete |
| 7 | Engines Page (Download, Activate, Grid/List) | PLAN-007 | ✅ Complete |
| 8 | Settings & Keybindings | PLAN-008 | ✅ Complete |
| 9 | Export Features (PGN, FEN, Screenshot) | PLAN-009 | ✅ Complete |
| 10 | Sidebar Push Layout | PLAN-012 | ✅ Complete |

---

## Active Plans (Priority Order)

### P1: Engine Pipeline Fix (CRITICAL)

> **PLAN-011** — Blocks all engine-dependent features.
> Engine downloads successfully but analyze returns 503.

| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| T11-001 | Fix `getEngine()` to use active engine from DB with error logging | DONE | — |
| T11-002 | Ensure `chmod +x` works on downloaded engines | DONE | — |
| T11-003 | Add engine status validation endpoint | DONE | — |
| T11-004 | Make EngineCard clickable to show details (path, status) | DONE | — |
| T11-005 | Add engine health check on app startup | DONE | — |
| T11-006 | Surface engine path in the engine details view | DONE | — |

### P2: UI/UX Fixes (Parallel, after P1)

#### PLAN-010: Window Chrome Cleanup
> Remove duplicate TitleBar with minimize/maximize/close and File/Edit/View menus.
> Electrobun handles native window chrome.

| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| T10-001 | Remove TitleBar component and imports from AppShell | DONE | — |
| T10-002 | Add minimal app-drag region for window dragging | DONE | — |
| T10-003 | Move File menu actions to keyboard shortcuts | DONE | — |
| T10-004 | Remove Edit/View menus (unused) | DONE | — |
| T10-005 | Update AppShell layout for removed TitleBar | DONE | — |

#### PLAN-012: Sidebar Fix ✅
> Sidebar overlays content instead of pushing. No close button.

| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| T12-001 | Fix SidebarInset layout to push content | DONE | — |
| T12-002 | Add collapse/expand button in sidebar header | DONE | — |
| T12-003 | Ensure smooth transition when sidebar toggles | DONE | — |
| T12-004 | Test sidebar behavior at all viewport sizes | DONE | — |

#### PLAN-013: Dialog & Modal Improvements
> Modals don't close on outside click.

| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| T13-001 | Audit all modals/dialogs for outside-click behavior | TODO | — |
| T13-002 | Replace raw overlay divs with proper Dialog components | TODO | — |
| T13-003 | Ensure all Dialogs use `onOpenChange` | TODO | — |
| T13-004 | Add Escape key handling to all modals | TODO | — |

#### PLAN-014: Layout Consistency
> Pages don't take full width. Settings page layout shifts.

| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| T14-001 | Define standard PageContainer component | TODO | — |
| T14-002 | Update all pages to use consistent max-width | TODO | — |
| T14-003 | Fix Settings page layout shift on section expand | TODO | — |
| T14-004 | Fix Accounts page to use full width | TODO | — |
| T14-005 | Fix Databases/Files pages layout | TODO | — |
| T14-006 | Ensure sidebar push doesn't break page widths | TODO | — |

#### PLAN-015: Settings Persistence
> Settings changes don't persist or apply.

| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| T15-001 | Create `settings` table schema | TODO | — |
| T15-002 | Add GET/PATCH /settings API routes | TODO | — |
| T15-003 | Create SettingsContext provider | TODO | — |
| T15-004 | Apply theme (light/dark/system) via CSS | TODO | — |
| T15-005 | Apply board style to Chessboard component | TODO | — |
| T15-006 | Apply show-coordinates/highlight-last-move | TODO | — |
| T15-007 | Wire Settings page to use SettingsContext | TODO | — |
| T15-008 | Persist engine defaults | TODO | — |

#### PLAN-016: Board Tabs Persistence
> Tabs don't survive navigation. "+" opens modal instead of new tab.

| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| T16-001 | Persist board tabs to localStorage | TODO | — |
| T16-002 | Change "+" to directly create a new Play tab | TODO | — |
| T16-003 | Add tab type selector as dropdown | TODO | — |
| T16-004 | Fix tab content isolation | TODO | — |
| T16-005 | Add tab reordering | TODO | — |
| T16-006 | Restore active tab from localStorage | TODO | — |

### P3: Board Engine & Analysis (Needs P1)

#### PLAN-017: Board Engine Integration & Win Bar
> Eval bar doesn't update during play. Engine doesn't play moves.

| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| T17-001 | Add real-time eval to play sessions | TODO | T11-001 |
| T17-002 | Update PlayGameView to display live eval bar | TODO | T17-001 |
| T17-003 | Ensure engine plays correctly as a player | TODO | T11-001 |
| T17-004 | Fix eval bar animation | TODO | T17-002 |
| T17-005 | Add eval display (cp/mate) alongside bar | TODO | T17-002 |
| T17-006 | Handle engine unavailability during play | TODO | T11-001 |

#### PLAN-018: Game Analysis Pipeline (CRITICAL)
> Chess.com-style move classification. The core feature.

| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| T18-001 | Port chess-kit move classifier | TODO | T11-001 |
| T18-002 | Create eval line chart component | TODO | — |
| T18-003 | Redesign game review page layout | TODO | T18-002 |
| T18-004 | Add per-move eval display in move list | TODO | T18-003 |
| T18-005 | Add accuracy calculation for both sides | TODO | T18-001 |
| T18-006 | Add player rating estimation | TODO | T18-005 |
| T18-007 | Make move list scrollable, auto-follow current ply | TODO | T18-003 |
| T18-008 | Add opening name display from ECO database | TODO | — |
| T18-009 | Ensure analysis persists in games table | TODO | T18-001 |

---

## Deferred: Training & Puzzles

| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| T1-001 | Create puzzles table schema | DEFERRED | — |
| T1-002 | Create puzzle_sets table schema | DEFERRED | — |
| T1-003 | Create PuzzleMode component | DEFERRED | T1-001 |
| T1-004 | Fetch puzzles from Lichess | DEFERRED | T1-003 |
| T1-005 | Implement rating adjustment | DEFERRED | T1-003 |
| T1-006 | Add spaced repetition (ts-fsrs) | DEFERRED | T1-003 |
| T1-007 | Create TrainingPage component | DEFERRED | — |
| T1-008 | Add Daily Goals tracking | DEFERRED | T1-007 |

---

## Deferred: Online Play

| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| B5-001 | Create online-play.ts client | DEFERRED | — |
| B5-002 | Add Chess.com real-time connection | DEFERRED | B5-001 |
| B5-003 | Add Lichess real-time connection | DEFERRED | B5-001 |
| B5-004 | Handle moves, clock, game end | DEFERRED | B5-002 |
| B5-005 | Store completed games locally | DEFERRED | B5-004 |

---

## Summary

| Category | Tasks | TODO | DEFERRED |
|----------|-------|------|----------|
| P1: Engine Pipeline | 6 | 0 | 0 |
| P2: UI/UX Fixes | 29 | 25 | 0 |
| P3: Board & Analysis | 15 | 15 | 0 |
| Deferred: Training | 8 | 0 | 8 |
| Deferred: Online Play | 5 | 0 | 5 |
| **Total** | **63** | **40** | **13** |

---

## How to Use This Roadmap

1. **Check dependencies** — P1 must be done before P3
2. **Pick a plan** — Each plan folder has detailed task files
3. **Read context** — Check `.project/context/` for investigation results
4. **Update status** — Change task status in this file when starting/completing
5. **Reference examples** — `examples/chess-kit/` for analysis, `examples/pawn-appetite/` for general patterns
