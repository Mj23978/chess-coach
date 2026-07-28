/**
 * Dashboard — `/`.
 *
 * The landing page, redesigned in PLAN-002. Composes a stack of cards in the
 * pawn-appetite style:
 *
 *   ┌──────────────────────── WelcomeCard ────────────────────────┐
 *   ├──── ConnectedAccountsCard ─────┬──── TimeControlGrid ────────┤
 *   ├────────────────────── GamesTable ───────────────────────────┤
 *   ├──── TrainingSuggestionsCard ───┬──── DailyGoalsCard ────────┤
 *   └─────────────────────────────────────────────────────────────┘
 *
 * Data flow:
 *  - `useQuery(["games"])` is the single source of truth for the games list.
 *    It feeds both GamesTable (full rows) and DailyGoalsCard (count-based
 *    "played today" counter).
 *  - Import PGN is triggered via the app-level modal (owned by App.tsx) —
 *    `onImportPgn` opens it; the query is invalidated from App on success.
 *
 * Until PLAN-003 (play) and PLAN-004 (account sync) land, several surfaces are
 * intentionally lightweight: time-control cards navigate to `/board` (a
 * placeholder) with the chosen time control as router state, and the
 * Chess.com/Lichess tabs show empty states pointing at the Accounts page.
 */
import { useQuery } from "@tanstack/react-query";
import {
	ConnectedAccountsCard,
	DailyGoalsCard,
	GamesTable,
	TimeControlGrid,
	TrainingSuggestionsCard,
	WelcomeCard,
} from "../components/dashboard";
import { fetchGames, type GameDTO } from "../lib/api";

interface DashboardPageProps {
	/** Open the app-level Import PGN modal. */
	onImportPgn?: () => void;
}

export default function DashboardPage({ onImportPgn }: DashboardPageProps) {
	const { data, isLoading, error } = useQuery<GameDTO[]>({
		queryKey: ["games"],
		queryFn: fetchGames,
	});

	const gamesCount = data?.length ?? 0;

	return (
		<PageContainer className="space-y-4">
			<WelcomeCard onImportPgn={() => onImportPgn?.()} />

			<div className="grid gap-4 md:grid-cols-3">
				<ConnectedAccountsCard />
				<div className="md:col-span-2">
					<TimeControlGrid />
				</div>
			</div>

			<GamesTable games={data ?? []} isLoading={isLoading} error={error} />

			<div className="grid gap-4 md:grid-cols-3">
				<div className="md:col-span-2">
					<TrainingSuggestionsCard />
				</div>
				<DailyGoalsCard gamesCount={gamesCount} />
			</div>
		</PageContainer>
	);
}
