/**
 * Accounts schema — connected Chess.com / Lichess identities for game sync.
 *
 * chess-coach is a local single-user desktop app, so accounts are global (no
 * app-level user dimension). An "account" is just a platform identity the user
 * wants to pull games from. Chess.com uses the public API (no tokens); Lichess
 * requires an OAuth token stored on the row.
 *
 * Games synced from an account carry `source` + `account_id` on the `games`
 * table (see ./games.ts); this table is the FK target (app-enforced — no DB
 * constraint, to keep migrations loose).
 */
import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Supported sync platforms. Kept in sync with the `source` union on the games
 * table (minus "local", which is reserved for manually-imported games that have
 * no platform account).
 */
export type AccountPlatform = "chess.com" | "lichess";

export const AccountsTable = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    /** Which platform this identity belongs to. */
    platform: text("platform").$type<AccountPlatform>().notNull(),
    /** Platform handle (case as returned by the platform; store verbatim). */
    username: text("username").notNull(),
    /** Platform-specific user id (Chess.com player id, Lichess user id). */
    platformUserId: text("platform_user_id"),
    /**
     * OAuth access token. Set for Lichess (PKCE flow). Always null for
     * Chess.com (public API needs no auth). NOTE: stored in plaintext for now
     * — see PLAN-004 notes for the encryption-at-rest follow-up.
     */
    accessToken: text("access_token"),
    /** OAuth refresh token (unused for Lichess personal tokens; reserved). */
    refreshToken: text("refresh_token"),
    /** When the access token expires (null = no expiry / personal token). */
    tokenExpiresAt: timestamp("token_expires_at"),
    /** Last successful incremental sync — used to skip old archives/games. */
    lastSyncedAt: timestamp("last_synced_at"),
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    /** One row per (platform, username) — adding the same handle twice is a no-op. */
    platformUserIdx: uniqueIndex("accounts_platform_username_idx").on(
      table.platform,
      table.username,
    ),
  }),
);

export type Account = typeof AccountsTable.$inferSelect;
export type NewAccount = typeof AccountsTable.$inferInsert;
