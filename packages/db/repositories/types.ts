import type { Game, NewGame, GameResult, PlaySide } from "../schema/games";

/** Input for creating a game. `userId` + `pgn` are required. */
export interface CreateGameInput {
  userId: string;
  pgn: string;
  title?: string;
  white?: string;
  black?: string;
  side?: PlaySide;
  result?: GameResult;
  tags?: string[];
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
}

export type GameRepository = {
  create: (input: CreateGameInput) => Promise<Game>;
  getById: (id: string) => Promise<Game | undefined>;
  listByUser: (
    userId: string,
    options?: { limit?: number; offset?: number },
  ) => Promise<Game[]>;
  update: (id: string, input: UpdateGameInput) => Promise<Game | undefined>;
  /** Overwrite the per-move analysis JSON. */
  setAnalysis: (id: string, analysis: Game["analysis"]) => Promise<Game | undefined>;
  delete: (id: string) => Promise<void>;
  countByUser: (userId: string) => Promise<number>;
};

export type { Game, NewGame };
