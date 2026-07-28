/**
 * CreateFileModal (FL2) — the "Import File" modal.
 *
 * Captures the inputs the `/files` POST route expects: name, type,
 * description, the PGN blob, and optional comma/newline-separated tags. Two
 * ways to supply the PGN:
 *  - "Paste PGN": paste one or more games directly.
 *  - "Upload file": pick a .pgn/.txt from disk (read client-side, then editable).
 *
 * Uses ModalShell (Radix Dialog) for proper outside-click and Escape handling.
 * Mirrors DatabaseModals' label styling (xs, muted) for cross-page consistency.
 */
import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { FileText, Upload } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import { Label } from "@repo/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { createFile, type FileType } from "../../lib/api";
import { toast, TOAST_MESSAGES } from "../ui";
import { ModalShell } from "../ui/modal-shell";

const TYPE_OPTIONS: { value: FileType; label: string }[] = [
	{ value: "games", label: "Games" },
	{ value: "repertoire", label: "Repertoire" },
	{ value: "tournament", label: "Tournament" },
	{ value: "puzzle", label: "Puzzles" },
];

export interface CreateFileModalProps {
	onClose: () => void;
	onCreated: () => void;
}

export function CreateFileModal({ onClose, onCreated }: CreateFileModalProps) {
	const [tab, setTab] = useState<"paste" | "upload">("paste");
	const [name, setName] = useState("");
	const [type, setType] = useState<FileType>("games");
	const [description, setDescription] = useState("");
	const [pgn, setPgn] = useState("");
	const [tagsRaw, setTagsRaw] = useState("");
	const fileInputRef = useRef<HTMLInputElement>(null);

	const createMut = useMutation({
		mutationFn: () => {
			const tags = tagsRaw
				.split(/[,\n]/)
				.map((t) => t.trim())
				.filter(Boolean);
			return createFile({
				name: name.trim(),
				type,
				description: description.trim() || undefined,
				pgn,
				tags: tags.length > 0 ? tags : undefined,
			});
		},
		onSuccess: () => {
			toast.success(TOAST_MESSAGES.FILE_IMPORTED);
			onCreated();
			onClose();
		},
	});

	const valid = name.trim().length > 0 && pgn.trim().length > 0;

	function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			const text = reader.result as string;
			setPgn(text);
			// Auto-fill name from filename if the user hasn't typed one.
			if (!name.trim()) {
				const baseName = file.name.replace(/\.pgn$/i, "").replace(/[._-]/g, " ");
				setName(baseName);
			}
		};
		reader.onerror = () => {
			toast.error("Couldn't read that file. Try pasting the PGN instead.");
		};
		reader.readAsText(file);
	}

	return (
		<ModalShell
			open
			onOpenChange={(open) => !open && onClose()}
			title="Import File"
			description="Paste PGN or choose a .pgn file from disk."
			footer={
				<>
					<Button variant="ghost" onClick={onClose} disabled={createMut.isPending}>
						Cancel
					</Button>
					<Button
						onClick={() => createMut.mutate()}
						disabled={!valid || createMut.isPending}
					>
						{createMut.isPending ? "Importing…" : "Import"}
					</Button>
				</>
			}
		>
			<div className="space-y-4">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div className="sm:col-span-1">
						<Label className="mb-1 block text-xs font-medium text-muted-foreground">
							Name
						</Label>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="My games — January"
							autoFocus
						/>
					</div>

					<div className="sm:col-span-1">
						<Label className="mb-1 block text-xs font-medium text-muted-foreground">
							Type
						</Label>
						<Select value={type} onValueChange={(v) => setType(v as FileType)}>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{TYPE_OPTIONS.map((opt) => (
									<SelectItem key={opt.value} value={opt.value}>
										{opt.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				<div>
					<Label className="mb-1 block text-xs font-medium text-muted-foreground">
						Description (optional)
					</Label>
					<Input
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="A short note about this file"
					/>
				</div>

				{/* Paste / upload tab switch — mirrors AddGamesModal's tab control. */}
				<div className="flex gap-1 rounded-lg border border-border p-1">
					{(["paste", "upload"] as const).map((t) => (
						<button
							key={t}
							type="button"
							onClick={() => setTab(t)}
							className={`flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-sm transition-colors ${
								tab === t
									? "bg-muted font-medium text-foreground"
									: "text-muted-foreground hover:bg-muted/50"
							}`}
						>
							{t === "paste" ? (
								<FileText className="size-3.5" />
							) : (
								<Upload className="size-3.5" />
							)}
							{t === "paste" ? "Paste PGN" : "Upload file"}
						</button>
					))}
				</div>

				{tab === "paste" ? (
					<div>
						<Label className="mb-1 block text-xs font-medium text-muted-foreground">
							PGN (one or more games)
						</Label>
						<Textarea
							value={pgn}
							onChange={(e) => setPgn(e.target.value)}
							placeholder='[Event "&#8230;"]\n[White "&#8230;"]\n&#8230;\n1. e4 e6 2. d4 d5 &#8230;'
							className="min-h-32 font-mono text-xs"
							rows={7}
						/>
					</div>
				) : (
					<div>
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
							{pgn ? "Change file…" : "Choose .pgn file…"}
						</Button>
						{pgn && (
							<>
								<p className="mt-2 text-xs text-muted-foreground">
									{pgn.length.toLocaleString()} characters loaded — edit below
									before importing if needed.
								</p>
								<Textarea
									value={pgn}
									onChange={(e) => setPgn(e.target.value)}
									rows={6}
									className="mt-2 font-mono text-xs"
								/>
							</>
						)}
					</div>
				)}

				<div>
					<Label className="mb-1 block text-xs font-medium text-muted-foreground">
						Tags (optional)
					</Label>
					<Input
						value={tagsRaw}
						onChange={(e) => setTagsRaw(e.target.value)}
						placeholder="opening, blitz, 2024 (comma-separated)"
					/>
				</div>

				{createMut.isError && (
					<p className="text-sm text-destructive">
						{createMut.error instanceof Error
							? createMut.error.message
							: "Failed to import file"}
					</p>
				)}
			</div>
		</ModalShell>
	);
}
