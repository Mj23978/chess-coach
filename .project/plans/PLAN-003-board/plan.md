# PLAN-003: Board Page Redesign

**Phase**: 3
**Priority**: P0
**Parallel Safe**: ✅ Yes (after PLAN-001 is complete)
**Estimated Duration**: 2-3 weeks

---

## Overview

Redesign the board page with a tabbed interface (browser-like tabs), play game
mode with human/engine opponents, and unified analysis mode. This is the core
chess-playing feature.

## Scope

### In Scope
- Tabbed board interface with multiple sessions
- New tab modal with 4 options
- Play game mode (Human vs Engine, Human vs Human)
- Clock component for timed games
- Unified analysis panel (Analyze, Database, Annotate, Info tabs)
- Online play integration (Chess.com/Lichess)

### Out of Scope
- Training/puzzles mode (deferred)
- Engine management (PLAN-007)

---

## Tasks

### B1: Tabbed Board Interface
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| B1-001 | Create BoardPage with tab state | TODO | - |
| B1-002 | Create TabBar component | TODO | B1-001 |
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
| B4-001 | Create AnalysisPanel component | DONE | - |
| B4-002 | Create AnalyzeTab (engine lines, eval graph) | DONE | B4-001 |
| B4-003 | Create DatabaseTab (similar positions) | DONE | B4-001 |
| B4-004 | Create AnnotateTab (comments, marks) | DONE | B4-001 |
| B4-005 | Create InfoTab (metadata, opening) | DONE | B4-001 |
| B4-006 | Add panel to game-review page | DONE | B4-001 |

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

## Technical Approach

### Tab State Management
```typescript
// Use Zustand or React state for tab management
interface BoardTab {
  id: string;
  type: 'play' | 'analysis' | 'puzzle' | 'import';
  title: string;
  gameId?: string;
  fen?: string;
}

interface BoardState {
  tabs: BoardTab[];
  activeTabId: string;
  addTab: (tab: Omit<BoardTab, 'id'>) => void;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
}
```

### Play Game Flow
```
1. User selects time control + opponents
2. POST /games/play → creates game record, returns game ID
3. BoardPage subscribes to SSE for that game
4. User makes move → POST /games/:id/move
5. If engine opponent: engine calculates response → SSE sends move
6. Clock updates in real-time
7. Game ends → store result, update stats
```

### Game Session Schema
```typescript
// Add to games table or create separate sessions table
interface GameSession {
  id: string;
  white: { type: 'human' | 'engine'; name: string; engineId?: string };
  black: { type: 'human' | 'engine'; name: string; engineId?: string };
  timeControl: { minutes: number; increment: number };
  clock: { white: number; black: number };
  fen: string;
  pgn: string;
  status: 'playing' | 'finished';
  result?: string;
}
```

---

## Reference Files

From `examples/pawn-appetite/`:
- `src/features/board/BoardPage.tsx` - Tab management
- `src/components/board/` - Board components (eval bar, player header, clock)
- `src/hooks/useEngine.ts` - Engine hook pattern

From current codebase:
- `apps/desktop/src/web/pages/game-review.tsx` - Existing review page
- `apps/desktop/src/web/components/Chessboard.tsx` - Board component
- `packages/api/src/engine/` - UCI engine integration

---

## Files to Create/Modify

### New Files
- `apps/desktop/src/web/pages/board.tsx`
- `apps/desktop/src/web/components/board/TabBar.tsx`
- `apps/desktop/src/web/components/board/NewTabModal.tsx`
- `apps/desktop/src/web/components/board/PlayGameView.tsx`
- `apps/desktop/src/web/components/board/PlayerConfigCard.tsx`
- `apps/desktop/src/web/components/board/GameActionsBar.tsx`
- `apps/desktop/src/web/components/board/Clock.tsx`
- `apps/desktop/src/web/components/board/AnalysisPanel.tsx`
- `apps/desktop/src/web/components/board/AnalyzeTab.tsx`
- `apps/desktop/src/web/components/board/DatabaseTab.tsx`
- `apps/desktop/src/web/components/board/AnnotateTab.tsx`
- `apps/desktop/src/web/components/board/InfoTab.tsx`
- `apps/desktop/src/web/lib/online-play.ts`
- `packages/api/src/routes/play.ts`

### Modified Files
- `apps/desktop/src/web/pages/game-review.tsx` - Add analysis panel
- `packages/api/src/server.ts` - Register new routes

---

## API Endpoints

```
POST /games/play
  Body: { white, black, timeControl, fen? }
  Response: { gameId, fen, clock }

POST /games/:id/move
  Body: { move: string }  // UCI format
  Response: { fen, clock, gameStatus }

GET /games/:id/stream
  SSE: { type: 'move' | 'clock' | 'end', data }

POST /games/online
  Body: { platform: 'chess.com' | 'lichess', accountId }
  Response: { gameId }
```

---

## Acceptance Criteria

- [x] Tab bar shows open tabs with close buttons
- [x] New tab modal shows 4 options
- [x] Play Game view shows board + player config
- [x] Can configure Human vs Engine game
- [x] Can configure Human vs Human (local) game
- [x] Clock component works with time control
- [x] Making moves updates board and PGN
- [x] Engine responds to moves (if engine opponent)
- [x] Game ends correctly with result
- [x] Analysis panel shows in review mode
- [ ] Type checking passes (owner verifies on PC)
- [ ] Lint passes (owner verifies on PC)

---

## Notes

- This is the largest plan - consider breaking into sub-plans if needed
- Online play integration is optional for initial release
- Focus on local play first, add online support incrementally
