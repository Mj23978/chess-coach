/**
 * Games routes — the API pattern for chess-coach.
 *
 * Endpoints:
 *   GET    /games/:userId        list a user's games (newest first)
 *   GET    /games/demo           convenience: list the demo user's games
 *   GET    /games/:userId/:id    one game by id
 *   POST   /games/:userId        create a game (body: PGN + optional fields)
 *   PATCH  /games/:userId/:id    update a game's metadata
 *   DELETE /games/:userId/:id    delete a game
 *
 * No auth yet — the `userId` is a path param so the SPA can target a demo
 * user. When Better-Auth is wired in, replace `userId` resolution with the
 * session user and add ownership checks.
 */
import { Elysia, t } from "elysia";
import { gameRepository } from "@repo/db";

/** A stable demo user id used by the desktop SPA before auth exists. */
export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000000";

export const gamesRoutes = new Elysia({ prefix: "/games" })
  // Convenience route for the desktop dashboard before auth is wired.
  .get("/demo", async () => {
    const games = await gameRepository.listByUser(DEMO_USER_ID);
    return { games };
  })
  .get("/:userId", async ({ params: { userId } }) => {
    const games = await gameRepository.listByUser(userId);
    return { games };
  })
  .get("/:userId/:id", async ({ params: { userId, id }, set }) => {
    const game = await gameRepository.getById(id);
    if (!game || game.userId !== userId) {
      set.status = 404;
      return { error: "Game not found" };
    }
    return { game };
  })
  .post(
    "/:userId",
    async ({ params: { userId }, body, set }) => {
      const game = await gameRepository.create({
        userId,
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
    "/:userId/:id",
    async ({ params: { userId, id }, body, set }) => {
      const existing = await gameRepository.getById(id);
      if (!existing || existing.userId !== userId) {
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
  .delete("/:userId/:id", async ({ params: { userId, id }, set }) => {
    const existing = await gameRepository.getById(id);
    if (!existing || existing.userId !== userId) {
      set.status = 404;
      return { error: "Game not found" };
    }
    await gameRepository.delete(id);
    set.status = 204;
  });
