/**
 * Empty state components (Phase 9: X2-003).
 *
 * Reusable empty state variants for different contexts:
 * - No items yet
 * - No search results
 * - Error state
 * - Welcome state
 */
import { type ReactNode } from "react";
import {
	Database,
	FolderOpen,
	Cpu,
	User,
	FileText,
	Search,
	Inbox,
	Globe,
} from "lucide-react";
import { Button } from "@repo/ui/components/button";

interface EmptyStateProps {
	icon?: ReactNode;
	title: string;
	description: string;
	action?: {
		label: string;
		onClick: () => void;
		icon?: ReactNode;
	};
	secondaryAction?: {
		label: string;
		onClick: () => void;
	};
}

/** Generic empty state component. */
export function EmptyState({
	icon,
	title,
	description,
	action,
	secondaryAction,
}: EmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center py-12 text-center">
			{icon && (
				<div className="mb-4 flex size-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
					{icon}
				</div>
			)}
			<h3 className="mb-2 text-lg font-medium text-neutral-900">{title}</h3>
			<p className="mb-6 max-w-sm text-sm text-neutral-500">{description}</p>
			<div className="flex gap-2">
				{action && (
					<Button onClick={action.onClick}>
						{action.icon && <span className="mr-1.5">{action.icon}</span>}
						{action.label}
					</Button>
				)}
				{secondaryAction && (
					<Button variant="outline" onClick={secondaryAction.onClick}>
						{secondaryAction.label}
					</Button>
				)}
			</div>
		</div>
	);
}

/** No search results empty state. */
export function NoSearchResults({
	query,
	onClear,
}: {
	query: string;
	onClear: () => void;
}) {
	return (
		<div className="flex flex-col items-center justify-center py-12 text-center">
			<div className="mb-4 flex size-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
				<Search className="size-8" />
			</div>
			<h3 className="mb-2 text-lg font-medium text-neutral-900">
				No results found
			</h3>
			<p className="mb-4 text-sm text-neutral-500">
				No items match "{query}". Try a different search term.
			</p>
			<Button variant="outline" onClick={onClear}>
				Clear search
			</Button>
		</div>
	);
}

/** Databases page empty state. */
export function DatabasesEmpty({ onCreate }: { onCreate: () => void }) {
	return (
		<EmptyState
			icon={<Database className="size-8" />}
			title="No databases yet"
			description="Create a database to organize your games by theme, opening, or event."
			action={{ label: "Create Database", onClick: onCreate }}
		/>
	);
}

/** Files page empty state. */
export function FilesEmpty({ onAdd }: { onAdd: () => void }) {
	return (
		<EmptyState
			icon={<FolderOpen className="size-8" />}
			title="No files yet"
			description="Import a PGN file or paste a game to get started."
			action={{ label: "Import File", onClick: onAdd }}
		/>
	);
}

/** Engines page empty state. */
export function EnginesEmpty({
	onDownload,
	onAdd,
}: {
	onDownload: () => void;
	onAdd: () => void;
}) {
	return (
		<EmptyState
			icon={<Cpu className="size-8" />}
			title="No engines configured"
			description="Download Stockfish or add a local engine to enable analysis."
			action={{ label: "Download Engine", onClick: onDownload }}
			secondaryAction={{ label: "Add Local Engine", onClick: onAdd }}
		/>
	);
}

/** Accounts page empty state. */
export function AccountsEmpty({ onAdd }: { onAdd: () => void }) {
	return (
		<EmptyState
			icon={<User className="size-8" />}
			title="No accounts connected"
			description="Connect your Chess.com or Lichess account to sync your games."
			action={{ label: "Add Account", onClick: onAdd }}
		/>
	);
}

/** Games page empty state. */
export function GamesEmpty({ onImport }: { onImport: () => void }) {
	return (
		<EmptyState
			icon={<FileText className="size-8" />}
			title="No games yet"
			description="Import a PGN file or connect an account to start analyzing your games."
			action={{ label: "Import Game", onClick: onImport }}
		/>
	);
}

/** Board page empty state. */
export function BoardEmpty({
	onPlay,
	onFen,
}: {
	onPlay: () => void;
	onFen: () => void;
}) {
	return (
		<EmptyState
			icon={<Globe className="size-8" />}
			title="Welcome to the Board"
			description="Start a new game or load a position to analyze."
			action={{ label: "Play Game", onClick: onPlay }}
			secondaryAction={{ label: "Enter FEN", onClick: onFen }}
		/>
	);
}

/** Generic inbox/placeholder empty state. */
export function InboxEmpty({
	title = "Nothing here yet",
	description = "This section will be available in a future update.",
}: {
	title?: string;
	description?: string;
}) {
	return (
		<EmptyState
			icon={<Inbox className="size-8" />}
			title={title}
			description={description}
		/>
	);
}
