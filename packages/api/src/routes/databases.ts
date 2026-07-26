/**
 * Databases routes — game-collection CRUD + membership + export/dedup (DB3).
 *
 * chess-coach is a local single-user desktop app with no auth, so databases
 * are global (no owner dimension). Endpoints:
 *
 *   GET    /databases                  list all databases (newest first)
 *   POST   /databases                  create a database
 *   GET    /databases/:id              one database by id
 *   PATCH  /databases/:id              rename / re-describe
 *   DELETE /databases/:id              delete + cascade junction rows
 *   GET    /databases/:id/games        member games (for "Explore games")
 *   POST   /databases/:id/games        add games by id (idempotent)
 *   DELETE /databases/:id/games        unlink games (body: { gameIds })
 *   GET    /databases/:id/export       database as a single PGN blob
 *   POST   /databases/:id/dedup        remove duplicate games
 */
import { Elysia, t } from "elysia";
import { databaseRepository, gameRepository } from "@repo/db";

const NOT_FOUND = (set: { status?: number }) => {
  set.status = 404;
  return { error: "Database not found" };
};

export const databasesRoutes = new Elysia({ prefix: "/databases" })
  // List all databases.
  .get("/", async () => {
    const databases = await databaseRepository.list();
    return { databases };
  })

  // Create a database.
  .post(
    "/",
    async ({ body, set }) => {
      const database = await databaseRepository.create({
        name: body.name,
        description: body.description,
        type: body.type,
      });
      set.status = 201;
      return { database };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        type: t.Optional(t.Union([t.Literal("games"), t.Literal("repertoire"), t.Literal("puzzles")])),
      }),
    },
  )

  // One database by id.
  .get("/:id", async ({ params: { id }, set }) => {
    const database = await databaseRepository.getById(id);
    if (!database) return NOT_FOUND(set);
    return { database };
  })

  // Rename / re-describe.
  .patch(
    "/:id",
    async ({ params: { id }, body, set }) => {
      const existing = await databaseRepository.getById(id);
      if (!existing) return NOT_FOUND(set);
      const database = await databaseRepository.update(id, body);
      return { database };
    },
    {
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1 })),
        description: t.Optional(t.Nullable(t.String())),
      }),
    },
  )

  // Delete + manual cascade of junction rows.
  .delete("/:id", async ({ params: { id }, set }) => {
    const existing = await databaseRepository.getById(id);
    if (!existing) return NOT_FOUND(set);
    await databaseRepository.delete(id);
    set.status = 204;
  })

  // Member games (for the drawer's "Explore games" list).
  .get("/:id/games", async ({ params: { id }, set }) => {
    const existing = await databaseRepository.getById(id);
    if (!existing) return NOT_FOUND(set);
    const games = await databaseRepository.getGames(id);
    return { games };
  })

  // Add games by id (idempotent — composite PK). Also accepts PGN bodies,
  // creating new games on the fly when `pgns` is supplied.
  .post(
    "/:id/games",
    async ({ params: { id }, body, set }) => {
      const existing = await databaseRepository.getById(id);
      if (!existing) return NOT_FOUND(set);

      // First create any games supplied as PGN. This mirrors the Import PGN
      // flow and lets the SPA add freshly-pasted games straight into a DB
      // without a separate /games round-trip.
      const createdIds: string[] = [];
      for (const pgn of body.pgns ?? []) {
        const game = await gameRepository.create({ pgn });
        createdIds.push(game.id);
      }

      const ids = [...(body.gameIds ?? []), ...createdIds];
      if (ids.length > 0) {
        await databaseRepository.addGames(id, ids);
      }

      const database = await databaseRepository.getById(id);
      return { database };
    },
    {
      body: t.Object({
        /** Existing game ids to link. */
        gameIds: t.Optional(t.Array(t.String())),
        /** PGN blobs to create as new games, then link. */
        pgns: t.Optional(t.Array(t.String({ minLength: 1 }))),
      }),
    },
  )

  // Unlink games (body: { gameIds }). Underlying game rows are left alone —
  // they may belong to other databases.
  .delete(
    "/:id/games",
    async ({ params: { id }, body, set }) => {
      const existing = await databaseRepository.getById(id);
      if (!existing) return NOT_FOUND(set);
      await databaseRepository.removeGames(id, body.gameIds ?? []);
      const database = await databaseRepository.getById(id);
      return { database };
    },
    {
      body: t.Object({
        gameIds: t.Optional(t.Array(t.String())),
      }),
    },
  )

  // Export as a single PGN blob (text/plain for Blob download).
  .get("/:id/export", async ({ params: { id }, set }) => {
    const existing = await databaseRepository.getById(id);
    if (!existing) return NOT_FOUND(set);
    const pgn = await databaseRepository.exportPgn(id);
    set.headers["content-type"] = "text/plain; charset=utf-8";
    // Hint a sensible filename (browsers may override).
    const safeName = existing.name.replace(/[^\w.-]+/g, "_") || "database";
    set.headers["content-disposition"] = `attachment; filename="${safeName}.pgn"`;
    return pgn;
  })

  // Remove duplicate games (normalized-PGN grouping). Returns the count
  // unlinked; underlying game rows are deleted only if referenced by no
  // other database.
  .post("/:id/dedup", async ({ params: { id }, set }) => {
    const existing = await databaseRepository.getById(id);
    if (!existing) return NOT_FOUND(set);
    const result = await databaseRepository.deduplicate(id);
    const database = await databaseRepository.getById(id);
    return { database, removed: result.removed };
  });
