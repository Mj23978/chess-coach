/**
 * GameReviewPage — `/games/:id`.
 *
 * The headline view: a board that walks through a stored game, with a move
 * list annotated by the classifier (chess.com-style Brilliant/…/Blunder
 * badges), a white-relative eval bar, and prev/next + keyboard navigation.
 *
 * Data flow:
 *  - `fetchGame(id)` loads the game (PGN + optional analysis).
 *  - `travelGame(pgn)` produces the ordered positions; ply `i` corresponds to
 *    `analysis[i]` (same index — both are 0-based move arrays of length N).
 *  - The board shows the FEN BEFORE the current ply (so the viewer sees the
 *    position the player faced), with `lastMove` = the ply's from/to.
 *  - The eval bar reads the eval AFTER the move (i.e. `analysis[ply]`); for
 *    ply 0 (start position) there is no move yet, so the bar shows 50/50.
 *
 * "Analyze" triggers `analyzeGame`; on success the query refetches and badges
 * appear. 503 (no Stockfish binary) surfaces a hint.
 */
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Key } from "@lichess-org/chessground/types";
import { Button } from "@repo/ui/components/button";
import { Chessboard } from "../components/Chessboard";
import { fetchGame, analyzeGame, type MoveAnalysisDTO } from "../lib/api";
import { travelGame } from "../lib/chess";
import {
	classificationStyle,
	whiteWinPercent,
	formatEval,
	CLASSIFICATION_STYLES,
	type Classification,
} from "../lib/classification";

/** Square pair for `lastMove`, derived from the UCI string ("e2e4" → ["e2","e4"]). */
function uciLastMove(uci: string): [string, string] | null {
	if (uci.length < 4) return null;
	return [uci.slice(0, 2), uci.slice(2, 4)];
}

export default function GameReviewPage() {
	const { id } = useParams<{ id: string }>();
	const qc = useQueryClient();

	const {
		data: game,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["game", id],
		queryFn: () => fetchGame(id!),
		enabled: !!id,
	});

	const analyzeMut = useMutation({
		mutationFn: () => analyzeGame(id!),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["game", id] }),
	});

	// Walk the PGN into ordered positions. Memoized on the PGN string.
	const positions = useMemo(() => {
		if (!game) return [];
		try {
			return travelGame(game.pgn);
		} catch {
			return [];
		}
	}, [game]);

	// Current ply index (0 = start position before white's 1st move).
	const [ply, setPly] = useState(0);
	// Reset to start when a new game loads.
	useEffect(() => {
		setPly(0);
	}, [id]);

	// Keyboard navigation: ←/→ step, Home/End jump.
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === "ArrowLeft") setPly((p) => Math.max(0, p - 1));
			else if (e.key === "ArrowRight")
				setPly((p) => Math.min(positions.length, p + 1));
			else if (e.key === "Home") setPly(0);
			else if (e.key === "End") setPly(positions.length);
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [positions.length]);

	if (isLoading) {
		return <div className="p-8 text-neutral-500">Loading game…</div>;
	}
	if (error || !game) {
		return (
			<div className="p-8">
				<p className="text-red-600">
					Failed to load game: {error ? String(error) : "not found"}
				</p>
				<Link to="/" className="mt-3 inline-block text-sm text-blue-600">
					Back to dashboard
				</Link>
			</div>
		);
	}

	if (positions.length === 0) {
		return (
			<div className="p-8">
				<p className="text-red-600">This game's PGN could not be parsed.</p>
				<Link to="/" className="mt-3 inline-block text-sm text-blue-600">
					Back to dashboard
				</Link>
			</div>
		);
	}

	// The position to display: before the current ply, or the start position
	// when ply === 0. `travelGame` stores `fen` = the FEN BEFORE the move.
	const startPos = positions[0]!.fen; // initial position (before move 1)
	const displayFen = ply === 0 ? startPos : positions[ply - 1]!.fen;
	const lastMove = ply > 0 ? uciLastMove(positions[ply - 1]!.uci) : null;

	// Eval for the bar: the eval AFTER the move just played. When viewing the
	// start position (ply 0) there's no "after" yet — show even.
	const analysis = (game.analysis ?? []) as MoveAnalysisDTO[];
	const evalAfter: MoveAnalysisDTO | undefined =
		ply > 0 ? analysis[ply - 1] : undefined;
	const winPct = whiteWinPercent(evalAfter ?? {});

	const hasAnalysis = analysis.length > 0;

	return (
		<div className="mx-auto max-w-6xl p-6">
			<header className="mb-4 flex items-center justify-between">
				<div>
					<h1 className="text-xl font-bold">
						{game.title ?? `${game.white ?? "?"} vs ${game.black ?? "?"}`}
					</h1>
					<p className="text-xs text-neutral-500">
						{game.result ?? "*"} · {positions.length} plies
					</p>
				</div>
				<div className="flex items-center gap-2">
					{analyzeMut.isError && (
						<span className="text-xs text-red-600">
							{analyzeMut.error instanceof Error
								? analyzeMut.error.message
								: "Analysis failed"}
						</span>
					)}
					<Button
						onClick={() => analyzeMut.mutate()}
						disabled={analyzeMut.isPending}
					>
						{analyzeMut.isPending
							? "Analyzing…"
							: hasAnalysis
								? "Re-analyze"
								: "Analyze"}
					</Button>
				</div>
			</header>

			{!hasAnalysis && !analyzeMut.isPending && (
				<p className="mb-3 rounded-md bg-neutral-100 px-3 py-2 text-xs text-neutral-600">
					No analysis yet — click <strong>Analyze</strong> to run the engine and
					classify each move. Requires a Stockfish binary staged under{" "}
					<code>binaries/</code>.
				</p>
			)}

			<div className="flex gap-6">
				{/* Board + eval bar */}
				<div className="flex items-stretch gap-2">
					<EvalBar whiteWin={winPct} />
					<div className="w-[480px] max-w-full">
						<Chessboard
							fen={displayFen}
							orientation={game.side ?? "white"}
							lastMove={lastMove as [Key, Key] | null}
						/>
					</div>
				</div>

				{/* Move list + controls */}
				<div className="flex min-w-[280px] flex-1 flex-col rounded-lg border border-neutral-200">
					<div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2">
						<span className="text-xs font-medium text-neutral-500">
							Moves{" "}
							{hasAnalysis && (
								<span className="text-neutral-400">· classified</span>
							)}
						</span>
						<div className="flex gap-1">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPly(0)}
								disabled={ply === 0}
							>
								⏮
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPly((p) => Math.max(0, p - 1))}
								disabled={ply === 0}
							>
								←
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPly((p) => Math.min(positions.length, p + 1))}
								disabled={ply >= positions.length}
							>
								→
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPly(positions.length)}
								disabled={ply >= positions.length}
							>
								⏭
							</Button>
						</div>
					</div>

					<div className="flex-1 overflow-y-auto p-2">
						<MoveList
							positions={positions}
							analysis={analysis}
							currentPly={ply}
							onSelect={(p) => setPly(p)}
						/>
					</div>

					{/* Legend */}
					{hasAnalysis && (
						<div className="flex flex-wrap gap-2 border-t border-neutral-200 px-3 py-2">
							{(Object.keys(CLASSIFICATION_STYLES) as Classification[]).map(
								(c) => {
									const s = CLASSIFICATION_STYLES[c];
									return (
										<span
											key={c}
											className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${s.bg} ${s.text}`}
											title={s.label}
										>
											{s.glyph}
										</span>
									);
								},
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

/** Vertical white-relative eval bar (white at the bottom). */
function EvalBar({ whiteWin }: { whiteWin: number | null }) {
	// whiteWin is 0..100 (white win %). null → unknown (split bar).
	const pct = whiteWin ?? 50;
	return (
		<div className="relative w-4 self-stretch overflow-hidden rounded-sm bg-neutral-900">
			{/* White portion grows from the bottom. */}
			<div
				className="absolute inset-x-0 bottom-0 bg-white transition-[height] duration-200"
				style={{ height: `${pct}%` }}
			/>
		</div>
	);
}

/** Two-column move list (white | black) with classification badges. */
function MoveList({
	positions,
	analysis,
	currentPly,
	onSelect,
}: {
	positions: ReturnType<typeof travelGame>;
	analysis: MoveAnalysisDTO[];
	currentPly: number;
	onSelect: (ply: number) => void;
}) {
	// Group plies into move-number rows: 1. e4 e5 / 2. Nf3 ...
	const rows: {
		num: number;
		white?: {
			ply: number;
			pos: (typeof positions)[number];
			a?: MoveAnalysisDTO;
		};
		black?: {
			ply: number;
			pos: (typeof positions)[number];
			a?: MoveAnalysisDTO;
		};
	}[] = [];
	for (let i = 0; i < positions.length; i++) {
		const pos = positions[i]!;
		const moveNo = Math.floor(i / 2) + 1;
		if (i % 2 === 0) {
			rows.push({
				num: moveNo,
				white: { ply: i + 1, pos, a: analysis[i] },
			});
		} else {
			const row = rows[rows.length - 1]!;
			row.black = { ply: i + 1, pos, a: analysis[i] };
		}
	}

	return (
		<table className="w-full border-collapse text-sm">
			<tbody>
				{rows.map((row) => (
					<tr key={row.num} className="odd:bg-neutral-50">
						<td className="w-8 py-1 pl-2 pr-1 text-right text-xs text-neutral-400">
							{row.num}.
						</td>
						<PlyCell
							entry={row.white}
							currentPly={currentPly}
							onSelect={onSelect}
						/>
						<PlyCell
							entry={row.black}
							currentPly={currentPly}
							onSelect={onSelect}
						/>
					</tr>
				))}
			</tbody>
		</table>
	);
}

function PlyCell({
	entry,
	currentPly,
	onSelect,
}: {
	entry?: { ply: number; pos: { san: string }; a?: MoveAnalysisDTO };
	currentPly: number;
	onSelect: (ply: number) => void;
}) {
	if (!entry) return <td />;
	const active = currentPly === entry.ply;
	const style = classificationStyle(entry.a?.classification);
	const ev = formatEval(entry.a ?? {});
	return (
		<td className="py-1 pr-1">
			<button
				type="button"
				onClick={() => onSelect(entry.ply)}
				className={`flex w-full items-center gap-1.5 rounded px-1.5 py-0.5 text-left font-mono text-[13px] ${
					active ? "bg-blue-100 text-blue-900" : "hover:bg-neutral-100"
				}`}
			>
				{style && (
					<span
						className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${style.bg} ${style.text}`}
						title={style.label}
					>
						{style.glyph}
					</span>
				)}
				<span>{entry.pos.san}</span>
				{ev && (
					<span className="ml-auto text-[10px] text-neutral-400">{ev}</span>
				)}
			</button>
		</td>
	);
}
