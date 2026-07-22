/**
 * Pre-build step: stage native (WASM / data / tarball) assets that the Bun
 * bundler can't inline into the single-file Electrobun bundle.
 *
 * Problem: `electrobun build` runs `bun build` on `src/bun/index.ts`, which
 * produces one `index.js` at `Resources/app/bun/index.js`. PGlite (via
 * `@repo/db`) loads its WASM runtime with `new URL("./pglite.data",
 * import.meta.url)` — i.e. it looks for the data file NEXT TO the bundled
 * `index.js`. The bundler drops those binary sidecars, so at runtime PGlite
 * throws ENOENT on `pglite.data` and "Extension bundle not found" on
 * `vector.tar.gz` / `pgtap.tar.gz`.
 *
 * Fix: copy the five PGlite assets from node_modules into a stable staging
 * directory (`native-assets/`). `electrobun.config.ts` then ships that
 * directory to `Resources/app/bun/` via its `copy` directive, placing the
 * files exactly where PGlite's `import.meta.url`-relative resolution expects
 * them.
 *
 * Idempotent and safe to run before every build / dev launch.
 */
import { cpSync, mkdirSync, existsSync, readdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const monorepoRoot = resolve(projectRoot, "..", "..");
const require = createRequire(import.meta.url);

// PGlite is a transitive dep of `@repo/db`, not a direct dep of the desktop
// app — so it isn't in `apps/desktop/node_modules`. Resolve it through
// `@repo/db`'s module graph instead: `@repo/db` IS a direct workspace dep
// of the desktop app, and its own require context can see PGlite regardless
// of whether the install layout is bun's flattened `.bun/` dir, pnpm, or
// plain npm hoisting.
const dbPackagePath = require.resolve("@repo/db");
const dbRequire = createRequire(dbPackagePath);
let pgliteDist;
try {
  pgliteDist = dirname(dbRequire.resolve("@electric-sql/pglite/dist/index.js"));
} catch {
  // Fallback: scan the bun `.bun` isolated-layout directory. Each package
  // lives at `.bun/<name>@<version>/node_modules/<name>/`.
  const bunDir = join(monorepoRoot, "node_modules", ".bun");
  if (existsSync(bunDir)) {
    const candidate = readdirSync(bunDir)
      .filter((d) => d.startsWith("@electric-sql+pglite@"))
      .map((d) => join(bunDir, d, "node_modules", "@electric-sql", "pglite", "dist"))
      .find((d) => existsSync(join(d, "pglite.data")));
    if (candidate) pgliteDist = candidate;
  }
}

const stageDir = join(projectRoot, "native-assets");

// Assets PGlite loads at runtime via import.meta.url-relative URLs or
// extension bundle resolution. Names are fixed by PGlite's own code.
const ASSETS = [
  "pglite.data", // Emscripten FS bundle (Postgres data files)
  "pglite.wasm", // Postgres WASM module
  "initdb.wasm", // initdb WASM module
  "vector.tar.gz", // pgvector extension
  "pgtap.tar.gz", // pgtap extension
];

// Reset the staging dir so stale assets never ship.
if (existsSync(stageDir)) {
  rmSync(stageDir, { recursive: true, force: true });
}
mkdirSync(stageDir, { recursive: true });

let copied = 0;
const missing = [];
for (const name of ASSETS) {
  const src = join(pgliteDist, name);
  if (!existsSync(src)) {
    missing.push(src);
    continue;
  }
  cpSync(src, join(stageDir, name), { force: true });
  copied += 1;
}

if (missing.length > 0) {
  console.error(
    `[stage-native-assets] ERROR: missing PGlite assets:\n  - ${missing.join("\n  - ")}\n` +
      `Resolved pglite dist: ${pgliteDist}\n` +
      `Is @electric-sql/pglite installed? Run \`bun install\`.`,
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Also stage the Drizzle SQL migrations. The desktop Bun main sets
// MIGRATIONS_DIR to a path relative to the bundle (Resources/app/migrations),
// and electrobun.config ships this staging dir there. Without this, the
// bundled app boots against an empty DB schema (all Mastra + app tables
// missing).
// ---------------------------------------------------------------------------
const migrationsSrc = resolve(monorepoRoot, "packages", "api", "migrations");
const migrationsStage = join(stageDir, "migrations");
if (!existsSync(join(migrationsSrc, "meta", "_journal.json"))) {
  console.error(
    `[stage-native-assets] ERROR: migrations journal not found at ${migrationsSrc}/meta/_journal.json`,
  );
  process.exit(1);
}
cpSync(migrationsSrc, migrationsStage, { recursive: true, force: true });
console.log(
  `[stage-native-assets] Staged Drizzle migrations → ${migrationsStage.replace(projectRoot + "/", "")}/`,
);

console.log(
  `[stage-native-assets] Staged ${copied} PGlite assets → ${stageDir.replace(projectRoot + "/", "")}/`,
);
console.debug(
  `[stage-native-assets]   pglite dist: ${pgliteDist}`,
);
