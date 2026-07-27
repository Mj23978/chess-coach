# PLAN-002: Dashboard Redesign — Implementation Notes

**Status**: DONE (D1, D2, D3-001/002/003)
**Completed**: 2026-07-25
**Agent**: main

## What was built

The dashboard (`/`) was rewritten from a flat card-per-game list into the
pawn-appetite-style card stack. All new code lives under
`apps/desktop/src/web/components/dashboard/` (barrel `index.ts`).

### Layout (`pages/dashboard.tsx` — full rewrite, D1-008)
Single `max-w-6xl p-8` container, vertical stack:
1. `WelcomeCard`
2. grid md:cols-3 → `ConnectedAccountsCard` (1) | `TimeControlGrid` (2)
3. `GamesTable` (full width)
4. grid md:cols-3 → `TrainingSuggestionsCard` (2) | `DailyGoalsCard` (1)

The page keeps the existing `onImportPgn` prop (app-level modal) and the
`useQuery(["games"])` call; that query now feeds both `GamesTable` and the
daily-goals counter.

### Components (`components/dashboard/`)
- **`WelcomeCard.tsx`** (D1-001/002/003) — greeting + "Play Now"
  (`navigate("/board")`) + "Import Game" (calls `onImportPgn`).
- **`ConnectedAccountsCard.tsx`** (D1-004) — Chess.com/Lichess rows. Until
  PLAN-004, both render "Not connected" with a link to `/accounts`. Shaped so
  passing an `accounts` array later is a one-prop change.
- **`TimeControlGrid.tsx`** (D1-005/006/007) — four cards (Classical 15+10,
  Rapid 10+0, Blitz 3+2, Bullet 1+0). Click → `navigate("/board", { state:
  { timeControl } })`. `TIME_CONTROLS` is exported so PLAN-003 can reuse the
  shape. Full play mode is PLAN-003; until then the board page (placeholder)
  receives the time control via `location.state`.
- **`GamesTable.tsx`** (D2-001…008) — `@repo/ui` Tabs (Local / Chess.com /
  Lichess) + Table. Local tab is live:
  - Columns: Opponent, Color (W/B chip), Result (Won/Lost/Draw + raw PGN
    result), Accuracy (%), ACPL, Moves (full-move count), Date, Account
    ("Local" badge), Actions ("Analyze" / "Re-analyze").
  - Sorting (D2-007): clickable headers toggle asc/desc; `useMemo` re-sorts.
  - Filtering (D2-008): opponent-name search + All/Analyzed toggle.
  - Rows clickable (D2-006): the opponent cell is a `<Link to="/games/:id">`;
    the Analyze button `stopPropagation`s so it doesn't trigger navigation.
  - Chess.com/Lichess tabs: empty state pointing to `/accounts` (Phase 4).
- **`DailyGoalsCard.tsx`** + **`useDailyGoals.ts`** (D3-001/002/003) — two
  progress bars. Games-played-today is derived from the `games` query length
  via a `localStorage` counter (`chess-coach.dailyGoals`) that rolls over at
  local midnight and seeds its baseline on first run so pre-existing games
  aren't counted as "played today". Puzzles bar is a placeholder (`0/10` +
  "Puzzles arrive with Training."). Streak badge omitted (needs puzzle data).

### Helpers (`lib/dashboard-stats.ts` — new)
Pure functions so the table is a pure view:
- `opponentName`, `userSide`, `resultLabel` — display strings.
- `plyCount` — PGN ply count via `travelGame` (returns `null` on parse error).
- `userAccuracy` — lila accuracy formula over the user-side plies, derived
  from the per-ply `evalCp`/`mate` in `analysis[]`. White-relative evals are
  converted to the mover's frame. Returns `null` when unanalyzed.
- `userAcpl` — mean |cp loss| over the user's plies, in pawns.
- `isAnalyzed` — boolean.

**Note on accuracy math:** the DB stores one eval per ply (the eval AFTER the
move). We approximate the win%-drop using consecutive evals, then apply
`103.1668 * exp(-0.04354 * drop) - 3.1669` clamped to [0,100]. This matches the
formula family the classifier uses; if a precomputed per-ply accuracy ever
lands in the DB, swap `userAccuracy`'s body — callers stay the same.

## Scope decisions (confirmed with user)

1. **DailyGoalsCard → client-side `localStorage`.** D3-004 (daily_goals DB
   table) and D3-005 (API routes) stay `TODO`; they belong with Training.
2. **GamesTable non-Local tabs → empty state.** Chess.com/Lichess data lands
   in PLAN-004. Account column shows "Local" for all rows for now.
3. **Play / time-control cards → navigate to `/board`.** Full game start is
   PLAN-003; cards are not disabled.

## Conventions followed

- Matched existing page style: `mx-auto max-w-* p-8`, `@repo/ui`
  Card/Button/Badge/Tabs/Table/Input, `lucide-react` icons.
- Dense top-of-file comment block on the rewritten `dashboard.tsx` (AGENTS.md
  convention for load-bearing files).
- TS strict + `noUncheckedIndexedAccess`: every indexed array access is
  null-guarded.
- No imports from `examples/`.
- Biome `format --write` applied to all changed files.

## Verification

- `bun --filter=@chess-coach/desktop run typecheck` → **clean (exit 0)**.
- `bunx @biomejs/biome check --write` on all touched files → **clean**.
  (Two fixes applied during the pass: removed a dead `lastSeen` local in
  `useDailyGoals.ts`; added `role="img"` to the `ColorChip` span so its
  `aria-label` is valid per Biome's a11y rule.)

## Known gaps / follow-ups

- **D3-004, D3-005** (daily_goals DB + API) — deferred with Training; the
  `useDailyGoals` hook is structured so swapping in a real API later is local.
- **Chess.com/Lichess tab data** — PLAN-004. The empty-state CTA already
  links to `/accounts`.
- **Actual game start on `/board`** — PLAN-003. The board page is still a
  placeholder; time-control cards pass their preset as router `state` for
  PLAN-003 to consume.
- **Accuracy/ACPL accuracy** — current numbers are an approximation from the
  stored per-ply evals (see note above). If reviewers find them off vs. the
  game-review page, the fix is local to `dashboard-stats.ts`.
