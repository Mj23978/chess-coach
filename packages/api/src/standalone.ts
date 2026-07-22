/**
 * Standalone backend runner — boots @repo/db (PGlite + migrations) then
 * listens on BACKEND_PORT (default 4001). Use for local API-only dev; the
 * desktop app runs its own in-process server via apps/desktop/src/bun.
 */
import "dotenv/config";
import { env } from "@repo/env";
import { app } from "./server";
import { initDB } from "@repo/db";

// Await DB init before listening so the first request hits a ready DB.
await initDB();

app.listen(process.env.BACKEND_PORT ?? env.BACKEND_PORT);

console.log(
  `🦊 chess-coach API running at http://${app.server?.hostname}:${app.server?.port}`,
);
