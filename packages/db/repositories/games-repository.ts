/**
 * Game repository — the pattern to follow for chess-domain repositories.
 *
 * All access goes through the lazy `db` proxy from ../db, which waits for
 * PGlite + migrations to finish before forwarding the call. Repositories are
 * plain object literals, not classes; import `gameRepository` and call its
 * methods. No user/owner concept — games are global (local single-user app).
 */
import { desc, eq, count } from "drizzle-orm";
import { db } from "../db";
import { GamesTable } from "../schema/games";
import type {
  CreateGameInput,
  Game,
  GameRepository,
  UpdateGameInput,
} from "./types";

export const gameRepository: GameRepository = {
  create: async (input: CreateGameInput): Promise<Game> => {
    const [row] = await db
      .insert(GamesTable)
      .values({
        pgn: input.pgn,
        title: input.title,
        white: input.white,
        black: input.black,
        side: input.side,
        result: input.result,
        tags: input.tags,
      })
      .returning();
    return row!;
  },

  getById: async (id: string): Promise<Game | undefined> => {
    const [row] = await db
      .select()
      .from(GamesTable)
      .where(eq(GamesTable.id, id))
      .limit(1);
    return row ?? undefined;
  },

  list: async (options?: { limit?: number; offset?: number }): Promise<Game[]> => {
    const { limit = 50, offset = 0 } = options ?? {};
    return db
      .select()
      .from(GamesTable)
      .orderBy(desc(GamesTable.createdAt))
      .limit(limit)
      .offset(offset);
  },

  update: async (
    id: string,
    input: UpdateGameInput,
  ): Promise<Game | undefined> => {
    const [row] = await db
      .update(GamesTable)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(GamesTable.id, id))
      .returning();
    return row ?? undefined;
  },

  setAnalysis: async (id: string, analysis: Game["analysis"]) => {
    const [row] = await db
      .update(GamesTable)
      .set({ analysis, updatedAt: new Date() })
      .where(eq(GamesTable.id, id))
      .returning();
    return row ?? undefined;
  },

  delete: async (id: string): Promise<void> => {
    await db.delete(GamesTable).where(eq(GamesTable.id, id));
  },

  count: async (): Promise<number> => {
    const [row] = await db.select({ n: count() }).from(GamesTable);
    return row?.n ?? 0;
  },
};
