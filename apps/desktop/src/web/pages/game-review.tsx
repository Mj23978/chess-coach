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
import { Download, Copy, Camera } from "lucide-react";
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
import {
	exportPgnWithAnnotations,
	copyFenToClipboard,
	downloadText,
	generatePgnFilename,
} from "../lib/export";
import { BoardErrorBoundary, toast, TOAST_MESSAGES } from "../components/ui";
import { AnalysisPanel } from "../components/board/AnalysisPanel";
import { PageContainer, PageHeader } from "../components/layout";
import { useSettings } from "../lib/settings-context";

/** Square pair for `lastMove`, derived from the UCI string ("e2e4" → ["e2","e4"]). */
function uciLastMove(uci: string): [string, string] | null {
	if (uci.length < 4) return null;
	return [uci.slice(0, 2), uci.slice(2, 4)];
}

export default function GameReviewPage() {
	const { id } = useParams<{ id: string }>();
	const qc = useQueryClient();
	const { settings } = useSettings();

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
		mutationFn: () =>
			analyzeGame(id!, { depth: settings.analysisDepth }),
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
		return <div className="p-8 text-muted-foreground">Loading game…</div>;
	}
	if (error || !game) {
		return (
			<div className="flex flex-col items-center justify-center p-12 text-center">
				<div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-muted">
					<span className="text-2xl">♚</span>
				</div>
				<h2 className="text-lg font-semibold">Game not found</h2>
				<p className="mt-1 max-w-sm text-sm text-muted-foreground">
					{error
						? `Could not load this game: ${String(error)}`
						: "This game may have been deleted or the link is invalid."}
				</p>
				<Link
					to="/"
					className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
				>
					← Back to Dashboard
				</Link>
			</div>
		);
	}

	if (positions.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center p-12 text-center">
				<div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-muted">
					<span className="text-2xl">⚠️</span>
				</div>
				<h2 className="text-lg font-semibold">Could not parse this game</h2>
				<p className="mt-1 max-w-sm text-sm text-muted-foreground">
					The PGN data for this game appears to be malformed. Try re-importing the
					game from the original source.
				</p>
				<Link
					to="/"
					className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
				>
					← Back to Dashboard
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
		<PageContainer variant="wide" className="py-6">
			<PageHeader
				title={game.title ?? `${game.white ?? "?"} vs ${game.black ?? "?"}`}
				subtitle={`${game.result ?? "*"} · ${positions.length} moves`}
				backTo="/"
				backLabel="Dashboard"
				actions={
					<>
						{analyzeMut.isError && (
							<span className="text-xs text-destructive">
								{analyzeMut.error instanceof Error
									? analyzeMut.error.message
									: "Analysis failed"}
							</span>
						)}

						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								const fen = displayFen;
								copyFenToClipboard(fen).then((ok) => {
									if (ok) toast.success(TOAST_MESSAGES.FEN_COPIED);
									else toast.error("Failed to copy FEN");
								});
							}}
						>
							<Copy className="mr-1.5 size-3.5" />
							FEN
						</Button>

						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								const pgn = exportPgnWithAnnotations({
									pgn: game!.pgn,
									analysis,
									includeEval: true,
									includeClassification: true,
								});
								downloadText(pgn, generatePgnFilename(game!), "text/x-chess-pgn");
								toast.success(TOAST_MESSAGES.PGN_EXPORTED);
							}}
						>
							<Download className="mr-1.5 size-3.5" />
							PGN
						</Button>

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
					</>
				}
			/>

			{!hasAnalysis && !analyzeMut.isPending && (
				<p className="mb-3 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
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
						<BoardErrorBoundary>
							<Chessboard
								fen={displayFen}
								orientation={game.side ?? "white"}
								lastMove={lastMove as [Key, Key] | null}
								boardStyle={settings.boardStyle}
								showCoords={settings.showCoords}
								highlightLastMove={settings.highlightLastMove}
							/>
						</BoardErrorBoundary>
					</div>
				</div>

				{/* Move list + controls */}
				<div className="flex min-w-[280px] flex-1 flex-col rounded-lg border border-border">
					<div className="flex items-center justify-between border-b border-border px-3 py-2">
						<span className="text-xs font-medium text-muted-foreground">
							Moves{" "}
							{hasAnalysis && (
								<span className="text-muted-foreground">· classified</span>
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
						<div className="flex flex-wrap gap-2 border-t border-border px-3 py-2">
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

			{/* Analysis Panel */}
			<AnalysisPanel
				pgn={game.pgn}
				fen={displayFen}
				ply={ply}
				analysis={analysis}
				totalPlies={positions.length}
				onNavigate={(p) => setPly(p)}
				className="hidden lg:flex"
			/>
		</PageContainer>
	);
}

/** Vertical white-relative eval bar (white at the bottom). */
function EvalBar({ whiteWin }: { whiteWin: number | null }) {
	// whiteWin is 0..100 (white win %). null → unknown (split bar).
	const pct = whiteWin ?? 50;
	return (
		<div className="relative w-6 self-stretch overflow-hidden rounded-sm bg-foreground">
			{/* White portion grows from the bottom. */}
			<div
				className="absolute inset-x-0 bottom-0 bg-background transition-[height] duration-200"
				style={{ height: `${pct}%` }}
			/>
			{/* Center line */}
			<div className="absolute inset-x-0 top-1/2 h-px bg-border/50" />
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
					<tr key={row.num} className="odd:bg-muted/50">
						<td className="w-8 py-1 pl-2 pr-1 text-right text-xs text-muted-foreground">
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
					active ? "bg-chess-cream text-chess-brown" : "hover:bg-muted"
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
					<span className="ml-auto text-[10px] text-muted-foreground">{ev}</span>
				)}
			</button>
		</td>
	);
}
