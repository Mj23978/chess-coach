import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite/vector";
import { pgtap } from "@electric-sql/pglite/pgtap";
import { drizzle } from "drizzle-orm/pglite";
import { join } from "node:path";
import * as schema from "./schema.pg";
import { runMigrations } from "./migrations";
import { env } from "@repo/env";

type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>;

let pgliteInstance: PGlite | null = null;
let dbInstance: DrizzleClient | null = null;
let initPromise: Promise<DrizzleClient> | null = null;

/**
 * Resolve the PGlite database path.
 *
 * Desktop host takes precedence: when `globalThis.__CHESS_COACH_DESKTOP__` is
 * set (by `apps/desktop/src/bun/index.ts`, BEFORE this module is imported),
 * the DB lives at `${appDataDir}/chess-coach.db` — a stable, per-user path
 * that survives restarts. We deliberately IGNORE any `DATABASE_URL` in this
 * branch because Bun auto-loads `.env` files up the CWD and a leaked
 * `DATABASE_URL` would point at a transient path.
 *
 * For all other hosts (standalone server, tests), fall back to
 * `process.env.DATABASE_URL` (read live — this module may be imported before
 * the host sets its env), then the env snapshot, then `./.db`.
 */
function resolveDatabasePath(): string {
  const desktop = (globalThis as any).__CHESS_COACH_DESKTOP__ as
    | { appDataDir?: string }
    | undefined;
  if (desktop?.appDataDir) {
    return join(desktop.appDataDir, "chess-coach.db");
  }
  return process.env.DATABASE_URL ?? env.DATABASE_URL ?? "./.db";
}

export function initDB(): Promise<DrizzleClient> {
  if (!initPromise) {
    initPromise = (async () => {
      const dbPath = resolveDatabasePath();
      console.log(`[db] PGlite database at ${dbPath}`);
      pgliteInstance = new PGlite(dbPath, {
        extensions: { vector, pgtap }
      });
      await pgliteInstance.waitReady;

      // Run migrations before wrapping in Drizzle
      await runMigrations(pgliteInstance);

      // Set instance
      dbInstance = drizzle(pgliteInstance, { schema });
      return dbInstance;
    })();
  }
  return initPromise;
}

// Auto-initialize at module load ONLY when no host has signaled it will drive
// initialization itself. The Electrobun desktop host sets
// `__CHESS_COACH_DESKTOP__` on globalThis and calls `initDB()` itself after the
// env is ready — auto-init there would race the preload shim. Other hosts
// (standalone server, tests) get the convenience auto-init.
if (!(globalThis as any).__CHESS_COACH_DESKTOP__) {
  initDB().catch((err) => console.error("Failed to initialize database:", err));
}

/**
 * Inject a pre-initialized Drizzle instance (and underlying PGlite) into the
 * module-level singletons. This is primarily used by tests so that the
 * `pgDb`/`db` proxy used by domain code points at the same in-memory test
 * database the test harness sets up, instead of spinning up its own separate
 * `./.db` instance.
 *
 * Calling this resolves the init promise immediately so any code awaiting
 * `initDB()` continues to work transparently.
 */
export function setDbInstance(instance: DrizzleClient): void {
  dbInstance = instance;
  initPromise = Promise.resolve(instance);
}

// A Proxy that intercepts all method calls (select, insert, update, delete)
// and forces them to wait for the initialization promise to resolve.
export const db = new Proxy({} as DrizzleClient, {
  get(target, prop, receiver) {
    if (!dbInstance) {
      // If someone accesses db properties before init is complete,
      // return a proxy handler that waits for the promise.
      return (...args: any[]) => {
        return initDB().then((resolvedDb) => {
          const method = (resolvedDb as any)[prop];
          if (typeof method === "function") {
            return method.apply(resolvedDb, args);
          }
          return method;
        });
      };
    }

    // Once initialized, fall back to lightning-fast direct access
    const value = (dbInstance as any)[prop];
    if (typeof value === "function") {
      return value.bind(dbInstance);
    }
    return value;
  },
});

// Match your current exports
export const pgDb = db;
