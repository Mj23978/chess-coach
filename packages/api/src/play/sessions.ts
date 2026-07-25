/**
 * Play sessions — in-memory authoritative state for live games.
 *
 * A "play session" is a game in progress (Human vs Human, Human vs Engine, or
 * Engine vs Engine). It is NOT persisted to PGlite while playing: a live game
 * has a ticking clock and transient state that doesn't fit the `games` table.
 * When the game ends (checkmate / stalemate / draw / resignation / timeout),
 * `endSession()` serializes the final PGN into a normal `games` row via
 * `gameRepository.create` and the session is discarded — at which point it
 * shows up on the dashboard and `/games/:id` review page like any imported
 * game.
 *
 * chess.js is the single source of truth for move legality and PGN. The SPA
 * sends UCI; we validate, apply, switch the clock (+increment), detect game
 * end, and (if the opponent is an engine) compute and apply the engine's
 * reply. The board UI is driven entirely by SSE events derived from here — it
 * never applies a move optimistically.
 *
 * Concurrency: sessions live in a `Map` in this process. They survive neither
 * server restart nor reconnect-loss for in-progress games (acceptable v1;
 * documented in PLAN-003 notes.md). The clock is ticked by a 1s `setInterval`
 * per active timed session, started in `routes/play.ts` on session creation.
 */
import { randomUUID } from "node:crypto";
import { Chess } from "chess.js";
import { gameRepository, type Game } from "@repo/db";
import { analyze } from "../engine";
import { uciMoveParams } from "../classifier/chess-helpers";
import type { Move } from "chess.js";

/** Default think time (ms) for engine opponents — snappy for casual play. */
export const DEFAULT_ENGINE_MOVETIME = 300;

/** A player (one side of a session). */
export interface PlayerSpec {
  kind: "human" | "engine";
  /** Display name. Humans = entered name; engines = engine name. */
  name: string;
  /** For engine players: the configured engine id (currently informational —
   *  v1 uses the singleton active engine). */
  engineId?: string;
}

export type PlayerColor = "white" | "black";

/** Time control: total minutes + increment seconds. `null` = untimed. */
export interface TimeControl {
  minutes: number;
  increment: number;
}

export type GameStatus = "playing" | "finished";

export type EndReason =
  | "checkmate"
  | "stalemate"
  | "draw"
  | "resign"
  | "timeout";

/** The live state of one play session. */
export interface GameSession {
  id: string;
  /** chess.js instance — authoritative board + PGN. */
  game: Chess;
  white: PlayerSpec;
  black: PlayerSpec;
  timeControl: TimeControl | null;
  /** Remaining time in ms per side. `null` for untimed sessions. */
  clock: { white: number; black: number } | null;
  status: GameStatus;
  /** When finished: which color won (null = draw). */
  winner: PlayerColor | null;
  /** When finished: human-readable result in PGN notation ("1-0" | "0-1" | "1/2-1/2"). */
  result: string | null;
  /** When finished: why the game ended. */
  endReason: EndReason | null;
  /** The persisted `games` row, once `endSession` has run. */
  persistedGame: Game | null;
  /** Wall-clock ms timestamp of the last clock tick (for drift correction). */
  lastTickAt: number | null;
  /** The most recent move applied (UCI of orig+dest+promo). */
  lastMove: { from: string; to: string; promotion?: string; san: string; color: PlayerColor } | null;
  /** SSE subscribers (push callbacks). See `routes/play.ts` /stream. */
  subscribers: Set<(type: SseEventType, payload: SseSnapshot) => void>;
}

/** SSE event types a session can broadcast. */
export type SseEventType = "move" | "clock" | "end";

/** The session snapshot included in every SSE event. */
export interface SseSnapshot {
  sessionId: string;
  fen: string;
  turn: PlayerColor;
  clock: { white: number; black: number } | null;
  status: GameStatus;
  winner: PlayerColor | null;
  result: string | null;
  endReason: EndReason | null;
  lastMove: GameSession["lastMove"];
  pgn: string;
}

/** Input to create a session. */
export interface CreateSessionInput {
  white: PlayerSpec;
  black: PlayerSpec;
  timeControl?: TimeControl | null;
  /** Optional custom starting FEN (for "Enter FEN" → play). */
  fen?: string;
}

/** Result of applying a move. */
export interface ApplyMoveResult {
  /** Whether the submitted human move was legal + applied. */
  ok: boolean;
  /** When ok=false: why (illegal move, wrong side, game over, etc.). */
  error?: string;
  /** The session (always populated when the session exists). */
  session?: GameSession;
  /** If the engine played a reply, this is its UCI; else null. */
  engineReplyUci?: string | null;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const sessions = new Map<string, GameSession>();

/** Look up a live session by id. */
export function getSession(id: string): GameSession | undefined {
  return sessions.get(id);
}

/** Create and register a new session. Throws on invalid FEN. */
export function createSession(input: CreateSessionInput): GameSession {
  const game = input.fen ? new Chess(input.fen) : new Chess();
  // chess.js throws on an invalid FEN in the constructor above.

  const startMs =
    input.timeControl != null
      ? Math.round(input.timeControl.minutes * 60 * 1000)
      : null;

  const session: GameSession = {
    id: randomUUID(),
    game,
    white: input.white,
    black: input.black,
    timeControl: input.timeControl ?? null,
    clock: startMs != null ? { white: startMs, black: startMs } : null,
    status: "playing",
    winner: null,
    result: null,
    endReason: null,
    persistedGame: null,
    lastTickAt: startMs != null ? Date.now() : null,
    lastMove: null,
    subscribers: new Set(),
  };
  sessions.set(session.id, session);
  return session;
}

/** Side currently to move in a session ("white" | "black"). */
export function sideToMove(s: GameSession): PlayerColor {
  return s.game.turn() === "w" ? "white" : "black";
}

/** True if the engine should move next (an engine is the side to move). */
export function engineToMove(s: GameSession): boolean {
  const side = sideToMove(s);
  const player = side === "white" ? s.white : s.black;
  return player.kind === "engine";
}

/** Apply a human move (UCI). Validates legality, side, and game state. */
export function applyHumanMove(
  s: GameSession,
  uci: string,
): { ok: true; move: GameSession["lastMove"] } | { ok: false; error: string } {
  if (s.status === "finished") {
    return { ok: false, error: "Game is already finished" };
  }
  const side = sideToMove(s);
  if ((side === "white" ? s.white : s.black).kind === "engine") {
    return { ok: false, error: "It is the engine's turn" };
  }
  let move: Move | null;
  try {
    move = s.game.move(uciMoveParams(uci));
  } catch {
    return { ok: false, error: "Illegal move" };
  }
  if (!move) return { ok: false, error: "Illegal move" };

  applyIncrement(s, side);
  recordLastMove(s, move);
  detectGameOver(s);
  return {
    ok: true,
    move: {
      from: move.from,
      to: move.to,
      promotion: move.promotion,
      san: move.san,
      color: side,
    },
  };
}

/**
 * Drive an engine reply for the side to move. Returns the engine's UCI move
 * (or null if the game is over). Throws `EngineUnavailableError` (and any
 * other analyze() error) — the route translates to 503 / 500.
 */
export async function driveEngineMove(
  s: GameSession,
  movetime = DEFAULT_ENGINE_MOVETIME,
): Promise<string | null> {
  if (s.status === "finished") return null;
  if (!engineToMove(s)) return null;

  const movedColor = sideToMove(s); // color BEFORE the engine's move is applied
  const fen = s.game.fen();
  const evalResult = await analyze(fen, { movetime, multiPv: 1 });
  const best = evalResult.bestMove;
  if (!best) {
    // Engine returned no bestmove — treat as a protocol error.
    throw new Error("Engine returned no best move");
  }
  let move: Move | null;
  try {
    move = s.game.move(uciMoveParams(best));
  } catch {
    throw new Error(`Engine returned illegal move: ${best}`);
  }
  if (!move) throw new Error(`Engine returned illegal move: ${best}`);

  applyIncrement(s, movedColor);
  recordLastMove(s, move);
  detectGameOver(s);
  return best;
}

// ---------------------------------------------------------------------------
// Clock
// ---------------------------------------------------------------------------

/**
 * Advance the clock for the side to move by the elapsed real time since the
 * last tick. Returns true if the active side just flagged (ran out of time).
 * No-op for untimed sessions. Called ~1s by routes/play.ts.
 */
export function tickClock(s: GameSession): boolean {
  if (!s.clock) return false; // untimed
  if (s.status === "finished") return false;
  if (s.lastTickAt == null) return false;

  const now = Date.now();
  const elapsed = now - s.lastTickAt;
  s.lastTickAt = now;
  const side = sideToMove(s);
  const remaining = Math.max(0, s.clock[side] - elapsed);
  s.clock[side] = remaining;
  if (remaining <= 0) {
    flagOut(s, side);
    return true;
  }
  return false;
}

/** Add the increment to the side that just moved (called right after a move). */
function applyIncrement(s: GameSession, movedColor: PlayerColor): void {
  if (!s.clock || !s.timeControl) return;
  s.clock[movedColor] += s.timeControl.increment * 1000;
}

/** End the game on timeout — the flagged side loses. */
function flagOut(s: GameSession, flagged: PlayerColor): void {
  // Insufficient material on the winner → draw instead of timeout loss.
  if (s.game.isInsufficientMaterial()) {
    finishDraw(s, "draw");
    return;
  }
  const winner: PlayerColor = flagged === "white" ? "black" : "white";
  finish(s, { winner, result: winner === "white" ? "1-0" : "0-1", reason: "timeout" });
}

// ---------------------------------------------------------------------------
// Game-end detection + persistence
// ---------------------------------------------------------------------------

/** Detect natural game end (checkmate / stalemate / draw) on the current
 *  position. If the game is over, finalize the session. */
function detectGameOver(s: GameSession): void {
  if (s.status === "finished") return;
  if (!s.game.isGameOver()) return;

  if (s.game.isCheckmate()) {
    // The side to move is checkmated → the OTHER side wins.
    const loser = sideToMove(s);
    const winner: PlayerColor = loser === "white" ? "black" : "white";
    finish(s, {
      winner,
      result: winner === "white" ? "1-0" : "0-1",
      reason: "checkmate",
    });
    return;
  }
  // Stalemate, threefold, insufficient, or 50-move → draw.
  finishDraw(s, "draw");
}

/** Mark a session finished as a draw (any draw reason). */
function finishDraw(s: GameSession, reason: EndReason): void {
  finish(s, { winner: null, result: "1/2-1/2", reason });
}

/** Resignation: `resigningColor` loses. */
export function resignSession(s: GameSession, resigningColor: PlayerColor): void {
  if (s.status === "finished") return;
  const winner: PlayerColor = resigningColor === "white" ? "black" : "white";
  finish(s, {
    winner,
    result: winner === "white" ? "1-0" : "0-1",
    reason: "resign",
  });
}

interface FinishInput {
  winner: PlayerColor | null;
  result: string;
  reason: EndReason;
}

/** Finalize a session's state and persist it to the `games` table. */
function finish(s: GameSession, input: FinishInput): void {
  if (s.status === "finished") return;
  s.status = "finished";
  s.winner = input.winner;
  s.result = input.result;
  s.endReason = input.reason;
  s.lastTickAt = null;
  void endSession(s); // fire-and-forget persistence; route awaits on demand.
}

/**
 * Persist the finished session's PGN into the `games` table (idempotent —
 * stores once in `persistedGame`). Returns the stored row.
 */
export async function endSession(s: GameSession): Promise<Game> {
  if (s.persistedGame) return s.persistedGame;
  // Stamp PGN headers with result + player names + a marker tag so the
  // dashboard / review page can tell played games from imported ones.
  try {
    s.game.setHeader("Result", s.result ?? "*");
    s.game.setHeader("White", s.white.name);
    s.game.setHeader("Black", s.black.name);
    s.game.setHeader("Event", "chess-coach play");
  } catch {
    /* header write shouldn't fail play persistence */
  }
  const pgn = s.game.pgn();
  const stored = await gameRepository.create({
    pgn,
    white: s.white.name,
    black: s.black.name,
    // `side` = the human's color, if any. Engine vs Engine → null.
    side: humanSide(s),
    result: (s.result as Game["result"]) ?? "*",
    tags: ["play"],
  });
  s.persistedGame = stored;
  return stored;
}

/** The human side for the `games.side` column, or null if neither side is human
 *  (engine vs engine) or both are (pick white). */
function humanSide(s: GameSession): "white" | "black" | undefined {
  if (s.white.kind === "human" && s.black.kind === "engine") return "white";
  if (s.black.kind === "human" && s.white.kind === "engine") return "black";
  return undefined;
}

/** Remove a session from memory (e.g. after the SPA closes the tab). */
export function deleteSession(id: string): void {
  sessions.delete(id);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function recordLastMove(
  s: GameSession,
  move: { from: string; to: string; promotion?: string; san: string; color: "w" | "b" },
): void {
  s.lastMove = {
    from: move.from,
    to: move.to,
    promotion: move.promotion,
    san: move.san,
    color: move.color === "w" ? "white" : "black",
  };
}

// ---------------------------------------------------------------------------
// SSE broadcast helpers
// ---------------------------------------------------------------------------

/** Build an immutable snapshot of a session for SSE clients. */
export function snapshot(s: GameSession): SseSnapshot {
  return {
    sessionId: s.id,
    fen: s.game.fen(),
    turn: sideToMove(s),
    clock: s.clock ? { ...s.clock } : null,
    status: s.status,
    winner: s.winner,
    result: s.result,
    endReason: s.endReason,
    lastMove: s.lastMove ? { ...s.lastMove } : null,
    pgn: s.game.pgn(),
  };
}

/** Subscribe to a session's events. Returns an unsubscribe fn. */
export function subscribe(
  s: GameSession,
  cb: (type: SseEventType, payload: SseSnapshot) => void,
): () => void {
  s.subscribers.add(cb);
  return () => s.subscribers.delete(cb);
}

/** Broadcast a snapshot to all subscribers of a session. */
export function emit(s: GameSession, type: SseEventType): void {
  const snap = snapshot(s);
  for (const cb of s.subscribers) cb(type, snap);
}
