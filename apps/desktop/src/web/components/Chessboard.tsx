/**
 * Chessboard — React wrapper around @lichess-org/chessground.
 *
 * A simplified port of pawn-appetite's `Chessground.tsx`: creates the
 * chessground `Api` once on a container ref, then re-applies the config via
 * `api.set(...)` whenever the relevant props change. This is the only board
 * surface in the app — game review, puzzles, and play all compose it.
 *
 * Styling: chessground ships three CSS files in its npm package — base layout,
 * the brown board texture, and the cburnett piece set. We import all three so
 * the board renders correctly with zero extra asset wiring. (Later we can swap
 * piece/board themes the way pawn-appetite does, via CSS files in public/.)
 *
 * The component is controlled: pass `fen`, `orientation`, `lastMove`, optional
 * `dests` (legal targets, from `legalDests()`), optional `shapes` (arrows), and
 * an `onMove(orig, dest)` callback. For review/readonly views, omit `dests`
 * and `onMove` and the board is non-interactive.
 */
import { Chessground as NativeChessground } from "@lichess-org/chessground";
import type { Api } from "@lichess-org/chessground/api";
import type { Config } from "@lichess-org/chessground/config";
import type { Dests, Key, Color } from "@lichess-org/chessground/types";
import type { DrawShape } from "@lichess-org/chessground/draw";
import { useEffect, useRef } from "react";
// chessground's own CSS (base layout + brown board + cburnett pieces).
import "@lichess-org/chessground/assets/chessground.base.css";
import "@lichess-org/chessground/assets/chessground.brown.css";
import "@lichess-org/chessground/assets/chessground.cburnett.css";

export interface ChessboardProps {
  /** Position to display. */
  fen: string;
  /** Side at the bottom. Defaults to "white". */
  orientation?: Color | "white" | "black";
  /** Last move played, to highlight orig+dest squares. */
  lastMove?: [Key, Key] | null;
  /** Legal destinations for the side to move (chessground `Dests`). When
   *  omitted, the board is non-interactive (review mode). */
  dests?: Dests | null;
  /** Color of the side allowed to move, or null for locked. Defaults derived
   *  from `dests` presence. */
  turnColor?: Color | null;
  /** Arrow/shape overlays (e.g. engine best line). */
  shapes?: DrawShape[];
  /** Called after a legal move is made on the board. */
  onMove?: (orig: Key, dest: Key) => void;
  /** Square CSS classes overlay (e.g. classification highlight). */
  highlight?: Map<Key, string>;
  /** Optional className for sizing the container. */
  className?: string;
}

export function Chessboard({
  fen,
  orientation = "white",
  lastMove = null,
  dests,
  turnColor,
  shapes,
  onMove,
  highlight,
  className,
}: ChessboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<Api | null>(null);
  // Keep the latest onMove in a ref so the chessground event closure (created
  // once) always calls the current handler without re-binding.
  const onMoveRef = useRef(onMove);
  useEffect(() => {
    onMoveRef.current = onMove;
  });

  // --- Create the chessground instance exactly once. ---
  useEffect(() => {
    if (!containerRef.current || apiRef.current) return;
    apiRef.current = NativeChessground(containerRef.current, {
      // minimal initial config; the sync effect below keeps it fresh.
      fen,
      orientation: orientation as Color,
    });
    return () => {
      apiRef.current?.destroy?.();
      apiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Re-apply config on prop changes. ---
  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    const interactive = !!dests && !!onMove;
    const config: Config = {
      fen,
      orientation: orientation as Color,
      turnColor: (turnColor ?? (interactive ? deriveTurn(fen) : undefined)) as
        | Color
        | undefined,
      lastMove: lastMove ?? undefined,
      movable: {
        free: false,
        color: interactive ? ((turnColor ?? deriveTurn(fen)) as Color) : undefined,
        dests: dests ?? undefined,
        showDests: interactive,
        events: {
          after: (orig, dest) => onMoveRef.current?.(orig, dest),
        },
      },
      draggable: { enabled: interactive },
      selectable: { enabled: interactive },
      highlight: {
        lastMove: !!lastMove,
        check: true,
      },
      drawable: {
        enabled: false,
        visible: !!shapes?.length,
        shapes: shapes,
      },
      coordinates: true,
    };
    api.set(config);
    // Apply square-class overlays (classification colors) directly — chessground
    // exposes setAutoShapes for arrows; per-square CSS classes go via the
    // internal squareClasses. The simplest stable path is the CSS-class map on
    // the state, applied through `set` is not exposed; use autoShapes for now
    // and leave a richer highlight API for a later pass.
    void highlight;
  }, [fen, orientation, lastMove, dests, turnColor, shapes, highlight, onMove]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        aspectRatio: "1 / 1",
        width: "100%",
      }}
    />
  );
}

/** Derive the side to move from a FEN field (3rd token: w/b). */
function deriveTurn(fen: string): Color | undefined {
  const t = fen.split(" ")[1];
  if (t === "w") return "white";
  if (t === "b") return "black";
  return undefined;
}
