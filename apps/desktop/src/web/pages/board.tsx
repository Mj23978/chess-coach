/**
 * BoardPage — `/board`. The tabbed board interface (PLAN-003 B1).
 *
 * Browser-like tabs along the top, each holding a play session (PlayGameView).
 * Tab state persists to localStorage so tabs survive navigation (PLAN-016).
 * The "+" button directly creates a new Play tab; a dropdown menu offers other
 * tab types (FEN, Analysis, Import). Tabs support drag-to-reorder.
 *
 * Functional tab kinds (v1): "play" (standard start) and "fen" (custom FEN →
 * also a PlayGameView seeded with that position). Analysis & Import are
 * deferred (see the dropdown menu).
 */
import { useCallback } from "react";
import { usePersistentState } from "../lib/usePersistentState";
import { TabBar, type BoardTab } from "../components/board/TabBar";
import { PlayGameView } from "../components/board/PlayGameView";
import { Dices, FileText, Search, PencilRuler } from "lucide-react";

interface TabState extends BoardTab {
  /** Starting FEN for a "fen" tab. */
  fen?: string;
}

let tabSeq = 0;
const newId = () => `tab-${Date.now()}-${tabSeq++}`;

const STORAGE_KEY = "chess-coach.board-tabs";

export default function BoardPage() {
  // Persist tabs and active tab ID to localStorage.
  const [tabs, setTabs] = usePersistentState<TabState[]>(STORAGE_KEY, []);
  const [activeId, setActiveId] = usePersistentState<string | null>(
    `${STORAGE_KEY}.active`,
    null,
  );

  const openTab = useCallback((kind: BoardTab["kind"], opts?: { fen?: string }) => {
    const id = newId();
    const tab: TabState = {
      id,
      kind,
      title: kind === "fen" ? "Position" : "Play",
      fen: opts?.fen,
    };
    setTabs((prev) => [...prev, tab]);
    setActiveId(id);
  }, []);

  const closeTab = useCallback(
    (id: string) => {
      setTabs((prev) => {
        const idx = prev.findIndex((t) => t.id === id);
        if (idx < 0) return prev;
        const next = prev.filter((t) => t.id !== id);
        // If we closed the active tab, move focus to the neighbor.
        if (activeId === id) {
          const neighbor = next[idx] ?? next[idx - 1] ?? null;
          setActiveId(neighbor ? neighbor.id : null);
        }
        return next;
      });
    },
    [activeId],
  );

  /** Move a tab from one index to another (drag-to-reorder). */
  const moveTab = useCallback((fromIndex: number, toIndex: number) => {
    setTabs((prev) => {
      if (fromIndex < 0 || fromIndex >= prev.length) return prev;
      if (toIndex < 0 || toIndex >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  /** Validate that the active tab still exists; clear if orphaned. */
  const activeTab = tabs.find((t) => t.id === activeId) ?? null;

  return (
    <div className="flex h-full flex-col">
      <TabBar
        tabs={tabs}
        activeId={activeId}
        onSelect={setActiveId}
        onClose={closeTab}
        onCreateTab={openTab}
        onMoveTab={moveTab}
      />

      <div className="flex-1 overflow-auto">
        {activeTab ? (
          <PlayGameView
            key={activeTab.id}
            initialFen={activeTab.fen}
            onTitleChange={(title) =>
              setTabs((prev) =>
                prev.map((t) => (t.id === activeTab.id ? { ...t, title } : t)),
              )
            }
            onClose={() => closeTab(activeTab.id)}
          />
        ) : (
          <EmptyState onPick={(kind) => openTab(kind)} />
        )}
      </div>
    </div>
  );
}

/** First-run / no-tabs landing: the four-card picker rendered inline. */
function EmptyState({
  onPick,
}: {
  onPick: (kind: BoardTab["kind"], opts?: { fen?: string }) => void;
}) {
  return (
    <div className="mx-auto max-w-3xl p-8">
      <header className="mb-6">
        <div className="flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-chess-brown/10">
            <span className="text-2xl">♚</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Board</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Play games, analyze positions, and review your openings. Open a new
              tab to get started.
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <PickCard
          icon={<Dices className="size-5" />}
          title="Play Game"
          description="Start a new game against a human or the engine."
          onClick={() => onPick("play")}
        />
        <PickCard
          icon={<FileText className="size-5" />}
          title="Enter Position"
          description="Load a custom position to play from."
          onClick={() => onPick("fen")}
          tooltip="FEN (Forsyth-Edwards Notation) is a way to describe a chess position"
        />
        <PickCard
          icon={<Search className="size-5" />}
          title="Analysis"
          description="Analyze a position with the engine."
          disabled
          badge="Coming soon"
        />
        <PickCard
          icon={<PencilRuler className="size-5" />}
          title="Import Game"
          description="Paste a chess game to review move-by-move."
          disabled
          badge="Use Import"
        />
      </div>
    </div>
  );
}

interface PickCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  disabled?: boolean;
  badge?: string;
  tooltip?: string;
}

function PickCard({
  icon,
  title,
  description,
  onClick,
  disabled,
  badge,
  tooltip,
}: PickCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={`flex items-start gap-3 rounded-lg border border-border p-4 text-left transition-all ${
        disabled
          ? "cursor-not-allowed opacity-60"
          : "hover:border-chess-brown/20 hover:bg-chess-cream/50 hover:shadow-sm"
      }`}
    >
      <span className="mt-0.5 text-foreground">{icon}</span>
      <span className="flex-1">
        <span className="flex items-center gap-2">
          <span className="font-semibold text-foreground">{title}</span>
          {badge && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {badge}
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  );
}
