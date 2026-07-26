/**
 * Files routes — imported PGN file CRUD (PLAN-009 / FL3).
 *
 * chess-coach is a local single-user desktop app with no auth, so files are
 * global (no owner dimension). Endpoints:
 *
 *   GET    /files          list all files (newest first)
 *   POST   /files          create a file from a PGN import
 *   GET    /files/:id      one file by id
 *   PATCH  /files/:id      rename / re-describe / re-type / replace PGN
 *   DELETE /files/:id      delete a file
 *
 * Mirrors the databases/engines route shape. `gameCount` / `storageBytes` are
 * computed in the repository from the PGN blob, never accepted from the client.
 */
import { Elysia, t } from "elysia";
import { fileRepository } from "@repo/db";

const NOT_FOUND = (set: { status?: number }) => {
  set.status = 404;
  return { error: "File not found" };
};

const FILE_TYPE = t.Union([
  t.Literal("games"),
  t.Literal("repertoire"),
  t.Literal("tournament"),
  t.Literal("puzzle"),
]);

export const filesRoutes = new Elysia({ prefix: "/files" })
  // List all files.
  .get("/", async () => {
    const files = await fileRepository.list();
    return { files };
  })

  // Create a file from an imported PGN blob.
  .post(
    "/",
    async ({ body, set }) => {
      const file = await fileRepository.create({
        name: body.name,
        type: body.type,
        description: body.description,
        pgn: body.pgn,
        tags: body.tags,
      });
      set.status = 201;
      return { file };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        type: t.Optional(FILE_TYPE),
        description: t.Optional(t.Nullable(t.String())),
        pgn: t.String({ minLength: 1 }),
        tags: t.Optional(t.Array(t.String())),
      }),
    },
  )

  // One file by id.
  .get("/:id", async ({ params: { id }, set }) => {
    const file = await fileRepository.getById(id);
    if (!file) return NOT_FOUND(set);
    return { file };
  })

  // Rename / re-describe / re-type / replace PGN.
  .patch(
    "/:id",
    async ({ params: { id }, body, set }) => {
      const existing = await fileRepository.getById(id);
      if (!existing) return NOT_FOUND(set);
      const file = await fileRepository.update(id, body);
      return { file };
    },
    {
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1 })),
        type: t.Optional(FILE_TYPE),
        description: t.Optional(t.Nullable(t.String())),
        pgn: t.Optional(t.String({ minLength: 1 })),
        tags: t.Optional(t.Nullable(t.Array(t.String()))),
      }),
    },
  )

  // Delete a file.
  .delete("/:id", async ({ params: { id }, set }) => {
    const existing = await fileRepository.getById(id);
    if (!existing) return NOT_FOUND(set);
    await fileRepository.delete(id);
    set.status = 204;
  });
