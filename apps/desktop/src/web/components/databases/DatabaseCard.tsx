/**
 * DatabaseCard (DB2-002) — one database in the grid / list.
 *
 * Used in both `view` modes:
 *  - `grid`: a square-ish card with icon, name, type badge, and stat chips.
 *  - `list`: a compact single row (icon + name + stats on the right).
 *
 * Clicking the card opens the drawer (parent's `onOpen`). The card itself is
 * a presentational component — all data + handlers come from props.
 */
import {
  Database as DatabaseIcon,
  Pencil,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import type { DatabaseDTO } from "../../lib/api";
import { formatBytes, formatRelative } from "./utils";

export interface DatabaseCardProps {
  database: DatabaseDTO;
  /** Grid (default) or list layout. */
  view?: "grid" | "list";
  /** Clicking the card body opens the drawer. */
  onOpen: () => void;
  /** Drawer's rename action (also reachable from the card's "more" menu). */
  onRename?: () => void;
  /** Delete (with confirm handled by the parent). */
  onDelete?: () => void;
}

export function DatabaseCard({
  database,
  view = "grid",
  onOpen,
  onRename,
  onDelete,
}: DatabaseCardProps) {
  if (view === "list") {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
        className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 transition-colors hover:border-border hover:bg-muted/50"
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <DatabaseIcon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{database.name}</span>
            <TypeBadge type={database.type} />
          </div>
          {database.description && (
            <p className="truncate text-xs text-muted-foreground/500">
              {database.description}
            </p>
          )}
        </div>
        <StatChips database={database} layout="inline" />
        <CardMenu onRename={onRename} onDelete={onDelete} onOpen={onOpen} />
      </div>
    );
  }

  // Grid variant
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="group relative flex cursor-pointer flex-col rounded-xl border border-border bg-background p-4 transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-md"
    >
      <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
        <CardMenu onRename={onRename} onDelete={onDelete} onOpen={onOpen} />
      </div>

      <div className="mb-3 flex size-11 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <DatabaseIcon className="size-5" />
      </div>

      <div className="mb-1 flex items-center gap-2">
        <h3 className="truncate font-semibold">{database.name}</h3>
        <TypeBadge type={database.type} />
      </div>

      <p className="mb-3 line-clamp-2 min-h-[2.5rem] text-xs text-muted-foreground/500">
        {database.description || "No description"}
      </p>

      <StatChips database={database} layout="stacked" />

      <div className="mt-3 border-t border-border/50 pt-2 text-xs text-muted-foreground">
        Updated {formatRelative(database.updatedAt)}
      </div>
    </div>
  );
}

/** Type label / colour. */
function TypeBadge({ type }: { type: DatabaseDTO["type"] }) {
  const label =
    type === "games" ? "Games" : type === "repertoire" ? "Repertoire" : "Puzzles";
  return (
    <Badge variant="secondary" className="shrink-0 text-[10px]">
      {label}
    </Badge>
  );
}

/** Stat chips — game count + size. */
function StatChips({
  database,
  layout,
}: {
  database: DatabaseDTO;
  layout: "inline" | "stacked";
}) {
  if (layout === "inline") {
    return (
      <div className="flex shrink-0 items-center gap-3 font-mono text-xs text-muted-foreground/500">
        <span>{database.gameCount} games</span>
        <span>·</span>
        <span>{formatBytes(database.storageBytes)}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="rounded-md bg-muted px-2 py-1 font-mono text-muted-foreground">
        {database.gameCount} games
      </span>
      <span className="rounded-md bg-muted px-2 py-1 font-mono text-muted-foreground">
        {formatBytes(database.storageBytes)}
      </span>
    </div>
  );
}

/** The kebab menu — rename / open / delete. */
function CardMenu({
  onOpen,
  onRename,
  onDelete,
}: {
  onOpen: () => void;
  onRename?: () => void;
  onDelete?: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="size-7 p-0"
          onClick={(e) => e.stopPropagation()}
          aria-label="More actions"
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={onOpen}>Open</DropdownMenuItem>
        {onRename && (
          <DropdownMenuItem onClick={onRename}>
            <Pencil className="mr-2 size-3.5" />
            Rename
          </DropdownMenuItem>
        )}
        {(onRename || onOpen) && <DropdownMenuSeparator />}
        {onDelete && (
          <DropdownMenuItem
            onClick={onDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 size-3.5" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
