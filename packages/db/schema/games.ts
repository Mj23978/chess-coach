/**
 * Chess domain schema.
 *
 * `games` is the central record: a user's imported or played game (PGN +
 * result + optional engine analysis). This is intentionally small — extend
 * with openings repertoire, play sessions, tactics, etc. as the app grows.
 */
import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  json,
  index,
} from "drizzle-orm/pg-core";
import { UserTable } from "./auth";

/**
 * Result of a chess game, in standard PGN notation.
 *   "1-0"  white wins
 *   "0-1"  black wins
 *   "1/2-1/2"  draw
 *   "*"  unfinished / unknown
 */
export type GameResult = "1-0" | "0-1" | "1/2-1/2" | "*";

/**
 * Which side the user played in the game.
 */
export type PlaySide = "white" | "black";

/**
 * Engine analysis stored per move. Coarse for now — the analysis pipeline can
 * enrich this (best move, PV, eval units, etc.) without a schema change because
 * it's JSON.
 */
export interface MoveAnalysis {
  san: string;
  /** Centipawn eval from the user's perspective (+ = good for user). */
  evalCp?: number;
  /** Mate score from the user's perspective, in plies; positive = user mates. */
  mate?: number;
  /** True when the move is a blunder / mistake / inaccuracy per the classifier. */
  classification?: "brilliant" | "great" | "best" | "excellent" | "good" | "inaccuracy" | "mistake" | "blunder";
}

export const GamesTable = pgTable(
  "games",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    /** Game title / label for display. Defaults to "White vs. Black". */
    title: text("title"),
    /** Player names from the PGN headers. */
    white: text("white"),
    black: text("black"),
    /** Which side the user played. */
    side: text("side").$type<PlaySide>(),
    /** Final result in PGN notation. */
    result: text("result").$type<GameResult>(),
    /** Full PGN body (movetext + headers). */
    pgn: text("pgn").notNull(),
    /** Per-move engine analysis (see MoveAnalysis). JSON column. */
    analysis: json("analysis").$type<MoveAnalysis[]>().default([]),
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
    userIdIdx: index("games_user_id_idx").on(table.userId),
    createdAtIdx: index("games_created_at_idx").on(table.createdAt),
  }),
);

export const gamesRelations = relations(GamesTable, (helpers) => ({
  user: helpers.one(UserTable, {
    fields: [GamesTable.userId],
    references: [UserTable.id],
  }),
}));

export type Game = typeof GamesTable.$inferSelect;
export type NewGame = typeof GamesTable.$inferInsert;
