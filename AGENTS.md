# AGENTS.md — chess-coach

Workspace instructions for ZCode agents. Read this before editing.

## Project goal

**Chess-coach** is a desktop chess coach app: analyze the user's games, play
against them, and point out their mistakes. This workspace was bootstrapped by
copying the `packages/` and `apps/desktop` from an unrelated project ("Aksam",
an AI agent / video-creation platform). The migration to chess-domain code is
largely complete: `@repo/api` (`/games` CRUD) and `@repo/db` (a `games` table
with PGN + a `MoveAnalysis[]` JSON column) are already chess-domain, and the
desktop SPA's env/bun plumbing has been renamed to `CHESS_COACH_*` /
`chess-coach.db`. Remaining work is adding chess *features* (board UI, engine
analysis pipeline, Chess.com sync, puzzles, repertoire) on top of the clean
plumbing.

## Repo layout

- `apps/desktop/` — Electrobun desktop app. Bun main + Vite/React SPA + embedded
  Elysia server. **This is the only app and the product surface.**
  - `src/bun/` — Electrobun Bun (main) process. `index.ts` = env preload shim,
    `main.ts` = real boot, `server.ts` = starts the in-process Elysia API.
  - `src/web/` — the React SPA (moved here from a former `apps/web`). Owns all
    non-landing UI. Path alias `@/` → `src/web/`.
  - `src/web/` — the React SPA. Flat page-based structure (see `App.tsx` +
    `pages/`), rendered via react-router-dom. Path alias `@/` → `src/web/`.
  - `src/web/shims/` — browser shim for `@repo/env` (reads the API base URL
    injected by the Bun main).
  - `views/mainview/` — Vite build output; served via Electrobun `views://`.
  - `electrobun.config.ts`, `scripts/stage-native-assets.mjs` — bundling + PGlite
    native asset staging.
- `packages/` — shared workspace packages (Bun workspace + npm "catalog"):
  - `@repo/api` — Elysia server. `src/server.ts`, `src/routes/*`, `src/standalone.ts`.
  - `@repo/db` — Drizzle ORM + PGlite. `schema/`, `repositories/`, migrations runner.
  - `@repo/storage` — S3/MinIO backend with a filesystem backend for desktop.
  - `@repo/ui` — shared Radix + Tailwind v4 component library (no build step;
    imported as raw `.tsx`).
  - `@repo/env` — env validation via `@t3-oss/env-core` + zod. `index.ts` is
    present and functional (all vars optional/defaulted so the desktop preload
    shim's dummy values validate).
  - `@repo/logger` — consola-based logger.
- `examples/` — reference material, NOT part of the build (never import from
  these in shipped code — copy/adapt instead):
  - `examples/pawn-appetite/` — a mature Tauri 2 + Mantine + chessground chess
    app. Reference for chess UI patterns (board, pieces), Chess.com pubapi
    sync + TCN decoding, Lichess OAuth (PKCE), puzzle DB + adaptive Elo, native
    UCI engine management (Stockfish et al.), ECO openings + repertoire gaps +
    ts-fsrs spaced repetition. Heavy logic is in Rust (`src-tauri/`), so porting
    means re-implementing that in TS; the `src/utils/*.ts(x)` frontend logic is
    framework-agnostic and ports directly.
  - `examples/chess-kit/` — a Next.js + MUI chess app that contains a complete,
    self-contained chess.com/lila-style **move classifier** (Brilliant / Great /
    Best / Excellent / Good / Inaccuracy / Mistake / Blunder). Lives in
    `src/lib/engine/helpers/` + `src/lib/chess.ts` + `src/lib/math.ts`; pure TS
    depending only on `chess.js`. Port these into the desktop app for game review.
- `docker-compose.services.yml` — local infra (pgvector, redis, rustfs/S3,
  inngest, qdrant, searxng). The desktop app uses **embedded PGlite + filesystem
  storage**, so most of these are only relevant if you re-introduce a server mode.


## Build / dev / test commands

> ⚠️ **DO NOT run any of these commands on the current VPS server.** Bun,
> node_modules, drizzle-kit, tsc, and the rest of the toolchain are **not
> installed** on this host (`bun`, `tsc`, `drizzle-kit` are all missing, and
> `node_modules/` does not exist). Do not attempt `bun install`, `bun run
> check-types`, `bun run lint`, `bun run db:generate`, `bun run build`, or any
> other build/type-check/lint/migrate command here — it will fail and waste
> time. Instead, **just write/edit the files and push the changes**. The owner
> pulls the work onto their own Windows PC (where the toolchain is installed)
> and a separate agent runs type-check / lint / migrations / build and refines
> for bugs. Migrations (`.sql`) and any generated artifacts are produced on
> that machine, not here.

Run from repo root. Package manager is **Bun** (`packageManager: bun@1.3.14`),
managed by **Turborepo**.

```bash
bun install                       # install (workspace + catalog resolution)
bun run dev --filter=@chess-coach/desktop   # desktop app (electrobun dev)
bun --filter=@chess-coach/desktop run dev:web  # SPA-only Vite dev server (HMR), port 5173
bun run dev:backend               # @repo/api standalone (Elysia)
bun run check-types               # turbo check-types (tsc --noEmit across pkgs)
bun run lint                      # turbo lint (Biome — @biomejs/biome)
bun run format                    # prettier --write on **/*.{ts,tsx,md}
bun run build                     # turbo build
bun run clean                     # git clean -xdf .cache .turbo dist node_modules
bun run db:generate               # drizzle-kit generate (schema → migration folder sync)
bun run db:push                   # drizzle-kit push (schema → DB)
bun run db:migrate                # drizzle-kit migrate
bun run db:studio                 # drizzle-kit studio
```

Per-package typecheck: each package has a `typecheck` (or `type-check`) script
(`tsc --noEmit`). API + db have `test` / `test:run` via **vitest**.

> Build is expected to fail until the missing `@repo/*` packages are either
> restored, re-implemented, or removed from imports.
>
> (Reminder: none of these commands run on this VPS — see the ⚠️ note above.
> Edit the files, commit, and push; verification happens on the owner's PC.)

## Architecture boundaries & layer rules

1. **Desktop = one process, embedded everything.** The Electrobun Bun main boots
   PGlite (in-process Postgres), registers the filesystem storage backend, and
   starts the Elysia API (`@repo/api`) on a free localhost port. The webview SPA
   talks to that API over plain HTTP (cookies + SSE work natively). **Do not
   assume a separate server process or external Postgres for desktop.**
2. **Env ordering is load-bearing.** `src/bun/index.ts` (preload shim) MUST run
   before any `@repo/*` import: it loads the app-data `.env`, sets desktop
   defaults (S3 dummies, `DATABASE_URL` → `${APP_DATA_DIR}/chess-coach.db`,
   `NEXT_PUBLIC_*` placeholders), then dynamically imports `main.ts`. `@repo/env`
   validates `process.env` eagerly at import time — break this order and boot
   fails. See the long comment block in `src/bun/index.ts`.
3. **`@repo/env` is shimmed in the browser.** The SPA never imports the real
   `@repo/env`; Vite aliases it to `src/web/shims/env.ts`, which reads the API
   base URL from `window.__CHESS_COACH_API_BASE__` (injected by the Bun main).
   Keep browser/server env access separated.
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

> Reminder: per the ⚠️ note in **Build / dev / test commands** above, do **not**
> run build/type-check/lint/migrate commands on this VPS — they are not
> installed here. Just write the code carefully and push; another agent on the
> owner's Windows PC verifies and refines.

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
  `CHESS_COACH_DEV_API_PORT` or 4001.
- **Windows icon** ships at `src/web/public/favicon.ico` and is referenced from
  `electrobun.config.ts` (`win.icon`) and the tray (`views://mainview/favicon.ico`).

## Project Management System

This project uses a structured task management system in `.project/` to enable
parallel development and persist work across sessions. **Read this section before
starting any implementation work.**

### Directory Structure

```
.project/
├── ROADMAP.md           # Master task list with all features and tasks
├── plans/               # Implementation plans for each feature
│   └── PLAN-XXX-name/   # One folder per plan
│       ├── plan.md      # Plan overview and approach
│       ├── task-YYY.md  # Individual task files
│       └── notes.md     # Implementation notes
├── backlog/             # Deferred or unplanned tasks
└── context/             # Shared context files for investigation results
```

### Workflow for Agents

1. **Before starting**: Read `.project/ROADMAP.md` to understand the full scope
   and find a task with status `TODO` and no blocking dependencies.

2. **Pick a plan**: Each plan folder covers a cohesive feature area. Multiple
   agents can work on different plans simultaneously without conflicts.

3. **Document work**: 
   - Create/update task files in the plan folder
   - Store investigation findings in `.project/context/`
   - Update task status in `ROADMAP.md` when starting/completing

4. **Handoff**: When passing work to another agent, the task files and context
   provide everything needed to continue without re-investigating.

### Current Plan Folders

| Plan ID | Feature | Phase | Parallel Safe |
|---------|---------|-------|---------------|
| PLAN-001 | App Shell & Navigation | 1 | ✅ Yes |
| PLAN-002 | Dashboard Redesign | 2 | ✅ Yes (after PLAN-001) |
| PLAN-003 | Board Page Redesign | 3 | ✅ Yes (after PLAN-001) |
| PLAN-004 | Accounts & Sync | 4 | ✅ Yes (after PLAN-001) |
| PLAN-005 | Databases Page | 5 | ✅ Yes (after PLAN-001) |
| PLAN-006 | Files Page | 6 | ✅ Yes (after PLAN-001) |
| PLAN-007 | Engines Page Polish | 7 | ✅ Yes |
| PLAN-008 | Settings & Keybindings | 8 | ✅ Yes |

### Task Status Convention

- `TODO` — Not started, available for pickup
- `IN_PROGRESS` — Currently being worked on (agent name + date)
- `BLOCKED` — Blocked by another task (note which one)
- `DONE` — Completed (note completion date)
- `DEFERRED` — Moved to backlog or future phase

### Example Task File

```markdown
# F1-001: Create AppShell Component

**Status**: IN_PROGRESS
**Started**: 2026-07-24
**Agent**: main

## Objective
Create the main layout wrapper that provides the navigation rail and content area.

## Approach
1. Create AppShell.tsx in src/web/components/layout/
2. Use flex layout with fixed-width left rail
3. Accept children for the main content area

## Dependencies
- None

## Files Affected
- src/web/components/layout/AppShell.tsx (new)
- src/web/App.tsx (modify)

## Notes
- Reference examples/pawn-appetite/src/routes/__root.tsx for layout pattern
- Use @repo/ui Card component for styling consistency
```

---

## Things to read before touching sensitive areas

- `.project/ROADMAP.md` — **START HERE** for task assignments and project status.
- `apps/desktop/src/bun/index.ts` — env preload order (don't reorder imports).
- `apps/desktop/src/bun/main.ts` — boot sequence + dev/prod webview branching.
- `apps/desktop/electrobun.config.ts` — bundle `copy` paths + PGlite asset
  placement rationale.
- `apps/desktop/vite.config.ts` — alias/shim resolution + `base: "./"` rationale.
- `packages/api/README.md` — backend architecture (note: it may describe the
  original Aksam layout; the live route surface is `/games` CRUD in
  `src/routes/games.ts`).
- `packages/db/README.md` — Drizzle + PGlite setup.
