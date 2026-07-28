/**
 * GamesTable (D2-001 … D2-008) — the dashboard's games browser.
 *
 * Three tabs (Local / Chess.com / Lichess). The Local tab is live: it lists
 * every game from `/games` with sortable, searchable columns and clickable
 * rows that open the game-review page. The Chess.com and Lichess tabs are
 * empty states until PLAN-004 wires account sync — they point the user at the
 * Accounts page.
 *
 * Derived per-game stats (move count, accuracy, ACPL) come from
 * `lib/dashboard-stats.ts`; analysis is kicked off via the existing
 * `analyzeGame` API (moved here from the old dashboard cards).
 */

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@repo/ui/components/tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronsUpDown, ChevronUp, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { analyzeGame, type GameDTO } from "../../lib/api";
import {
	isAnalyzed,
	opponentName,
	plyCount,
	resultLabel,
	userAccuracy,
	userAcpl,
	userSide,
} from "../../lib/dashboard-stats";
import { ErrorState } from "../ui";

type SortKey = "opponent" | "result" | "accuracy" | "acpl" | "moves" | "date";
type SortDir = "asc" | "desc";

interface GamesSubTableProps {
	games: GameDTO[];
	isLoading: boolean;
	error: unknown;
	/** Message shown when the (filtered) list is empty. */
	emptyMessage: string;
	/** When set, the empty state shows a "sync from Accounts" CTA. */
	emptyAction?: "connect";
}

function GamesSubTable({
	games,
	isLoading,
	error,
	emptyMessage,
	emptyAction,
}: GamesSubTableProps) {
	const qc = useQueryClient();
	const [sortKey, setSortKey] = useState<SortKey>("date");
	const [sortDir, setSortDir] = useState<SortDir>("desc");
	const [query, setQuery] = useState("");
	const [filterAnalyzed, setFilterAnalyzed] = useState<"all" | "analyzed">(
		"all",
	);

	const analyzeMut = useMutation({
		mutationFn: (id: string) => analyzeGame(id),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["games"] }),
	});

	const rows = useMemo(() => {
		const filtered = games.filter((g) => {
			const opp = opponentName(g).toLowerCase();
			if (query && !opp.includes(query.toLowerCase())) return false;
			if (filterAnalyzed === "analyzed" && !isAnalyzed(g)) return false;
			return true;
		});
		const sorted = [...filtered].sort((a, b) => cmp(a, b, sortKey));
		return sortDir === "asc" ? sorted : sorted.reverse();
	}, [games, query, filterAnalyzed, sortKey, sortDir]);

	function toggleSort(key: SortKey) {
		if (key === sortKey) {
			setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		} else {
			setSortKey(key);
			setSortDir("asc");
		}
	}

	if (isLoading) {
		return <p className="px-4 py-8 text-sm text-muted-foreground/500">Loading games…</p>;
	}
	if (error) {
		return (
			<div className="px-4">
				<ErrorState
					title="Couldn't load games"
					description="We had trouble loading your recent games. Please try again."
					detail={String(error)}
					onRetry={onRetry}
				/>
			</div>
		);
	}
	if (games.length === 0) {
		return (
			<div className="rounded-md border border-dashed border-border p-8 text-center">
				<p className="text-sm text-muted-foreground/500">{emptyMessage}</p>
				{emptyAction === "connect" && (
					<Button asChild variant="outline" size="sm" className="mt-3">
						<Link to="/accounts">Sync from Accounts</Link>
					</Button>
				)}
			</div>
		);
	}

	return (
		<div>
			{/* Filter bar (D2-008) */}
			<div className="flex flex-wrap items-center gap-2 px-4 py-2">
				<div className="relative max-w-xs flex-1">
					<Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						variant="minimal"
						placeholder="Search opponent…"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className="pl-8"
					/>
				</div>
				<div className="flex items-center gap-1 text-xs">
					{(["all", "analyzed"] as const).map((opt) => (
						<Button
							key={opt}
							variant={filterAnalyzed === opt ? "default" : "outline"}
							size="sm"
							onClick={() => setFilterAnalyzed(opt)}
						>
							{opt === "all" ? "All" : "Analyzed"}
						</Button>
					))}
				</div>
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						<SortableHead
							label="Opponent"
							active={sortKey === "opponent"}
							dir={sortDir}
							onClick={() => toggleSort("opponent")}
						/>
						<TableHead className="w-16">Color</TableHead>
						<SortableHead
							label="Result"
							active={sortKey === "result"}
							dir={sortDir}
							onClick={() => toggleSort("result")}
						/>
						<SortableHead
							label="Accuracy"
							active={sortKey === "accuracy"}
							dir={sortDir}
							onClick={() => toggleSort("accuracy")}
							className="w-24"
						/>
						<SortableHead
							label="ACPL"
							active={sortKey === "acpl"}
							dir={sortDir}
							onClick={() => toggleSort("acpl")}
							className="w-20"
						/>
						<SortableHead
							label="Moves"
							active={sortKey === "moves"}
							dir={sortDir}
							onClick={() => toggleSort("moves")}
							className="w-20"
						/>
						<SortableHead
							label="Date"
							active={sortKey === "date"}
							dir={sortDir}
							onClick={() => toggleSort("date")}
							className="w-32"
						/>
						<TableHead className="w-24">Account</TableHead>
						<TableHead className="w-24 text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{rows.map((g) => {
						const opp = opponentName(g);
						const side = userSide(g);
						const moves = plyCount(g);
						const accuracy = userAccuracy(g);
						const acpl = userAcpl(g);
						const result = resultLabel(g);
						const analyzed = isAnalyzed(g);
						return (
							<TableRow
								key={g.id}
								className="cursor-pointer hover:bg-muted/50"
							>
								<TableCell className="max-w-[200px] truncate font-medium">
									<Link to={`/games/${g.id}`} className="block truncate">
										{opp}
									</Link>
								</TableCell>
								<TableCell>
									<ColorChip side={side} />
								</TableCell>
								<TableCell>
									<span className={resultToneClass(result.tone)}>
										{result.text}
									</span>
									<span className="ml-1.5 font-mono text-xs text-muted-foreground">
										{g.result ?? "*"}
									</span>
								</TableCell>
								<TableCell className="font-mono text-xs">
									{accuracy !== null ? `${accuracy}%` : "—"}
								</TableCell>
								<TableCell className="font-mono text-xs">
									{acpl !== null ? acpl.toFixed(1) : "—"}
								</TableCell>
								<TableCell className="font-mono text-xs text-muted-foreground/500">
									{moves !== null ? Math.ceil(moves / 2) : "—"}
								</TableCell>
								<TableCell className="text-xs text-muted-foreground/500">
									{formatDate(g.createdAt)}
								</TableCell>
								<TableCell>
									<Badge variant="secondary">{sourceLabel(g.source)}</Badge>
								</TableCell>
								<TableCell className="text-right">
									<Button
										variant="outline"
										size="sm"
										onClick={(e) => {
											// Prevent the row-link navigation.
											e.preventDefault();
											e.stopPropagation();
											analyzeMut.mutate(g.id);
										}}
										disabled={
											analyzeMut.isPending && analyzeMut.variables === g.id
										}
									>
										{analyzeMut.isPending && analyzeMut.variables === g.id
											? "…"
											: analyzed
												? "Re-analyze"
												: "Analyze"}
									</Button>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>

			{analyzeMut.isError && (
				<p className="px-4 py-2 text-xs text-destructive">
					{analyzeMut.error instanceof Error
						? analyzeMut.error.message
						: "Analysis failed"}
				</p>
			)}
		</div>
	);
}

/** Display label for a game's source. */
function sourceLabel(
	source: GameDTO["source"] | null | undefined,
): string {
	switch (source) {
		case "chesscom":
			return "Chess.com";
		case "lichess":
			return "Lichess";
		default:
			return "Local";
	}
}

// ---------------------------------------------------------------------------
// Small view helpers
// ---------------------------------------------------------------------------

function SortableHead({
	label,
	active,
	dir,
	onClick,
	className,
}: {
	label: string;
	active: boolean;
	dir: SortDir;
	onClick: () => void;
	className?: string;
}) {
	const Icon = active
		? dir === "asc"
			? ChevronUp
			: ChevronDown
		: ChevronsUpDown;
	return (
		<TableHead className={className}>
			<button
				type="button"
				onClick={onClick}
				className="inline-flex items-center gap-1 text-left font-medium hover:text-foreground"
			>
				{label}
				<Icon className="size-3 text-muted-foreground" />
			</button>
		</TableHead>
	);
}

function ColorChip({ side }: { side: "white" | "black" }) {
	return (
		<span
			role="img"
			aria-label={side === "white" ? "Played White" : "Played Black"}
			title={side === "white" ? "Played White" : "Played Black"}
			className={`inline-flex size-4 items-center justify-center rounded-full border text-[9px] font-bold ${
				side === "white"
					? "border-border bg-background text-foreground"
					: "border-border bg-foreground text-white"
			}`}
		>
			{side === "white" ? "W" : "B"}
		</span>
	);
}

function resultToneClass(tone: "win" | "loss" | "draw" | "unknown"): string {
	switch (tone) {
		case "win":
			return "text-emerald-600 font-medium";
		case "loss":
			return "text-rose-600 font-medium";
		case "draw":
			return "text-muted-foreground/500";
		default:
			return "text-muted-foreground";
	}
}

function formatDate(iso: string): string {
	try {
		return new Date(iso).toLocaleDateString(undefined, {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	} catch {
		return iso;
	}
}

/** Compare two games along a sort key (ascending). */
function cmp(a: GameDTO, b: GameDTO, key: SortKey): number {
	switch (key) {
		case "opponent":
			return opponentName(a).localeCompare(opponentName(b));
		case "result":
			return (a.result ?? "").localeCompare(b.result ?? "");
		case "accuracy": {
			const x = userAccuracy(a) ?? -1;
			const y = userAccuracy(b) ?? -1;
			return x - y;
		}
		case "acpl": {
			const x = userAcpl(a) ?? Number.POSITIVE_INFINITY;
			const y = userAcpl(b) ?? Number.POSITIVE_INFINITY;
			return x - y;
		}
		case "moves": {
			const x = plyCount(a) ?? 0;
			const y = plyCount(b) ?? 0;
			return x - y;
		}
		case "date":
			return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
	}
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

export interface GamesTableProps {
	games: GameDTO[];
	isLoading: boolean;
	error: unknown;
	/** Active tab value; defaults to "local". */
	defaultTab?: string;
	/** Retry callback shown in the error state. */
	onRetry?: () => void;
}

export function GamesTable({
	games,
	isLoading,
	error,
	defaultTab = "local",
	onRetry,
}: GamesTableProps) {
	const local = games.filter((g) => (g.source ?? "local") === "local");
	const chesscom = games.filter((g) => g.source === "chesscom");
	const lichess = games.filter((g) => g.source === "lichess");

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">Recent Games</CardTitle>
			</CardHeader>
			<CardContent>
			<Tabs defaultValue={defaultTab}>
				<TabsList>
					<TabsTrigger value="local">Local ({local.length})</TabsTrigger>
					<TabsTrigger value="chesscom">
						Chess.com ({chesscom.length})
					</TabsTrigger>
					<TabsTrigger value="lichess">
						Lichess ({lichess.length})
					</TabsTrigger>
				</TabsList>
				<TabsContent value="local">
					<GamesSubTable
						games={local}
						isLoading={isLoading}
						error={error}
						emptyMessage="No games yet. Import a PGN to begin."
					/>
				</TabsContent>
				<TabsContent value="chesscom">
					<GamesSubTable
						games={chesscom}
						isLoading={false}
						error={error}
						emptyMessage="No Chess.com games synced yet."
						emptyAction="connect"
					/>
				</TabsContent>
				<TabsContent value="lichess">
					<GamesSubTable
						games={lichess}
						isLoading={false}
						error={error}
						emptyMessage="No Lichess games synced yet."
						emptyAction="connect"
					/>
				</TabsContent>
			</Tabs>
		</CardContent>
		</Card>
	);
}
