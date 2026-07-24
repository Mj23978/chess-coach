/**
 * Minimal UCI (Universal Chess Interface) line parser.
 *
 * Stockfish emits two kinds of lines we care about during a search:
 *   info depth D multipv M score cp N pv m1 m2 m3 ...
 *   info depth D multipv M score mate K pv m1 m2 m3 ...
 *   bestmove <uci> [ ponder <uci> ]
 *
 * We parse each `info` line into a partial LineEval (keyed by multipv index)
 * and the `bestmove` line into a move string. The engine wrapper accumulates
 * the deepest line per MultiPV index and returns them as `PositionEval.lines`.
 *
 * This is a hand-written tokenizer (not a grammar) because the UCI `info`
 * format is a flat space-separated token stream with a handful of known keys.
 * Mirrors the parsing done by vampirc_uci in pawn-appetite's Rust backend,
 * but scoped to just what the classifier needs (depth, multipv, score, pv).
 */

/**
 * Parse one UCI `info ... pv ...` line into a partial line eval, or `null`
 * if the line carries no PV (e.g. "info string ..." or time-only updates).
 *
 * Returns the line's { multiPv, depth, cp?, mate?, pv } fields. Only lines
 * that include a `pv` token sequence are meaningful for the classifier, so
 * lines without `pv` return null and the caller ignores them.
 */
export function parseInfoLine(line: string): {
  multiPv: number;
  depth: number;
  cp?: number;
  mate?: number;
  pv: string[];
} | null {
  // Only consider lines that have both a score and a pv — bare depth/nps
  // updates aren't useful per-line and would create noise.
  if (!line.startsWith("info")) return null;
  const tokens = line.split(/\s+/);
  let depth = 0;
  let multiPv = 1;
  let cp: number | undefined;
  let mate: number | undefined;
  let pv: string[] | undefined;

  for (let i = 1; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === "depth") {
      depth = Number(tokens[++i]) || 0;
    } else if (t === "multipv") {
      multiPv = Number(tokens[++i]) || 1;
    } else if (t === "score") {
      const kind = tokens[++i];
      const val = Number(tokens[++i]);
      if (kind === "cp") cp = val;
      else if (kind === "mate") mate = val;
    } else if (t === "pv") {
      // Everything after "pv" until end-of-line (or a "string"/"lowerbound"
      // token, which Stockfish never appends after pv) is the PV move list.
      pv = tokens.slice(i + 1).filter(Boolean);
      break;
    }
  }

  if (pv === undefined || pv.length === 0) return null;
  return { multiPv, depth, cp, mate, pv };
}

/**
 * Parse a `bestmove <uci>` line. Returns the UCI move string or null.
 * Handles the optional `ponder <uci>` suffix by ignoring it.
 */
export function parseBestmove(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("bestmove")) return null;
  const parts = trimmed.split(/\s+/);
  // ["bestmove", "e2e4", "ponder", "e7e5"] → "e2e4"
  return parts[1] && parts[1] !== "(none)" ? parts[1] : null;
}
