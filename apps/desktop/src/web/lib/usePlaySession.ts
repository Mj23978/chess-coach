/**
 * usePlaySession — React hook that owns a live play session.
 *
 * Responsibilities:
 *  - Hold the authoritative SessionSnapshot (single source of truth for the
 *    board, clock, status, result).
 *  - Subscribe to the session's SSE stream and apply incoming snapshots.
 *  - Expose `makeMove(uci)` (POSTs; the SSE stream reconciles) and `resign()`.
 *
 * The SPA never mutates the snapshot locally — every state change arrives via
 * SSE. `makeMove` fires the POST and lets the server-emitted `move` event (or
 * the POST response on error) update the view. This keeps the board and the
 * server perfectly in sync even under flaky networks (a dropped move event
 * would be corrected by the next one).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyMove,
  resignGame,
  subscribeSession,
  type SessionSnapshot,
  type PlayerColor,
} from "./play-api";

export interface UsePlaySessionResult {
  snapshot: SessionSnapshot | null;
  /** Transient error from the last move/resign (cleared on next success). */
  error: string | null;
  /** A move is in flight (engine thinking, or POST pending). */
  pending: boolean;
  makeMove: (uci: string) => Promise<void>;
  resign: (color?: PlayerColor) => Promise<void>;
}

export function usePlaySession(sessionId: string | null): UsePlaySessionResult {
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const snapRef = useRef<SessionSnapshot | null>(null);
  snapRef.current = snapshot;

  // Subscribe to SSE while we have a sessionId.
  useEffect(() => {
    if (!sessionId) {
      setSnapshot(null);
      return;
    }
    let closed = false;
    const close = subscribeSession(sessionId, {
      onEvent: (_type, snap) => {
        if (closed) return;
        setSnapshot(snap);
        setError(null);
        setPending(false);
      },
      onError: () => {
        // EventSource auto-reconnects; surface a soft error only if we have no
        // snapshot yet (initial connect failure).
        if (!snapRef.current) setError("Lost connection to the game server.");
      },
    });
    return () => {
      closed = true;
      close();
    };
  }, [sessionId]);

  const makeMove = useCallback(
    async (uci: string) => {
      if (!sessionId) return;
      // Don't double-submit while the engine is thinking.
      if (snapRef.current?.status === "finished") return;
      setPending(true);
      setError(null);
      try {
        const res = await applyMove(sessionId, uci);
        // The POST response is authoritative too (covers the case where SSE
        // lagged). Merge it in.
        setSnapshot(res);
        if (res.engineError) setError(res.engineError);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setPending(false);
      }
    },
    [sessionId],
  );

  const resign = useCallback(
    async (color?: PlayerColor) => {
      if (!sessionId) return;
      setPending(true);
      setError(null);
      try {
        const res = await resignGame(sessionId, color);
        setSnapshot(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setPending(false);
      }
    },
    [sessionId],
  );

  return { snapshot, error, pending, makeMove, resign };
}
