/**
 * Database repository — CRUD + membership for game collections.
 *
 * Mirrors the engines-repository style (plain object literal, types inlined).
 * All access goes through the lazy `db` proxy from ../db.
 *
 * Membership invariants:
 *  - Adds are idempotent (composite PK on `(database_id, game_id)`).
 *  - `gameCount` / `storageBytes` are recomputed from the live join after
 *    every membership mutation so the grid never shows stale counts.
 *  - Dedup removes duplicate *PGN content* within a database, unlinking the
 *    losers and deleting their game rows **only if they belong to no other
 *    database** (so we never clobber a game referenced elsewhere).
 *  - Deleting a database cascades its junction rows (manually — no FK).
 */
import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "../db";
import {
  DatabasesTable,
  DatabaseGamesTable,
  type Database,
  type NewDatabase,
  type DatabaseType,
} from "../schema/databases";
import { GamesTable, type Game } from "../schema/games";

/**
 * Normalize a PGN for duplicate comparison: trim, collapse runs of internal
 * whitespace, drop a trailing result token. Headers ([Event …]) are kept so
 * genuinely different games (different players/event) stay distinct even when
 * the movetext coincides.
 */
function normalizePgn(pgn: string): string {
  return pgn
    .replace(/\s+/g, " ")
    .trim()
    // Drop the trailing PGN result token (1-0 / 0-1 / 1/2-1/2 / *).
    .replace(/\s(1-0|0-1|1\/2-1\/2|\*)$/i, "");
}

export const databaseRepository = {
  /** List all databases, newest first. */
  async list(): Promise<Database[]> {
    return db
      .select()
      .from(DatabasesTable)
      .orderBy(desc(DatabasesTable.createdAt));
  },

  /** One database by id. */
  async getById(id: string): Promise<Database | null> {
    const [row] = await db
      .select()
      .from(DatabasesTable)
      .where(eq(DatabasesTable.id, id))
      .limit(1);
    return row ?? null;
  },

  /** Create a database. */
  async create(data: {
    name: string;
    description?: string | null;
    type?: DatabaseType;
  }): Promise<Database> {
    const [row] = await db
      .insert(DatabasesTable)
      .values({
        name: data.name,
        description: data.description ?? null,
        type: data.type ?? "games",
      })
      .returning();
    return row!;
  },

  /** Rename / re-describe a database. */
  async update(
    id: string,
    data: Partial<Pick<Database, "name" | "description">>,
  ): Promise<Database | null> {
    const [row] = await db
      .update(DatabasesTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(DatabasesTable.id, id))
      .returning();
    return row ?? null;
  },

  /** Delete a database and its junction rows (manual cascade; no FK). */
  async delete(id: string): Promise<void> {
    await db
      .delete(DatabaseGamesTable)
      .where(eq(DatabaseGamesTable.databaseId, id));
    await db.delete(DatabasesTable).where(eq(DatabasesTable.id, id));
  },

  /**
   * Link games to a database. Idempotent: re-linking an existing pair is a
   * no-op (composite PK). Recomputes the cached counts afterward.
   */
  async addGames(databaseId: string, gameIds: string[]): Promise<void> {
    if (gameIds.length === 0) return;
    // ON CONFLICT DO NOTHING keeps the insert idempotent under the composite PK.
    await db
      .insert(DatabaseGamesTable)
      .values(gameIds.map((gameId) => ({ databaseId, gameId })))
      .onConflictDoNothing();
    await this.recomputeStats(databaseId);
  },

  /**
   * Unlink games from a database. Does NOT delete the underlying game rows
   * (they may belong to other databases). Recomputes cached counts afterward.
   */
  async removeGames(databaseId: string, gameIds: string[]): Promise<void> {
    if (gameIds.length === 0) return;
    await db
      .delete(DatabaseGamesTable)
      .where(
        and(
          eq(DatabaseGamesTable.databaseId, databaseId),
          inArray(DatabaseGamesTable.gameId, gameIds),
        ),
      );
    await this.recomputeStats(databaseId);
  },

  /** All member games of a database, newest first. */
  async getGames(databaseId: string): Promise<Game[]> {
    const rows = await db
      .select({ game: GamesTable })
      .from(GamesTable)
      .innerJoin(
        DatabaseGamesTable,
        eq(DatabaseGamesTable.gameId, GamesTable.id),
      )
      .where(eq(DatabaseGamesTable.databaseId, databaseId))
      .orderBy(desc(GamesTable.createdAt));
    return rows.map((r) => r.game);
  },

  /**
   * Export a database as a single PGN blob — every member game's PGN joined
   * by a blank line. Returned to the SPA for Blob-download.
   */
  async exportPgn(databaseId: string): Promise<string> {
    const games = await this.getGames(databaseId);
    return games.map((g) => g.pgn).join("\n\n");
  },

  /**
   * Remove duplicate games within a database. Two games are "duplicates" when
   * their normalized PGN (see normalizePgn) matches. For each duplicate group
   * we keep the newest member (max createdAt) and unlink the rest. Losers'
   * underlying game rows are deleted **only if they belong to no other
   * database**, so we never clobber shared games.
   *
   * Returns the number of duplicates removed (junction rows unlinked).
   */
  async deduplicate(databaseId: string): Promise<{ removed: number }> {
    const games = await this.getGames(databaseId);
    if (games.length === 0) return { removed: 0 };

    // Group game ids by normalized PGN.
    const groups = new Map<string, Game[]>();
    for (const g of games) {
      const key = normalizePgn(g.pgn);
      const arr = groups.get(key);
      if (arr) arr.push(g);
      else groups.set(key, [g]);
    }

    const loserIds: string[] = [];
    for (const arr of groups.values()) {
      if (arr.length < 2) continue;
      // Keep the newest; the rest are losers.
      const sorted = [...arr].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      for (let i = 1; i < sorted.length; i++) loserIds.push(sorted[i]!.id);
    }

    if (loserIds.length === 0) return { removed: 0 };

    // Unlink losers from this database.
    await db
      .delete(DatabaseGamesTable)
      .where(
        and(
          eq(DatabaseGamesTable.databaseId, databaseId),
          inArray(DatabaseGamesTable.gameId, loserIds),
        ),
      );

    // Delete loser game rows that are no longer referenced by ANY database.
    // A loser is still referenced if it has a junction row for a *different*
    // database. (ne = "not equal to this database".)
    for (const loserId of loserIds) {
      const [row] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(DatabaseGamesTable)
        .where(
          and(
            eq(DatabaseGamesTable.gameId, loserId),
            ne(DatabaseGamesTable.databaseId, databaseId),
          ),
        );
      const otherRefs = row?.count ?? 0;
      if (otherRefs === 0) {
        await db.delete(GamesTable).where(eq(GamesTable.id, loserId));
      }
    }

    await this.recomputeStats(databaseId);
    return { removed: loserIds.length };
  },

  /**
   * Recompute the cached `gameCount` / `storageBytes` for a database from the
   * live membership join. Called after every membership mutation.
   */
  async recomputeStats(databaseId: string): Promise<void> {
    const [row] = await db
      .select({
        gameCount: sql<number>`count(*)::int`,
        storageBytes: sql<number>`coalesce(sum(octet_length(${GamesTable.pgn})), 0)::int`,
      })
      .from(DatabaseGamesTable)
      .innerJoin(
        GamesTable,
        eq(DatabaseGamesTable.gameId, GamesTable.id),
      )
      .where(eq(DatabaseGamesTable.databaseId, databaseId));
    await db
      .update(DatabasesTable)
      .set({
        gameCount: row?.gameCount ?? 0,
        storageBytes: row?.storageBytes ?? 0,
        updatedAt: new Date(),
      })
      .where(eq(DatabasesTable.id, databaseId));
  },
};

export type { Database, NewDatabase, DatabaseType };
