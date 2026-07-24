/**
 * ImportPgnModal — paste a PGN, optionally label it, create the game.
 *
 * The dashboard's "Import PGN" button opens this. On submit it calls
 * `createGame(…)`, invalidates the games query, and closes. Headers
 * (White/Black/Result) are parsed from the PGN server-side in a later pass —
 * for now we pass them through as the user types (optional).
 */
import { useState } from "react";
import { Button } from "@repo/ui/components/button";
import { createGame } from "../lib/api";

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold">Import PGN</h2>
        <label className="mb-1 block text-xs font-medium text-neutral-600">
          Title (optional)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Caro-Kann vs. Magnus"
          className="mb-3 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
        />
        <label className="mb-1 block text-xs font-medium text-neutral-600">
          PGN
        </label>
        <textarea
          value={pgn}
          onChange={(e) => setPgn(e.target.value)}
          placeholder='[Event "..."]\n[White "..."]\n...\n1. e4 e6 2. d4 d5 ...'
          rows={12}
          className="w-full resize-y rounded-md border border-neutral-300 p-3 font-mono text-xs outline-none focus:border-neutral-500"
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Importing…" : "Import"}
          </Button>
        </div>
      </div>
    </div>
  );
}
