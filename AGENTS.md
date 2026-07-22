# AGENTS.md — chess-coach

Workspace instructions for ZCode agents. Read this before editing.

## Project goal

**Chess-coach** is a desktop chess coach app: analyze the user's games, play
against them, and point out their mistakes. This workspace was bootstrapped by
copying the `packages/` and `apps/desktop` from an unrelated project ("Aksam",
an AI agent / video-creation platform). **The source is mid-migration and does
not yet build.** Expect broken imports, missing workspace packages, and
Aksam-specific routes/schemas that need to be replaced with chess-domain ones.

When asked to "clean packages and apps," the target end state is:
`@repo/api` + `@repo/db` schemas/routes serve chess concepts (games, analyses,
positions, opening repertoires, play sessions), and the desktop SPA's routes
become chess coach routes (dashboard, game review, play, repertoire, etc.).

## Repo layout

- `apps/desktop/` — Electrobun desktop app. Bun main + Vite/React SPA + embedded
  Elysia server. **This is the only app and the product surface.**
  - `src/bun/` — Electrobun Bun (main) process. `index.ts` = env preload shim,
    `main.ts` = real boot, `server.ts` = starts the in-process Elysia API.
  - `src/web/` — the React SPA (moved here from a former `apps/web`). Owns all
    non-landing UI. Path alias `@/` → `src/web/`.
  - `src/web/app/` — Next.js-style route tree (`(auth)`, `(protected)`) rendered
    via react-router (see `App.tsx`). `next/*` imports resolve to hand-written
    shims under `src/web/shims/next/*`.
  - `src/web/shims/` — browser shims for `next/*` and `@repo/env`.
  - `views/mainview/` — Vite build output; served via Electrobun `views://`.
  - `electrobun.config.ts`, `scripts/stage-native-assets.mjs` — bundling + PGlite
    native asset staging.
- `packages/` — shared workspace packages (Bun workspace + npm "catalog"):
  - `@repo/api` — Elysia server. `src/server.ts`, `src/routes/*`, `src/standalone.ts`.
  - `@repo/db` — Drizzle ORM + PGlite. `schema/`, `repositories/`, migrations runner.
  - `@repo/storage` — S3/MinIO backend with a filesystem backend for desktop.
  - `@repo/ui` — shared Radix + Tailwind v4 component library (no build step;
    imported as raw `.tsx`).
  - `@repo/env` — env validation via `@t3-oss/env-nextjs` + zod. **NOTE: the
    `src/` was wiped during the copy — only the build contract remains. This is
    a known gap to fix.**
  - `@repo/logger` — consola-based logger.
- `examples/` — reference material, NOT part of the build:
  - `examples/pawn-appetite/` — a Tauri + Mantine + chessground chess app.
    Useful reference for chess UI patterns (board, pieces, @lichess-org/chessground,
    chess logic libs). Do not import from here.
  - `examples/chess-kit/` — empty placeholder.
- `docker-compose.services.yml` — local infra (pgvector, redis, rustfs/S3,
  inngest, qdrant, searxng). The desktop app uses **embedded PGlite + filesystem
  storage**, so most of these are only relevant if you re-introduce a server mode.


## Build / dev / test commands

Run from repo root. Package manager is **Bun** (`packageManager: bun@1.3.14`),
managed by **Turborepo**.

```bash
bun install                       # install (workspace + catalog resolution)
bun run dev --filter=@aksam/desktop         # desktop app (electrobun dev)
bun --filter=@aksam/desktop run dev:web     # SPA-only Vite dev server (HMR), port 5173
bun run dev:backend               # @repo/api standalone (Elysia)
bun run check-types               # turbo check-types (tsc --noEmit across pkgs)
bun run lint                      # turbo lint (Biome — @biomejs/biome)
bun run format                    # prettier --write on **/*.{ts,tsx,md}
bun run build                     # turbo build
bun run clean                     # git clean -xdf .cache .turbo dist node_modules
bun run db:push                   # drizzle-kit push (schema → DB)
bun run db:migrate                # drizzle-kit migrate
bun run db:studio                 # drizzle-kit studio
```

Per-package typecheck: each package has a `typecheck` (or `type-check`) script
(`tsc --noEmit`). API + db have `test` / `test:run` via **vitest**.

> Build is expected to fail until the missing `@repo/*` packages are either
> restored, re-implemented, or removed from imports.

## Architecture boundaries & layer rules

1. **Desktop = one process, embedded everything.** The Electrobun Bun main boots
   PGlite (in-process Postgres), registers the filesystem storage backend, and
   starts the Elysia API (`@repo/api`) on a free localhost port. The webview SPA
   talks to that API over plain HTTP (cookies + SSE work natively). **Do not
   assume a separate server process or external Postgres for desktop.**
2. **Env ordering is load-bearing.** `src/bun/index.ts` (preload shim) MUST run
   before any `@repo/*` import: it loads the app-data `.env`, sets desktop
   defaults (S3 dummies, `DATABASE_URL` → `${APP_DATA_DIR}/aksam.db`,
   `NEXT_PUBLIC_*` placeholders), then dynamically imports `main.ts`. `@repo/env`
   validates `process.env` eagerly at import time — break this order and boot
   fails. See the long comment block in `src/bun/index.ts`.
3. **`@repo/env` is shimmed in the browser.** The SPA never imports the real
   `@repo/env`; Vite aliases it to `src/web/shims/env.ts`, which reads the API
   base URL from `window.__AKSAM_API_BASE__` (injected by the Bun main). Keep
   browser/server env access separated.
4. **`next/*` imports in `src/web/` are normal** — they resolve to shims, not
   real Next.js. Don't "fix" them by adding Next as a dependency; extend the
   shim under `src/web/shims/next/*` if a new Next API is used.
5. **`@repo/ui` is source-consumed.** It has no build step; apps import raw
   `.tsx` via the `./components/*`, `./hooks/*`, `./lib/*`, `./icons/*` exports.
   Use Tailwind v4 conventions (it ships `@repo/ui/postcss.config.mjs`).
6. **DB schema changes require migrations.** Edit `packages/db/schema/*`, then
   `bun run db:generate` (create) / `db:push` (apply to PGlite). The desktop
   bundle copies staged migrations in via `electrobun.config.ts` `copy` +
   `scripts/stage-native-assets.mjs` — keep that path consistent when adding
   migrations.
7. **Don't import from `examples/`.** It's reference-only.

## Coding conventions

- TypeScript strict mode + `noUncheckedIndexedAccess` (root `tsconfig.json`).
  `moduleResolution: "Bundler"`, `target: ES2022`.
- Path aliases (desktop `tsconfig.json` + mirrored in `vite.config.ts`):
  `@/*` → `apps/desktop/src/web/*`, `@repo/*` → `packages/*`.
- Formatting: tabs in `package.json`/`tsconfig.json`; Prettier for
  `**/*.{ts,tsx,md}`; Biome for lint. Match the surrounding file's style.
- Comments: the existing code uses dense, explanatory comment blocks at the top
  of load-bearing files (see `src/bun/index.ts`, `vite.config.ts`,
  `electrobun.config.ts`). Follow that convention for non-obvious logic;
  keep comments factual and update them when behavior changes.

## Desktop gotchas

- **`base: "./"` in `vite.config.ts` is required.** The SPA is served via the
  virtual `views://mainview/` scheme, not HTTP. Absolute asset paths 404 under
  WebView2 and leave a black splash. Keep relative output.
- **`exitOnLastWindowClosed: false`** — closing the window hides to tray; the
  backend keeps running. "Quit" from the tray is the only full exit. The native
  close is not preventable, so "Show" rebuilds a fresh `BrowserWindow`.
- **PGlite native assets** (`pglite.wasm`, `pglite.data`, `initdb.wasm`,
  `vector.tar.gz`, `pgtap.tar.gz`) are staged by `scripts/stage-native-assets.mjs`
  into `native-assets/`, then placed at specific bundle paths by the `copy`
  directives (core assets next to the bundle, extension tarballs one level up).
  Don't reorder these without reading the path-resolution comment in
  `electrobun.config.ts`.
- **Playwright is externalized** in `electrobun.config.ts` (`playwright-core`,
  `chromium-bidi`, etc.) because its runtime `require()`s break Bun's bundler.
  Keep those entries if you touch the bundler config.
- **Dev HMR:** run `dev:web` (Vite on :5173, `strictPort`) and `dev`
  (electrobun) separately. The Bun main points the webview at `127.0.0.1:5173`
  only when `NODE_ENV !== "production"`. API proxy target defaults to
  `AKSAM_DEV_API_PORT` or 4001.
- The Windows icon path in `electrobun.config.ts` points at
  `../../apps/web/public/favicon.ico` — that app no longer exists in this repo.
  Fix the path (or ship a local icon) before a Windows build.

## Things to read before touching sensitive areas

- `apps/desktop/src/bun/index.ts` — env preload order (don't reorder imports).
- `apps/desktop/src/bun/main.ts` — boot sequence + dev/prod webview branching.
- `apps/desktop/electrobun.config.ts` — bundle `copy` paths + PGlite asset
  placement rationale.
- `apps/desktop/vite.config.ts` — alias/shim resolution + `base: "./"` rationale.
- `packages/api/README.md` — backend architecture (note: it describes the
  original Aksam layout; some referenced dirs like `routes/projects.ts` /
  `routes/inngest.ts` are no longer present).
- `packages/db/README.md` — Drizzle + PGlite setup.
