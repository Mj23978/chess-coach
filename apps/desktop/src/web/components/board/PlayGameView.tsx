/**
 * PlayGameView — the "Play Game" tab body.
 *
 * Two phases:
 *   1. Setup: configure White/Black (Human/Engine + name + engine), pick a
 *      time control, optionally enter a starting FEN. "Start" POSTs
 *      /games/play and we transition to live mode with the returned sessionId.
 *   2. Live: the board is interactive for the human side on move; moves go to
 *      the server, which reconciles state via SSE (usePlaySession). The clock
 *      is driven by the snapshot. Resign / Save-PGN / Flip are in the actions
 *      bar. When the game finishes it's already persisted server-side; "Save"
 *      just downloads the PGN locally.
 *
 * Board interactivity: we only enable input when (a) the game is playing,
 * (b) it's a human's turn, and (c) no move is pending. `legalDests` gives
 * chessground the legal targets; `onMove` builds a UCI string and submits it.
 */
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { Key } from "@lichess-org/chessground/types";
import { Chess } from "chess.js";
import { Chessboard } from "../Chessboard";
import {
  PlayerConfigCard,
  toPlayerSpec,
  TIME_CONTROLS,
  type PlayerConfig,
} from "./PlayerConfigCard";
import { GameActionsBar } from "./GameActionsBar";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { startPlay, type TimeControl, type PlayerColor } from "../../lib/play-api";
import { usePlaySession } from "../../lib/usePlaySession";
import { legalDests, turnColor, isValidFen } from "../../lib/chess";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export interface PlayGameViewProps {
  /** Optional starting FEN passed from the "Enter FEN" tab. */
  initialFen?: string;
  /** Notify the BoardPage to update this tab's title. */
  onTitleChange?: (title: string) => void;
  /** Close this tab (e.g. after save on a finished game). */
  onClose?: () => void;
}

export function PlayGameView({ initialFen, onTitleChange }: PlayGameViewProps) {
  const [white, setWhite] = useState<PlayerConfig>({
    kind: "human",
    name: "Player",
  });
  const [black, setBlack] = useState<PlayerConfig>({
    kind: "engine",
    name: "Stockfish",
  });
  const [tc, setTc] = useState<TimeControl>(
    TIME_CONTROLS.find((t) => t.label === "Rapid 10+0")?.value ?? {
      minutes: 10,
      increment: 0,
    },
  );
  const [fenInput, setFenInput] = useState(initialFen ?? "");
  const [orientation, setOrientation] = useState<PlayerColor>("white");
  const [sessionId, setSessionId] = useState<string | null>(null);

  const startMut = useMutation({
    mutationFn: startPlay,
    onSuccess: (snap) => {
      setSessionId(snap.sessionId);
      onTitleChange?.(playerTitle(white, black));
    },
  });

  const session = usePlaySession(sessionId);
  const snap = session.snapshot;

  const startFen = initialFen || undefined;
  const displayFen = snap?.fen ?? startFen ?? START_FEN;

  // Legal destinations for the interactive board (only when it's a human's
  // turn to move). Precomputed whenever the FEN changes.
  const dests = useMemo(() => legalDests(displayFen), [displayFen]);
  const turn = snap ? snap.turn : turnColor(displayFen);
  // Interactive iff: live + playing + side to move is human + not pending.
  const humanSide: PlayerColor | null =
    snap && snap.status === "playing"
      ? turn === "white"
        ? white.kind === "human"
          ? "white"
          : null
        : black.kind === "human"
          ? "black"
          : null
      : null;
  const interactive = humanSide === turn && !session.pending;

  const handleMove = (orig: Key, dest: Key) => {
    // chessground passes orig/dest; promotion defaults to queen for now (a
    // proper promotion picker is a later polish — most moves don't promote).
    const promo = maybePromotion(orig, dest, displayFen) ? "q" : "";
    const uci = `${orig}${dest}${promo}`;
    void session.makeMove(uci);
  };

  const [startError, setStartError] = useState<string | null>(null);

  const handleStart = () => {
    const fen = fenInput.trim() || startFen;
    if (fen && !isValidFen(fen)) {
      setStartError("That starting FEN isn't valid.");
      return;
    }
    setStartError(null);
    startMut.mutate({
      white: toPlayerSpec(white),
      black: toPlayerSpec(black),
      timeControl: tc.minutes === 0 && tc.increment === 0 ? null : tc,
      fen,
    });
  };

  // ----- Setup phase -----
  if (!snap) {
    const fenInvalid = fenInput.trim().length > 0 && !isValidFen(fenInput.trim());
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <header>
          <h1 className="text-lg font-bold">New Game</h1>
          <p className="text-xs text-neutral-500">
            Configure both sides, then start. Untimed games skip the clock.
          </p>
        </header>

        <div className="space-y-2">
          <PlayerConfigCard
            color="black"
            config={black}
            onChange={setBlack}
          />
          <PlayerConfigCard
            color="white"
            config={white}
            onChange={setWhite}
            timeControl={tc}
            onTimeControlChange={setTc}
            showTimeControl
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-neutral-500">
            Starting FEN (optional — leave blank for the standard position)
          </Label>
          <Input
            value={fenInput}
            onChange={(e) => setFenInput(e.target.value)}
            placeholder={START_FEN}
            className="font-mono text-xs"
          />
          {fenInvalid && (
            <p className="text-xs text-red-600">That FEN isn't valid.</p>
          )}
        </div>

        {(startError || startMut.isError) && (
          <p className="text-xs text-red-600">
            {startError ??
              (startMut.error as Error | undefined)?.message ??
              "Couldn't start the game."}
          </p>
        )}

        <div className="flex items-center gap-2">
          <Button onClick={handleStart} disabled={startMut.isPending}>
            {startMut.isPending ? "Starting…" : "Start game"}
          </Button>
        </div>
      </div>
    );
  }

  // ----- Live / finished phase -----
  const finished = snap.status === "finished";
  const whiteRemaining = snap.clock?.white ?? null;
  const blackRemaining = snap.clock?.black ?? null;

  const handleSave = () => {
    // Download the PGN locally (the server already persists on game end).
    const blob = new Blob([snap.pgn], { type: "application/x-chess-pgn" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${white.name}_vs_${black.name}.pgn`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="flex gap-6">
        {/* Board column */}
        <div className="flex items-stretch gap-3">
          <div className="w-[520px] max-w-full">
            <Chessboard
              fen={displayFen}
              orientation={orientation}
              lastMove={
                snap.lastMove ? ([snap.lastMove.from, snap.lastMove.to] as [Key, Key]) : null
              }
              dests={interactive ? dests : null}
              turnColor={turn ?? undefined}
              onMove={interactive ? handleMove : undefined}
            />
          </div>
        </div>

        {/* Side column: players, actions, status */}
        <div className="flex min-w-[280px] flex-1 flex-col gap-2">
          {/* Top player = the side NOT at the bottom of the board */}
          <PlayerConfigCard
            color={orientation === "white" ? "black" : "white"}
            config={orientation === "white" ? black : white}
            onChange={orientation === "white" ? setBlack : setWhite}
            live={{
              msRemaining:
                orientation === "white" ? blackRemaining : whiteRemaining,
              active: turn === (orientation === "white" ? "black" : "white"),
            }}
          />

          <GameActionsBar
            onFlip={() =>
              setOrientation((o) => (o === "white" ? "black" : "white"))
            }
            onResign={() => {
              // Resign the human side, if any.
              const resigner: PlayerColor | undefined =
                white.kind === "human" && black.kind === "human"
                  ? turn ?? undefined
                  : white.kind === "human"
                    ? "white"
                    : "black";
              if (resigner) void session.resign(resigner);
            }}
            onSave={handleSave}
            finished={finished}
          />

          {session.error && (
            <p className="rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">
              {session.error}
            </p>
          )}

          {finished ? (
            <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm">
              <p className="font-medium">{resultLabel(snap.result, snap.winner)}</p>
              <p className="text-xs text-neutral-500">
                {endLabel(snap.endReason)} · game saved to your library
              </p>
            </div>
          ) : session.pending ? (
            <p className="text-xs text-neutral-500">
              {turn === humanSide ? "Thinking…" : "Engine is thinking…"}
            </p>
          ) : (
            <p className="text-xs text-neutral-500">
              {turn === humanSide
                ? "Your move"
                : `Waiting for ${turn === "white" ? white.name : black.name}`}
            </p>
          )}

          {/* Bottom player = the side at the bottom of the board */}
          <PlayerConfigCard
            color={orientation}
            config={orientation === "white" ? white : black}
            onChange={orientation === "white" ? setWhite : setBlack}
            live={{
              msRemaining: orientation === "white" ? whiteRemaining : blackRemaining,
              active: turn === orientation,
            }}
            className="mt-auto"
          />
        </div>
      </div>
    </div>
  );
}

// ---- helpers --------------------------------------------------------------

/** True if `from→to` could be a pawn promotion (rank 8/1 + a pawn is moving).
 *  We err on the side of "maybe" — the server re-validates; a non-promotion
 *  UCI with a promo char is rejected as illegal, so this only matters for
 *  actual promotions. */
function maybePromotion(from: Key, to: Key, fen: string): boolean {
  const rank = (to as string)[1];
  if (rank !== "1" && rank !== "8") return false;
  try {
    const g = new Chess(fen);
    const piece = g.get(from as never);
    return piece?.type === "p";
  } catch {
    return false;
  }
}

function playerTitle(w: PlayerConfig, b: PlayerConfig): string {
  return `${w.name || "White"} vs ${b.name || "Black"}`;
}

function resultLabel(result: string | null, winner: PlayerColor | null): string {
  if (!result || result === "*") return "Game ended";
  if (result === "1/2-1/2") return "Draw";
  return winner === "white" ? "White wins" : "Black wins";
}

function endLabel(reason: string | null): string {
  switch (reason) {
    case "checkmate":
      return "Checkmate";
    case "stalemate":
      return "Stalemate";
    case "draw":
      return "Draw";
    case "resign":
      return "By resignation";
    case "timeout":
      return "On time";
    default:
      return "Game over";
  }
}
