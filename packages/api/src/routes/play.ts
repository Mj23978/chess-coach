/**
 * Play routes — the live-game API surface (B3 of PLAN-003).
 *
 * Sessions are created here and live in `play/sessions.ts`'s in-memory store.
 * chess.js + the singleton engine drive authoritative state; this route layer
 * is a thin transport: it translates HTTP into session mutations and pushes
 * snapshots to subscribers via SSE.
 *
 * Endpoints:
 *   POST /games/play              create a session → { sessionId, ...snapshot }
 *   GET  /games/:id/stream        SSE: move | clock | end events
 *   POST /games/:id/move          apply a human move; if the opponent is an
 *                                 engine, drive its reply → { ...snapshot }
 *   POST /games/:id/resign        end the game (resigner loses) → { ...snapshot }
 *
 * SSE is served as a raw `Response` with a `ReadableStream` and
 * `text/event-stream` headers — framework-agnostic and works in Bun/Elysia
 * without a streaming plugin. Each event is `event: <type>\ndata: <json>\n\n`.
 *
 * The clock interval is owned per-session and started on first SSE subscriber,
 * stopped when the session ends or its last subscriber leaves. We don't tick
 * in the route handler because the SPA must receive clock updates even when no
 * HTTP request is in flight.
 */
import { Elysia, t } from "elysia";
import {
  createSession,
  getSession,
  sideToMove,
  applyHumanMove,
  driveEngineMove,
  resignSession,
  tickClock,
  endSession,
  subscribe,
  emit,
  snapshot,
  DEFAULT_ENGINE_MOVETIME,
  type GameSession,
  type PlayerSpec,
  type TimeControl,
  type PlayerColor,
  type GameStatus,
  type SseEventType,
  type SseSnapshot,
} from "../play/sessions";
import { EngineUnavailableError } from "../engine";

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const playerSpecSchema = t.Object({
  kind: t.Union([t.Literal("human"), t.Literal("engine")]),
  name: t.String({ minLength: 1 }),
  engineId: t.Optional(t.String()),
});

const timeControlSchema = t.Object({
  minutes: t.Number({ minimum: 0 }),
  increment: t.Number({ minimum: 0 }),
});

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  // Disable Nagle so per-second clock ticks aren't delayed/batched.
  "X-Accel-Buffering": "no",
} as const;

/** Encode one SSE message. */
function sseMessage(type: SseEventType, data: SseSnapshot): string {
  return `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
}

// ---------------------------------------------------------------------------
// Per-session clock intervals. Keyed by sessionId; cleared on finish/unsub.
// ---------------------------------------------------------------------------
const clockTimers = new Map<string, ReturnType<typeof setInterval>>();

function startClockTimer(s: GameSession): void {
  if (!s.timeControl) return; // untimed — no ticking
  if (clockTimers.has(s.id)) return;
  const timer = setInterval(() => {
    const flagged = tickClock(s);
    if (flagged) {
      emit(s, "end");
      stopClockTimer(s.id);
    } else {
      emit(s, "clock");
    }
  }, 1000);
  clockTimers.set(s.id, timer);
}

function stopClockTimer(id: string): void {
  const t = clockTimers.get(id);
  if (t) {
    clearInterval(t);
    clockTimers.delete(id);
  }
}

export const playRoutes = new Elysia({ prefix: "/games" })
  /**
   * Create a new play session.
   * Body: { white: PlayerSpec, black: PlayerSpec, timeControl?: TimeControl,
   *         fen?: string, engineMovetime?: number }
   */
  .post(
    "/play",
    ({ body }) => {
      const s = createSession({
        white: body.white,
        black: body.black,
        timeControl: body.timeControl ?? null,
        fen: body.fen,
      });
      // If black is an engine and white is human+to-move-first, no engine move
      // is due yet. If white is the engine, kick it off lazily on first move.
      return snapshot(s);
    },
    {
      body: t.Object({
        white: playerSpecSchema,
        black: playerSpecSchema,
        timeControl: t.Optional(timeControlSchema),
        fen: t.Optional(t.String({ minLength: 1 })),
        engineMovetime: t.Optional(t.Number({ minimum: 10, maximum: 60_000 })),
      }),
    },
  )
  /**
   * SSE stream of session events. The clock interval starts on first
   * subscriber and stops when the session ends or the last client leaves.
   */
  .get("/:id/stream", ({ params: { id }, set }) => {
    const s = getSession(id);
    if (!s) {
      set.status = 404;
      return { error: "Session not found" };
    }

    let cleanup: (() => void) | null = null;

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder();
        const send = (type: SseEventType, payload: SseSnapshot) => {
          try {
            controller.enqueue(encoder.encode(sseMessage(type, payload)));
          } catch {
            // controller already closed (client gone) — drop silently.
          }
        };

        // 1. Send the current snapshot immediately so the client can render
        //    before the first periodic event.
        send("clock", snapshot(s));

        // 2. Subscribe for subsequent updates.
        const unsub = subscribe(s, send);

        // 3. Start the clock interval (no-op if untimed).
        startClockTimer(s);

        // 4. Heartbeat every 25s keeps proxies from closing the idle
        //    connection (untimed games otherwise never send anything while
        //    the human is thinking).
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(": ping\n\n"));
          } catch {
            /* closed */
          }
        }, 25_000);

        cleanup = () => {
          clearInterval(heartbeat);
          unsub();
          if (s.subscribers.size === 0) stopClockTimer(s.id);
        };
      },
      cancel() {
        // Bun fires this when the client aborts the fetch / navigates away.
        cleanup?.();
        cleanup = null;
      },
    });

    // Return a raw Response so Elysia/Bun streams it as-is. `set.headers` would
    // be overridden by Response headers; we set them on the Response directly.
    return new Response(stream, { headers: SSE_HEADERS });
  })
  /**
   * Apply a human move. If the opponent is an engine, compute + apply its
   * reply (synchronously, before responding) so the SPA gets the engine's
   * move in the same HTTP response AND via SSE.
   */
  .post(
    "/:id/move",
    async ({ params: { id }, body, set }) => {
      const s = getSession(id);
      if (!s) {
        set.status = 404;
        return { error: "Session not found" };
      }
      if (s.status === "finished") {
        set.status = 409;
        return { error: "Game is already finished" };
      }

      const result = applyHumanMove(s, body.move);
      if (!result.ok) {
        set.status = 400;
        return { error: result.error };
      }

      // Reset the clock tick baseline so the engine's think time isn't billed
      // to the human on the next tick.
      if (s.clock && s.lastTickAt != null) s.lastTickAt = Date.now();
      emit(s, "move");

      // If the human's move didn't end the game and the engine is now to move,
      // drive its reply before responding (so the SPA gets it in-band + SSE).
      // NOTE: we can't let TS narrow `s.status` here — applyHumanMove may have
      // mutated it to "finished" (checkmate/stalemate/draw), which TS can't
      // see across the function call. `readStatus` forces a fresh union read.
      const readStatus = (): GameStatus => s.status as GameStatus;
      let engineError: string | undefined;
      const engineDue =
        readStatus() !== "finished" &&
        ((sideToMove(s) === "white" && s.white.kind === "engine") ||
          (sideToMove(s) === "black" && s.black.kind === "engine"));
      if (engineDue) {
        try {
          await driveEngineMove(s, body.engineMovetime ?? DEFAULT_ENGINE_MOVETIME);
          if (s.clock && s.lastTickAt != null) s.lastTickAt = Date.now();
          emit(s, "move");
        } catch (err) {
          // 503 when the engine is unavailable; 500 otherwise. The session is
          // left in the pre-engine-move state so the human can retry.
          engineError = err instanceof Error ? err.message : String(err);
          set.status = err instanceof EngineUnavailableError ? 503 : 500;
        }
      }

      // If the game just ended (checkmate/etc.), finalize + persist.
      if (readStatus() === "finished") {
        await endSession(s);
        emit(s, "end");
        stopClockTimer(s.id);
      }

      const snap = snapshot(s);
      return engineError
        ? { ...snap, engineError }
        : snap;
    },
    {
      body: t.Object({
        move: t.String({ minLength: 4 }),
        engineMovetime: t.Optional(t.Number({ minimum: 10, maximum: 60_000 })),
      }),
    },
  )
  /**
   * Resign the game. `color` is the resigning side (default: side to move).
   */
  .post(
    "/:id/resign",
    async ({ params: { id }, body, set }) => {
      const s = getSession(id);
      if (!s) {
        set.status = 404;
        return { error: "Session not found" };
      }
      if (s.status === "finished") {
        set.status = 409;
        return { error: "Game is already finished" };
      }
      const resigning: PlayerColor =
        body?.color ?? sideToMove(s);
      resignSession(s, resigning);
      await endSession(s);
      stopClockTimer(s.id);
      emit(s, "end");
      return snapshot(s);
    },
    {
      body: t.Optional(
        t.Object({
          color: t.Optional(t.Union([t.Literal("white"), t.Literal("black")])),
        }),
      ),
    },
  );

/** Re-export types the SPA client will mirror. */
export type { PlayerSpec, TimeControl, PlayerColor, SseSnapshot };
