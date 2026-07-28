/**
 * Settings routes — GET/PATCH /settings.
 *
 * Simple key-value store backed by the `settings` table. The SPA fetches the
 * full settings map on mount and patches individual keys on change. All values
 * are strings in the DB; the repository layer handles serialisation.
 *
 *   GET    /settings        → { settings: SettingsMap }
 *   PATCH  /settings        → { settings: SettingsMap }  (partial update)
 *   DELETE /settings        → { settings: SettingsMap }  (reset to defaults)
 */
import { Elysia, t } from "elysia";
import { settingsRepository } from "@repo/db";
import type { SettingsMap } from "@repo/db";

export const settingsRoutes = new Elysia({ prefix: "/settings" })
  /**
   * GET /settings — load all settings (merged with defaults).
   * Returns the full SettingsMap so the SPA can hydrate its context.
   */
  .get("/", async () => {
    const settings = await settingsRepository.getAll();
    return { settings };
  })

  /**
   * PATCH /settings — partial update.
   * Body is a subset of SettingsMap keys; only provided keys are persisted.
   * Returns the full merged SettingsMap after upsert.
   */
  .patch(
    "/",
    async ({ body }) => {
      const settings = await settingsRepository.updatePartial(body);
      return { settings };
    },
    {
      body: t.Object({
        theme: t.Optional(
          t.Union([t.Literal("light"), t.Literal("dark"), t.Literal("system")]),
        ),
        boardStyle: t.Optional(
          t.Union([
            t.Literal("brown"),
            t.Literal("blue"),
            t.Literal("green"),
            t.Literal("purple"),
          ]),
        ),
        showCoords: t.Optional(t.Boolean()),
        highlightLastMove: t.Optional(t.Boolean()),
        defaultEngine: t.Optional(t.String()),
        autoAnalyze: t.Optional(t.Boolean()),
        analysisDepth: t.Optional(t.Number({ minimum: 1, maximum: 50 })),
        syncOnStart: t.Optional(t.Boolean()),
        syncInterval: t.Optional(t.Number({ minimum: 1, maximum: 1440 })),
        autoImportChessCom: t.Optional(t.Boolean()),
        autoImportLichess: t.Optional(t.Boolean()),
      }),
    },
  )

  /**
   * DELETE /settings — reset all settings to defaults.
   */
  .delete("/", async () => {
    const settings = await settingsRepository.resetAll();
    return { settings };
  });
