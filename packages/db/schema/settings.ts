/**
 * Settings schema — simple key-value store for app preferences.
 *
 * chess-coach is a local single-user desktop app, so settings are global
 * (no user dimension). Each row is a `key` + `value` pair. The app caches
 * settings in-memory and persists changes through the API. Keys follow a
 * dot-separated namespace convention:
 *
 *   theme                  → "light" | "dark" | "system"
 *   board.style            → "brown" | "blue" | "green" | "purple"
 *   board.showCoords       → "true" | "false"
 *   board.highlightLastMove → "true" | "false"
 *   engine.defaultEngine   → "Stockfish" | "Komodo" | ...
 *   engine.autoAnalyze     → "true" | "false"
 *   engine.analysisDepth   → "10" … "40"
 *   sync.syncOnStart       → "true" | "false"
 *   sync.syncInterval      → minutes as string ("15" … "360")
 *   sync.autoImportChessCom → "true" | "false"
 *   sync.autoImportLichess  → "true" | "false"
 *
 * All values are strings (JSON-serialisable) to keep the schema trivial.
 * The app layer parses them into the correct types.
 */
import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const SettingsTable = pgTable(
  "settings",
  {
    /** Dot-namespaced preference key, e.g. "board.style". */
    key: text("key").primaryKey().notNull(),
    /** String-encoded value. */
    value: text("value").notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    /** Unique index is redundant with PK but keeps intent clear. */
    keyIdx: uniqueIndex("settings_key_idx").on(table.key),
  }),
);

export type Setting = typeof SettingsTable.$inferSelect;
export type NewSetting = typeof SettingsTable.$inferInsert;

// ---------------------------------------------------------------------------
// Typed settings map — the shape the SPA consumes.
// ---------------------------------------------------------------------------

export interface SettingsMap {
  theme: "light" | "dark" | "system";
  boardStyle: "brown" | "blue" | "green" | "purple";
  showCoords: boolean;
  highlightLastMove: boolean;
  defaultEngine: string;
  autoAnalyze: boolean;
  analysisDepth: number;
  syncOnStart: boolean;
  syncInterval: number;
  autoImportChessCom: boolean;
  autoImportLichess: boolean;
}

/** Default values used when no row exists in the DB yet. */
export const DEFAULT_SETTINGS: SettingsMap = {
  theme: "system",
  boardStyle: "brown",
  showCoords: true,
  highlightLastMove: true,
  defaultEngine: "Stockfish",
  autoAnalyze: true,
  analysisDepth: 20,
  syncOnStart: true,
  syncInterval: 60,
  autoImportChessCom: true,
  autoImportLichess: true,
};

// ---------------------------------------------------------------------------
// Serialisation helpers (key ↔ value ↔ SettingsMap)
// ---------------------------------------------------------------------------

/**
 * Convert a flat `SettingsMap` into key-value rows for the DB.
 * Booleans become "true"/"false"; numbers become stringified.
 */
export function settingsMapToRows(
  map: SettingsMap,
): Array<{ key: string; value: string }> {
  return [
    { key: "theme", value: map.theme },
    { key: "board.style", value: map.boardStyle },
    { key: "board.showCoords", value: String(map.showCoords) },
    { key: "board.highlightLastMove", value: String(map.highlightLastMove) },
    { key: "engine.defaultEngine", value: map.defaultEngine },
    { key: "engine.autoAnalyze", value: String(map.autoAnalyze) },
    { key: "engine.analysisDepth", value: String(map.analysisDepth) },
    { key: "sync.syncOnStart", value: String(map.syncOnStart) },
    { key: "sync.syncInterval", value: String(map.syncInterval) },
    { key: "sync.autoImportChessCom", value: String(map.autoImportChessCom) },
    { key: "sync.autoImportLichess", value: String(map.autoImportLichess) },
  ];
}

/** Merge DB rows into a `SettingsMap`, falling back to defaults. */
export function rowsToSettingsMap(
  rows: Array<{ key: string; value: string }>,
): SettingsMap {
  const map = { ...DEFAULT_SETTINGS };
  const lookup = new Map(rows.map((r) => [r.key, r.value]));

  const str = (k: string, fallback: string) => lookup.get(k) ?? fallback;
  const bool = (k: string, fallback: boolean) => {
    const v = lookup.get(k);
    if (v === undefined) return fallback;
    return v === "true";
  };
  const num = (k: string, fallback: number) => {
    const v = lookup.get(k);
    if (v === undefined) return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  map.theme = str("theme", DEFAULT_SETTINGS.theme) as SettingsMap["theme"];
  map.boardStyle = str("board.style", DEFAULT_SETTINGS.boardStyle) as SettingsMap["boardStyle"];
  map.showCoords = bool("board.showCoords", DEFAULT_SETTINGS.showCoords);
  map.highlightLastMove = bool("board.highlightLastMove", DEFAULT_SETTINGS.highlightLastMove);
  map.defaultEngine = str("engine.defaultEngine", DEFAULT_SETTINGS.defaultEngine);
  map.autoAnalyze = bool("engine.autoAnalyze", DEFAULT_SETTINGS.autoAnalyze);
  map.analysisDepth = num("engine.analysisDepth", DEFAULT_SETTINGS.analysisDepth);
  map.syncOnStart = bool("sync.syncOnStart", DEFAULT_SETTINGS.syncOnStart);
  map.syncInterval = num("sync.syncInterval", DEFAULT_SETTINGS.syncInterval);
  map.autoImportChessCom = bool("sync.autoImportChessCom", DEFAULT_SETTINGS.autoImportChessCom);
  map.autoImportLichess = bool("sync.autoImportLichess", DEFAULT_SETTINGS.autoImportLichess);

  return map;
}

/**
 * Parse a partial update (only changed keys) into DB rows.
 * Values are serialised the same way as `settingsMapToRows`.
 */
export function partialMapToRows(
  partial: Partial<SettingsMap>,
): Array<{ key: string; value: string }> {
  const rows: Array<{ key: string; value: string }> = [];
  if (partial.theme !== undefined) rows.push({ key: "theme", value: partial.theme });
  if (partial.boardStyle !== undefined) rows.push({ key: "board.style", value: partial.boardStyle });
  if (partial.showCoords !== undefined) rows.push({ key: "board.showCoords", value: String(partial.showCoords) });
  if (partial.highlightLastMove !== undefined) rows.push({ key: "board.highlightLastMove", value: String(partial.highlightLastMove) });
  if (partial.defaultEngine !== undefined) rows.push({ key: "engine.defaultEngine", value: partial.defaultEngine });
  if (partial.autoAnalyze !== undefined) rows.push({ key: "engine.autoAnalyze", value: String(partial.autoAnalyze) });
  if (partial.analysisDepth !== undefined) rows.push({ key: "engine.analysisDepth", value: String(partial.analysisDepth) });
  if (partial.syncOnStart !== undefined) rows.push({ key: "sync.syncOnStart", value: String(partial.syncOnStart) });
  if (partial.syncInterval !== undefined) rows.push({ key: "sync.syncInterval", value: String(partial.syncInterval) });
  if (partial.autoImportChessCom !== undefined) rows.push({ key: "sync.autoImportChessCom", value: String(partial.autoImportChessCom) });
  if (partial.autoImportLichess !== undefined) rows.push({ key: "sync.autoImportLichess", value: String(partial.autoImportLichess) });
  return rows;
}
