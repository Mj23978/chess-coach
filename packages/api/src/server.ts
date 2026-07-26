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

const corsOrigins = [
  env.NEXT_PUBLIC_APP_URL,
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
  .use(authRoutes);

export type App = typeof app;
