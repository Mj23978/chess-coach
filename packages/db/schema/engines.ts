/**
 * Engine configuration schema.
 *
 * Stores user-configured UCI engines (Stockfish, RubiChess, etc.) with their
 * paths, download status, and UCI options. Chess-coach is a local desktop app,
 * so engine configs are global (no user dimension).
 *
 * Engines can be:
 *  - Downloaded from predefined URLs (Stockfish releases)
 *  - Added from a local file path
 *
 * The active engine is marked with `isActive: true`. Only one can be active.
 */
import { pgTable, text, boolean, integer, json, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * UCI engine option type (inline to avoid circular dependency with @repo/api).
 * See packages/api/src/engine/uci-types.ts for the full definition.
 */
export interface UciOption {
  name: string;
  type: "check" | "spin" | "combo" | "string" | "button" | "filename";
  default?: string | number | boolean;
  min?: number;
  max?: number;
  vars?: string[];
  value?: string | number | boolean;
}

export const EnginesTable = pgTable("engines", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  /** Display name (e.g., "Stockfish 18"). */
  name: text("name").notNull(),
  /** Engine version (e.g., "18"). */
  version: text("version"),
  /** Path to the engine binary (absolute or relative to engines dir). */
  path: text("path"),
  /** Download URL if this engine was downloaded from the cloud. */
  downloadUrl: text("download_url"),
  /** Whether the engine binary exists on disk. Updated on each check. */
  exists: boolean("exists").notNull().default(false),
  /** Whether this is the currently selected engine for analysis. */
  isActive: boolean("is_active").notNull().default(false),
  /** UCI options configured for this engine (MultiPV, Threads, Hash, etc.). */
  options: json("options").$type<UciOption[]>().default([]),
  /** ELO rating for display (from engine catalog). */
  elo: integer("elo"),
  /** Image URL for display (from engine catalog). */
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Engine = typeof EnginesTable.$inferSelect;
export type NewEngine = typeof EnginesTable.$inferInsert;
