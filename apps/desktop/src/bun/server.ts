/**
 * Thin wrapper that starts the @repo/api Elysia app on a given port.
 *
 * Importing `app` from @repo/api triggers any module-load-time wiring in the
 * api package. The desktop host and the standalone backend
 * (packages/api/src/standalone.ts) share the exact same `app` — the only
 * difference is who calls `listen()` and on what port.
 */
import { app } from "@repo/api";

export async function startElysiaServer(port: number): Promise<void> {
  app.listen(port);
}
