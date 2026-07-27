# PLAN-007: Engines Page Polish

**Phase**: 7
**Priority**: P2
**Parallel Safe**: ✅ Yes - no dependencies on other plans
**Estimated Duration**: 1 week

---

## Overview

Move engine management from the settings page to a dedicated engines page and
improve the UI with search, list view toggle, and better card styling.

## Scope

### In Scope
- Extract engine management to dedicated page
- Add search functionality
- Add list view toggle
- Improve card styling with images

### Out of Scope
- New engine features (existing functionality is sufficient)
- Engine vs engine matches

---

## Tasks

| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| E1-001 | Create EnginesPage component | TODO | - |
| E1-002 | Move engine management from settings | TODO | E1-001 |
| E1-003 | Add search functionality | TODO | E1-001 |
| E1-004 | Add List view toggle | TODO | E1-001 |
| E1-005 | Improve EngineCard styling | TODO | - |
| E1-006 | Add engine images | TODO | E1-005 |

---

## Technical Approach

### Page Structure
```
┌─────────────────────────────────────────────────────────┐
│ Engines                              [Search] [+ Add]   │
├─────────────────────────────────────────────────────────┤
│ [Grid] [List]                                           │
├─────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐                    │
│ │ Stock   │ │ Rubi    │ │ Custom  │                    │
│ │ fish    │ │ Chess   │ │ Engine  │                    │
│ │  ⚙️     │ │  ⚙️     │ │  ⚙️     │                    │
│ └─────────┘ └─────────┘ └─────────┘                    │
└─────────────────────────────────────────────────────────┘
```

### Engine Card (Grid View)
```typescript
interface EngineCardProps {
  id: string;
  name: string;
  version: string;
  isActive: boolean;
  exists: boolean;
  elo?: number;
  image?: string;
  onActivate: () => void;
  onConfigure: () => void;
  onRemove: () => void;
}
```

### Engine Card (List View)
```typescript
// Row format: [Active] Name | Version | ELO | Status | Actions
```

---

## Reference Files

From current codebase:
- `apps/desktop/src/web/pages/settings.tsx` - Current engine management
- `packages/api/src/routes/engines.ts` - Engine API routes
- `packages/db/schema/engines.ts` - Engine schema

---

## Files to Create/Modify

### New Files
- `apps/desktop/src/web/pages/engines.tsx`
- `apps/desktop/src/web/components/engines/EngineCard.tsx`
- `apps/desktop/src/web/components/engines/EngineGrid.tsx`
- `apps/desktop/src/web/components/engines/EngineList.tsx`

### Modified Files
- `apps/desktop/src/web/pages/settings.tsx` - Remove engine section
- `apps/desktop/src/web/lib/api.ts` - Ensure engine API is exposed

---

## Acceptance Criteria

- [ ] Engines page accessible from navigation
- [ ] Shows all configured engines in grid view
- [ ] Can toggle to list view
- [ ] Search filters engines by name
- [ ] Add button opens add engine dialog
- [ ] Engine cards show name, version, and image
- [ ] Active engine is visually highlighted
- [ ] Configure button opens options drawer
- [ ] Activate button sets engine as active
- [ ] Remove button deletes engine
- [ ] Settings page no longer has engine section
- [ ] Type checking passes
- [ ] Lint passes

---

## Notes

- Engine management already works, this is primarily a UI move
- Keep existing API routes unchanged
- Consider adding engine images for popular engines (Stockfish logo, etc.)
