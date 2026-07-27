# PLAN-008: Settings & Keybindings

**Phase**: 8
**Priority**: P2
**Parallel Safe**: ✅ Yes - no dependencies on other plans
**Estimated Duration**: 1 week

---

## Overview

Redesign the settings page with proper sections for appearance, engine defaults,
sync preferences, and keyboard shortcuts. Implement global keyboard shortcuts
for common actions.

## Scope

### In Scope
- Settings page redesign with sections
- Keyboard shortcuts editor
- Global keyboard shortcuts implementation
- Theme/appearance settings

### Out of Scope
- Actual theme switching (can be placeholder)
- Per-engine defaults (use global defaults for now)

---

## Tasks

### S1: Settings Page Redesign
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| S1-001 | Create new SettingsPage layout | TODO | - |
| S1-002 | Add Appearance section | TODO | S1-001 |
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

## Technical Approach

### Settings Page Layout
```
┌─────────────────────────────────────────────────────────┐
│ Settings                                                │
├─────────────────────────────────────────────────────────┤
│ [Appearance] [Engine] [Sync] [Shortcuts] [About]        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Appearance Section:                                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Theme:      [Light] [Dark] [System]             │   │
│  │ Board:      [Green] [Brown] [Blue] ...          │   │
│  │ Pieces:     [Classic] [Alpha] [Merida] ...      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Keyboard Shortcuts Hook
```typescript
// apps/desktop/src/web/hooks/useKeyboardShortcuts.ts
export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Navigation: Ctrl+1-7
      if (e.ctrlKey && e.key >= '1' && e.key <= '7') {
        const routes = ['/', '/board', '/engines', '/databases', '/files', '/accounts', '/train'];
        navigate(routes[parseInt(e.key) - 1]);
      }
      
      // Game navigation: Arrow keys
      if (e.key === 'ArrowLeft') previousMove();
      if (e.key === 'ArrowRight') nextMove();
      
      // Board actions
      if (e.key === 'f' && !e.ctrlKey) flipBoard();
      if (e.key === 's' && !e.ctrlKey) savePgn();
      
      // Global search
      if (e.ctrlKey && e.key === 'f') openSearch();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
```

### Settings Persistence
```typescript
// Use localStorage for now, could migrate to DB later
interface Settings {
  theme: 'light' | 'dark' | 'system';
  boardTheme: string;
  pieceSet: string;
  engineDefaults: {
    depth: number;
    multiPv: number;
    threads: number;
    hashSize: number;
  };
  syncPreferences: {
    autoSync: boolean;
    syncInterval: number;
  };
  shortcuts: Record<string, string>;
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  boardTheme: 'green',
  pieceSet: 'classic',
  engineDefaults: {
    depth: 20,
    multiPv: 1,
    threads: 1,
    hashSize: 128,
  },
  syncPreferences: {
    autoSync: false,
    syncInterval: 60,
  },
  shortcuts: {
    navigate: 'Ctrl+1-7',
    prevMove: 'ArrowLeft',
    nextMove: 'ArrowRight',
    flipBoard: 'f',
    savePgn: 's',
    search: 'Ctrl+f',
  },
};
```

---

## Reference Files

From `examples/pawn-appetite/`:
- Settings page patterns
- Keyboard shortcut handling

---

## Files to Create/Modify

### New Files
- `apps/desktop/src/web/pages/settings-new.tsx` (then replace old)
- `apps/desktop/src/web/hooks/useKeyboardShortcuts.ts`
- `apps/desktop/src/web/hooks/useSettings.ts`

### Modified Files
- `apps/desktop/src/web/components/layout/AppShell.tsx` - Add keyboard hook
- `apps/desktop/src/web/pages/game-review.tsx` - Wire keyboard navigation

---

## Acceptance Criteria

- [ ] Settings page has tabbed sections
- [ ] Appearance section shows theme/board/piece options
- [ ] Engine defaults section shows depth/multiPv/threads/hash
- [ ] Sync preferences section shows options
- [ ] Shortcuts section lists all shortcuts
- [ ] Ctrl+1-7 navigates to correct pages
- [ ] Arrow keys navigate game moves
- [ ] F flips the board
- [ ] S saves PGN
- [ ] Ctrl+F opens search
- [ ] Settings persist across sessions
- [ ] Type checking passes
- [ ] Lint passes

---

## Notes

- Theme switching is a placeholder - actual implementation requires CSS variables
- Keyboard shortcuts should be scoped (only active in relevant contexts)
- Consider adding a "Reset to defaults" button
