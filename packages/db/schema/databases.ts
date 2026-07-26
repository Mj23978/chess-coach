/**
 * Databases schema — logical game collections ("databases" in the
 * chess-software sense, e.g. a Scid/Mega-database).
 *
 * chess-coach is a local single-user desktop app, so databases are global
 * (no owner dimension). A "database" here is just a named, curated grouping
 * of games — the games themselves live in the `games` table; membership is a
 * many-to-many through `database_games`. This keeps a single game reusable
 * across multiple collections without duplicating PGN bytes.
 *
 * Following the repo convention (see `games.account_id`), there are **no
 * DB-level foreign keys** on the junction — referential integrity is
 * app-enforced in the repository. This keeps migrations loose and lets the
 * `runMigrations` runner tolerate re-applied snapshots.
 */
import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  boolean,
} from "drizzle-orm/pg-core";

/**
 * Kind of collection. Defaults to `"games"`. `"repertoire"` / `"puzzles"` are
 * reserved for future phases (PLAN-006 files / deferred training); the UI
 * treats them the same as games today.
 */
export type DatabaseType = "games" | "repertoire" | "puzzles";

export const DatabasesTable = pgTable(
  "databases",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    /** Human label (e.g. "My Blitz Games 2024"). */
    name: text("name").notNull(),
    /** Kind of collection — see DatabaseType. */
    type: text("type")
      .$type<DatabaseType>()
      .notNull()
      .default("games"),
    /** Free-form description shown in the drawer. */
    description: text("description"),
    /**
     * Placeholder for future position indexing (Scoutchess-style "find
     * similar positions"). Unused today; surfaced in the UI as a badge.
     */
    isIndexed: boolean("is_indexed").notNull().default(false),
    /**
     * Denormalized member count. Maintained by the repository on every
     * membership mutation (add / remove / dedup) to avoid a COUNT join when
     * rendering the grid. May drift if the `games` table is mutated out of
     * band; the drawer's "Explore" view recomputes from the live join.
     */
    gameCount: integer("game_count").notNull().default(0),
    /**
     * Approximate storage footprint in bytes (sum of member PGN UTF-8 byte
     * lengths). Maintained alongside `gameCount`. Cosmetic — used for the
     * card's size chip.
     */
    storageBytes: integer("storage_bytes").notNull().default(0),
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    /** Sort the grid by newest by default. */
    createdAtIdx: index("databases_created_at_idx").on(table.createdAt),
  }),
);

/**
 * Junction: membership of a game in a database. Composite PK on
 * `(database_id, game_id)` means the same game can be linked to a database at
 * most once (idempotent adds). No FK constraints — see file header.
 */
export const DatabaseGamesTable = pgTable(
  "database_games",
  {
    databaseId: uuid("database_id").notNull(),
    gameId: uuid("game_id").notNull(),
    /** When the game was linked to this database. */
    addedAt: timestamp("added_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.databaseId, table.gameId] }),
    /** The drawer's "Explore games" list filters by database. */
    databaseIdx: index("database_games_database_idx").on(table.databaseId),
    /** Unused today; supports a future "which DBs contain this game?" view. */
    gameIdx: index("database_games_game_idx").on(table.gameId),
  }),
);

export type Database = typeof DatabasesTable.$inferSelect;
export type NewDatabase = typeof DatabasesTable.$inferInsert;
export type DatabaseGame = typeof DatabaseGamesTable.$inferSelect;
