/**
 * @repo/api server — the Elysia app shared by both hosts:
 *  - Standalone runner: src/standalone.ts → `app.listen(port)`.
 *  - Desktop host: apps/desktop/src/bun/server.ts → `startElysiaServer(port)`.
 *
 * Minimal for now: CORS + `/health` + the games routes. Add auth middleware
 * and more chess routes (analysis, play, repertoire) as the app grows.
 */
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { env } from "@repo/env";
import { gamesRoutes } from "./routes/games";
import { enginesRoutes } from "./routes/engines";
import { playRoutes } from "./routes/play";
import { databasesRoutes } from "./routes/databases";
import { accountsRoutes } from "./routes/accounts";
import { filesRoutes } from "./routes/files";
import { authRoutes } from "./routes/auth";
import { settingsRoutes } from "./routes/settings";

/**
 * CORS allow-list. Origins that may call the API from a browser.
 *
 * In the Electrobun desktop app the webview loads from the virtual
 * `views://mainview/` scheme and requests are same-origin / trusted, so this
 * list is mostly irrelevant there. It matters for `bun run dev:web`, where the
 * SPA runs on the Vite dev server (default http://localhost:5173) and calls the
 * Elysia API (default :4001) cross-origin. Without the dev origin in the list,
 * every fetch from the browser fails the CORS preflight and the SPA blanks.
 *
 * - `NEXT_PUBLIC_APP_URL` is included for parity with server-mode deployments.
 * - `CORS_ALLOW_ORIGINS` lets the operator add arbitrary origins via env.
 * - The Vite dev origin (and a couple of common alt ports) are implicit so
 *   `dev:web` works without env config.
 */
const VITE_DEV_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const corsOrigins = [
  env.NEXT_PUBLIC_APP_URL,
  ...VITE_DEV_ORIGINS,
  ...(process.env.CORS_ALLOW_ORIGINS?.split(",")
    .map((o) => o.trim())
    .filter(Boolean) ?? []),
];

export const app = new Elysia()
  .use(
    cors({
      origin: corsOrigins,
      methods: ["GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  .get("/", () => ({
    name: "chess-coach-api",
    version: "0.1.0",
  }))
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }))
  .use(gamesRoutes)
  .use(enginesRoutes)
  .use(playRoutes)
  .use(databasesRoutes)
  .use(accountsRoutes)
  .use(filesRoutes)
  .use(authRoutes)
  .use(settingsRoutes);

export type App = typeof app;

/**
 * Check engine health at server startup and self-heal a broken active row.
 *
 * Non-blocking — runs in the background so it doesn't delay the server from
 * accepting requests. If the active engine's binary is missing on disk (a
 * common failure when an older install layout left a stale `path` in the DB,
 * e.g. pointing into `build/.../bin/engines/...` after the user re-downloaded
 * a different build to the current APP_DATA_DIR location), this promotes the
 * first still-existing engine to active so analysis works on the first try.
 */
export async function logEngineHealth(): Promise<void> {
  try {
    const { engineRepository } = await import("@repo/db");
    const { existsSync } = await import("node:fs");
    const active = await engineRepository.getActive();

    const existingWithUsablePath = async () => {
      const all = await engineRepository.list();
      return all.find((e) => !!e.path && existsSync(e.path)) ?? null;
    };

    if (!active) {
      // No active engine — auto-activate the first usable one, if any.
      const usable = await existingWithUsablePath();
      if (usable) {
        await engineRepository.setActive(usable.id);
        console.log(
          `[server] ✓ Auto-activated existing engine: ${usable.name} at ${usable.path}`
        );
      } else {
        console.warn("[server] ⚠ No active engine configured. Analysis will 503.");
      }
      return;
    }

    if (!active.path) {
      console.warn(`[server] ⚠ Active engine "${active.name}" has no binary path.`);
      const usable = await existingWithUsablePath();
      if (usable && usable.id !== active.id) {
        await engineRepository.setActive(usable.id);
        console.log(
          `[server] ✓ Re-activated usable engine: ${usable.name} at ${usable.path}`
        );
      }
      return;
    }

    if (!existsSync(active.path)) {
      console.warn(
        `[server] ⚠ Active engine "${active.name}" binary not found: ${active.path}`
      );
      const usable = await existingWithUsablePath();
      if (usable && usable.id !== active.id) {
        await engineRepository.setActive(usable.id);
        console.log(
          `[server] ✓ Active engine binary missing — re-activated ${usable.name} at ${usable.path}`
        );
      }
      return;
    }

    console.log(`[server] ✓ Active engine: ${active.name} at ${active.path}`);
  } catch (err) {
    console.warn("[server] Could not check engine health:", err);
  }
}
