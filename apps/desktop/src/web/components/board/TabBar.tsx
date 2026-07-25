/**
 * TabBar — browser-like row of open board tabs.
 *
 * Each tab shows a title + close (×). The active tab is highlighted. A "+"
 * button at the end opens the NewTabModal (handled by the parent). Tabs are
 * owned by BoardPage's local state; closing the last tab returns to the empty
 * state.
 */
import { Plus, X } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

export interface BoardTab {
  id: string;
  title: string;
  kind: "play" | "fen";
}

export interface TabBarProps {
  tabs: BoardTab[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onNewTab: () => void;
  className?: string;
}

export function TabBar({
  tabs,
  activeId,
  onSelect,
  onClose,
  onNewTab,
  className,
}: TabBarProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 border-b border-neutral-200 bg-neutral-50 px-2 py-1.5",
        className,
      )}
    >
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <div
            key={tab.id}
            role="tab"
            tabIndex={0}
            onClick={() => onSelect(tab.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(tab.id);
              }
            }}
            className={cn(
              "group flex max-w-[200px] cursor-pointer items-center gap-2 rounded-md border px-3 py-1 text-xs transition-colors",
              active
                ? "border-neutral-300 bg-white text-neutral-900 shadow-sm"
                : "border-transparent text-neutral-600 hover:bg-neutral-100",
            )}
          >
            <span className="truncate">{tab.title}</span>
            <button
              type="button"
              aria-label={`Close ${tab.title}`}
              onClick={(e) => {
                e.stopPropagation();
                onClose(tab.id);
              }}
              className="shrink-0 rounded p-0.5 text-neutral-400 opacity-0 transition-opacity hover:bg-neutral-200 hover:text-neutral-700 group-hover:opacity-100"
            >
              <X className="size-3" />
            </button>
          </div>
        );
      })}

      <button
        type="button"
        onClick={onNewTab}
        aria-label="New tab"
        title="New tab"
        className="ml-1 flex size-6 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-800"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
