/**
 * Settings repository — key-value CRUD for app preferences.
 *
 * The settings table stores every preference as a separate row. This repo
 * provides bulk get/upsert so the API and context layer deal with a single
 * `SettingsMap` object rather than individual key lookups.
 */
import { eq } from "drizzle-orm";
import { db } from "../db";
import { SettingsTable } from "../schema/settings";
import type {
  SettingsMap,
  NewSetting,
} from "../schema/settings";
import {
  rowsToSettingsMap,
  partialMapToRows,
} from "../schema/settings";

export const settingsRepository = {
  /** Load all settings, merged with defaults. */
  async getAll(): Promise<SettingsMap> {
    const rows = await db.select().from(SettingsTable);
    return rowsToSettingsMap(rows);
  },

  /** Upsert a batch of key-value rows (partial update). */
  async upsertMany(
    entries: Array<{ key: string; value: string }>,
  ): Promise<SettingsMap> {
    // Drizzle's upsert: insert or update on conflict.
    for (const { key, value } of entries) {
      await db
        .insert(SettingsTable)
        .values({ key, value })
        .onConflictDoUpdate({
          target: SettingsTable.key,
          set: { value, updatedAt: new Date() },
        });
    }
    // Return the fresh state.
    return this.getAll();
  },

  /** Replace all settings from a full SettingsMap. */
  async replaceAll(map: SettingsMap): Promise<SettingsMap> {
    const rows = partialMapToRows(map);
    return this.upsertMany(rows);
  },

  /** Update a subset of settings; returns the merged result. */
  async updatePartial(
    partial: Partial<SettingsMap>,
  ): Promise<SettingsMap> {
    const rows = partialMapToRows(partial);
    if (rows.length === 0) return this.getAll();
    return this.upsertMany(rows);
  },

  /** Delete a single setting key. */
  async deleteKey(key: string): Promise<void> {
    await db.delete(SettingsTable).where(eq(SettingsTable.key, key));
  },

  /** Reset all settings to defaults. */
  async resetAll(): Promise<SettingsMap> {
    await db.delete(SettingsTable);
    return this.getAll();
  },
};
