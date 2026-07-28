/**
 * FileDrawer (FL2-003) — the right-side detail panel for an imported file.
 *
 * Capabilities:
 *  - Inline rename / edit description / change type
 *  - View the raw PGN blob
 *  - Export (download) the PGN
 *  - Delete the file
 *
 * Built on the design-system `Sheet` (right side), mirroring DatabaseDrawer.
 * The parent owns the open state; this component drives its own mutations and
 * invalidates the `["files"]` query key on success.
 */
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	Download,
	Trash2,
	Copy,
	Check,
	Gamepad2,
	HardDrive,
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { updateFile, deleteFile, type FileDTO, type FileType } from "../../lib/api";
import { toast } from "../ui";
import { formatBytes, formatRelative } from "../databases/utils";
import { downloadText } from "../../lib/export";

const TYPE_OPTIONS: { value: FileType; label: string }[] = [
	{ value: "games", label: "Games" },
	{ value: "repertoire", label: "Repertoire" },
	{ value: "tournament", label: "Tournament" },
	{ value: "puzzle", label: "Puzzles" },
];

export interface FileDrawerProps {
	/** The file to show. null = closed. */
	file: FileDTO | null;
	/** Called when the user dismisses the panel. */
	onClose: () => void;
}

export function FileDrawer({ file, onClose }: FileDrawerProps) {
	const open = file !== null;
	const id = file?.id;

	return (
		<Sheet open={open} onOpenChange={(o) => !o && onClose()}>
			<SheetContent side="right" className="w-full sm:max-w-md">
				{file && id && <DrawerBody key={id} file={file} onClose={onClose} />}
			</SheetContent>
		</Sheet>
	);
}

function DrawerBody({
	file,
	onClose,
}: {
	file: FileDTO;
	onClose: () => void;
}) {
	const qc = useQueryClient();
	const [copied, setCopied] = useState(false);

	// Inline rename / description / type editing.
	const [editing, setEditing] = useState(false);
	const [name, setName] = useState(file.name);
	const [description, setDescription] = useState(file.description ?? "");
	const [type, setType] = useState<FileType>(file.type);

	const updateMut = useMutation({
		mutationFn: (input: {
			name?: string;
			description?: string | null;
			type?: FileType;
		}) => updateFile(file.id, input),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["files"] });
			setEditing(false);
		},
	});

	const deleteMut = useMutation({
		mutationFn: () => deleteFile(file.id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["files"] });
			toast.success("File deleted");
			onClose();
		},
	});

	function saveEdit() {
		const trimmed = name.trim();
		if (!trimmed) return;
		const desc = description.trim() ? description.trim() : null;
		updateMut.mutate({ name: trimmed, description: desc, type });
	}

	function cancelEdit() {
		setName(file.name);
		setDescription(file.description ?? "");
		setType(file.type);
		setEditing(false);
	}

	function handleExport() {
		const safeName = file.name.replace(/[^\w.-]+/g, "_") || "file";
		downloadText(file.pgn, `${safeName}.pgn`, "text/x-chess-pgn");
	}

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(file.pgn);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			toast.error("Clipboard unavailable — use Download instead.");
		}
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
						<span className="truncate">{file.name}</span>
					)}
					<Badge variant="secondary" className="shrink-0 capitalize">
						{file.type}
					</Badge>
				</SheetTitle>
				<SheetDescription>
					Created {formatRelative(file.createdAt)} · Updated{" "}
					{formatRelative(file.updatedAt)}
				</SheetDescription>
			</SheetHeader>

			<div className="flex-1 space-y-5 overflow-y-auto p-4">
				{/* Description (editable) */}
				<div>
					<Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
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
							{file.description || (
								<span className="italic text-muted-foreground">No description</span>
							)}
						</p>
					)}
				</div>

				{/* Type (editable) */}
				{editing && (
					<div>
						<Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
							Type
						</Label>
						<Select value={type} onValueChange={(v) => setType(v as FileType)}>
							<SelectTrigger className="h-9 w-full">
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
				)}

				{/* Stats */}
				<div className="grid grid-cols-2 gap-2">
					<StatBox
						icon={<Gamepad2 className="size-4" />}
						label="Games"
						value={String(file.gameCount)}
					/>
					<StatBox
						icon={<HardDrive className="size-4" />}
						label="Size"
						value={formatBytes(file.storageBytes)}
					/>
				</div>

				{/* Edit / save */}
				{editing ? (
					<div className="flex gap-2">
						<Button
							onClick={saveEdit}
							disabled={updateMut.isPending}
							size="sm"
						>
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
						Rename / Edit details
					</Button>
				)}

				{/* PGN preview */}
				<div>
					<div className="mb-1.5 flex items-center justify-between">
						<Label className="text-xs font-medium text-muted-foreground">
							PGN ({file.gameCount} game{file.gameCount === 1 ? "" : "s"})
						</Label>
						<div className="flex gap-1">
							<Button
								variant="ghost"
								size="sm"
								className="h-7 px-2 text-xs"
								onClick={handleCopy}
							>
								{copied ? (
									<Check className="mr-1 size-3 text-emerald-600" />
								) : (
									<Copy className="mr-1 size-3" />
								)}
								{copied ? "Copied" : "Copy"}
							</Button>
							<Button
								variant="ghost"
								size="sm"
								className="h-7 px-2 text-xs"
								onClick={handleExport}
							>
								<Download className="mr-1 size-3" />
								Download
							</Button>
						</div>
					</div>
					<pre className="max-h-64 overflow-auto rounded-lg border border-border/50 bg-muted/50 p-2 font-mono text-[11px] leading-relaxed text-foreground">
						{file.pgn || "— empty —"}
					</pre>
				</div>

				{/* Tags */}
				{file.tags && file.tags.length > 0 && (
					<div>
						<Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
							Tags
						</Label>
						<div className="flex flex-wrap gap-1">
							{file.tags.map((tag) => (
								<Badge
									key={tag}
									variant="secondary"
									className="text-[10px]"
								>
									{tag}
								</Badge>
							))}
						</div>
					</div>
				)}

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
							if (confirm(`Delete "${file.name}"? This cannot be undone.`)) {
								deleteMut.mutate();
							}
						}}
						disabled={deleteMut.isPending}
					>
						<Trash2 className="mr-1.5 size-3.5" />
						{deleteMut.isPending ? "Deleting…" : "Delete file"}
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
			<div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
				{icon}
				{label}
			</div>
			<div className="font-mono text-sm font-semibold text-foreground">
				{value}
			</div>
		</div>
	);
}
