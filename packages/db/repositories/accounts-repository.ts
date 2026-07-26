/**
 * Account repository — CRUD for connected Chess.com / Lichess identities.
 *
 * Follows the same object-literal pattern as games-/engines-repository. Access
 * goes through the lazy `db` proxy (../db), which waits for PGlite + migrations
 * before forwarding calls. Import `accountRepository` and call its methods.
 *
 * Games synced from an account carry `account_id` on the games table; this
 * repo is the FK target (app-enforced — no DB constraint).
 */
import { and, desc, eq } from "drizzle-orm";
import { db } from "../db";
import { AccountsTable } from "../schema/accounts";
import type { AccountPlatform } from "../schema/accounts";
import type {
  Account,
  AccountRepository,
  CreateAccountInput,
  UpdateAccountInput,
} from "./types";

export const accountRepository: AccountRepository = {
  /** List all connected accounts, newest first. */
  list: async (): Promise<Account[]> => {
    return db
      .select()
      .from(AccountsTable)
      .orderBy(desc(AccountsTable.createdAt));
  },

  /** Get an account by id. */
  getById: async (id: string): Promise<Account | null> => {
    const [row] = await db
      .select()
      .from(AccountsTable)
      .where(eq(AccountsTable.id, id))
      .limit(1);
    return row ?? null;
  },

  /** Look up an account by (platform, username) — the uniqueness key. */
  getByPlatform: async (
    platform: AccountPlatform,
    username: string,
  ): Promise<Account | null> => {
    const [row] = await db
      .select()
      .from(AccountsTable)
      .where(
        and(
          eq(AccountsTable.platform, platform),
          eq(AccountsTable.username, username),
        ),
      )
      .limit(1);
    return row ?? null;
  },

  /** Create a new account row. */
  create: async (input: CreateAccountInput): Promise<Account> => {
    const [row] = await db
      .insert(AccountsTable)
      .values({
        platform: input.platform,
        username: input.username,
        platformUserId: input.platformUserId,
        accessToken: input.accessToken,
        refreshToken: input.refreshToken,
        tokenExpiresAt: input.tokenExpiresAt,
      })
      .returning();
    return row!;
  },

  /** Patch account fields (username rename, platform id, …). */
  update: async (
    id: string,
    input: UpdateAccountInput,
  ): Promise<Account | null> => {
    const [row] = await db
      .update(AccountsTable)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(AccountsTable.id, id))
      .returning();
    return row ?? null;
  },

  /**
   * Store OAuth tokens (Lichess). Chess.com has no tokens — left null. Pass
   * `undefined` for any field you don't want to touch.
   */
  setTokens: async (
    id: string,
    tokens: {
      accessToken?: string;
      refreshToken?: string;
      tokenExpiresAt?: Date | null;
    },
  ): Promise<Account | null> => {
    const [row] = await db
      .update(AccountsTable)
      .set(
        {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiresAt: tokens.tokenExpiresAt,
          updatedAt: new Date(),
        },
      )
      .where(eq(AccountsTable.id, id))
      .returning();
    return row ?? null;
  },

  /** Mark the account's last successful incremental sync as now. */
  touchSynced: async (id: string): Promise<Account | null> => {
    const [row] = await db
      .update(AccountsTable)
      .set({ lastSyncedAt: new Date(), updatedAt: new Date() })
      .where(eq(AccountsTable.id, id))
      .returning();
    return row ?? null;
  },

  /** Delete an account. Synced games are orphaned (account_id kept, source kept). */
  delete: async (id: string): Promise<void> => {
    await db.delete(AccountsTable).where(eq(AccountsTable.id, id));
  },
};
