/**
 * PlayerDatabaseDrawer (A5) — per-account detail panel.
 *
 * Opens from an AccountCard. Shows three tabs over the account's synced games:
 *  - Overview: W/L/D breakdown + games count + last sync.
 *  - Ratings: live per-time-control ratings from the platform.
 *  - Openings: grouped by ECO/Opening (W/D/L each), sorted by games played.
 *
 * Game headers (ECO/Opening/Result) are parsed client-side from each game's
 * stored PGN via `pgnHeaders` — no separate openings table is needed. A right
 * drawer widened beyond the default `sm:max-w-sm` so tables/bars fit.
 */
import { useQuery } from "@tanstack/react-query";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@repo/ui/components/drawer";
import { Badge } from "@repo/ui/components/badge";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@repo/ui/components/tabs";
import { RefreshCw } from "lucide-react";
import {
	fetchAccountStats,
	fetchGames,
	type AccountDTO,
	type AccountStatsDTO,
	type GameDTO,
} from "../../lib/api";
import { pgnHeaders } from "../../lib/chess";
import { userSide, resultLabel } from "../../lib/dashboard-stats";

interface PlayerDatabaseDrawerProps {
	account: AccountDTO | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function PlayerDatabaseDrawer({
	account,
	open,
	onOpenChange,
}: PlayerDatabaseDrawerProps) {
	// Keyed queries so switching accounts refetches cleanly.
	const statsQ = useQuery({
		queryKey: ["account-stats", account?.id],
		queryFn: () => fetchAccountStats(account!.id),
		enabled: !!account,
	});
	const gamesQ = useQuery<GameDTO[]>({
		queryKey: ["account-games", account?.id],
		queryFn: () => fetchGames({ accountId: account!.id }),
		enabled: !!account,
	});

	const games = gamesQ.data ?? [];
	const stats = statsQ.data;

	return (
		<Drawer
			direction="right"
			open={open}
			onOpenChange={onOpenChange}
			shouldScaleBackground={false}
		>
			<DrawerContent className="sm:max-w-xl">
				<DrawerHeader>
					<DrawerTitle className="flex items-center gap-2 text-lg">
						{account && <PlatformDot platform={account.platform} />}
						{account?.username ?? "—"}
						{account?.platform && (
							<Badge variant="secondary" className="capitalize">
								{account.platform === "chess.com" ? "Chess.com" : "Lichess"}
							</Badge>
						)}
					</DrawerTitle>
					<DrawerDescription>
						Player database · {games.length} synced game
						{games.length === 1 ? "" : "s"}
					</DrawerDescription>
				</DrawerHeader>

				<div className="flex-1 overflow-y-auto px-4 pb-6">
					<Tabs defaultValue="overview">
						<TabsList>
							<TabsTrigger value="overview">Overview</TabsTrigger>
							<TabsTrigger value="ratings">Ratings</TabsTrigger>
							<TabsTrigger value="openings">Openings</TabsTrigger>
						</TabsList>

						<TabsContent value="overview" className="mt-4 space-y-4">
							<OverviewTab stats={stats} account={account} />
						</TabsContent>

						<TabsContent value="ratings" className="mt-4">
							<RatingsTab stats={stats} />
						</TabsContent>

						<TabsContent value="openings" className="mt-4">
							<OpeningsTab games={games} username={account?.username} />
						</TabsContent>
					</Tabs>
				</div>
			</DrawerContent>
		</Drawer>
	);
}

// ---------------------------------------------------------------------------

function OverviewTab({
	stats,
	account,
}: {
	stats: AccountStatsDTO | undefined;
	account: AccountDTO | null;
}) {
	const w = stats?.results.wins ?? 0;
	const l = stats?.results.losses ?? 0;
	const d = stats?.results.draws ?? 0;
	const total = w + l + d;
	return (
		<div className="space-y-4">
			<div>
				<div className="mb-1 flex items-center justify-between text-xs text-muted-foreground/500">
					<span>Win / Draw / Loss</span>
					<span>{total} decided</span>
				</div>
				<ResultBar wins={w} draws={d} losses={l} />
				<div className="mt-2 grid grid-cols-3 gap-2 text-center">
					<Stat label="Wins" value={w} tone="text-emerald-600" />
					<Stat label="Draws" value={d} tone="text-muted-foreground/500" />
					<Stat label="Losses" value={l} tone="text-rose-600" />
				</div>
			</div>
			<InfoRow
				label="Games synced"
				value={String(stats?.gamesCount ?? account?.gamesCount ?? 0)}
			/>
			<InfoRow label="Last sync" value={formatDate(account?.lastSyncedAt)} />
			{stats?.ratingsError && (
				<p className="text-xs text-amber-600">
					Live ratings unavailable: {stats.ratingsError}
				</p>
			)}
		</div>
	);
}

function RatingsTab({ stats }: { stats: AccountStatsDTO | undefined }) {
	if (!stats) return <Skeleton label="Loading ratings…" />;
	if (stats.ratingsError && stats.ratings.length === 0) {
		return (
			<p className="text-sm text-amber-600">
				Could not load live ratings: {stats.ratingsError}
			</p>
		);
	}
	if (stats.ratings.length === 0) {
		return <p className="text-sm text-muted-foreground/500">No ratings available.</p>;
	}
	return (
		<table className="w-full text-sm">
			<thead>
				<tr className="text-left text-xs text-muted-foreground/500">
					<th className="py-1 font-medium">Time control</th>
					<th className="py-1 text-right font-medium">Rating</th>
					<th className="py-1 text-right font-medium">Games</th>
				</tr>
			</thead>
			<tbody>
				{stats.ratings
					.slice()
					.sort((a, b) => b.rating - a.rating)
					.map((r) => (
						<tr key={r.key} className="border-t border-border/50">
							<td className="capitalize py-1.5">{r.key}</td>
							<td className="py-1.5 text-right font-mono">{r.rating}</td>
							<td className="py-1.5 text-right font-mono text-muted-foreground/500">
								{r.games ?? "—"}
							</td>
						</tr>
					))}
			</tbody>
		</table>
	);
}

interface OpeningRow {
	key: string;
	eco: string;
	opening: string;
	wins: number;
	draws: number;
	losses: number;
}

function OpeningsTab({
	games,
	username,
}: {
	games: GameDTO[];
	username?: string;
}) {
	if (games.length === 0) {
		return <Skeleton label="No synced games yet — run a sync from the card." />;
	}
	const rows: Record<string, OpeningRow> = {};
	for (const g of games) {
		const h = pgnHeaders(g.pgn);
		const eco = h.ECO?.trim() || "?";
		const opening = h.Opening?.trim() || "Unknown";
		const key = `${eco} · ${opening}`;
		const row = (rows[key] ??= {
			key,
			eco,
			opening,
			wins: 0,
			draws: 0,
			losses: 0,
		});
		const side = userSide({ side: g.side }) === "white" ? "white" : "black";
		// Infer side from player name when the game didn't record it.
		let effSide: "white" | "black" = side;
		if (username) {
			if (g.white?.toLowerCase() === username.toLowerCase()) effSide = "white";
			else if (g.black?.toLowerCase() === username.toLowerCase())
				effSide = "black";
		}
		const r = resultLabel({ result: g.result, side: effSide });
		if (r.tone === "win") row.wins++;
		else if (r.tone === "draw") row.draws++;
		else if (r.tone === "loss") row.losses++;
	}
	const sorted = Object.values(rows).sort(
		(a, b) => b.wins + b.draws + b.losses - (a.wins + a.draws + a.losses),
	);
	return (
		<div className="space-y-2">
			{sorted.map((row) => {
				const total = row.wins + row.draws + row.losses;
				return (
					<div key={row.key} className="rounded-md border border-border p-2.5">
						<div className="flex items-baseline justify-between gap-2">
							<span className="truncate text-sm font-medium">{row.opening}</span>
							<span className="shrink-0 font-mono text-xs text-muted-foreground">
								{row.eco}
							</span>
						</div>
						<div className="mt-1.5">
							<ResultBar
								wins={row.wins}
								draws={row.draws}
								losses={row.losses}
								height="h-1.5"
							/>
						</div>
						<div className="mt-1 flex gap-3 font-mono text-[11px] text-muted-foreground/500">
							<span className="text-emerald-600">{row.wins}W</span>
							<span>{row.draws}D</span>
							<span className="text-rose-600">{row.losses}L</span>
							<span className="ml-auto">{total}</span>
						</div>
					</div>
				);
			})}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Small view helpers
// ---------------------------------------------------------------------------

function ResultBar({
	wins,
	draws,
	losses,
	height = "h-2",
}: {
	wins: number;
	draws: number;
	losses: number;
	height?: string;
}) {
	const total = Math.max(1, wins + draws + losses);
	return (
		<div className={`flex w-full overflow-hidden rounded-full bg-muted ${height}`}>
			<div
				className="bg-emerald-500"
				style={{ width: `${(wins / total) * 100}%` }}
			/>
			<div
				className="bg-muted"
				style={{ width: `${(draws / total) * 100}%` }}
			/>
			<div
				className="bg-rose-500"
				style={{ width: `${(losses / total) * 100}%` }}
			/>
		</div>
	);
}

function Stat({
	label,
	value,
	tone,
}: {
	label: string;
	value: number;
	tone?: string;
}) {
	return (
		<div className="rounded-md border border-border py-2">
			<div className={`text-lg font-semibold ${tone ?? ""}`}>{value}</div>
			<div className="text-xs text-muted-foreground/500">{label}</div>
		</div>
	);
}

function InfoRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between border-t border-border/50 py-2 text-sm">
			<span className="text-muted-foreground/500">{label}</span>
			<span className="font-medium">{value}</span>
		</div>
	);
}

function Skeleton({ label }: { label: string }) {
	return (
		<div className="flex items-center gap-2 py-6 text-sm text-muted-foreground/500">
			<RefreshCw className="size-4 animate-spin" />
			{label}
		</div>
	);
}

function PlatformDot({ platform }: { platform: AccountDTO["platform"] }) {
	const cls = platform === "chess.com" ? "bg-emerald-500" : "bg-foreground";
	return <span className={`inline-block size-2.5 rounded-full ${cls}`} />;
}

function formatDate(iso: string | null | undefined): string {
	if (!iso) return "Never";
	try {
		return new Date(iso).toLocaleString(undefined, {
			dateStyle: "medium",
			timeStyle: "short",
		});
	} catch {
		return iso;
	}
}
