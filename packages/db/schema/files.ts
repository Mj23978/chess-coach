/**
 * Files schema — imported PGN files (PLAN-009 / Phase 6).
 *
 * chess-coach is a local single-user desktop app, so files are global (no
 * owner dimension). A "file" here is a single PGN blob the user imported
 * (pasted text or an uploaded `.pgn`), tagged with a kind so the Files page
 * can group Games / Repertoires / Tournaments / Puzzles.
 *
 * This is intentionally **separate** from the `databases` table: a database is
 * a curated many-to-many *collection* of game rows (membership via
 * `database_games`), whereas a file is a single raw PGN blob kept verbatim —
 * the user may import a file just to browse/export it without splitting it into
 * individual game rows. `gameCount` / `storageBytes` are denormalized counts
 * maintained by the repository on every write.
 *
 * No DB-level foreign keys — referential integrity is app-enforced, matching
 * the convention used by `games.account_id` and `database_games`.
 */
import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  index,
} from "drizzle-orm/pg-core";

/**
 * Kind of imported file. Surfaced as a filter row + colored card on the Files
 * page. Kept in sync with `FileType` in apps/desktop/src/web/lib/api.ts.
 */
export type FileType = "games" | "repertoire" | "tournament" | "puzzle";

export const FilesTable = pgTable(
  "files",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    /** Human label (e.g. "Caro-Kann Repertoire 2024"). */
    name: text("name").notNull(),
    /** Kind of file — see FileType. Defaults to "games". */
    type: text("type").$type<FileType>().notNull().default("games"),
    /** Free-form description shown in the drawer. */
    description: text("description"),
    /**
     * The raw PGN body, kept verbatim. May contain multiple games separated by
     * blank lines; `gameCount` reflects how many were detected.
     */
    pgn: text("pgn").notNull(),
    /**
     * Number of games detected in `pgn` (count of PGN result tokens
     * "1-0" / "0-1" / "1/2-1/2" / "*"). Maintained by the repository on write.
     */
    gameCount: integer("game_count").notNull().default(0),
    /**
     * Approximate storage footprint in bytes (UTF-8 byte length of `pgn`).
     * Cosmetic — used for the card's size chip. Maintained by the repository.
     */
    storageBytes: integer("storage_bytes").notNull().default(0),
    /** Free-form tags for filtering (e.g. ["blitz", "Caro-Kann"]). */
    tags: text("tags").array(),
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    /** Files page sorts by newest by default. */
    createdAtIdx: index("files_created_at_idx").on(table.createdAt),
    /** Type-filter row groups files by kind. */
    typeIdx: index("files_type_idx").on(table.type),
  }),
);

export type FileRow = typeof FilesTable.$inferSelect;
export type NewFile = typeof FilesTable.$inferInsert;
