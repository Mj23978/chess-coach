/**
 * Move-classification display data — the chess.com badge palette.
 *
 * These match the `classification` union stored in the DB's `analysis` column
 * (see packages/db/schema/games.ts). Each entry has:
 *  - `label`: human label shown in the badge ("Brilliant", "Mistake", …).
 *  - `glyph`: the single-character chess.com symbol (!!, !?, etc.).
 *  - `bg` / `text`: Tailwind classes for the badge.
 *  - `bar`: hex color for the eval-bar marker on the move list.
 *
 * Source: chess.com's published classification colors. The two-letter glyphs
 * mirror lila's annotation convention (← Brilliant = "!!", Blunder = "??").
 */
import type { MoveAnalysisDTO } from "./api";

export type Classification = NonNullable<MoveAnalysisDTO["classification"]>;

export interface ClassificationStyle {
  label: string;
  glyph: string;
  /** Tailwind background class for the round badge. */
  bg: string;
  /** Tailwind text color class for the badge glyph. */
  text: string;
  /** Hex color used for the eval-bar marker. */
  bar: string;
}

export const CLASSIFICATION_STYLES: Record<Classification, ClassificationStyle> =
  {
    brilliant: {
      label: "Brilliant",
      glyph: "!!",
      bg: "bg-emerald-500",
      text: "text-white",
      bar: "#10b981",
    },
    great: {
      label: "Great",
      glyph: "!",
      bg: "bg-sky-500",
      text: "text-white",
      bar: "#0ea5e9",
    },
    best: {
      label: "Best",
      glyph: "★",
      bg: "bg-muted/500",
      text: "text-white",
      bar: "#737373",
    },
    excellent: {
      label: "Excellent",
      glyph: "→",
      bg: "bg-muted-foreground",
      text: "text-white",
      bar: "#a3a3a3",
    },
    good: {
      label: "Good",
      glyph: "✓",
      bg: "bg-stone-400",
      text: "text-white",
      bar: "#a8a29e",
    },
    inaccuracy: {
      label: "Inaccuracy",
      glyph: "?!",
      bg: "bg-yellow-400",
      text: "text-foreground",
      bar: "#facc15",
    },
    mistake: {
      label: "Mistake",
      glyph: "?",
      bg: "bg-orange-500",
      text: "text-white",
      bar: "#f97316",
    },
    blunder: {
      label: "Blunder",
      glyph: "??",
      bg: "bg-red-600",
      text: "text-white",
      bar: "#dc2626",
    },
  };

/** Style for a move's classification, or null if unclassified. */
export function classificationStyle(
  c: Classification | undefined,
): ClassificationStyle | null {
  return c ? (CLASSIFICATION_STYLES[c] ?? null) : null;
}

/**
 * Convert a white-relative eval to a 0–100 white win percentage for the eval
 * bar, using the lila formula (same one the classifier uses server-side):
 *   win% = 50 + 50 * (2 / (1 + exp(-0.00368208 * cp)) - 1)
 * Mate scores clamp to 0/100. Returns null if neither cp nor mate is set.
 */
export function whiteWinPercent(m: {
  evalCp?: number;
  mate?: number;
}): number | null {
  if (m.mate !== undefined) {
    return m.mate > 0 ? 100 : m.mate < 0 ? 0 : 50;
  }
  if (m.evalCp === undefined) return null;
  const cp = Math.max(-1000, Math.min(1000, m.evalCp));
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
}

/** "+1.2" / "-3.4" / "M5" / "M-3" display string for an eval. */
export function formatEval(m: {
  evalCp?: number;
  mate?: number;
}): string | null {
  if (m.mate !== undefined) {
    return m.mate === 0 ? "M0" : `M${m.mate > 0 ? "" : "-"}${Math.abs(m.mate)}`;
  }
  if (m.evalCp === undefined) return null;
  const pawns = m.evalCp / 100;
  return `${pawns >= 0 ? "+" : ""}${pawns.toFixed(1)}`;
}
