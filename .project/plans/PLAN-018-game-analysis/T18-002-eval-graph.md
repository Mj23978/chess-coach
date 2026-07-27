# T18-002: Create Eval Line Chart Component

**Status**: TODO
**Priority**: HIGH

## Objective
Create a line chart showing win probability (white %) over the course of the game, one data point per move. This is the signature visual element of chess.com's analysis page.

## Layout Reference
```
┌─────────────────────────────────────────────────┐
│  White ████████████████████████░░░░░  Black     │
│  [──────●──────●──────●──────●──────●────]     │
│   1.e4  2.Nf3 3.Bb5 ...           Move Number  │
├──────────────────────┬──────────────────────────┤
│  Board + Eval Bar    │  Move List               │
```

## Approach
1. Use a lightweight charting library (recharts or visx) — already in the dependency landscape
2. X-axis: move number (1, 2, 3, ...)
3. Y-axis: white win probability (0-100%)
4. Color the line based on who has advantage (green for leader)
5. Highlight the current move on hover/click
6. Mark blunders/mistakes with red dots on the line

## Data Source
The `analysis` array on the game record contains `evalCp` (centipawn eval) for each move. Convert to win % using the existing `whiteWinPercent()` helper in `classification.ts`.

## Files to Create
- `apps/desktop/src/web/components/game-review/EvalGraph.tsx` (new)

## Files to Modify
- `apps/desktop/src/web/pages/game-review.tsx` (add EvalGraph above the board)
- `apps/desktop/src/web/lib/classification.ts` (export eval-to-win% converter)

## Acceptance Criteria
- Chart renders with one point per move
- Clicking a point navigates to that move (syncs with board)
- Current move is highlighted
- Chart is responsive and works at different window sizes
- Smooth animation when analysis data loads
