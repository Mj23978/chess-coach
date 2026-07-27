/**
 * Clipboard / download / PGN-annotation helpers for the game-review flow.
 *
 * These are pure-ish browser utilities kept out of `lib/api.ts` so the API
 * client stays a thin fetch wrapper. Used by `pages/game-review.tsx` and the
 * title-bar menus.
 *
 *  - `copyFenToClipboard(fen)` — best-effort clipboard write; resolves false
 *    on environments where the clipboard API is unavailable (so the caller
 *    can surface a toast instead of silently failing).
 *  - `downloadText(text, filename, mime)` — programmatic Blob download.
 *  - `generatePgnFilename(game)` — safe, readable filename for the export
 *    (`White_vs_Black_2024-01-01.pgn`).
 *  - `exportPgnWithAnnotations({ pgn, analysis, … })` — re-emit a PGN with
 *    `[%eval …]` and classification clock glyphs (`!!`, `??`, …) interleaved
 *    after each move, mirroring the lila/chess.com annotation convention so
 *    the exported file round-trips into other viewers.
 */
import type { MoveAnalysisDTO, GameDTO } from "./api";
import {
	CLASSIFICATION_STYLES,
	type Classification,
} from "./classification";

/** Copy a FEN string to the clipboard. Resolves false if unavailable. */
export async function copyFenToClipboard(fen: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(fen);
		return true;
	} catch {
		// Fallback for non-secure contexts (Electrobun webview may block
		// navigator.clipboard depending on origin).
		try {
			const ta = document.createElement("textarea");
			ta.value = fen;
			ta.style.position = "fixed";
			ta.style.opacity = "0";
			document.body.appendChild(ta);
			ta.select();
			const ok = document.execCommand("copy");
			document.body.removeChild(ta);
			return ok;
		} catch {
			return false;
		}
	}
}

/** Trigger a browser download of a text payload. */
export function downloadText(
	text: string,
	filename: string,
	mime = "text/plain;charset=utf-8",
): void {
	const blob = new Blob([text], { type: mime });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	// Give the webview a tick to start the download before revoking.
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Build a safe, human-readable `.pgn` filename for a game. */
export function generatePgnFilename(game: Pick<GameDTO, "white" | "black" | "createdAt">): string {
	const safe = (s: string | null | undefined) =>
		(s ?? "Unknown").replace(/[^\w.-]+/g, "_").slice(0, 40) || "Unknown";
	const date = new Date(game.createdAt).toISOString().slice(0, 10);
	return `${safe(game.white)}_vs_${safe(game.black)}_${date}.pgn`;
}

/**
 * Re-emit a PGN with per-move annotations interleaved.
 *
 * Strategy: walk the movetext of the input PGN, and after each move insert
 * the matching classification glyph + `[%eval …]` comment (wrapped in braces
 * so it survives round-trips). The `analysis[i]` entry corresponds to the
 * `i`-th move (0-based), matching the convention used by `travelGame()` and
 * the server-side classifier.
 *
 * The header section (everything before the first move) is passed through
 * unchanged. If the PGN has no parseable movetext, the original is returned.
 */
export function exportPgnWithAnnotations({
	pgn,
	analysis,
	includeEval = true,
	includeClassification = true,
}: {
	pgn: string;
	analysis: MoveAnalysisDTO[];
	includeEval?: boolean;
	includeClassification?: boolean;
}): string {
	// Split off the headers: everything up to the line that starts with "1."
	// (the first move). Comments/RAVs inside movetext are not parsed deeply —
	// we move token by token and inject annotations right after each move.
	const headerEnd = pgn.search(/\b1\.(\s|\.\.)/);
	if (headerEnd < 0) return pgn;
	const header = pgn.slice(0, headerEnd);
	const movetext = pgn.slice(headerEnd);

	// Tokenize: move numbers (e.g. "1." / "1..."), SAN moves (Nf3, O-O, exd5+),
	// and everything else (results, spaces). A move is matched permissively.
	const tokenRe = /(\d+\.(\.\.)?)|([KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBNqrbn])?[+#]?)|(O-O(?:-O)?[+#]?)|(1-0|0-1|1\/2-1\/2|\*)|(\{[^}]*\})|(\s+)|([^\s]+)/g;
	const tokens: string[] = [];
	let m: RegExpExecArray | null;
	while ((m = tokenRe.exec(movetext)) !== null) {
		tokens.push(m[0]);
	}

	let moveIdx = 0;
	let out = "";
	for (const tok of tokens) {
		out += tok;
		// Is this token a move? (SAN or castles, not a move number / result /
		// whitespace / existing comment.)
		const isMove =
			/^([KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBNqrbn])?[+#]?)$/.test(tok) ||
			/^O-O(?:-O)?[+#]?$/.test(tok);
		if (!isMove) continue;

		const a = analysis[moveIdx];
		moveIdx++;
		if (!a) continue;

		const parts: string[] = [];
		if (includeClassification && a.classification) {
			const glyph = CLOCK_GLYPHS[a.classification as Classification];
			if (glyph) parts.push(glyph);
		}
		if (includeEval) {
			const ev = formatEvalToken(a);
			if (ev) parts.push(`[%eval ${ev}]`);
		}
		if (parts.length > 0) {
			out += ` {${parts.join(" ")}}`;
		}
	}

	return `${header}${out}`;
}

/** chess.com/lila clock glyphs for the standard classifications. */
const CLOCK_GLYPHS: Record<Classification, string> = {
	brilliant: "!!",
	great: "!",
	best: "",
	excellent: "",
	good: "",
	inaccuracy: "?!",
	mistake: "?",
	blunder: "??",
};

/** Format a MoveAnalysis as the operand of `[%eval …]` ("+1.2" / "#5"). */
function formatEvalToken(a: MoveAnalysisDTO): string | null {
	if (a.mate !== undefined) {
		return `#${a.mate}`;
	}
	if (a.evalCp === undefined) return null;
	const pawns = a.evalCp / 100;
	return `${pawns >= 0 ? "+" : ""}${pawns.toFixed(2)}`;
}

// Re-export so consumers can grab the styles alongside without a second import.
export { CLASSIFICATION_STYLES };
