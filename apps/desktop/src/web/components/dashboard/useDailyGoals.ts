/**
 * useDailyGoals (D3-001/002) — client-side "games played today" counter for the
 * DailyGoalsCard.
 *
 * Storage shape in `localStorage["chess-coach.dailyGoals"]`:
 *   { date: "YYYY-MM-DD", gamesPlayed: number, lastSeenCount: number }
 *
 * The counter is derived from the games query length (passed in as
 * `gamesCount`). When `gamesCount` grows above `lastSeenCount`, the day's
 * `gamesPlayed` is bumped by the delta; `lastSeenCount` tracks the latest seen
 * total so the delta is correct across reloads. The date rolls over at local
 * midnight.
 *
 * No DB table / API route is used (D3-004 / D3-005 are deferred with Training).
 * Puzzles are tracked as a placeholder constant of 0 — when the puzzle DB
 * lands we'll extend this hook to read its own counter.
 */
import { useEffect, useState } from "react";

const STORAGE_KEY = "chess-coach.dailyGoals";
const GAMES_TARGET = 5;
const PUZZLES_TARGET = 10;

export interface DailyGoals {
	/** Local YYYY-MM-DD the counters apply to. */
	date: string;
	gamesPlayed: number;
	puzzlesPlayed: number;
}

interface StoredGoals {
	date: string;
	gamesPlayed: number;
	puzzlesPlayed: number;
	/** Last observed `games` array length, used to compute deltas. */
	lastSeenCount: number;
}

function todayStr(): string {
	return new Date().toISOString().slice(0, 10);
}

function readStored(): StoredGoals | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as StoredGoals;
		if (
			typeof parsed.date !== "string" ||
			typeof parsed.gamesPlayed !== "number"
		) {
			return null;
		}
		return parsed;
	} catch {
		return null;
	}
}

function writeStored(s: StoredGoals): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
	} catch {
		// Storage unavailable (private mode, etc.) — degrade to in-memory only.
	}
}

/**
 * @param gamesCount total number of games the user has stored (e.g. the
 *   `data.length` of the `useQuery(["games"])` result). Used to detect new
 *   games played/imported today.
 */
export function useDailyGoals(gamesCount: number): {
	goals: DailyGoals;
	gamesTarget: number;
	puzzlesTarget: number;
} {
	const [goals, setGoals] = useState<DailyGoals>(() => {
		const stored = readStored();
		const today = todayStr();
		if (!stored || stored.date !== today) {
			return { date: today, gamesPlayed: 0, puzzlesPlayed: 0 };
		}
		return {
			date: stored.date,
			gamesPlayed: stored.gamesPlayed,
			puzzlesPlayed: stored.puzzlesPlayed ?? 0,
		};
	});

	// Track new games as they appear.
	useEffect(() => {
		const stored = readStored();
		const today = todayStr();
		const playedToday = stored?.date === today ? (stored?.gamesPlayed ?? 0) : 0;

		// On the first effect run with no stored baseline, seed lastSeenCount to
		// the current count so we don't credit pre-existing games as "played
		// today".
		const baseline =
			stored?.date === today && typeof stored?.lastSeenCount === "number"
				? stored.lastSeenCount
				: gamesCount;

		const delta = Math.max(0, gamesCount - baseline);
		const next =
			stored?.date === today
				? { date: today, gamesPlayed: playedToday + delta, puzzlesPlayed: 0 }
				: { date: today, gamesPlayed: delta, puzzlesPlayed: 0 };

		// Only write if something changed (avoids an infinite loop).
		if (
			stored?.date !== today ||
			stored.lastSeenCount !== gamesCount ||
			stored.gamesPlayed !== next.gamesPlayed
		) {
			writeStored({
				date: today,
				gamesPlayed: next.gamesPlayed,
				puzzlesPlayed: 0,
				lastSeenCount: gamesCount,
			});
			setGoals(next);
		}
	}, [gamesCount]);

	return {
		goals,
		gamesTarget: GAMES_TARGET,
		puzzlesTarget: PUZZLES_TARGET,
	};
}
