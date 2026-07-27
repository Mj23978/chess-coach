# PLAN-018: Game Analysis Pipeline (Move Classification)

**Status**: TODO
**Created**: 2026-07-26
**Priority**: CRITICAL

## Problem
The game analysis page exists but the core feature — classifying each move like chess.com (Brilliant/Great/Best/Excellent/Good/Inaccuracy/Mistake/Blunder) — needs to be fully implemented and polished. The user specifically mentioned this as the main reason for building the app.

## Current State
- `analyzeGame()` API exists and calls the engine
- `classification.ts` has classification logic
- `game-review.tsx` shows the move list with badges
- But: the analysis pipeline needs to be robust, the UI needs polish, and the eval graph is missing

## Approach
Port the chess-kit move classifier (which mirrors chess.com/lila) and build a chess.com-like analysis page with:
1. Eval graph at the top showing win probability history
2. Move list with classification badges (scrollable, both colors)
3. Black/White accuracy and rating display
4. Per-move eval display

## Tasks

| Task ID | Title | Status |
|---------|-------|--------|
| T18-001 | Port chess-kit move classifier to desktop app | TODO |
| T18-002 | Create eval line chart component (win probability over moves) | TODO |
| T18-003 | Redesign game review page layout (graph top, moves side) | TODO |
| T18-004 | Add per-move eval display (cp/mate) in move list | TODO |
| T18-005 | Add accuracy calculation for both sides | TODO |
| T18-006 | Add player rating estimation based on accuracy | TODO |
| T18-007 | Make move list scrollable and auto-follow current ply | TODO |
| T18-008 | Add opening name display from ECO database | TODO |
| T18-009 | Ensure analysis persists in games table after completion | TODO |

## Files Affected
- `apps/desktop/src/web/lib/classification.ts` (modify — port chess-kit classifier)
- `apps/desktop/src/web/lib/chess.ts` (modify — add classification helpers)
- `apps/desktop/src/web/pages/game-review.tsx` (modify — redesign layout)
- `apps/desktop/src/web/components/game-review/EvalGraph.tsx` (new)
- `apps/desktop/src/web/components/game-review/MoveClassificationList.tsx` (new)
- `apps/desktop/src/web/components/game-review/AccuracyCard.tsx` (new)
- `packages/api/src/routes/games.ts` (modify — improve analyze endpoint)

## Reference: chess-kit Analysis Page Layout
```
┌─────────────────────────────────────────────────┐
│  Eval Graph (line chart, win probability %)     │
│  [─────────────────────────────────────────]    │
├──────────────────────┬──────────────────────────┤
│  Board + Eval Bar    │  Move List (scrollable)  │
│  ┌──┬──────────┐     │  1. e4  ● Great  +0.3   │
│  │  │          │     │     e5  ○ Good   +0.1   │
│  │  │  Board   │     │  2. Nf3 ● Best   +0.4   │
│  │  │          │     │     Nc6 ○ Good   +0.2   │
│  │  │          │     │  ...                     │
│  └──┴──────────┘     │                          │
│                      ├──────────────────────────┤
│  ⏮ ← → ⏭           │  White: 85% accuracy     │
│                      │  Black: 72% accuracy     │
│                      │  White Rating: ~1800     │
│                      │  Black Rating: ~1500     │
└──────────────────────┴──────────────────────────┘
```

## Classification Thresholds (from chess-kit)
- **Brilliant**: Only move that avoids significant eval loss, sacrifices material
- **Great**: Only move that maintains significant advantage
- **Best**: Engine's top choice (within 0.05 cp of best)
- **Excellent**: Within 10 cp of best move
- **Good**: Within 30 cp of best move
- **Inaccuracy**: 50-100 cp loss from best
- **Mistake**: 100-200 cp loss from best
- **Blunder**: >200 cp loss from best

## Notes
- The chess-kit classifier is in `examples/chess-kit/src/lib/engine/helpers/`
- It depends only on `chess.js` — can be ported directly
- The eval graph should use a charting library (recharts or similar)
- Accuracy formula: `100 - (average_cp_loss / max_cp_loss * 100)`
- Rating estimation uses accuracy → rating mapping tables
