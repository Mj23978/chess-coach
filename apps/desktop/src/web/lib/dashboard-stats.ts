/**
 * Pure helpers that derive per-game display stats for the dashboard's
 * GamesTable.
 *
 * The `games` table stores raw PGN + an optional `analysis[]` JSON column
 * (see `packages/db/schema/games.ts`). The dashboard needs derived numbers —
 * move count, accuracy %, ACPL — that aren't worth a DB column but are needed
 * per-row. These helpers keep that derivation out of the component so the
 * table stays a pure view, and so the math is easy to audit.
 *
 * Conventions:
 *  - `evalCp` in `MoveAnalysis` is WHITE-relative (+ = good for white), per
 *    `packages/db/schema/games.ts`. We convert to the user's perspective using
 *    `side` when computing accuracy/ACPL.
 *  - All helpers are total: they return `null` (or a sensible fallback) when
 *    the data isn't available, rather than throwing, so a partially-analyzed
 *    or unparsed game still renders.
 */
import type { GameDTO, MoveAnalysisDTO } from "./api";
import { travelGame } from "./chess";

/** "White" / "Black" / "?" — display name for the opponent of `side`. */
export function opponentName(
	game: Pick<GameDTO, "white" | "black" | "side">,
): string {
	const side = game.side ?? "white";
	const name = side === "white" ? game.black : game.white;
	return name?.trim() || side === "white" ? "Black" : "White";
}

/** The side the user played, defaulting to "white" when the game doesn't say. */
export function userSide(game: Pick<GameDTO, "side">): "white" | "black" {
	return game.side ?? "white";
}

/**
 * Number of plies in the game (1 ply = one half-move). Returns `null` if the
 * PGN can't be parsed. Used for the "Moves" column (shown as `Math.ceil(n/2)`
 * full moves, e.g. 40 plies → "20").
 */
export function plyCount(game: Pick<GameDTO, "pgn">): number | null {
	try {
		return travelGame(game.pgn).length;
	} catch {
		return null;
	}
}

/**
 * Average accuracy (%) for the user's side, derived from the `analysis[]`
 * column. Mirrors the lila/chess.com definition: each ply's accuracy is
 * derived from the white-win% drop across that move (100 = best, 0 = worst),
 * then averaged over the user's plies.
 *
 * Returns `null` when there's no analysis or no user-side plies to average.
 *
 * Implementation note: we only have `evalCp`/`mate` per ply (the eval AFTER
 * the move), so we approximate the win%-drop using consecutive evals. This is
 * the same family of formula used by the classifier; if the DB later stores a
 * precomputed accuracy per ply, swap the body here without touching callers.
 */
export function userAccuracy(
	game: Pick<GameDTO, "analysis" | "side">,
): number | null {
	const analysis = game.analysis;
	if (!analysis || analysis.length === 0) return null;
	const side = game.side ?? "white";

	// win% AFTER each ply (white-relative). null/undefined when the eval is
	// missing (noUncheckedIndexedAccess makes indexed access possibly undefined).
	const winPctAfter: (number | null)[] = analysis.map((m) => whiteWinPct(m));
	// Baseline: the start position is even (50%). For ply 0 we use that; for
	// later plies we use the previous ply's win%.
	let total = 0;
	let count = 0;
	let prev = 50; // start position
	for (let i = 0; i < winPctAfter.length; i++) {
		const plySide = i % 2 === 0 ? "white" : "black";
		const after = winPctAfter[i] ?? null;
		if (after === null) {
			// Missing eval — carry the previous baseline forward.
			continue;
		}
		if (plySide === side) {
			// Accuracy from the mover's perspective: convert win% to the mover's
			// frame, then the drop in win% from the best play baseline.
			const moverBefore = side === "white" ? prev : 100 - prev;
			const moverAfter = side === "white" ? after : 100 - after;
			const drop = Math.max(0, moverBefore - moverAfter);
			// lila accuracy formula: 103.1668 * exp(-0.04354 * drop) - 3.1669,
			// clamped to [0, 100].
			const acc = clamp(103.1668 * Math.exp(-0.04354 * drop) - 3.1669, 0, 100);
			total += acc;
			count++;
		}
		prev = after;
	}
	if (count === 0) return null;
	return Math.round(total / count);
}

/**
 * Average Centipawn Loss for the user's side: the mean of |cp loss| over the
 * user's plies, where "loss" is how many centipawns the move gave up relative
 * to the previous eval (negative swings count). Returns `null` when there's no
 * analysis. Reported in pawns (cp / 100) rounded to 1 decimal.
 */
export function userAcpl(
	game: Pick<GameDTO, "analysis" | "side">,
): number | null {
	const analysis = game.analysis;
	if (!analysis || analysis.length === 0) return null;
	const side = game.side ?? "white";

	let total = 0;
	let count = 0;
	let prevCp = 0; // start position ~ even
	for (let i = 0; i < analysis.length; i++) {
		const plySide = i % 2 === 0 ? "white" : "black";
		const m = analysis[i];
		// Skip plies where eval is unknown (mate or undefined).
		if (!m || m.evalCp === undefined) {
			continue;
		}
		if (plySide === side) {
			// Cp from the mover's perspective before/after this move.
			const moverBefore = side === "white" ? prevCp : -prevCp;
			const moverAfter = side === "white" ? m.evalCp : -m.evalCp;
			const loss = Math.max(0, moverBefore - moverAfter);
			total += loss;
			count++;
		}
		prevCp = m.evalCp;
	}
	if (count === 0) return null;
	return Math.round((total / count / 100) * 10) / 10;
}

/** True when the game has any engine analysis attached. */
export function isAnalyzed(game: Pick<GameDTO, "analysis">): boolean {
	return (game.analysis?.length ?? 0) > 0;
}

/**
 * Win/draw/loss chip text for the user's side, derived from the PGN `result`.
 * "1-0" → "Won"/"Lost" depending on side, etc. "*" → "—" (unknown).
 */
export function resultLabel(game: Pick<GameDTO, "result" | "side">): {
	text: string;
	tone: "win" | "loss" | "draw" | "unknown";
} {
	const side = game.side ?? "white";
	switch (game.result) {
		case "1-0":
			return side === "white"
				? { text: "Won", tone: "win" }
				: { text: "Lost", tone: "loss" };
		case "0-1":
			return side === "black"
				? { text: "Won", tone: "win" }
				: { text: "Lost", tone: "loss" };
		case "1/2-1/2":
			return { text: "Draw", tone: "draw" };
		default:
			return { text: "—", tone: "unknown" };
	}
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** White-relative win% (0..100) from a single move's eval, or null if unknown. */
function whiteWinPct(m: MoveAnalysisDTO): number | null {
	if (m.mate !== undefined) {
		return m.mate > 0 ? 100 : m.mate < 0 ? 0 : 50;
	}
	if (m.evalCp === undefined) return null;
	const cp = clamp(m.evalCp, -1000, 1000);
	return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
}

function clamp(n: number, lo: number, hi: number): number {
	return Math.max(lo, Math.min(hi, n));
}
