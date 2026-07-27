/**
 * FileModals (FL2-003, FL2-004, FL2-005) — create / import file modal.
 *
 * Supports two modes:
 *  - "Paste PGN": paste PGN text directly (one or more games).
 *  - "Upload file": select a .pgn file from disk (Electrobun / browser).
 *
 * The modal also has a type picker (games / repertoire / tournament / puzzle)
 * and optional name + description fields.
 */
import { useState, useRef } from "react";
import { Upload, FileText } from "lucide-react";
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
import { createFile, type FileType, type FileDTO } from "../../lib/api";

/** Shared overlay shell — matches the existing ImportPgnModal / DatabaseModals look. */
function ModalShell({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>
        {children}
        <div className="mt-4 flex justify-end gap-2">{footer}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CreateFileModal
// ---------------------------------------------------------------------------

export interface CreateFileModalProps {
  onClose: () => void;
  onCreated: (file: FileDTO) => void;
}

export function CreateFileModal({ onClose, onCreated }: CreateFileModalProps) {
  const [tab, setTab] = useState<"paste" | "upload">("paste");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<FileType>("games");
  const [pgn, setPgn] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Read the file as text.
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setPgn(text);
      // Auto-fill name from filename if empty.
      if (!name.trim()) {
        const baseName = file.name.replace(/\.pgn$/i, "").replace(/[._-]/g, " ");
        setName(baseName);
      }
    };
    reader.onerror = () => setError("Failed to read file.");
    reader.readAsText(file);
  }

  async function submit() {
    if (!name.trim()) {
      setError("Give the file a name.");
      return;
    }
    if (!pgn.trim()) {
      setError("Paste PGN text or upload a .pgn file.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const file = await createFile({
        name: name.trim(),
        type,
        description: description.trim() || undefined,
        pgn: pgn.trim(),
      });
      onCreated(file);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell
      title="Import PGN File"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Importing…" : "Import"}
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
            placeholder="e.g. Chess.com Blitz 2024"
            autoFocus
          />
        </div>

        <div>
          <Label className="mb-1 block text-xs font-medium text-neutral-600">
            Type
          </Label>
          <Select value={type} onValueChange={(v) => setType(v as FileType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="games">Games</SelectItem>
              <SelectItem value="repertoire">Repertoire</SelectItem>
              <SelectItem value="tournament">Tournament</SelectItem>
              <SelectItem value="puzzle">Puzzles</SelectItem>
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
            placeholder="What is this file for?"
            rows={2}
          />
        </div>

        {/* Tab switch: paste vs upload */}
        <div className="flex gap-1 rounded-lg border border-neutral-200 p-1">
          {(["paste", "upload"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-sm ${
                tab === t
                  ? "bg-neutral-100 font-medium"
                  : "text-neutral-500 hover:bg-neutral-50"
              }`}
            >
              {t === "paste" ? (
                <>
                  <FileText className="size-3.5" />
                  Paste PGN
                </>
              ) : (
                <>
                  <Upload className="size-3.5" />
                  Upload File
                </>
              )}
            </button>
          ))}
        </div>

        {tab === "paste" ? (
          <div>
            <Label className="mb-1 block text-xs font-medium text-neutral-600">
              PGN (one or more games)
            </Label>
            <Textarea
              value={pgn}
              onChange={(e) => setPgn(e.target.value)}
              placeholder='[Event "..."]\n[White "..."]\n...\n1. e4 e6 2. d4 d5 ...'
              rows={8}
              className="font-mono text-xs"
            />
          </div>
        ) : (
          <div>
            <Label className="mb-1 block text-xs font-medium text-neutral-600">
              Select a .pgn file
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pgn,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="mr-1.5 size-3.5" />
              {pgn ? "File loaded — click to change" : "Choose file…"}
            </Button>
            {pgn && (
              <p className="mt-2 text-xs text-neutral-500">
                {pgn.length.toLocaleString()} characters loaded. You can also
                edit the PGN below before importing.
              </p>
            )}
            {pgn && (
              <Textarea
                value={pgn}
                onChange={(e) => setPgn(e.target.value)}
                rows={6}
                className="mt-2 font-mono text-xs"
              />
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </ModalShell>
  );
}
