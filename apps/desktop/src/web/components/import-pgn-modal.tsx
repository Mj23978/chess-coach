/**
 * ImportPgnModal — paste a PGN, optionally label it, create the game.
 *
 * The dashboard's "Import PGN" button opens this. On submit it calls
 * `createGame(…)`, invalidates the games query, and closes. Headers
 * (White/Black/Result) are parsed from the PGN server-side in a later pass —
 * for now we pass them through as the user types (optional).
 *
 * Uses ModalShell (Radix Dialog) for proper outside-click and Escape handling.
 */
import { useState } from "react";
import { Button } from "@repo/ui/components/button";
import { createGame } from "../lib/api";
import { ModalShell } from "./ui/modal-shell";

export interface ImportPgnModalProps {
  /** Called after a successful create (parent can navigate / refetch). */
  onCreated?: (gameId: string) => void;
  onClose: () => void;
}

export function ImportPgnModal({ onCreated, onClose }: ImportPgnModalProps) {
  const [pgn, setPgn] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!pgn.trim()) {
      setError("Paste a PGN first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const game = await createGame({
        pgn: pgn.trim(),
        title: title.trim() || undefined,
      });
      onCreated?.(game.id);
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
      title="Import PGN"
      className="max-w-2xl"
    >
      <label className="mb-1 block text-xs font-medium text-muted-foreground">
        Title (optional)
      </label>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Caro-Kann vs. Magnus"
        className="mb-3 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
      />
      <label className="mb-1 block text-xs font-medium text-muted-foreground">
        PGN
      </label>
      <textarea
        value={pgn}
        onChange={(e) => setPgn(e.target.value)}
        placeholder='[Event "..."]\n[White "..."]\n...\n1. e4 e6 2. d4 d5 ...'
        rows={12}
        className="w-full resize-y rounded-md border border-border p-3 font-mono text-xs outline-none focus:border-primary"
      />
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={busy}>
          {busy ? "Importing…" : "Import"}
        </Button>
      </div>
    </ModalShell>
  );
}
