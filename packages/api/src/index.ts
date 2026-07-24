/**
 * @repo/api — public entry.
 *
 * Re-exports the configured Elysia `app` (CORS + health + routes). Both hosts
 * import `app` from here:
 *  - Standalone runner: src/standalone.ts → `app.listen(port)`.
 *  - Desktop host: apps/desktop/src/bun/server.ts → `startElysiaServer(port)`.
 */
export { app } from "./server";
export type { App } from "./server";
