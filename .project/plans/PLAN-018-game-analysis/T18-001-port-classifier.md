# T18-001: Port chess-kit Move Classifier

**Status**: TODO
**Priority**: CRITICAL

## Objective
Port the chess-kit move classification logic into the desktop app. This is the core engine that classifies each move as Brilliant/Great/Best/Excellent/Good/Inaccuracy/Mistake/Blunder.

## Source
`examples/chess-kit/src/lib/engine/helpers/` contains:
- `classify.ts` — main classifier logic
- `constants.ts` — thresholds and classification definitions
- `eval.ts` — eval comparison helpers

Also depends on:
- `examples/chess-kit/src/lib/chess.ts` — chess.js helpers
- `examples/chess-kit/src/lib/math.ts` — math utilities

## Approach
1. Copy the pure TS files from chess-kit (they depend only on chess.js)
2. Adapt imports to use the desktop app's chess.js instance
3. Integrate with the existing `packages/api/src/engine/` analysis pipeline
4. Store classifications in the `analysis` JSON column on the `games` table

## Classification Thresholds (from chess-kit)
| Classification | Condition |
|---------------|-----------|
| Brilliant | Only move that avoids significant eval loss + sacrifices material |
| Great | Only move that maintains significant advantage |
| Best | Engine's top choice (within 0.05 cp) |
| Excellent | Within 10 cp of best |
| Good | Within 30 cp of best |
| Inaccuracy | 50-100 cp loss from best |
| Mistake | 100-200 cp loss from best |
| Blunder | >200 cp loss from best |

## Files to Create/Modify
- `apps/desktop/src/web/lib/classification.ts` (modify — merge chess-kit logic)
- `packages/api/src/engine/classifier.ts` (new — server-side classifier)
- `packages/api/src/routes/games.ts` (modify — use classifier in analyze endpoint)
