# PLAN-002: Dashboard Redesign

**Phase**: 2
**Priority**: P0
**Parallel Safe**: ✅ Yes (after PLAN-001 is complete)
**Estimated Duration**: 1-2 weeks

---

## Overview

Redesign the dashboard page to match the pawn-appetite reference app with:
welcome card, connected accounts, time control quick start, games table with tabs,
and daily goals widget.

## Scope

### In Scope
- WelcomeCard with Play Now / Import Game actions
- ConnectedAccountsCard showing synced accounts
- TimeControlGrid with Classical/Rapid/Blitz/Bullet cards
- GamesTable with Local/Chess.com/Lichess tabs
- DailyGoalsCard widget

### Out of Scope
- Account management UI (PLAN-004)
- Training/puzzles (deferred to Phase 2)
- Actual game play (PLAN-003)

---

## Tasks

| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| D1-001 | Create WelcomeCard component | DONE | - |
| D1-002 | Add Play Now button action | DONE | D1-001 |
| D1-003 | Add Import Game button action | DONE | D1-001 |
| D1-004 | Create ConnectedAccountsCard | DONE | - |
| D1-005 | Create TimeControlGrid component | DONE | - |
| D1-006 | Add Classical/Rapid/Blitz/Bullet cards | DONE | D1-005 |
| D1-007 | Wire time control cards to game start | DONE | D1-006 |
| D1-008 | Rewrite DashboardPage layout | DONE | D1-001, D1-004, D1-005 |
| D2-001 | Create GamesTable component | DONE | - |
| D2-002 | Add Local/Chess.com/Lichess tabs | DONE | D2-001 |
| D2-003 | Add columns: Opponent, Color, Result | DONE | D2-001 |
| D2-004 | Add columns: Accuracy, ACPL, Moves, Date | DONE | D2-001 |
| D2-005 | Add Account column | DONE | D2-001 |
| D2-006 | Make rows clickable → game review | DONE | D2-001 |
| D2-007 | Add sorting functionality | DONE | D2-001 |
| D2-008 | Add filtering functionality | DONE | D2-001 |
| D3-001 | Create DailyGoalsCard component | DONE | - |
| D3-002 | Add games played counter | DONE | D3-001 |
| D3-003 | Add puzzles solved counter (placeholder) | DONE | D3-001 |
| D3-004 | Create daily_goals table schema | TODO | - |
| D3-005 | Add API routes for goals | TODO | D3-004 |

---

## Technical Approach

### Dashboard Layout Structure
```
┌─────────────────────────────────────────────────────────┐
│ WelcomeCard                                              │
│   "Welcome back!" + [Play Now] [Import Game]            │
├────────────────────────┬────────────────────────────────┤
│ ConnectedAccountsCard  │ TimeControlGrid                │
│   - Account 1          │   ┌────┐ ┌────┐ ┌────┐ ┌────┐ │
│   - Account 2          │   │Clas│ │Rapi│ │Blit│ │Bull│ │
│                        │   └────┘ └────┘ └────┘ └────┘ │
├────────────────────────┴────────────────────────────────┤
│ GamesTable                                               │
│   [Local] [Chess.com] [Lichess]                         │
│   ┌──────────────────────────────────────────────────┐  │
│   │ Opponent │ Color │ Result │ Acc │ ACPL │ Date   │  │
│   ├──────────────────────────────────────────────────┤  │
│   │ ...                                             │  │
│   └──────────────────────────────────────────────────┘  │
├────────────────────────┬────────────────────────────────┤
│ Training Suggestions   │ DailyGoalsCard                 │
│   (placeholder)        │   Games: 3/5  Puzzles: 0/10   │
└────────────────────────┴────────────────────────────────┘
```

### Time Control Definitions
```typescript
const TIME_CONTROLS = {
  classical: { label: 'Classical', time: '15+10', minutes: 15, increment: 10 },
  rapid: { label: 'Rapid', time: '10+0', minutes: 10, increment: 0 },
  blitz: { label: 'Blitz', time: '3+2', minutes: 3, increment: 2 },
  bullet: { label: 'Bullet', time: '1+0', minutes: 1, increment: 0 },
};
```

### Games Table Columns
```typescript
const columns = [
  { key: 'opponent', label: 'Opponent', sortable: true },
  { key: 'color', label: 'Color', sortable: false },
  { key: 'result', label: 'Result', sortable: true },
  { key: 'accuracy', label: 'Accuracy', sortable: true },
  { key: 'acpl', label: 'ACPL', sortable: true },
  { key: 'moves', label: 'Moves', sortable: true },
  { key: 'date', label: 'Date', sortable: true },
  { key: 'account', label: 'Account', sortable: false },
];
```

---

## Reference Files

From `examples/pawn-appetite/`:
- `src/features/dashboard/DashboardPage.tsx` - Main dashboard structure
- `src/features/dashboard/components/WelcomeCard.tsx`
- `src/features/dashboard/components/QuickActionsGrid.tsx`
- `src/features/dashboard/components/GamesHistoryCard.tsx`
- `src/features/dashboard/components/DailyGoalsCard.tsx`

---

## Files to Create/Modify

### New Files
- `apps/desktop/src/web/components/dashboard/WelcomeCard.tsx`
- `apps/desktop/src/web/components/dashboard/ConnectedAccountsCard.tsx`
- `apps/desktop/src/web/components/dashboard/TimeControlGrid.tsx`
- `apps/desktop/src/web/components/dashboard/GamesTable.tsx`
- `apps/desktop/src/web/components/dashboard/DailyGoalsCard.tsx`
- `apps/desktop/src/web/components/dashboard/TrainingSuggestionsCard.tsx` (placeholder)

### Modified Files
- `apps/desktop/src/web/pages/dashboard.tsx` - Complete rewrite

### Schema Files (if needed)
- `packages/db/schema/daily-goals.ts` - For daily goals tracking

---

## API Changes

### New Endpoints (if needed)
```
GET  /accounts          # List connected accounts (for ConnectedAccountsCard)
GET  /goals/daily       # Get today's goals
POST /goals/daily       # Update goal progress
```

---

## Acceptance Criteria

- [x] WelcomeCard shows greeting and quick actions
- [x] Play Now button navigates to /board with new game modal
- [x] Import Game button opens import modal
- [x] ConnectedAccountsCard shows list of accounts (empty state OK)
- [x] TimeControlGrid shows 4 time control cards
- [x] Clicking a time control card starts a new game (navigates to /board w/ time control state; full play mode is PLAN-003)
- [x] GamesTable shows tabs for Local/Chess.com/Lichess
- [x] GamesTable columns display correct data
- [x] Clicking a game row opens game review
- [x] DailyGoalsCard shows progress counters
- [x] Type checking passes
- [x] Lint passes

---

## Notes

- Depends on PLAN-001 for navigation shell
- Account sync data will be wired up in PLAN-004
- Training suggestions are a placeholder for now
