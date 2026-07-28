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
// Brown is the default; blue/green are toggled via container classes below.
import "@lichess-org/chessground/assets/chessground.base.css";
import "@lichess-org/chessground/assets/chessground.brown.css";
import "@lichess-org/chessground/assets/chessground.cburnett.css";

/** Board color theme — maps to chessground CSS files. */
export type BoardStyle = "brown" | "blue" | "green" | "purple";

/** Map board style → container CSS class. The brown theme is the default
 *  (loaded above). Blue and green override via the classes below. Purple
 *  is a custom override not shipped by chessground. */
const BOARD_STYLE_CLASSES: Record<BoardStyle, string> = {
	brown: "",
	blue: "board-blue",
	green: "board-green",
	purple: "board-purple",
};

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
  /** Board color theme. Defaults to "brown". */
  boardStyle?: BoardStyle;
  /** Show rank/file coordinates on the board edges. Defaults to true. */
  showCoords?: boolean;
  /** Highlight the last move with colored squares. Defaults to true. */
  highlightLastMove?: boolean;
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
  boardStyle = "brown",
  showCoords = true,
  highlightLastMove = true,
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
        lastMove: highlightLastMove && !!lastMove,
        check: true,
      },
      drawable: {
        enabled: false,
        visible: !!shapes?.length,
        shapes: shapes,
      },
      coordinates: showCoords,
    };
    api.set(config);
    // Apply square-class overlays (classification colors) directly — chessground
    // exposes setAutoShapes for arrows; per-square CSS classes go via the
    // internal squareClasses. The simplest stable path is the CSS-class map on
    // the state, applied through `set` is not exposed; use autoShapes for now
    // and leave a richer highlight API for a later pass.
    void highlight;
  }, [fen, orientation, lastMove, dests, turnColor, shapes, highlight, onMove, highlightLastMove, showCoords]);

  const boardClass = BOARD_STYLE_CLASSES[boardStyle];

  return (
    <>
      {/* Board theme overrides — loaded once, toggled by container class. */}
      <BoardThemeStyles />
      <div
        ref={containerRef}
        className={`${className ?? ""} ${boardClass}`.trim()}
        style={{
          aspectRatio: "1 / 1",
          width: "100%",
        }}
      />
    </>
  );
}

/** Derive the side to move from a FEN field (3rd token: w/b). */
function deriveTurn(fen: string): Color | undefined {
  const t = fen.split(" ")[1];
  if (t === "w") return "white";
  if (t === "b") return "black";
  return undefined;
}

// ---------------------------------------------------------------------------
// Board theme CSS overrides (injected once via a hidden <style> element).
// ---------------------------------------------------------------------------

let styleInjected = false;

function BoardThemeStyles() {
  if (typeof document === "undefined") return null;
  if (!styleInjected) {
    const style = document.createElement("style");
    style.textContent = `
      /* Chessground board theme overrides — toggled by container class. */
      .board-blue cg-board {
        background-color: #dee3e6;
      }
      .board-blue cg-board square.e1 { background-color: #f0f0f0; }
      .board-blue cg-board square.d1 { background-color: #aaa; }
      .board-blue cg-board square.f1 { background-color: #aaa; }
      .board-blue cg-board square.c1 { background-color: #f0f0f0; }
      .board-blue cg-board square.e8 { background-color: #aaa; }
      .board-blue cg-board square.d8 { background-color: #f0f0f0; }
      .board-blue cg-board square.f8 { background-color: #f0f0f0; }
      .board-blue cg-board square.c8 { background-color: #aaa; }
      /* Simple two-tone override for blue */
      .board-blue cg-board {
        background:
          repeating-conic-gradient(#dee3e6 0% 25%, #fff 0% 50%) 0 0 / 25% 25%;
      }
      .board-green cg-board {
        background:
          repeating-conic-gradient(#779556 0% 25%, #ebecd0 0% 50%) 0 0 / 25% 25%;
      }
      .board-purple cg-board {
        background:
          repeating-conic-gradient(#8e6aab 0% 25%, #f0d9e0 0% 50%) 0 0 / 25% 25%;
      }
    `;
    document.head.appendChild(style);
    styleInjected = true;
  }
  return null;
}
