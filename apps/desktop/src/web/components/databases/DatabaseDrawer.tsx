/**
 * DatabaseDrawer (DB2-006 … DB2-010) — the right-side detail panel for a
 * database.
 *
 * Capabilities:
 *  - Rename / edit description inline (DB2-007)
 *  - "Explore games" — list member games with remove buttons (DB2-008)
 *  - "Remove duplicates" (DB2-009)
 *  - "Export" — download all member PGNs as one file (DB2-010)
 *  - Delete the whole database
 *
 * Built on the design-system `Sheet` (right side). The parent owns the open
 * state and the mutations; this component just calls back. All mutations
 * (rename / add / remove / dedup / delete) invalidate the `["databases"]` and
 * `["database-games", id]` query keys on success.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  Trash2,
  Copy,
  Check,
  X,
  Loader2,
  Sparkles,
  Gamepad2,
  HardDrive,
  Plus,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@repo/ui/components/sheet";
import { Button } from "@repo/ui/components/button";
import { Badge } from "@repo/ui/components/badge";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import { Label } from "@repo/ui/components/label";
import {
  fetchDatabaseGames,
  updateDatabase,
  removeDatabaseGames,
  deleteDatabase,
  dedupDatabase,
  exportDatabasePgn,
  type DatabaseDTO,
} from "../../lib/api";
import { formatBytes, formatRelative } from "./utils";

export interface DatabaseDrawerProps {
  /** The database to show. null = closed. */
  database: DatabaseDTO | null;
  /** Called when the user dismisses the panel. */
  onClose: () => void;
  /** Called when the user wants to add games to this database. */
  onAddGames?: (database: DatabaseDTO) => void;
}

export function DatabaseDrawer({
  database,
  onClose,
  onAddGames,
}: DatabaseDrawerProps) {
  const open = database !== null;
  const id = database?.id;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        {database && id && (
          <DrawerBody
            key={id}
            database={database}
            onClose={onClose}
            onAddGames={onAddGames}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function DrawerBody({
  database,
  onClose,
  onAddGames,
}: {
  database: DatabaseDTO;
  onClose: () => void;
  onAddGames?: (database: DatabaseDTO) => void;
}) {
  const qc = useQueryClient();
  const [showGames, setShowGames] = useState(false);
  const [copiedExport, setCopiedExport] = useState(false);

  // Inline rename / description editing.
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(database.name);
  const [description, setDescription] = useState(database.description ?? "");

  // Member games (fetched lazily when "Explore games" is expanded).
  const gamesQuery = useQuery({
    queryKey: ["database-games", database.id],
    queryFn: () => fetchDatabaseGames(database.id),
    enabled: showGames,
  });

  const updateMut = useMutation({
    mutationFn: (input: { name?: string; description?: string | null }) =>
      updateDatabase(database.id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["databases"] });
      setEditing(false);
    },
  });

  const removeGameMut = useMutation({
    mutationFn: (gameIds: string[]) =>
      removeDatabaseGames(database.id, gameIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["databases"] });
      qc.invalidateQueries({ queryKey: ["database-games", database.id] });
    },
  });

  const dedupMut = useMutation({
    mutationFn: () => dedupDatabase(database.id),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["databases"] });
      qc.invalidateQueries({ queryKey: ["database-games", database.id] });
      if (data.removed === 0) {
        alert("No duplicates found.");
      } else {
        alert(`Removed ${data.removed} duplicate game(s).`);
      }
    },
    onError: (err) =>
      alert(
        `Failed to remove duplicates: ${
          err instanceof Error ? err.message : String(err)
        }`,
      ),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteDatabase(database.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["databases"] });
      onClose();
    },
  });

  const exportMut = useMutation({
    mutationFn: () => exportDatabasePgn(database.id),
    onSuccess: (pgn) => {
      // Download as a .pgn file.
      const blob = new Blob([pgn], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = database.name.replace(/[^\w.-]+/g, "_") || "database";
      a.download = `${safeName}.pgn`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    onError: (err) =>
      alert(
        `Export failed: ${err instanceof Error ? err.message : String(err)}`,
      ),
  });

  const copyExportMut = useMutation({
    mutationFn: () => exportDatabasePgn(database.id),
    onSuccess: async (pgn) => {
      try {
        await navigator.clipboard.writeText(pgn);
        setCopiedExport(true);
        setTimeout(() => setCopiedExport(false), 1500);
      } catch {
        alert("Clipboard unavailable — use the Download button instead.");
      }
    },
  });

  function saveEdit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const desc = description.trim() ? description.trim() : null;
    updateMut.mutate({
      name: trimmed,
      description: desc,
    });
  }

  function cancelEdit() {
    setName(database.name);
    setDescription(database.description ?? "");
    setEditing(false);
  }

  return (
    <div className="flex h-full flex-col">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          {editing ? (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-lg font-semibold"
              autoFocus
            />
          ) : (
            <span className="truncate">{database.name}</span>
          )}
          <Badge variant="secondary" className="shrink-0 capitalize">
            {database.type}
          </Badge>
        </SheetTitle>
        <SheetDescription>
          Created {formatRelative(database.createdAt)} · Updated{" "}
          {formatRelative(database.updatedAt)}
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {/* Description (editable) */}
        <div>
          <Label className="mb-1.5 block text-xs font-medium text-muted-foreground/500">
            Description
          </Label>
          {editing ? (
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description…"
              className="min-h-20 text-sm"
              rows={3}
            />
          ) : (
            <p className="text-sm text-foreground">
              {database.description || (
                <span className="italic text-muted-foreground">No description</span>
              )}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <StatBox
            icon={<Gamepad2 className="size-4" />}
            label="Games"
            value={String(database.gameCount)}
          />
          <StatBox
            icon={<HardDrive className="size-4" />}
            label="Size"
            value={formatBytes(database.storageBytes)}
          />
        </div>

        {/* Edit / save buttons */}
        {editing ? (
          <div className="flex gap-2">
            <Button onClick={saveEdit} disabled={updateMut.isPending} size="sm">
              {updateMut.isPending ? "Saving…" : "Save"}
            </Button>
            <Button
              variant="outline"
              onClick={cancelEdit}
              disabled={updateMut.isPending}
              size="sm"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditing(true)}
            className="w-full"
          >
            <Copy className="mr-1.5 size-3.5" />
            Rename / Edit description
          </Button>
        )}

        {/* Actions */}
        <div className="space-y-2 border-t border-border/50 pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/500">
            Actions
          </h4>

          {onAddGames && (
            <Button
              size="sm"
              className="w-full justify-start"
              onClick={() => onAddGames(database)}
            >
              <Plus className="mr-1.5 size-3.5" />
              Add games
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => setShowGames((s) => !s)}
          >
            <Gamepad2 className="mr-1.5 size-3.5" />
            {showGames ? "Hide games" : "Explore games"}
          </Button>

          {showGames && (
            <GamesList
              isLoading={gamesQuery.isLoading}
              error={gamesQuery.error}
              games={gamesQuery.data ?? []}
              onRemove={(gameId) => removeGameMut.mutate([gameId])}
              removing={removeGameMut.isPending}
            />
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => exportMut.mutate()}
            disabled={database.gameCount === 0 || exportMut.isPending}
          >
            {exportMut.isPending ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <Download className="mr-1.5 size-3.5" />
            )}
            Export as PGN
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => copyExportMut.mutate()}
            disabled={
              database.gameCount === 0 || copyExportMut.isPending
            }
          >
            {copiedExport ? (
              <Check className="mr-1.5 size-3.5 text-emerald-600" />
            ) : copyExportMut.isPending ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <Copy className="mr-1.5 size-3.5" />
            )}
            {copiedExport ? "Copied!" : "Copy PGN to clipboard"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => dedupMut.mutate()}
            disabled={dedupMut.isPending}
          >
            <Sparkles className="mr-1.5 size-3.5" />
            {dedupMut.isPending ? "Removing…" : "Remove duplicates"}
          </Button>
        </div>

        {/* Danger zone */}
        <div className="space-y-2 border-t border-border/50 pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-destructive/70">
            Danger zone
          </h4>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-destructive hover:bg-destructive/10"
            onClick={() => {
              if (
                confirm(
                  `Delete "${database.name}"? This removes the database and unlinks its games. The underlying game records are kept.`,
                )
              ) {
                deleteMut.mutate();
              }
            }}
            disabled={deleteMut.isPending}
          >
            <Trash2 className="mr-1.5 size-3.5" />
            {deleteMut.isPending ? "Deleting…" : "Delete database"}
          </Button>
        </div>

        {(updateMut.isError || deleteMut.isError) && (
          <p className="text-xs text-destructive">
            {updateMut.error instanceof Error
              ? updateMut.error.message
              : deleteMut.error instanceof Error
                ? deleteMut.error.message
                : "An error occurred"}
          </p>
        )}
      </div>
    </div>
  );
}

/** Small stat box for the drawer. */
function StatBox({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/50 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground/500">
        {icon}
        {label}
      </div>
      <div className="font-mono text-sm font-semibold text-foreground">
        {value}
      </div>
    </div>
  );
}

/** The member-games list shown under "Explore games". */
function GamesList({
  isLoading,
  error,
  games,
  onRemove,
  removing,
}: {
  isLoading: boolean;
  error: unknown;
  games: { id: string; white: string | null; black: string | null; result: string | null; createdAt: string }[];
  onRemove: (gameId: string) => void;
  removing: boolean;
}) {
  if (isLoading) {
    return (
      <p className="px-2 py-3 text-xs text-muted-foreground/500">Loading games…</p>
    );
  }
  if (error) {
    return (
      <p className="px-2 py-3 text-xs text-destructive">
        Failed to load games: {String(error)}
      </p>
    );
  }
  if (games.length === 0) {
    return (
      <p className="px-2 py-3 text-xs text-muted-foreground/500">
        This database has no games yet. Add some with the "Add games" button on
        the page.
      </p>
    );
  }
  return (
    <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border/50 p-1">
      {games.map((g) => (
        <div
          key={g.id}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
        >
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium">
              {g.white || "?"} vs. {g.black || "?"}
            </div>
            <div className="font-mono text-[10px] text-muted-foreground">
              {g.result ?? "*"} · {formatRelative(g.createdAt)}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="size-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(g.id)}
            disabled={removing}
            aria-label="Remove game from database"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}
