/**
 * @repo/db — public entry.
 *
 * Exports:
 *  - `db` / `pgDb`: lazy Drizzle proxies (await-free; auto-wait on init).
 *  - `initDB()`: explicitly initialize PGlite + run migrations. Idempotent.
 *  - `setDbInstance()`: inject a Drizzle instance (tests).
 *  - `runMigrations()`: low-level migration runner.
 *  - all schema tables/types (via schema.pg).
 *  - `gameRepository` + repo types (via repository).
 */
export { db, pgDb, initDB, setDbInstance } from "./db";

export * from "./schema.pg";

export { runMigrations } from "./migrations";

export * from "./repository";
