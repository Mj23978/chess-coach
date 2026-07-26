/**
 * File repository — CRUD for imported PGN files (PLAN-009 / Phase 6).
 *
 * Follows the same object-literal pattern as games-/engines-/databases-
 * repository. All access goes through the lazy `db` proxy (../db), which waits
 * for PGlite + migrations before forwarding calls.
 *
 * `gameCount` and `storageBytes` are denormalized and recomputed from `pgn` on
 * every create/update so the Files grid never shows stale counts. The count is
 * the number of PGN result tokens ("1-0" / "0-1" / "1/2-1/2" / "*") in the blob
 * — a coarse but robust proxy for "how many games are in this file" that needs
 * no chess move parser.
 */
import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import {
  FilesTable,
  type FileRow,
  type FileType,
} from "../schema/files";

/**
 * Count the games in a PGN blob by counting result tokens. Each completed PGN
 * game ends with one of the four result markers; a stray "*" inside commentary
 * is rare and acceptable noise for a cosmetic count.
 */
function countGames(pgn: string): number {
  const matches = pgn.match(/\b(1-0|0-1|1\/2-1\/2|\*)\b/g);
  return matches ? matches.length : 0;
}

/** UTF-8 byte length of the PGN — the card's size chip. */
function byteLength(pgn: string): number {
  return Buffer.byteLength(pgn, "utf-8");
}

export interface CreateFileInput {
  name: string;
  type?: FileType;
  description?: string | null;
  pgn: string;
  tags?: string[] | null;
}

export interface UpdateFileInput {
  name?: string;
  type?: FileType;
  description?: string | null;
  pgn?: string;
  tags?: string[] | null;
}

export const fileRepository = {
  /** List all files, newest first. */
  async list(): Promise<FileRow[]> {
    return db
      .select()
      .from(FilesTable)
      .orderBy(desc(FilesTable.createdAt));
  },

  /** One file by id. */
  async getById(id: string): Promise<FileRow | null> {
    const [row] = await db
      .select()
      .from(FilesTable)
      .where(eq(FilesTable.id, id))
      .limit(1);
    return row ?? null;
  },

  /** Create a file from an imported PGN blob. */
  async create(input: CreateFileInput): Promise<FileRow> {
    const [row] = await db
      .insert(FilesTable)
      .values({
        name: input.name,
        type: input.type ?? "games",
        description: input.description ?? null,
        pgn: input.pgn,
        tags: input.tags ?? null,
        gameCount: countGames(input.pgn),
        storageBytes: byteLength(input.pgn),
      })
      .returning();
    return row!;
  },

  /** Rename / re-describe / re-type / replace PGN. Recomputes cached counts. */
  async update(id: string, input: UpdateFileInput): Promise<FileRow | null> {
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (input.name !== undefined) patch.name = input.name;
    if (input.type !== undefined) patch.type = input.type;
    if (input.description !== undefined) patch.description = input.description;
    if (input.tags !== undefined) patch.tags = input.tags;
    if (input.pgn !== undefined) {
      patch.pgn = input.pgn;
      patch.gameCount = countGames(input.pgn);
      patch.storageBytes = byteLength(input.pgn);
    }

    const [row] = await db
      .update(FilesTable)
      .set(patch)
      .where(eq(FilesTable.id, id))
      .returning();
    return row ?? null;
  },

  /** Delete a file. */
  async delete(id: string): Promise<void> {
    await db.delete(FilesTable).where(eq(FilesTable.id, id));
  },
};

export type { FileRow, FileType };
