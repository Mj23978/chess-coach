/**
 * Win-percentage conversion (engine eval → 0-100 from side-to-move's view).
 * Ported verbatim from chess-kit's `src/lib/engine/helpers/winPercentage.ts`.
 *
 * The formula is lichess's `WinPercent` (see lila source link below): cp is
 * clamped to [-1000, 1000], then run through a logistic function so the
 * result is a smooth 0-100 winning chance. Mate scores map to 100/0.
 */
import { ceilsNumber } from "./math";
import type { LineEval, PositionEval } from "./types";

export const getPositionWinPercentage = (position: PositionEval): number => {
  return getLineWinPercentage(position.lines[0]!);
};

export const getLineWinPercentage = (line: LineEval): number => {
  if (line.cp !== undefined) {
    return getWinPercentageFromCp(line.cp);
  }
  if (line.mate !== undefined) {
    return getWinPercentageFromMate(line.mate);
  }
  throw new Error("No cp or mate in line");
};

const getWinPercentageFromMate = (mate: number): number => {
  return mate > 0 ? 100 : 0;
};

// Source: https://github.com/lichess-org/lila/blob/a320a93b68dabee862b8093b1b2acdfe132b9966/modules/analyse/src/main/WinPercent.scala#L27
const getWinPercentageFromCp = (cp: number): number => {
  const cpCeiled = ceilsNumber(cp, -1000, 1000);
  const MULTIPLIER = -0.00368208; // Source: https://github.com/lichess-org/lila/pull/11148
  const winChances = 2 / (1 + Math.exp(MULTIPLIER * cpCeiled)) - 1;
  return 50 + 50 * winChances;
};
