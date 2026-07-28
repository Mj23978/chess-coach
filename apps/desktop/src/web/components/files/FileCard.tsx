/**
 * FileCard (FL2-002) — one imported file in the grid / list.
 *
 * Mirrors DatabaseCard: a presentational component driven by props. Two
 * layouts:
 *  - `grid`: a square card with the type icon, name, type badge, and stat
 *    chips (game count + storage size).
 *  - `list`: a compact single row.
 *
 * Used by `pages/files.tsx`. Clicking the card opens the drawer (parent's
 * `onOpen`); the kebab menu offers Open / Rename / Delete.
 */
import {
	FileText,
	BookOpen,
	Trophy,
	Puzzle,
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
import type { FileDTO, FileType } from "../../lib/api";
import { formatBytes, formatRelative } from "../databases/utils";

const TYPE_ICON: Record<FileType, typeof FileText> = {
	games: FileText,
	repertoire: BookOpen,
	tournament: Trophy,
	puzzle: Puzzle,
};
const TYPE_LABEL: Record<FileType, string> = {
	games: "Games",
	repertoire: "Repertoire",
	tournament: "Tournament",
	puzzle: "Puzzles",
};

export interface FileCardProps {
	file: FileDTO;
	/** Grid (default) or list layout. */
	view?: "grid" | "list";
	/** Clicking the card body opens the drawer. */
	onOpen: () => void;
	/** Drawer's rename action (also reachable from the kebab menu). */
	onRename?: () => void;
	/** Delete (confirm handled by the parent). */
	onDelete?: () => void;
}

export function FileCard({
	file,
	view = "grid",
	onOpen,
	onRename,
	onDelete,
}: FileCardProps) {
	const Icon = TYPE_ICON[file.type] ?? FileText;

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
				className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 transition-colors hover:border-primary/40 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
			>
				<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
					<Icon className="size-4" />
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<span className="truncate font-medium">{file.name}</span>
						<TypeBadge type={file.type} />
					</div>
					{file.description && (
						<p className="truncate text-xs text-muted-foreground">
							{file.description}
						</p>
					)}
				</div>
				<div className="flex shrink-0 items-center gap-3 font-mono text-xs text-muted-foreground">
					<span>{file.gameCount} games</span>
					<span>·</span>
					<span>{formatBytes(file.storageBytes)}</span>
				</div>
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
			className="group relative flex cursor-pointer flex-col rounded-xl border border-border bg-background p-4 transition-[transform,border-color,box-shadow] hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
		>
			<div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
				<CardMenu onRename={onRename} onDelete={onDelete} onOpen={onOpen} />
			</div>

			<div className="mb-3 flex size-11 items-center justify-center rounded-lg bg-muted text-muted-foreground">
				<Icon className="size-5" />
			</div>

			<div className="mb-1 flex items-center gap-2">
				<h3 className="truncate font-semibold">{file.name}</h3>
				<TypeBadge type={file.type} />
			</div>

			<p className="mb-3 line-clamp-2 min-h-[2.5rem] text-xs text-muted-foreground">
				{file.description || "No description"}
			</p>

			<div className="flex items-center gap-2 text-xs">
				<span className="rounded-md bg-muted px-2 py-1 font-mono text-muted-foreground">
					{file.gameCount} games
				</span>
				<span className="rounded-md bg-muted px-2 py-1 font-mono text-muted-foreground">
					{formatBytes(file.storageBytes)}
				</span>
			</div>

			<div className="mt-3 border-t border-border/50 pt-2 text-xs text-muted-foreground">
				Updated {formatRelative(file.updatedAt)}
			</div>
		</div>
	);
}

function TypeBadge({ type }: { type: FileType }) {
	return (
		<Badge variant="secondary" className="shrink-0 text-[10px]">
			{TYPE_LABEL[type]}
		</Badge>
	);
}

/** The kebab menu — open / rename / delete. */
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
