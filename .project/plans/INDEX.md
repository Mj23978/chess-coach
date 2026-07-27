# Chess-Coach Plans Index

> Last updated: 2026-07-26

## Active Plans (In Progress / TODO)

| Plan ID | Feature | Priority | Parallel Safe |
|---------|---------|----------|---------------|
| PLAN-003 | Board Page Redesign (B1-B4 DONE, B5 deferred) | Medium | ✅ Yes |
| PLAN-010 | Window Chrome Cleanup (remove duplicate TitleBar) | High | ✅ Yes |
| PLAN-011 | Engine Pipeline Fix (503 error, engine unusable) | **CRITICAL** | ❌ No (blocks others) |
| PLAN-012 | Sidebar Fix (push layout, close button) | High | ✅ Yes |
| PLAN-013 | Dialog & Modal Improvements (close on outside click) | Medium | ✅ Yes |
| PLAN-014 | Layout Consistency (full-width pages) | Medium | ✅ Yes |
| PLAN-015 | Settings Persistence (apply theme/board changes) | Medium | ✅ Yes |
| PLAN-016 | Board Tabs Persistence (survive navigation) | Medium | ✅ Yes |
| PLAN-017 | Board Engine Integration & Win Bar (eval updates) | High | ❌ No (needs PLAN-011) |
| PLAN-018 | Game Analysis Pipeline (move classification) | **CRITICAL** | ❌ No (needs PLAN-011) |

## Archived Plans (Completed)

| Plan ID | Feature | Completed |
|---------|---------|-----------|
| PLAN-001 | App Shell & Navigation | 2026-07-26 |
| PLAN-002 | Dashboard Redesign | 2026-07-26 |
| PLAN-004 | Accounts & Sync | 2026-07-26 |
| PLAN-005 | Databases Page | 2026-07-26 |
| PLAN-006 | Files Page | 2026-07-26 |
| PLAN-007 | Engines Page Polish | 2026-07-26 |
| PLAN-008 | Settings & Keybindings | 2026-07-26 |
| PLAN-009 | Files Page (API + UI) | 2026-07-26 |
| PLAN-003 | Board Page Redesign (B1-B4) | 2026-07-27 |

## Deferred Plans

| Plan ID | Feature | Status |
|---------|---------|--------|
| — | Training & Puzzles (Phase 2) | DEFERRED |

## Execution Order

```
Priority 1 (must fix first):
  PLAN-011 Engine Pipeline ← blocks everything engine-related
  
Priority 2 (can be parallel after 011):
  PLAN-010 Window Chrome
  PLAN-012 Sidebar Fix  
  PLAN-013 Dialog Improvements
  PLAN-014 Layout Consistency
  PLAN-015 Settings Persistence
  PLAN-016 Board Tabs
  
Priority 3 (needs 011):
  PLAN-017 Board Engine Integration
  PLAN-018 Game Analysis Pipeline

PLAN-003: Board Page Redesign — LARGELY COMPLETE (B1-B4 done, B5 deferred)
```
