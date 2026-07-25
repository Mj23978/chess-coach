# Chess-Coach Development Roadmap

> Last updated: 2026-07-25 (PLAN-002 complete)
> 
> This roadmap tracks all features and tasks for the chess-coach desktop app.
> Each feature is broken into tasks that can be picked up independently.

---

## Status Legend

- `TODO` - Not started
- `IN_PROGRESS` - Currently being worked on
- `BLOCKED` - Blocked by another task
- `DONE` - Completed
- `DEFERRED` - Moved to future phase

---

## Phase 1: Foundation & Navigation

### F1: App Shell & Layout System
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| F1-001 | Create AppShell component with layout wrapper | DONE | - |
| F1-002 | Create NavigationRail component (left sidebar) | DONE | F1-001 |
| F1-003 | Add navigation items with icons | DONE | F1-002 |
| F1-004 | Implement active state indicator | DONE | F1-002 |
| F1-005 | Add collapsible/expandable behavior | DONE | F1-002 |
| F1-006 | Create TitleBar component with menus | DONE | - |
| F1-007 | Add File/Edit/View menus | DONE | F1-006 |
| F1-008 | Add minimize/maximize/close buttons | DONE | F1-006 |
| F1-009 | Add search bar to title bar | DONE | F1-006 |
| F1-010 | Wire up routes in App.tsx | DONE | F1-001 |

### F2: Navigation Routes
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| F2-001 | Add /board route (placeholder) | DONE | - |
| F2-002 | Add /engines route (move from settings) | DONE | - |
| F2-003 | Add /databases route (placeholder) | DONE | - |
| F2-004 | Add /files route (placeholder) | DONE | - |
| F2-005 | Add /accounts route (placeholder) | DONE | - |
| F2-006 | Add /train route (placeholder, deferred) | DONE | - |
| F2-007 | Update /settings route | DONE | F2-002 |

---

## Phase 2: Dashboard Redesign

### D1: Dashboard Layout
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| D1-001 | Create WelcomeCard component | DONE | - |
| D1-002 | Add Play Now button action | DONE | D1-001 |
| D1-003 | Add Import Game button action | DONE | D1-001 |
| D1-004 | Create ConnectedAccountsCard component | DONE | - |
| D1-005 | Create TimeControlGrid component | DONE | - |
| D1-006 | Add Classical/Rapid/Blitz/Bullet cards | DONE | D1-005 |
| D1-007 | Wire time control cards to game start | DONE | D1-006 |
| D1-008 | Rewrite DashboardPage with new layout | DONE | D1-001, D1-004, D1-005 |

### D2: Games Table
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| D2-001 | Create GamesTable component | DONE | - |
| D2-002 | Add Local/Chess.com/Lichess tabs | DONE | D2-001 |
| D2-003 | Add columns: Opponent, Color, Result | DONE | D2-001 |
| D2-004 | Add columns: Accuracy, ACPL, Moves, Date | DONE | D2-001 |
| D2-005 | Add Account column | DONE | D2-001 |
| D2-006 | Make rows clickable → game review | DONE | D2-001 |
| D2-007 | Add sorting functionality | DONE | D2-001 |
| D2-008 | Add filtering functionality | DONE | D2-001 |

### D3: Daily Goals Widget
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| D3-001 | Create DailyGoalsCard component | DONE | - |
| D3-002 | Add games played counter | DONE | D3-001 |
| D3-003 | Add puzzles solved counter (placeholder) | DONE | D3-001 |
| D3-004 | Create daily_goals table schema | TODO | - |
| D3-005 | Add API routes for goals | TODO | D3-004 |

---

## Phase 3: Board Page Redesign

### B1: Tabbed Board Interface
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| B1-001 | Create BoardPage with tab state | TODO | - |
| B1-002 | Create TabBar component (browser-like) | TODO | B1-001 |
| B1-003 | Add new tab button (+) | TODO | B1-002 |
| B1-004 | Implement tab switching | TODO | B1-002 |
| B1-005 | Create NewTabModal component | TODO | B1-003 |
| B1-006 | Add 4-card selection in modal | TODO | B1-005 |

### B2: Play Game Mode
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| B2-001 | Create PlayGameView component | TODO | - |
| B2-002 | Add Chessboard with eval bar | TODO | B2-001 |
| B2-003 | Create PlayerConfigCard component | TODO | - |
| B2-004 | Add White/Black side tabs | TODO | B2-003 |
| B2-005 | Add Human/Engine toggle per side | TODO | B2-004 |
| B2-006 | Add player name input (human) | TODO | B2-005 |
| B2-007 | Add time control selector (human) | TODO | B2-005 |
| B2-008 | Add engine dropdown (engine) | TODO | B2-005 |
| B2-009 | Add FEN input for custom position | TODO | B2-001 |
| B2-010 | Create GameActionsBar component | TODO | - |
| B2-011 | Add Flip/Screenshot/Save/Reload buttons | TODO | B2-010 |
| B2-012 | Create Clock component | TODO | - |

### B3: Game API for Play Mode
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| B3-001 | Add POST /games/play endpoint | TODO | - |
| B3-002 | Add POST /games/:id/move endpoint | TODO | B3-001 |
| B3-003 | Add game state management | TODO | B3-001 |
| B3-004 | Add engine move calculation | TODO | B3-003 |
| B3-005 | Add SSE for real-time updates | TODO | B3-003 |

### B4: Analysis Mode
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| B4-001 | Create AnalysisPanel component | TODO | - |
| B4-002 | Create AnalyzeTab (engine lines, eval graph) | TODO | B4-001 |
| B4-003 | Create DatabaseTab (similar positions) | TODO | B4-001 |
| B4-004 | Create AnnotateTab (comments, marks) | TODO | B4-001 |
| B4-005 | Create InfoTab (metadata, opening) | TODO | B4-001 |
| B4-006 | Add panel to game-review page | TODO | B4-001 |

### B5: Online Play Integration
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| B5-001 | Create online-play.ts client | TODO | - |
| B5-002 | Add Chess.com real-time connection | TODO | B5-001 |
| B5-003 | Add Lichess real-time connection | TODO | B5-001 |
| B5-004 | Handle moves, clock, game end | TODO | B5-002, B5-003 |
| B5-005 | Store completed games locally | TODO | B5-004 |
| B5-006 | Add POST /games/online endpoint | TODO | B5-001 |

---

## Phase 4: Accounts & Sync

### A1: Database Schema
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| A1-001 | Create accounts table schema | TODO | - |
| A1-002 | Create accountStats table schema | TODO | - |
| A1-003 | Run db:generate migration | TODO | A1-001, A1-002 |
| A1-004 | Run db:push to apply | TODO | A1-003 |

### A2: Accounts Page
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| A2-001 | Create AccountsPage component | TODO | - |
| A2-002 | Create AccountCard component | TODO | - |
| A2-003 | Add platform icon (Chess.com/Lichess) | TODO | A2-002 |
| A2-004 | Add rating display per time control | TODO | A2-002 |
| A2-005 | Add games synced/total display | TODO | A2-002 |
| A2-006 | Create AddAccountModal component | TODO | - |
| A2-007 | Add platform + username inputs | TODO | A2-006 |
| A2-008 | Add Edit/Sync/Download/Remove actions | TODO | A2-002 |

### A3: Chess.com Integration
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| A3-001 | Create chesscom.ts API client | TODO | A1-004 |
| A3-002 | Implement public API access | TODO | A3-001 |
| A3-003 | Fetch game archives by username | TODO | A3-002 |
| A3-004 | Download PGNs incrementally | TODO | A3-003 |
| A3-005 | Parse PGN and store in games table | TODO | A3-004 |
| A3-006 | Add source field to games table | TODO | A1-004 |

### A4: Lichess Integration
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| A4-001 | Create lichess.ts API client | TODO | A1-004 |
| A4-002 | Implement OAuth PKCE flow | TODO | A4-001 |
| A4-003 | Store tokens in accounts table | TODO | A4-002 |
| A4-004 | Fetch games via API | TODO | A4-002 |
| A4-005 | Incremental sync with lastSyncedAt | TODO | A4-004 |

### A5: Player Database Drawer
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| A5-001 | Create PlayerDatabaseDrawer component | TODO | - |
| A5-002 | Create OverviewTab (win % chart) | TODO | A5-001 |
| A5-003 | Create RatingsTab (rating history) | TODO | A5-001 |
| A5-004 | Create OpeningsTab (opening performance) | TODO | A5-001 |
| A5-005 | Add account switcher dropdown | TODO | A5-001 |

### A6: Account API Routes
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| A6-001 | Add GET /accounts endpoint | TODO | A1-004 |
| A6-002 | Add POST /accounts endpoint | TODO | A1-004 |
| A6-003 | Add PATCH /accounts/:id endpoint | TODO | A1-004 |
| A6-004 | Add DELETE /accounts/:id endpoint | TODO | A1-004 |
| A6-005 | Add POST /accounts/:id/sync endpoint | TODO | A3-001, A4-001 |
| A6-006 | Add GET /accounts/:id/stats endpoint | TODO | A1-004 |

---

## Phase 5: Databases Page

### DB1: Database Schema
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| DB1-001 | Create databases table schema | TODO | - |
| DB1-002 | Create databaseGames junction table | TODO | - |
| DB1-003 | Run db:generate migration | TODO | DB1-001, DB1-002 |
| DB1-004 | Run db:push to apply | TODO | DB1-003 |

### DB2: Databases Page UI
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| DB2-001 | Create DatabasesPage component | TODO | - |
| DB2-002 | Create DatabaseCard component | TODO | - |
| DB2-003 | Add Grid/List view toggle | TODO | DB2-001 |
| DB2-004 | Create GenericHeader component | TODO | - |
| DB2-005 | Add search/sort/add actions | TODO | DB2-004 |
| DB2-006 | Create DatabaseDrawer component | TODO | - |
| DB2-007 | Add rename/description fields | TODO | DB2-006 |
| DB2-008 | Add explore games action | TODO | DB2-006 |
| DB2-009 | Add remove duplicates action | TODO | DB2-006 |
| DB2-010 | Add export games action | TODO | DB2-006 |

### DB3: Database API Routes
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| DB3-001 | Add GET /databases endpoint | TODO | DB1-004 |
| DB3-002 | Add POST /databases endpoint | TODO | DB1-004 |
| DB3-003 | Add GET /databases/:id endpoint | TODO | DB1-004 |
| DB3-004 | Add PATCH /databases/:id endpoint | TODO | DB1-004 |
| DB3-005 | Add DELETE /databases/:id endpoint | TODO | DB1-004 |
| DB3-006 | Add POST /databases/:id/games endpoint | TODO | DB1-004 |
| DB3-007 | Add GET /databases/:id/export endpoint | TODO | DB1-004 |

---

## Phase 6: Files Page

### FL1: Database Schema
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| FL1-001 | Create files table schema | TODO | - |
| FL1-002 | Run db:generate migration | TODO | FL1-001 |
| FL1-003 | Run db:push to apply | TODO | FL1-002 |

### FL2: Files Page UI
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| FL2-001 | Create FilesPage component | TODO | - |
| FL2-002 | Create FileCard component | TODO | - |
| FL2-003 | Create AddFileModal component | TODO | - |
| FL2-004 | Add type picker (game/repertoire/tournament/puzzle) | TODO | FL2-003 |
| FL2-005 | Add PGN paste/file upload | TODO | FL2-003 |

### FL3: Files API Routes
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| FL3-001 | Add GET /files endpoint | TODO | FL1-003 |
| FL3-002 | Add POST /files endpoint | TODO | FL1-003 |
| FL3-003 | Add GET /files/:id endpoint | TODO | FL1-003 |
| FL3-004 | Add PATCH /files/:id endpoint | TODO | FL1-003 |
| FL3-005 | Add DELETE /files/:id endpoint | TODO | FL1-003 |

---

## Phase 7: Engines Page Polish

### E1: Engines Page Migration
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| E1-001 | Create EnginesPage component | DONE | - |
| E1-002 | Move engine management from settings | DONE | E1-001 |
| E1-003 | Add search functionality | TODO | E1-001 |
| E1-004 | Add List view toggle | TODO | E1-001 |
| E1-005 | Improve EngineCard styling | TODO | - |
| E1-006 | Add engine images | TODO | E1-005 |

---

## Phase 8: Settings & Keybindings

### S1: Settings Page Redesign
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| S1-001 | Create new SettingsPage layout | TODO | - |
| S1-002 | Add Appearance section (theme, board colors) | TODO | S1-001 |
| S1-003 | Add Engine defaults section | TODO | S1-001 |
| S1-004 | Add Sync preferences section | TODO | S1-001 |
| S1-005 | Add Keyboard shortcuts editor | TODO | S1-001 |
| S1-006 | Add About section | TODO | S1-001 |

### S2: Keyboard Shortcuts
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| S2-001 | Create useKeyboardShortcuts hook | TODO | - |
| S2-002 | Add Ctrl+1-7 for navigation | TODO | S2-001 |
| S2-003 | Add arrow keys for game navigation | TODO | S2-001 |
| S2-004 | Add F for flip board | TODO | S2-001 |
| S2-005 | Add S for save PGN | TODO | S2-001 |
| S2-006 | Add Ctrl+F for global search | TODO | S2-001 |

---

## Phase 9: Export & Polish

### X1: Export Features
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| X1-001 | Add PGN export with annotations | TODO | - |
| X1-002 | Add FEN copy to clipboard | TODO | - |
| X1-003 | Add screenshot to clipboard/file | TODO | - |

### X2: UI Polish
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| X2-001 | Add loading skeletons | TODO | - |
| X2-002 | Add error boundaries | TODO | - |
| X2-003 | Add empty states | TODO | - |
| X2-004 | Add toast notifications | TODO | - |

---

## Deferred: Training & Puzzles (Phase 2)

### T1: Database Schema
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| T1-001 | Create puzzles table schema | DEFERRED | - |
| T1-002 | Create puzzle_sets table schema | DEFERRED | - |
| T1-003 | Create daily_goals table schema | DEFERRED | - |

### T2: Puzzle Mode
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| T2-001 | Create PuzzleMode component | DEFERRED | T1-003 |
| T2-002 | Fetch puzzles from Lichess | DEFERRED | T2-001 |
| T2-003 | Implement rating adjustment | DEFERRED | T2-001 |
| T2-004 | Add spaced repetition (ts-fsrs) | DEFERRED | T2-001 |

### T3: Training Page
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| T3-001 | Create TrainingPage component | DEFERRED | - |
| T3-002 | Add Tactics section | DEFERRED | T3-001 |
| T3-003 | Add Practices section | DEFERRED | T3-001 |
| T3-004 | Add Daily Goals tracking | DEFERRED | T3-001 |

---

## Summary Statistics

| Phase | Total Tasks | TODO | IN_PROGRESS | DONE | DEFERRED |
|-------|-------------|------|-------------|------|----------|
| Phase 1: Foundation | 17 | 0 | 0 | 17 | 0 |
| Phase 2: Dashboard | 21 | 2 | 0 | 19 | 0 |
| Phase 3: Board | 28 | 28 | 0 | 0 | 0 |
| Phase 4: Accounts | 26 | 22 | 0 | 0 | 4 |
| Phase 5: Databases | 17 | 17 | 0 | 0 | 0 |
| Phase 6: Files | 8 | 8 | 0 | 0 | 0 |
| Phase 7: Engines | 6 | 4 | 0 | 2 | 0 |
| Phase 8: Settings | 12 | 12 | 0 | 0 | 0 |
| Phase 9: Export | 7 | 7 | 0 | 0 | 0 |
| Deferred: Training | 8 | 0 | 0 | 0 | 8 |
| **Total** | **150** | **100** | **0** | **38** | **12** |

---

## How to Use This Roadmap

1. **Pick a task**: Choose a task with status `TODO` and no blocking dependencies
2. **Create a plan folder**: `.project/plans/PLAN-XXX-feature-name/`
3. **Document progress**: Add `task-YYY.md` for each task you work on
4. **Update status**: Change task status in this file when starting/completing
5. **Store context**: Save investigation results in `.project/context/`

---

## Workflow for Agents

When starting work on a task:

1. Read `.project/ROADMAP.md` to understand dependencies
2. Read relevant task file in `.project/plans/PLAN-XXX/`
3. Read context files in `.project/context/` if they exist
4. Implement the task
5. Update task status in ROADMAP.md
6. Document any findings in `.project/context/`

This enables multiple agents to work in parallel without conflicts.
