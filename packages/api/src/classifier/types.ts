/**
 * Move-classification types.
 *
 * Ported from chess-kit's `src/types/eval.ts` + `src/types/enums.ts`, with one
 * adaptation: the `MoveClassification` enum values are renamed to match the
 * `classification` union already in `packages/db/schema/games.ts` —
 *   chess-kit `splendid` → `brilliant`  (the chess.com "Brilliant" label)
 *   chess-kit `perfect`  → `great`       (the chess.com "Great" label)
 *   chess-kit `okay`     → `good`        (chess.com "Good")
 * so the classifier output drops straight into the `MoveAnalysis` JSON column.
 *
 * `LineEval` / `PositionEval` here intentionally match the engine's types in
 * `packages/api/src/engine/types.ts` (same fields), so engine output can be
 * fed to the classifier with no adaptation layer.
 */

/** Move-quality labels — the chess.com/lila palette, values match DB schema. */
export enum MoveClassification {
  Blunder = "blunder",
  Mistake = "mistake",
  Inaccuracy = "inaccuracy",
  Good = "good",
  Excellent = "excellent",
  Best = "best",
  Great = "great",
  Brilliant = "brilliant",
  /** Book opening — not classified (by theory). */
  Opening = "opening",
  /** Only one legal reply — no credit/blame. */
  Forced = "forced",
}

/** One principal-variation line (mirrors engine LineEval). */
export interface LineEval {
  pv: string[];
  cp?: number;
  mate?: number;
  depth: number;
  multiPv: number;
}

/** Full eval of one position, optionally annotated with classification. */
export interface PositionEval {
  fen?: string;
  bestMove?: string;
  moveClassification?: MoveClassification;
  opening?: string;
  lines: LineEval[];
}

export interface Accuracy {
  white: number;
  black: number;
}
