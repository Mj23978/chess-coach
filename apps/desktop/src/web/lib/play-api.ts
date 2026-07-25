/**
 * Play-session API client for the SPA.
 *
 * Mirrors the route surface in `packages/api/src/routes/play.ts`:
 *   POST /games/play        create a session
 *   POST /games/:id/move    apply a human move (+ engine reply if due)
 *   POST /games/:id/resign  resign
 *   GET  /games/:id/stream  SSE: move | clock | end
 *
 * The SPA never applies a move optimistically — `makeMove` POSTs and the
 * resulting state is reconciled by the SSE stream + the POST response. The
 * board's single source of truth is the server snapshot.
 */
import { api, API_BASE } from "./api";

export interface PlayerSpec {
  kind: "human" | "engine";
  name: string;
  engineId?: string;
}

export interface TimeControl {
  minutes: number;
  increment: number;
}

export type PlayerColor = "white" | "black";
export type GameStatus = "playing" | "finished";
export type EndReason =
  | "checkmate"
  | "stalemate"
  | "draw"
  | "resign"
  | "timeout";

/** Authoritative session snapshot, returned by every play endpoint + SSE. */
export interface SessionSnapshot {
  sessionId: string;
  fen: string;
  turn: PlayerColor;
  clock: { white: number; black: number } | null;
  status: GameStatus;
  winner: PlayerColor | null;
  result: string | null;
  endReason: EndReason | null;
  lastMove: {
    from: string;
    to: string;
    promotion?: string;
    san: string;
    color: PlayerColor;
  } | null;
  pgn: string;
}

export interface StartPlayInput {
  white: PlayerSpec;
  black: PlayerSpec;
  timeControl?: TimeControl | null;
  fen?: string;
  engineMovetime?: number;
}

/** `POST /games/play` — create a session, returns the initial snapshot. */
export async function startPlay(input: StartPlayInput): Promise<SessionSnapshot> {
  return api<SessionSnapshot>("/games/play", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** `POST /games/:id/move` — apply a human move. Returns the post-move
 *  snapshot (after the engine reply, if one was due). Throws on 4xx/5xx. */
export async function applyMove(
  sessionId: string,
  move: string,
  opts?: { engineMovetime?: number },
): Promise<SessionSnapshot & { engineError?: string }> {
  return api<SessionSnapshot & { engineError?: string }>(
    `/games/${sessionId}/move`,
    {
      method: "POST",
      body: JSON.stringify({ move, engineMovetime: opts?.engineMovetime }),
    },
  );
}

/** `POST /games/:id/resign` — resign the game. */
export async function resignGame(
  sessionId: string,
  color?: PlayerColor,
): Promise<SessionSnapshot> {
  return api<SessionSnapshot>(`/games/${sessionId}/resign`, {
    method: "POST",
    body: JSON.stringify(color ? { color } : {}),
  });
}

export type SseEventType = "move" | "clock" | "end";

export interface SessionEventHandlers {
  onEvent: (type: SseEventType, snapshot: SessionSnapshot) => void;
  onError?: (e: Event) => void;
}

/**
 * Open an SSE subscription to a session. Returns a close() that tears the
 * EventSource down. The server sends `event: move|clock|end` with a JSON
 * `data:` payload matching SessionSnapshot; we forward each to `onEvent`.
 */
export function subscribeSession(
  sessionId: string,
  handlers: SessionEventHandlers,
): () => void {
  const es = new EventSource(`${API_BASE}/games/${sessionId}/stream`);
  const handle = (type: SseEventType) => (e: MessageEvent) => {
    try {
      const snap = JSON.parse(e.data as string) as SessionSnapshot;
      handlers.onEvent(type, snap);
    } catch {
      // Malformed payload — ignore (the next event will resync).
    }
  };
  es.addEventListener("move", handle("move") as EventListener);
  es.addEventListener("clock", handle("clock") as EventListener);
  es.addEventListener("end", handle("end") as EventListener);
  if (handlers.onError) es.onerror = handlers.onError;
  return () => es.close();
}
