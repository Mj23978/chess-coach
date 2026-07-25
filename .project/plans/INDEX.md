# Plans Index

This directory contains implementation plans for chess-coach features.

## Active Plans

| Plan ID | Feature | Phase | Priority | Duration | Parallel Safe |
|---------|---------|-------|----------|----------|---------------|
| [PLAN-001](./PLAN-001-app-shell/plan.md) | App Shell & Navigation | 1 | P0 | 1-2 weeks | ✅ Yes |
| [PLAN-002](./PLAN-002-dashboard/plan.md) | Dashboard Redesign | 2 | P0 | 1-2 weeks | ✅ (after 001) |
| [PLAN-003](./PLAN-003-board/plan.md) | Board Page Redesign | 3 | P0 | 2-3 weeks | ✅ (after 001) |
| [PLAN-004](./PLAN-004-accounts/plan.md) | Accounts & Sync | 4 | P1 | 2-3 weeks | ✅ (after 001) |
| [PLAN-005](./PLAN-005-databases/plan.md) | Databases Page | 5 | P1 | 1-2 weeks | ✅ (after 001) |
| [PLAN-006](./PLAN-006-files/plan.md) | Files Page | 6 | P2 | 1 week | ✅ (after 001) |
| [PLAN-007](./PLAN-007-engines/plan.md) | Engines Page Polish | 7 | P2 | 1 week | ✅ Yes |
| [PLAN-008](./PLAN-008-settings/plan.md) | Settings & Keybindings | 8 | P2 | 1 week | ✅ Yes |

## Dependencies

```
PLAN-001 (App Shell)
    ├── PLAN-002 (Dashboard) ── depends on 001
    ├── PLAN-003 (Board) ── depends on 001
    ├── PLAN-004 (Accounts) ── depends on 001
    ├── PLAN-005 (Databases) ── depends on 001
    └── PLAN-006 (Files) ── depends on 001

PLAN-007 (Engines) ── independent
PLAN-008 (Settings) ── independent
```

## Parallel Execution Strategy

**Wave 1** (Can start immediately):
- PLAN-001: App Shell & Navigation (critical path)
- PLAN-007: Engines Page Polish
- PLAN-008: Settings & Keybindings

**Wave 2** (After PLAN-001 complete):
- PLAN-002: Dashboard Redesign
- PLAN-003: Board Page Redesign
- PLAN-004: Accounts & Sync
- PLAN-005: Databases Page
- PLAN-006: Files Page

## Plan Structure

Each plan folder contains:
```
PLAN-XXX-feature/
├── plan.md        # Main plan document (required)
├── task-YYY.md    # Individual task files (created as needed)
└── notes.md       # Implementation notes (optional)
```

## How to Work on a Plan

1. Read the plan.md file to understand scope and approach
2. Create task files for each task you work on
3. Update task status in both the plan.md and ROADMAP.md
4. Document findings in .project/context/ for future reference

## Completed Plans

- [PLAN-001](./PLAN-001-app-shell/plan.md) — App Shell & Navigation (2026-07-24)
- [PLAN-002](./PLAN-002-dashboard/plan.md) — Dashboard Redesign (2026-07-25)
