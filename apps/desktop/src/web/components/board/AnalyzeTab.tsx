/**
 * AnalyzeTab — engine analysis display for a single position.
 *
 * Shows:
 *   - Eval bar (white/black) for the current position
 *   - Principal variation lines from the engine
 *   - Classification of the current move (if analysis exists)
 *   - Accuracy stats for the game so far
 *
 * Engine lines require the engine pipeline (PLAN-011) to be functional.
 * For now this tab displays what analysis data is available and provides
 * a placeholder for live engine lines.
 */
import {
  classificationStyle,
  whiteWinPercent,
  formatEval,
  type Classification,
} from "../../lib/classification";
import type { MoveAnalysisDTO } from "../../lib/api";
import { cn } from "@repo/ui/lib/utils";

export interface AnalyzeTabProps {
  fen: string;
  ply: number;
  analysis: MoveAnalysisDTO[];
  totalPlies: number;
  onNavigate: (ply: number) => void;
}

export function AnalyzeTab({
  fen,
  ply,
  analysis,
  totalPlies,
  onNavigate,
}: AnalyzeTabProps) {
  // Analysis for the move that led to the current position.
  // ply=0 means start position (no move yet), so analysis[-1] doesn't exist.
  const moveAnalysis: MoveAnalysisDTO | undefined = ply > 0 ? analysis[ply - 1] : undefined;
  const winPct = whiteWinPercent(moveAnalysis ?? {});
  const classification = moveAnalysis?.classification as Classification | undefined;
  const style = classification ? classificationStyle(classification) : null;

  // Accuracy for the game so far (average centipawn loss).
  const movesWithAnalysis = analysis.slice(0, ply);
  const avgLoss =
    movesWithAnalysis.length > 0
      ? movesWithAnalysis.reduce((sum, a) => sum + (a.avgCentipawnLoss ?? 0), 0) /
        movesWithAnalysis.length
      : null;

  // Count classifications so far for accuracy summary.
  const classCounts: Record<string, number> = {};
  for (const a of movesWithAnalysis) {
    const c = a.classification ?? "unknown";
    classCounts[c] = (classCounts[c] ?? 0) + 1;
  }

  return (
    <div className="space-y-4">
      {/* Eval display */}
      <Section title="Evaluation">
        <div className="flex items-center gap-3">
          <EvalMiniBar whiteWin={winPct} />
          <div>
            <div className="text-sm font-medium text-neutral-900">
              {formatEval(moveAnalysis ?? {})}
            </div>
            <div className="text-xs text-neutral-500">
              {winPct != null ? `${winPct.toFixed(1)}% white` : "—"}
            </div>
          </div>
        </div>
      </Section>

      {/* Current move classification */}
      {style && (
        <Section title="Classification">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                style.bg,
                style.text,
              )}
            >
              {style.glyph}
            </span>
            <span className="text-sm text-neutral-700">{style.label}</span>
          </div>
          {moveAnalysis?.avgCentipawnLoss != null && (
            <p className="mt-1 text-xs text-neutral-500">
              Avg centipawn loss: {Math.round(moveAnalysis.avgCentipawnLoss)}
            </p>
          )}
        </Section>
      )}

      {/* Engine lines placeholder */}
      <Section title="Engine Lines">
        <div className="rounded-md bg-neutral-50 p-3 text-xs text-neutral-500">
          <p>
            Live engine lines will appear here once the engine pipeline is
            connected (PLAN-011).
          </p>
          <p className="mt-1">
            Configure a Stockfish binary on the Engines page to enable real-time
            analysis.
          </p>
        </div>
      </Section>

      {/* Accuracy summary */}
      {movesWithAnalysis.length > 0 && (
        <Section title="Accuracy">
          <div className="space-y-1.5">
            {avgLoss != null && (
              <div className="text-sm text-neutral-700">
                Avg centipawn loss:{" "}
                <span className="font-medium">{Math.round(avgLoss)}</span>
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {(Object.entries(classCounts) as [string, number][]).map(
                ([cls, count]) => {
                  const s = classificationStyle(cls);
                  if (!s) return null;
                  return (
                    <span
                      key={cls}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                        s.bg,
                        s.text,
                      )}
                    >
                      {s.glyph} {count}
                    </span>
                  );
                },
              )}
            </div>
          </div>
        </Section>
      )}

      {/* Move navigation hint */}
      <Section title="Navigate">
        <p className="text-xs text-neutral-500">
          Use ← → arrow keys or click moves in the list to navigate.
          {totalPlies > 0 && (
            <span className="ml-1">
              Position {ply}/{totalPlies}
            </span>
          )}
        </p>
      </Section>
    </div>
  );
}

/** Small vertical eval bar for inline display. */
function EvalMiniBar({ whiteWin }: { whiteWin: number | null }) {
  const pct = whiteWin ?? 50;
  return (
    <div className="relative h-12 w-3 overflow-hidden rounded-sm bg-neutral-900">
      <div
        className="absolute inset-x-0 bottom-0 bg-white transition-[height] duration-200"
        style={{ height: `${pct}%` }}
      />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-neutral-400">
        {title}
      </h3>
      {children}
    </div>
  );
}
