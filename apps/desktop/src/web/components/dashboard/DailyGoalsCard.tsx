/**
 * DailyGoalsCard (D3-001/002/003) — two progress bars:
 *  - Games played today (D3-002): live counter via `useDailyGoals`.
 *  - Puzzles solved today (D3-003): placeholder, always 0. Puzzles arrive with
 *    the Training phase; the card notes this inline.
 *
 * Streak badge (in the pawn-appetite reference) is omitted until the puzzle
 * streak data exists.
 */
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { Trophy } from "lucide-react";
import { useDailyGoals } from "./useDailyGoals";

interface DailyGoalsCardProps {
	/** Total stored games count — drives the games-played-today delta. */
	gamesCount: number;
}

export function DailyGoalsCard({ gamesCount }: DailyGoalsCardProps) {
	const { goals, gamesTarget, puzzlesTarget } = useDailyGoals(gamesCount);

	return (
		<Card className="h-full">
			<CardHeader className="flex flex-row items-center justify-between space-y-0">
				<CardTitle className="text-base">Daily Goals</CardTitle>
				<Trophy className="size-4 text-amber-500" />
			</CardHeader>
			<CardContent className="space-y-4">
				<GoalBar
					label="Games played"
					current={goals.gamesPlayed}
					target={gamesTarget}
					color="#10b981"
				/>
				<GoalBar
					label="Puzzles solved"
					current={goals.puzzlesPlayed}
					target={puzzlesTarget}
					color="#0ea5e9"
					note="Puzzles arrive with Training."
				/>
			</CardContent>
		</Card>
	);
}

function GoalBar({
	label,
	current,
	target,
	/** Inline color for the filled portion (avoids Tailwind dynamic-class pitfalls). */
	color,
	note,
}: {
	label: string;
	current: number;
	target: number;
	color: string;
	note?: string;
}) {
	const pct =
		target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
	const done = current >= target && target > 0;
	return (
		<div>
			<div className="mb-1 flex items-baseline justify-between">
				<span className="text-sm font-medium">{label}</span>
				<span
					className={`text-xs ${done ? "text-emerald-600" : "text-neutral-500"}`}
				>
					{current}/{target}
				</span>
			</div>
			<div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
				<div
					className="h-full rounded-full transition-[width] duration-300"
					style={{ width: `${pct}%`, backgroundColor: color }}
				/>
			</div>
			{note && <p className="mt-1 text-xs text-neutral-400">{note}</p>}
		</div>
	);
}
