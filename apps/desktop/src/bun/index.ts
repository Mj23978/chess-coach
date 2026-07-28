/**
 * Electrobun Bun main entry — preload shim.
 *
 * This file runs FIRST and does only two things:
 *  1. Load the user's `.env` from the app data directory (AI keys, auth secret).
 *  2. Set desktop-default values for env vars that `@repo/env` requires but the
 *     desktop context doesn't meaningfully have (S3 config — the filesystem
 *     backend ignores it; `NEXT_PUBLIC_*` — set to the localhost API URL at
 *     runtime).
 *
 * It MUST run before any `@repo/*` package is imported, because those packages
 * import `@repo/env` at module load time and it validates `process.env`
 * eagerly. ES module imports are hoisted, so we can't put the env setup in the
 * same file as the `@repo/*` imports — instead this shim dynamically imports
 * `./main.ts` after the environment is ready.
 *
 * The real boot sequence (PGlite, storage backend, Elysia server, window) lives
 * in `./main.ts`.
 */
import { config as loadDotenv } from "dotenv";
import { join, dirname } from "node:path";
import { mkdirSync, existsSync, writeFileSync, readFileSync } from "node:fs";

// We need Utils.paths.userData from electrobun/bun to locate the app data dir.
// This import is safe — electrobun/bun doesn't touch @repo/env.
import { Utils } from "electrobun/bun";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// 0. Migrations directory — point at the Drizzle SQL migrations.
//    `@repo/db`'s migrations runner resolves `path.join(MIGRATIONS_DIR,
//    "./migrations")`, so MIGRATIONS_DIR must be the PARENT of the migrations
//    folder.
//
//    Two contexts:
//    - Dev (`electrobun dev` / `bun --watch`): this file runs from source at
//      `apps/desktop/src/bun/index.ts`; the migrations live in the monorepo at
//      `packages/api/migrations/`. Resolve via cwd (`apps/desktop/`).
//    - Built bundle: `electrobun build` copies the staged migrations into the
//      app resources at `Resources/app/migrations/` (see electrobun.config.ts
//      `copy` + scripts/stage-native-assets.mjs). The bundled index.js lives
//      at `Resources/app/bun/index.js`, so the migrations are one dir up +
//      `migrations/`: `../../migrations` from this file's bundled location,
//      and MIGRATIONS_DIR is the parent of that.
//
//    We probe each candidate and pick the first whose journal exists, so the
//    resolution is deterministic regardless of cwd (which Bun sets to the
//    bin/ launcher dir in the built app, not a useful anchor).
// ---------------------------------------------------------------------------
{
  const thisFileDir = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    // Dev: cwd is apps/desktop/ → ../../packages/api
    resolve(process.cwd(), "../../packages/api"),
    // Built bundle: this file is at Resources/app/bun/index.js;
    // migrations ship at Resources/app/migrations/, so MIGRATIONS_DIR (the
    // PARENT of `migrations/`) is Resources/app/.
    resolve(thisFileDir, "../"),
  ];
  const found = candidates.find((c) =>
    existsSync(join(c, "migrations", "meta", "_journal.json")),
  );
  if (found) {
    process.env.MIGRATIONS_DIR = found;
  } else {
    // Last resort: the dev monorepo path even if the journal isn't there yet
    // (produces a clearer "no journal" error from the runner than a missing dir).
    process.env.MIGRATIONS_DIR = resolve(process.cwd(), "../../packages/api");
  }
  console.log(`[desktop] Migrations base: ${process.env.MIGRATIONS_DIR}`);
}

// ---------------------------------------------------------------------------
// 1. App data directory + .env
// ---------------------------------------------------------------------------
const APP_DATA_DIR = Utils.paths.userData;
const STORAGE_DIR = join(APP_DATA_DIR, "storage");
const ENV_FILE = join(APP_DATA_DIR, ".env");

// Expose APP_DATA_DIR to process.env so backend packages (@repo/api routes)
// that read process.env.APP_DATA_DIR (e.g. engine downloads) resolve to the
// correct app data location instead of falling back to process.cwd().
process.env.APP_DATA_DIR = APP_DATA_DIR;

mkdirSync(APP_DATA_DIR, { recursive: true });
mkdirSync(STORAGE_DIR, { recursive: true });

// Seed a default .env on first run.
if (!existsSync(ENV_FILE)) {
  writeFileSync(
    ENV_FILE,
    [
      `# Chess Coach desktop environment configuration.`,
      `# Edit and restart the app to apply changes.`,
      ``,
      `# Better-Auth — generate a strong random secret for production.`,
      `BETTER_AUTH_SECRET=change-me-to-a-random-secret`,
      ``,
      `# AI provider keys (add the ones you use for analysis/coaching).`,
      `OPENAI_API_KEY=`,
      `ANTHROPIC_API_KEY=`,
      ``,
    ].join("\n"),
    "utf-8",
  );
  console.log(`[desktop] Seeded default env at ${ENV_FILE}`);
}

// Load the .env into process.env. Existing process.env values win (dotenv
// default), so runtime-injected vars below aren't overwritten.
loadDotenv({ path: ENV_FILE });

// ---------------------------------------------------------------------------
// 2. Desktop defaults for vars @repo/env requires but desktop doesn't use.
//    These must be set BEFORE @repo/env is imported (in main.ts).
// ---------------------------------------------------------------------------

// S3 config — the filesystem backend ignores these, but @repo/env validates
// them and @repo/storage's minioBackend reads them lazily. Set harmless dummies
// so validation passes; they're never contacted on the desktop host.
process.env.S3_BUCKET ??= "chess-coach-desktop";
process.env.S3_ENDPOINT ??= "http://localhost:9000";
process.env.S3_ACCESS_KEY ??= "desktop-noop";
process.env.S3_SECRET_KEY ??= "desktop-noop";

// JWT_SECRET — required by @repo/env. Derive from BETTER_AUTH_SECRET if the
// user set that, else a stable per-install random value persisted to .env.
if (!process.env.JWT_SECRET) {
  if (process.env.BETTER_AUTH_SECRET && process.env.BETTER_AUTH_SECRET !== "change-me-to-a-random-secret") {
    process.env.JWT_SECRET = process.env.BETTER_AUTH_SECRET;
  } else {
    // Generate once and persist so sessions survive restarts.
    const { randomBytes } = await import("node:crypto");
    const generated = randomBytes(32).toString("hex");
    process.env.JWT_SECRET = generated;
    // Append to .env for next boot.
    const existing = readFileSync(ENV_FILE, "utf-8");
    writeFileSync(ENV_FILE, `${existing}\n# Auto-generated JWT_SECRET (stable per install)\nJWT_SECRET=${generated}\n`, "utf-8");
    console.log("[desktop] Generated and persisted JWT_SECRET");
  }
}

// DATABASE_URL — always pin to the appData PGlite file. We do NOT use `??=`
// here because Bun auto-loads `.env` files by walking up from the process CWD,
// and `DATABASE_URL=./.db` is pinned in several repo `.env` files (root,
// apps/desktop, packages/db, packages/api). That leak would point PGlite at
// `<cwd>/.db` (relative to the launcher's CWD — inside the install dir, wiped
// on every rebuild/reinstall), losing all users/sessions on restart. The
// desktop DB path is a host decision, not an env one. `@repo/db`'s
// `resolveDatabasePath()` also reads `__CHESS_COACH_DESKTOP__` directly as a
// belt-and-suspenders guard, but keeping `process.env.DATABASE_URL` correct
// here matters too — the `/debug/db-info` route echoes it, and any other code
// reading it directly stays consistent.
process.env.DATABASE_URL = join(APP_DATA_DIR, "chess-coach.db");

// NEXT_PUBLIC_* — set to a placeholder; the real value (the picked localhost
// port) is assigned in main.ts after the port is chosen.
process.env.NEXT_PUBLIC_APP_URL ??= "http://localhost:0";
process.env.NEXT_PUBLIC_API_URL ??= "http://localhost:0";

// Expose the resolved paths to main.ts via globalThis (avoids re-computing
// Utils.paths.userData, which may differ once the event loop advances).
(globalThis as any).__CHESS_COACH_DESKTOP__ = {
  appDataDir: APP_DATA_DIR,
  storageDir: STORAGE_DIR,
  envFile: ENV_FILE,
};

// ---------------------------------------------------------------------------
// 3. Dynamically import the real main (now that env is ready).
// ---------------------------------------------------------------------------
await import("./main");
