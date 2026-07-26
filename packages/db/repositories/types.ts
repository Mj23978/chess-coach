import type { Game, NewGame, GameResult, PlaySide, GameSource } from "../schema/games";
import type {
  Account,
  NewAccount,
  AccountPlatform,
} from "../schema/accounts";

/** Input for creating a game. `pgn` is required. */
export interface CreateGameInput {
  pgn: string;
  title?: string;
  white?: string;
  black?: string;
  side?: PlaySide;
  result?: GameResult;
  tags?: string[];
  /** Origin of the game. Defaults to "local" (DB-level) if unset. */
  source?: GameSource;
  /** Owning account id for synced games (references accounts.id). */
  accountId?: string;
}

/** Patchable fields when updating a game. */
export interface UpdateGameInput {
  title?: string;
  white?: string;
  black?: string;
  side?: PlaySide;
  result?: GameResult;
  pgn?: string;
  tags?: string[];
  source?: GameSource;
  accountId?: string | null;
}

export type GameRepository = {
  create: (input: CreateGameInput) => Promise<Game>;
  getById: (id: string) => Promise<Game | undefined>;
  list: (options?: { limit?: number; offset?: number }) => Promise<Game[]>;
  /** All games from a given source ("local" | "chesscom" | "lichess"). */
  listBySource: (source: GameSource) => Promise<Game[]>;
  /** All games synced from a given account id. */
  listByAccount: (accountId: string) => Promise<Game[]>;
  update: (id: string, input: UpdateGameInput) => Promise<Game | undefined>;
  /** Overwrite the per-move analysis JSON. */
  setAnalysis: (id: string, analysis: Game["analysis"]) => Promise<Game | undefined>;
  delete: (id: string) => Promise<void>;
  count: () => Promise<number>;
  /** Number of games from a given source. */
  countBySource: (source: GameSource) => Promise<number>;
  /** Number of games synced from a given account id. */
  countByAccount: (accountId: string) => Promise<number>;
};

export type { Game, NewGame, GameSource };

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

/** Input for creating an account row. */
export interface CreateAccountInput {
  platform: AccountPlatform;
  username: string;
  platformUserId?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
}

/** Patchable account fields. */
export interface UpdateAccountInput {
  username?: string;
  platformUserId?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date | null;
}

export type AccountRepository = {
  list: () => Promise<Account[]>;
  getById: (id: string) => Promise<Account | null>;
  getByPlatform: (
    platform: AccountPlatform,
    username: string,
  ) => Promise<Account | null>;
  create: (input: CreateAccountInput) => Promise<Account>;
  update: (id: string, input: UpdateAccountInput) => Promise<Account | null>;
  /** Store OAuth tokens (Lichess). `undefined` fields are left untouched. */
  setTokens: (
    id: string,
    tokens: {
      accessToken?: string;
      refreshToken?: string;
      tokenExpiresAt?: Date | null;
    },
  ) => Promise<Account | null>;
  /** Record a successful sync (lastSyncedAt = now). */
  touchSynced: (id: string) => Promise<Account | null>;
  delete: (id: string) => Promise<void>;
};

export type { Account, NewAccount, AccountPlatform };
