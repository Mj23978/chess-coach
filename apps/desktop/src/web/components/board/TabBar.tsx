/**
 * TabBar — browser-like row of open board tabs.
 *
 * Each tab shows a title + close (×). The active tab is highlighted. A "+"
 * button directly creates a new Play tab, with a dropdown menu for other tab
 * types (FEN, Analysis, Import). Tabs persist via localStorage (PLAN-016).
 */
import { ChevronDown, Dices, FileText, Plus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@repo/ui/lib/utils";

export type NewTabKind = "play" | "fen";

export interface BoardTab {
  id: string;
  title: string;
  kind: NewTabKind;
}

export interface TabBarProps {
  tabs: BoardTab[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  /** Called when the user picks a tab type from the dropdown. */
  onCreateTab: (kind: NewTabKind) => void;
  /** Move a tab to a new position (for drag-to-reorder). */
  onMoveTab?: (fromIndex: number, toIndex: number) => void;
  className?: string;
}

export function TabBar({
  tabs,
  activeId,
  onSelect,
  onClose,
  onCreateTab,
  onMoveTab,
  className,
}: TabBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click.
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  const handleDropdownPick = useCallback(
    (kind: NewTabKind) => {
      onCreateTab(kind);
      setDropdownOpen(false);
    },
    [onCreateTab],
  );

  return (
    <div
      className={cn(
        "flex items-center gap-1 border-b border-neutral-200 bg-neutral-50 px-2 py-1.5",
        className,
      )}
    >
      {tabs.map((tab, index) => {
        const active = tab.id === activeId;
        return (
          <Tab
            key={tab.id}
            tab={tab}
            index={index}
            active={active}
            onSelect={onSelect}
            onClose={onClose}
            onMoveTab={onMoveTab}
            totalTabs={tabs.length}
          />
        );
      })}

      {/* New tab button with dropdown */}
      <div ref={dropdownRef} className="relative ml-1 flex items-center">
        <button
          type="button"
          onClick={() => onCreateTab("play")}
          aria-label="New Play tab"
          title="New Play tab"
          className="flex size-6 items-center justify-center rounded-l-md text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-800"
        >
          <Plus className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => setDropdownOpen((v) => !v)}
          aria-label="New tab options"
          title="More tab types"
          className="flex size-6 items-center justify-center rounded-r-md text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-800"
        >
          <ChevronDown className="size-3" />
        </button>

        {dropdownOpen && (
          <DropdownMenu onPick={handleDropdownPick} onClose={() => setDropdownOpen(false)} />
        )}
      </div>
    </div>
  );
}

/** Individual tab with optional drag-to-reorder. */
function Tab({
  tab,
  index,
  active,
  onSelect,
  onClose,
  onMoveTab,
  totalTabs,
}: {
  tab: BoardTab;
  index: number;
  active: boolean;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onMoveTab?: (fromIndex: number, toIndex: number) => void;
  totalTabs: number;
}) {
  const dragRef = useRef<HTMLDivElement>(null);

  // Drag-to-reorder handlers.
  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData("text/plain", String(index));
      e.dataTransfer.effectAllowed = "move";
    },
    [index],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const fromIndex = Number.parseInt(e.dataTransfer.getData("text/plain"), 10);
      if (fromIndex !== index && onMoveTab) {
        onMoveTab(fromIndex, index);
      }
    },
    [index, onMoveTab],
  );

  return (
    <div
      ref={dragRef}
      role="tab"
      tabIndex={0}
      draggable={!!onMoveTab}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
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
        onMoveTab && "cursor-grab active:cursor-grabbing",
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
}

/** Dropdown menu for tab type selection. */
function DropdownMenu({
  onPick,
  onClose,
}: {
  onPick: (kind: NewTabKind) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-md border border-neutral-200 bg-white py-1 shadow-lg">
      <button
        type="button"
        onClick={() => onPick("play")}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-100"
      >
        <Dices className="size-4 text-neutral-500" />
        <span>New Play tab</span>
      </button>
      <button
        type="button"
        onClick={() => onPick("fen")}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-100"
      >
        <FileText className="size-4 text-neutral-500" />
        <span>Enter FEN...</span>
      </button>
    </div>
  );
}
