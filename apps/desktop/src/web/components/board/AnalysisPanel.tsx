/**
 * AnalysisPanel — tabbed sidebar for game review.
 *
 * Four tabs:
 *   - Analyze: engine lines (PV), eval graph, best move
 *   - Database: opening name, ECO code, similar games
 *   - Annotate: bookmarks, comments, marks on moves
 *   - Info: PGN headers, FEN, game metadata
 *
 * Shown to the right of the board on the game-review page. Receives the
 * current game data, selected ply, and analysis results from the parent.
 */
import { useState } from "react";
import { cn } from "@repo/ui/lib/utils";
import {
  Activity,
  Database,
  PenLine,
  Info,
} from "lucide-react";
import type { MoveAnalysisDTO } from "../../lib/api";
import { AnalyzeTab } from "./AnalyzeTab";
import { DatabaseTab } from "./DatabaseTab";
import { AnnotateTab } from "./AnnotateTab";
import { InfoTab } from "./InfoTab";

export type AnalysisTabId = "analyze" | "database" | "annotate" | "info";

export interface AnalysisTabDef {
  id: AnalysisTabId;
  label: string;
  icon: React.ReactNode;
}

export const ANALYSIS_TABS: AnalysisTabDef[] = [
  { id: "analyze", label: "Analyze", icon: <Activity className="size-4" /> },
  { id: "database", label: "Database", icon: <Database className="size-4" /> },
  { id: "annotate", label: "Annotate", icon: <PenLine className="size-4" /> },
  { id: "info", label: "Info", icon: <Info className="size-4" /> },
];

export interface AnalysisPanelProps {
  /** Current game PGN (for parsing headers, positions). */
  pgn: string;
  /** Current FEN of the displayed position. */
  fen: string;
  /** Current ply index (0 = start position). */
  ply: number;
  /** Per-move analysis results (may be empty if not analyzed yet). */
  analysis: MoveAnalysisDTO[];
  /** Total number of plies in the game. */
  totalPlies: number;
  /** Callback to navigate to a specific ply. */
  onNavigate: (ply: number) => void;
  /** Callback when a comment/bookmark is added (for future persistence). */
  onAnnotationChange?: () => void;
  className?: string;
}

export function AnalysisPanel({
  pgn,
  fen,
  ply,
  analysis,
  totalPlies,
  onNavigate,
  onAnnotationChange,
  className,
}: AnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState<AnalysisTabId>("analyze");

  return (
    <div
      className={cn(
        "flex min-w-[280px] flex-col rounded-lg border border-neutral-200 bg-white",
        className,
      )}
    >
      {/* Tab bar */}
      <div className="flex border-b border-neutral-200">
        {ANALYSIS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors",
              activeTab === tab.id
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-neutral-500 hover:text-neutral-700",
            )}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === "analyze" && (
          <AnalyzeTab
            fen={fen}
            ply={ply}
            analysis={analysis}
            totalPlies={totalPlies}
            onNavigate={onNavigate}
          />
        )}
        {activeTab === "database" && (
          <DatabaseTab fen={fen} pgn={pgn} ply={ply} />
        )}
        {activeTab === "annotate" && (
          <AnnotateTab
            pgn={pgn}
            ply={ply}
            onAnnotationChange={onAnnotationChange}
          />
        )}
        {activeTab === "info" && (
          <InfoTab pgn={pgn} fen={fen} ply={ply} totalPlies={totalPlies} />
        )}
      </div>
    </div>
  );
}
