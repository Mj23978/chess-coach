/**
 * Games routes — the API surface for chess-coach.
 *
 * chess-coach is a local single-user desktop app with no auth, so there is no
 * owner/user dimension — games are global. Endpoints:
 *   GET    /games                list all games (newest first)
 *   GET    /games/:id            one game by id
 *   POST   /games                create a game (body: PGN + optional fields)
 *   PATCH  /games/:id            update a game's metadata
 *   DELETE /games/:id            delete a game
 *   POST   /games/:id/analyze    run engine + classifier, store MoveAnalysis[]
 */
import { Elysia, t } from "elysia";
import { gameRepository } from "@repo/db";
import type { MoveAnalysis } from "@repo/db";
import {
  classifyGame,
  EngineUnavailableError,
  MoveClassification,
} from "../classifier";

/**
 * Map the classifier's per-move label onto the DB's `classification` union.
 * The classifier can also emit `Opening` (book) or `Forced` (only one legal
 * reply) — neither is a quality judgement, so collapse them to `best` to fit
 * the stored union (the review UI still shows the eval bar for them).
 */
function normalizeClassification(
  c: MoveClassification | undefined,
): MoveAnalysis["classification"] {
  switch (c) {
    case MoveClassification.Brilliant:
      return "brilliant";
    case MoveClassification.Great:
      return "great";
    case MoveClassification.Best:
      return "best";
    case MoveClassification.Excellent:
      return "excellent";
    case MoveClassification.Good:
      return "good";
    case MoveClassification.Inaccuracy:
      return "inaccuracy";
    case MoveClassification.Mistake:
      return "mistake";
    case MoveClassification.Blunder:
      return "blunder";
    // Opening / Forced / undefined — no badge to store.
    default:
      return undefined;
  }
}

export const gamesRoutes = new Elysia({ prefix: "/games" })
  .get(
    "/",
    async ({ query }) => {
      // Optional filters: `source` ("local"|"chesscom"|"lichess") and
      // `accountId`. Used by the dashboard tabs and the account drawer.
      let games;
      if (query.accountId) {
        games = await gameRepository.listByAccount(query.accountId);
      } else if (query.source) {
        games = await gameRepository.listBySource(query.source);
      } else {
        games = await gameRepository.list();
      }
      return { games };
    },
    {
      query: t.Optional(
        t.Object({
          source: t.Optional(t.String()),
          accountId: t.Optional(t.String()),
        }),
      ),
    },
  )
  .get("/:id", async ({ params: { id }, set }) => {
    const game = await gameRepository.getById(id);
    if (!game) {
      set.status = 404;
      return { error: "Game not found" };
    }
    return { game };
  })
  .post(
    "/",
    async ({ body, set }) => {
      const game = await gameRepository.create({
        pgn: body.pgn,
        title: body.title,
        white: body.white,
        black: body.black,
        side: body.side,
        result: body.result,
        tags: body.tags,
      });
      set.status = 201;
      return { game };
    },
    {
      body: t.Object({
        pgn: t.String({ minLength: 1 }),
        title: t.Optional(t.String()),
        white: t.Optional(t.String()),
        black: t.Optional(t.String()),
        side: t.Optional(t.Union([t.Literal("white"), t.Literal("black")])),
        result: t.Optional(
          t.Union([
            t.Literal("1-0"),
            t.Literal("0-1"),
            t.Literal("1/2-1/2"),
            t.Literal("*"),
          ]),
        ),
        tags: t.Optional(t.Array(t.String())),
      }),
    },
  )
  .patch(
    "/:id",
    async ({ params: { id }, body, set }) => {
      const existing = await gameRepository.getById(id);
      if (!existing) {
        set.status = 404;
        return { error: "Game not found" };
      }
      const game = await gameRepository.update(id, body);
      return { game };
    },
    {
      body: t.Object({
        title: t.Optional(t.String()),
        white: t.Optional(t.String()),
        black: t.Optional(t.String()),
        side: t.Optional(t.Union([t.Literal("white"), t.Literal("black")])),
        result: t.Optional(
          t.Union([
            t.Literal("1-0"),
            t.Literal("0-1"),
            t.Literal("1/2-1/2"),
            t.Literal("*"),
          ]),
        ),
        tags: t.Optional(t.Array(t.String())),
      }),
    },
  )
  .delete("/:id", async ({ params: { id }, set }) => {
    const existing = await gameRepository.getById(id);
    if (!existing) {
      set.status = 404;
      return { error: "Game not found" };
    }
    await gameRepository.delete(id);
    set.status = 204;
  })
  /**
   * Run engine + classifier over a stored game's PGN, persist the resulting
   * per-move `MoveAnalysis[]` into the existing `analysis` JSON column, and
   * return the fresh analysis + per-side accuracy.
   *
   * Body (all optional): `{ depth?, multiPv? }`. Defaults: depth 18, multiPv 3
   * (multiPv ≥ 2 is required for Brilliant/Great/Best to be reachable).
   *
   * Returns 503 if no Stockfish binary is staged under `binaries/` — see
   * `packages/api/src/engine/resolve.ts`. Pre-analyzed games still render.
   */
  .post(
    "/:id/analyze",
    async ({ params: { id }, body, set }) => {
      const existing = await gameRepository.getById(id);
      if (!existing) {
        set.status = 404;
        return { error: "Game not found" };
      }

      let result;
      try {
        result = await classifyGame(existing.pgn, {
          depth: body?.depth,
          multiPv: body?.multiPv,
        });
      } catch (err) {
        if (err instanceof EngineUnavailableError) {
          set.status = 503;
          return {
            error: "Engine unavailable",
            message: err.message,
          };
        }
        // chess.js throws on malformed PGN.
        set.status = 400;
        return {
          error: "Analysis failed",
          message: err instanceof Error ? err.message : String(err),
        };
      }

      // Normalize classifier labels → DB `classification` union.
      const analysis: MoveAnalysis[] = result.moves.map((m) => ({
        san: m.san,
        evalCp: m.evalCp,
        mate: m.mate,
        classification: normalizeClassification(m.classification),
      }));

      const game = await gameRepository.setAnalysis(id, analysis);
      return { game, accuracy: result.accuracy };
    },
    {
      body: t.Optional(
        t.Object({
          depth: t.Optional(t.Number({ minimum: 1, maximum: 30 })),
          multiPv: t.Optional(t.Number({ minimum: 1, maximum: 5 })),
        }),
      ),
    },
  );
