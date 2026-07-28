/**
 * CreateFileModal (FL2) — the "Import File" modal.
 *
 * Captures the four inputs the `/files` POST route expects: name, type,
 * description, and the PGN blob. Also accepts optional comma/newline-separated
 * tags. Calls `createFile` on submit; the parent invalidates `["files"]`.
 *
 * Uses ModalShell (Radix Dialog) for proper outside-click and Escape handling.
 */
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
	const [name, setName] = useState("");
	const [type, setType] = useState<FileType>("games");
	const [description, setDescription] = useState("");
	const [pgn, setPgn] = useState("");
	const [tagsRaw, setTagsRaw] = useState("");

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
		},
	});

	const valid = name.trim().length > 0 && pgn.trim().length > 0;

	return (
		<ModalShell
			open
			onOpenChange={(open) => !open && onClose()}
			title="Import File"
			footer={
				<>
					<Button variant="outline" onClick={onClose}>
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
				<div>
					<Label className="mb-1 block text-sm font-medium">Name</Label>
					<Input
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="My games — January"
						autoFocus
					/>
				</div>

				<div>
					<Label className="mb-1 block text-sm font-medium">Type</Label>
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

				<div>
					<Label className="mb-1 block text-sm font-medium">
						Description (optional)
					</Label>
					<Input
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="A short note about this file"
					/>
				</div>

				<div>
					<Label className="mb-1 block text-sm font-medium">PGN</Label>
					<Textarea
						value={pgn}
						onChange={(e) => setPgn(e.target.value)}
						placeholder="Paste one or more PGN games here…"
						className="min-h-32 font-mono text-xs"
						rows={6}
					/>
					<p className="mt-1 text-xs text-muted-foreground">
						You can paste multiple games; game count and size are computed
						automatically.
					</p>
				</div>

				<div>
					<Label className="mb-1 block text-sm font-medium">
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
