/**
 * AccountCard — one row in the Accounts list.
 *
 * Shows the platform identity, a live ratings summary (fetched per-card via
 * `fetchAccountStats`), games-synced count, and last-sync time. Actions:
 *  - Sync: `POST /accounts/:id/sync` (long-running; shows a spinner + result).
 *  - View database: opens the PlayerDatabaseDrawer.
 *  - Edit: inline rename modal.
 *  - Remove: confirm → `DELETE /accounts/:id`.
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Card,
	CardContent,
} from "@repo/ui/components/card";
import { Button } from "@repo/ui/components/button";
import { Badge } from "@repo/ui/components/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Input } from "@repo/ui/components/input";
import { Database, MoreVertical, RefreshCw } from "lucide-react";
import {
	deleteAccount,
	fetchAccountStats,
	syncAccount,
	updateAccount,
	type AccountDTO,
} from "../../lib/api";
import { ModalShell } from "../ui/modal-shell";

interface AccountCardProps {
	account: AccountDTO;
	onOpenDatabase: (account: AccountDTO) => void;
}

export function AccountCard({ account, onOpenDatabase }: AccountCardProps) {
	const qc = useQueryClient();
	const [renaming, setRenaming] = useState(false);
	const [confirmingDelete, setConfirmingDelete] = useState(false);

	const statsQ = useQuery({
		queryKey: ["account-stats", account.id],
		queryFn: () => fetchAccountStats(account.id),
		staleTime: 60_000,
	});

	const syncMut = useMutation({
		mutationFn: () => syncAccount(account.id),
		onSuccess: async () => {
			await qc.invalidateQueries({ queryKey: ["accounts"] });
			await qc.invalidateQueries({ queryKey: ["games"] });
			await qc.invalidateQueries({ queryKey: ["account-stats", account.id] });
			await qc.invalidateQueries({
				queryKey: ["account-games", account.id],
			});
		},
	});

	const renameMut = useMutation({
		mutationFn: (name: string) => updateAccount(account.id, { username: name }),
		onSuccess: async () => {
			await qc.invalidateQueries({ queryKey: ["accounts"] });
			setRenaming(false);
		},
	});

	const deleteMut = useMutation({
		mutationFn: () => deleteAccount(account.id),
		onSuccess: async () => {
			await qc.invalidateQueries({ queryKey: ["accounts"] });
			await qc.invalidateQueries({ queryKey: ["games"] });
		},
	});

	const ratings = (statsQ.data?.ratings ?? []).slice().sort(
		(a, b) => b.rating - a.rating,
	);
	const isChessCom = account.platform === "chess.com";

	return (
		<Card>
			<CardContent className="flex items-center justify-between gap-4 py-4">
				<div className="flex min-w-0 items-center gap-4">
					<div
						className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-white ${
							isChessCom ? "bg-emerald-500" : "bg-neutral-800"
						}`}
					>
						<span className="text-2xl">♟</span>
					</div>
					<div className="min-w-0">
						<div className="flex items-center gap-2">
							<span className="truncate font-medium">
								{account.username}
							</span>
							<Badge variant="secondary" className="shrink-0">
								{isChessCom ? "Chess.com" : "Lichess"}
							</Badge>
						</div>
						<div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-neutral-500">
							<span>{account.gamesCount} games synced</span>
							<span>·</span>
							<span>Last sync {formatDate(account.lastSyncedAt)}</span>
						</div>
						{ratings.length > 0 && (
							<div className="mt-1.5 flex flex-wrap gap-1">
								{ratings.map((r) => (
									<Badge key={r.key} variant="outline" className="capitalize">
										{r.key} {r.rating}
									</Badge>
								))}
							</div>
						)}
						{statsQ.data?.ratingsError && ratings.length === 0 && (
							<p className="mt-1 text-xs text-amber-600">
								Live ratings unavailable
							</p>
						)}
					</div>
				</div>

				<div className="flex shrink-0 items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => onOpenDatabase(account)}
					>
						<Database className="mr-1.5 size-4" />
						Database
					</Button>
					<Button
						size="sm"
						onClick={() => syncMut.mutate()}
						disabled={syncMut.isPending}
					>
						<RefreshCw
							className={`mr-1.5 size-4 ${syncMut.isPending ? "animate-spin" : ""}`}
						/>
						{syncMut.isPending ? "Syncing…" : "Sync"}
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" aria-label="Account actions">
								<MoreVertical className="size-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={() => onOpenDatabase(account)}>
								View player database
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setRenaming(true)}>
								Rename
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="text-rose-600"
								onClick={() => setConfirmingDelete(true)}
							>
								Remove account
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</CardContent>

			{syncMut.data && (
				<div className="border-t px-4 py-2 text-xs text-emerald-700">
					Synced {syncMut.data.synced} new game
					{syncMut.data.synced === 1 ? "" : "s"} ({syncMut.data.fetched} fetched).
				</div>
			)}
			{syncMut.isError && (
				<div className="border-t px-4 py-2 text-xs text-rose-600">
					{syncMut.error instanceof Error
						? syncMut.error.message
						: "Sync failed"}
				</div>
			)}

			{renaming && (
				<RenameModal
					initial={account.username}
					submitting={renameMut.isPending}
					error={
						renameMut.error instanceof Error
							? renameMut.error.message
							: renameMut.isError
								? "Rename failed"
								: null
					}
					onCancel={() => {
						setRenaming(false);
						renameMut.reset();
					}}
					onSubmit={(name) => renameMut.mutate(name)}
				/>
			)}

			{confirmingDelete && (
				<ConfirmModal
					title={`Remove ${account.username}?`}
					body="Synced games are kept (they'll show without an account). This cannot be undone."
					submitting={deleteMut.isPending}
					onCancel={() => {
						setConfirmingDelete(false);
						deleteMut.reset();
					}}
					onConfirm={() => deleteMut.mutate()}
				/>
			)}
		</Card>
	);
}

// ---------------------------------------------------------------------------

function RenameModal({
	initial,
	submitting,
	error,
	onCancel,
	onSubmit,
}: {
	initial: string;
	submitting: boolean;
	error: string | null;
	onCancel: () => void;
	onSubmit: (name: string) => void;
}) {
	const [name, setName] = useState(initial);
	return (
		<ModalShell
			open
			onOpenChange={(open) => !open && onCancel()}
			title="Rename account"
			className="max-w-sm"
		>
			<Input
				autoFocus
				value={name}
				onChange={(e) => setName(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter" && name.trim()) onSubmit(name.trim());
				}}
			/>
			{error && <p className="text-sm text-rose-600">{error}</p>}
			<div className="flex justify-end gap-2">
				<Button variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button
					disabled={!name.trim() || submitting}
					onClick={() => onSubmit(name.trim())}
				>
					{submitting ? "Saving…" : "Save"}
				</Button>
			</div>
		</ModalShell>
	);
}

function ConfirmModal({
	title,
	body,
	submitting,
	onCancel,
	onConfirm,
}: {
	title: string;
	body: string;
	submitting: boolean;
	onCancel: () => void;
	onConfirm: () => void;
}) {
	return (
		<ModalShell
			open
			onOpenChange={(open) => !open && onCancel()}
			title={title}
			className="max-w-sm"
		>
			<p className="text-sm text-neutral-600">{body}</p>
			<div className="flex justify-end gap-2">
				<Button variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button
					variant="destructive"
					disabled={submitting}
					onClick={onConfirm}
				>
					{submitting ? "Removing…" : "Remove"}
				</Button>
			</div>
		</ModalShell>
	);
}

function formatDate(iso: string | null | undefined): string {
	if (!iso) return "never";
	try {
		return new Date(iso).toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch {
		return iso ?? "never";
	}
}
