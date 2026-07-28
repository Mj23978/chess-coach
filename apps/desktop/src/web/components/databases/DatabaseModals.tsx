/**
 * DatabaseModals (DB2-006 create flow + add-games flow).
 *
 *  - `CreateDatabaseModal`: name + optional description + type picker.
 *  - `AddGamesModal`: lets the user add games to a database either by pasting
 *    PGN blobs or by selecting from their existing local games.
 *
 * Both use ModalShell (Radix Dialog) for proper outside-click and Escape
 * handling. They call back to the parent on success so the parent can close
 * + refetch.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Textarea } from "@repo/ui/components/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import {
  createDatabase,
  fetchGames,
  addDatabaseGames,
  type DatabaseDTO,
  type DatabaseType,
} from "../../lib/api";
import { ModalShell } from "../ui/modal-shell";

// ---------------------------------------------------------------------------
// CreateDatabaseModal
// ---------------------------------------------------------------------------

export interface CreateDatabaseModalProps {
  onClose: () => void;
  onCreated: (database: DatabaseDTO) => void;
}

export function CreateDatabaseModal({
  onClose,
  onCreated,
}: CreateDatabaseModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<DatabaseType>("games");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) {
      setError("Give the database a name.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const database = await createDatabase({
        name: name.trim(),
        description: description.trim() || undefined,
        type,
      });
      onCreated(database);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell
      open
      onOpenChange={(open) => !open && onClose()}
      title="New Database"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Creating…" : "Create"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <Label className="mb-1 block text-xs font-medium text-neutral-600">
            Name
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. My Blitz Games 2024"
            autoFocus
          />
        </div>

        <div>
          <Label className="mb-1 block text-xs font-medium text-neutral-600">
            Type
          </Label>
          <Select
            value={type}
            onValueChange={(v) => setType(v as DatabaseType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="games">Games</SelectItem>
              <SelectItem value="repertoire">Repertoire</SelectItem>
              <SelectItem value="puzzles">Puzzles</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-1 block text-xs font-medium text-neutral-600">
            Description (optional)
          </Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this collection for?"
            rows={3}
          />
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// AddGamesModal
// ---------------------------------------------------------------------------

export interface AddGamesModalProps {
  database: DatabaseDTO;
  onClose: () => void;
  onAdded: () => void;
}

/**
 * Add games to a database two ways:
 *  - "Paste PGN" tab: one or more PGN blobs (each becomes a new game).
 *  - "Existing" tab: pick from the user's already-imported local games.
 */
export function AddGamesModal({
  database,
  onClose,
  onAdded,
}: AddGamesModalProps) {
  const [tab, setTab] = useState<"paste" | "existing">("paste");
  const [pgn, setPgn] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Existing local games to pick from.
  const { data: allGames, isLoading } = useQuery({
    queryKey: ["games"],
    queryFn: fetchGames,
    enabled: tab === "existing",
  });

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      if (tab === "paste") {
        if (!pgn.trim()) {
          setError("Paste at least one PGN.");
          setBusy(false);
          return;
        }
        // Split multiple games on blank lines that separate PGN blocks.
        // A PGN game ends with a result token; the next starts with a header
        // tag or a move number. Splitting on "\n\n\n+" or two+ blank lines is
        // a pragmatic heuristic; the server stores each block as one game.
        const blocks = pgn
          .split(/\n\s*\n\s*\n+/)
          .map((b) => b.trim())
          .filter(Boolean);
        const pgns = blocks.length > 0 ? blocks : [pgn.trim()];
        await addDatabaseGames(database.id, { pgns });
      } else {
        const ids = [...selected];
        if (ids.length === 0) {
          setError("Select at least one game.");
          setBusy(false);
          return;
        }
        await addDatabaseGames(database.id, { gameIds: ids });
      }
      onAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <ModalShell
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Add games to "${database.name}"`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Adding…" : "Add games"}
          </Button>
        </>
      }
    >
      {/* Tab switch */}
      <div className="mb-4 flex gap-1 rounded-lg border border-neutral-200 p-1">
        {(["paste", "existing"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded px-3 py-1.5 text-sm ${
              tab === t
                ? "bg-neutral-100 font-medium"
                : "text-neutral-500 hover:bg-neutral-50"
            }`}
          >
            {t === "paste" ? "Paste PGN" : "Existing games"}
          </button>
        ))}
      </div>

      {tab === "paste" ? (
        <div>
          <Label className="mb-1 block text-xs font-medium text-neutral-600">
            PGN (one or more games, separated by blank lines)
          </Label>
          <Textarea
            value={pgn}
            onChange={(e) => setPgn(e.target.value)}
            placeholder='[Event "..."]\n[White "..."]\n...\n1. e4 e6 2. d4 d5 ...'
            rows={10}
            className="font-mono text-xs"
          />
        </div>
      ) : (
        <div>
          <p className="mb-2 text-xs text-neutral-500">
            Pick from your imported games. {selected.size} selected.
          </p>
          <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-neutral-200 p-1">
            {isLoading && (
              <p className="px-2 py-3 text-xs text-neutral-500">Loading…</p>
            )}
            {allGames?.length === 0 && (
              <p className="px-2 py-3 text-xs text-neutral-500">
                No games imported yet. Use the "Paste PGN" tab instead.
              </p>
            )}
            {allGames?.map((g) => {
              const checked = selected.has(g.id);
              return (
                <label
                  key={g.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                    checked ? "bg-blue-50" : "hover:bg-neutral-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(g.id)}
                    className="accent-blue-600"
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {g.white || "?"} vs. {g.black || "?"}
                  </span>
                  <span className="font-mono text-[10px] text-neutral-400">
                    {g.result ?? "*"}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </ModalShell>
  );
}
