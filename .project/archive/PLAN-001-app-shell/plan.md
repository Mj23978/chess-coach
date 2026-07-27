# PLAN-001: App Shell & Navigation

**Phase**: 1 (Foundation)
**Priority**: P0 (Critical - blocks other plans)
**Parallel Safe**: ✅ Yes - no dependencies on other plans
**Estimated Duration**: 1-2 weeks

---

## Overview

Create the main application shell with navigation rail and title bar. This is the
foundation that all pages will use, so it must be completed first.

## Scope

### In Scope
- AppShell component with layout wrapper
- NavigationRail component (left sidebar)
- TitleBar component with menus and window controls
- Route setup for all placeholder pages

### Out of Scope
- Dashboard content (PLAN-002)
- Board page content (PLAN-003)
- Any business logic

---

## Tasks

| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| F1-001 | Create AppShell component | TODO | - |
| F1-002 | Create NavigationRail component | TODO | F1-001 |
| F1-003 | Add navigation items with icons | TODO | F1-002 |
| F1-004 | Implement active state indicator | TODO | F1-002 |
| F1-005 | Add collapsible behavior | TODO | F1-002 |
| F1-006 | Create TitleBar component | TODO | - |
| F1-007 | Add File/Edit/View menus | TODO | F1-006 |
| F1-008 | Add window controls (min/max/close) | TODO | F1-006 |
| F1-009 | Add search bar to title bar | TODO | F1-006 |
| F2-001 | Add /board route (placeholder) | TODO | - |
| F2-002 | Add /engines route (placeholder) | TODO | - |
| F2-003 | Add /databases route (placeholder) | TODO | - |
| F2-004 | Add /files route (placeholder) | TODO | - |
| F2-005 | Add /accounts route (placeholder) | TODO | - |
| F2-006 | Add /train route (placeholder) | TODO | - |
| F2-007 | Update /settings route | TODO | F2-002 |

---

## Technical Approach

### AppShell Component
```tsx
// src/web/components/layout/AppShell.tsx
interface AppShellProps {
  children: React.ReactNode;
}

// Layout: TitleBar (top) | NavigationRail (left) | Main content (right)
// Use flexbox with fixed-width sidebar
```

### Navigation Items
```typescript
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/' },
  { id: 'board', label: 'Board', icon: Grid3x3, path: '/board' },
  { id: 'engines', label: 'Engines', icon: Cpu, path: '/engines' },
  { id: 'databases', label: 'Databases', icon: Database, path: '/databases' },
  { id: 'files', label: 'Files', icon: Folder, path: '/files' },
  { id: 'accounts', label: 'Accounts', icon: User, path: '/accounts' },
  { id: 'train', label: 'Train', icon: GraduationCap, path: '/train' },
];

const bottomItems = [
  { id: 'keybindings', label: 'Keybindings', icon: Keyboard, action: 'openKeybindings' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];
```

### Title Bar Menus
- **File**: New Game, Import PGN, Export PGN, Quit
- **Edit**: Undo, Redo, Copy FEN, Paste FEN
- **View**: Toggle Sidebar, Full Screen, Developer Tools

---

## Reference Files

From `examples/pawn-appetite/`:
- `src/routes/__root.tsx` - Root layout with AppShell pattern
- `src/components/Sidebar.tsx` - Navigation sidebar component
- `src/hooks/useResponsiveLayout.ts` - Responsive layout logic

---

## Files to Create/Modify

### New Files
- `apps/desktop/src/web/components/layout/AppShell.tsx`
- `apps/desktop/src/web/components/layout/NavigationRail.tsx`
- `apps/desktop/src/web/components/layout/TitleBar.tsx`
- `apps/desktop/src/web/components/layout/NavContext.tsx` (optional context)

### Modified Files
- `apps/desktop/src/web/App.tsx` - Wrap with AppShell, add routes

---

## Acceptance Criteria

- [ ] Navigation rail shows all 7 main items + 2 bottom items
- [ ] Clicking a nav item navigates to the correct route
- [ ] Active nav item is visually highlighted
- [ ] Title bar shows menus and window controls
- [ ] Window controls (min/max/close) work correctly
- [ ] All placeholder pages render correctly
- [ ] Layout is responsive (sidebar collapses on small screens)
- [ ] Type checking passes (`bun run check-types`)
- [ ] Lint passes (`bun run lint`)

---

## Notes

- This plan is a dependency for all other UI plans
- Focus on getting the structure right; styling can be refined later
- The search bar in the title bar can be a placeholder for now
