# PLAN-004: Accounts & Sync

**Phase**: 4
**Priority**: P1
**Parallel Safe**: ✅ Yes (after PLAN-001 is complete)
**Estimated Duration**: 2-3 weeks

---

## Overview

Implement account management for Chess.com and Lichess, including OAuth for
Lichess, public API access for Chess.com, game syncing, and player statistics
with opening analysis.

## Scope

### In Scope
- Database schema for accounts and stats
- Accounts page with list and management
- Chess.com public API integration
- Lichess OAuth PKCE integration
- Incremental game sync
- Player database drawer with stats

### Out of Scope
- Online real-time play (PLAN-003)
- Puzzle sync (deferred)

---

## Tasks

### A1: Database Schema
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| A1-001 | Create accounts table schema | TODO | - |
| A1-002 | Create accountStats table schema | TODO | - |
| A1-003 | Run db:generate migration | TODO | A1-001, A1-002 |
| A1-004 | Run db:push to apply | TODO | A1-003 |

### A2: Accounts Page
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| A2-001 | Create AccountsPage component | TODO | - |
| A2-002 | Create AccountCard component | TODO | - |
| A2-003 | Add platform icon | TODO | A2-002 |
| A2-004 | Add rating display per time control | TODO | A2-002 |
| A2-005 | Add games synced/total display | TODO | A2-002 |
| A2-006 | Create AddAccountModal | TODO | - |
| A2-007 | Add platform + username inputs | TODO | A2-006 |
| A2-008 | Add Edit/Sync/Download/Remove actions | TODO | A2-002 |

### A3: Chess.com Integration
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| A3-001 | Create chesscom.ts API client | TODO | A1-004 |
| A3-002 | Implement public API access | TODO | A3-001 |
| A3-003 | Fetch game archives by username | TODO | A3-002 |
| A3-004 | Download PGNs incrementally | TODO | A3-003 |
| A3-005 | Parse PGN and store in games | TODO | A3-004 |
| A3-006 | Add source field to games table | TODO | A1-004 |

### A4: Lichess Integration
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| A4-001 | Create lichess.ts API client | TODO | A1-004 |
| A4-002 | Implement OAuth PKCE flow | TODO | A4-001 |
| A4-003 | Store tokens in accounts table | TODO | A4-002 |
| A4-004 | Fetch games via API | TODO | A4-002 |
| A4-005 | Incremental sync with lastSyncedAt | TODO | A4-004 |

### A5: Player Database Drawer
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| A5-001 | Create PlayerDatabaseDrawer | TODO | - |
| A5-002 | Create OverviewTab (win % chart) | TODO | A5-001 |
| A5-003 | Create RatingsTab (rating history) | TODO | A5-001 |
| A5-004 | Create OpeningsTab (performance) | TODO | A5-001 |
| A5-005 | Add account switcher dropdown | TODO | A5-001 |

### A6: Account API Routes
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| A6-001 | Add GET /accounts endpoint | TODO | A1-004 |
| A6-002 | Add POST /accounts endpoint | TODO | A1-004 |
| A6-003 | Add PATCH /accounts/:id | TODO | A1-004 |
| A6-004 | Add DELETE /accounts/:id | TODO | A1-004 |
| A6-005 | Add POST /accounts/:id/sync | TODO | A3-001, A4-001 |
| A6-006 | Add GET /accounts/:id/stats | TODO | A1-004 |

---

## Technical Approach

### Database Schema

```typescript
// packages/db/schema/accounts.ts
export const accountsTable = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  platform: text("platform").$type<"chess.com" | "lichess">().notNull(),
  username: text("username").notNull(),
  userId: text("user_id"), // Platform-specific user ID
  accessToken: text("access_token"), // For Lichess OAuth
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const accountStatsTable = pgTable("account_stats", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id").references(() => accountsTable.id),
  bulletGames: integer("bullet_games").default(0),
  blitzGames: integer("blitz_games").default(0),
  rapidGames: integer("rapid_games").default(0),
  dailyGames: integer("daily_games").default(0),
  bulletRating: integer("bullet_rating"),
  blitzRating: integer("blitz_rating"),
  rapidRating: integer("rapid_rating"),
  dailyRating: integer("daily_rating"),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### Chess.com API Client

```typescript
// packages/api/src/integrations/chesscom.ts
const CHESSCOM_API = "https://api.chess.com/pub";

export async function fetchPlayerProfile(username: string) {
  const res = await fetch(`${CHESSCOM_API}/player/${username}`);
  return res.json();
}

export async function fetchGameArchives(username: string) {
  const res = await fetch(`${CHESSCOM_API}/player/${username}/games/archives`);
  return res.json(); // { archives: string[] }
}

export async function fetchGamesFromArchive(archiveUrl: string) {
  const res = await fetch(archiveUrl);
  return res.json(); // { games: Game[] }
}
```

### Lichess OAuth Flow

```typescript
// packages/api/src/integrations/lichess.ts
const LICHESS_API = "https://lichess.org";

// 1. Generate PKCE challenge
const verifier = generateRandomString(64);
const challenge = await sha256(verifier);

// 2. Redirect to Lichess auth
const authUrl = `${LICHESS_API}/oauth?` + new URLSearchParams({
  response_type: "code",
  client_id: "chess-coach",
  redirect_uri: "chess-coach://lichess-callback",
  code_challenge: challenge,
  code_challenge_method: "S256",
  scope: "game:read",
});

// 3. Exchange code for token
const token = await exchangeCodeForToken(code, verifier);
```

### Sync Strategy

```typescript
// Incremental sync - only fetch new games
async function syncGames(account: Account) {
  const lastSync = account.lastSyncedAt;
  
  if (account.platform === "chess.com") {
    const archives = await fetchGameArchives(account.username);
    for (const archive of archives.archives) {
      // Parse archive URL to get month/year
      const [year, month] = extractYearMonth(archive);
      
      // Skip archives before last sync
      if (lastSync && isBefore(year, month, lastSync)) continue;
      
      const games = await fetchGamesFromArchive(archive);
      for (const game of games.games) {
        await storeGame(game, account.id);
      }
    }
  }
}
```

---

## Reference Files

From `examples/pawn-appetite/`:
- `src/utils/chess.com/api.tsx` - Chess.com integration
- `src/utils/lichess/api.tsx` - Lichess integration
- `src/features/accounts/AccountsPage.tsx` - Accounts UI
- `src/features/accounts/components/AccountCard.tsx`
- `src-tauri/src/chess_com.rs` - Rust implementation (reference for logic)

---

## Files to Create/Modify

### New Schema Files
- `packages/db/schema/accounts.ts`

### New API Files
- `packages/api/src/integrations/chesscom.ts`
- `packages/api/src/integrations/lichess.ts`
- `packages/api/src/routes/accounts.ts`
- `packages/db/repositories/accounts-repository.ts`

### New UI Files
- `apps/desktop/src/web/pages/accounts.tsx`
- `apps/desktop/src/web/components/accounts/AccountCard.tsx`
- `apps/desktop/src/web/components/accounts/AddAccountModal.tsx`
- `apps/desktop/src/web/components/accounts/PlayerDatabaseDrawer.tsx`
- `apps/desktop/src/web/components/accounts/OverviewTab.tsx`
- `apps/desktop/src/web/components/accounts/RatingsTab.tsx`
- `apps/desktop/src/web/components/accounts/OpeningsTab.tsx`

### Modified Files
- `packages/db/schema/games.ts` - Add source field
- `packages/api/src/server.ts` - Register routes
- `apps/desktop/src/web/lib/api.ts` - Add account API functions

---

## API Endpoints

```
GET    /accounts              # List all accounts
POST   /accounts              # Add new account
GET    /accounts/:id          # Get account details
PATCH  /accounts/:id          # Update account (rename)
DELETE /accounts/:id          # Remove account
POST   /accounts/:id/sync     # Sync games from platform
GET    /accounts/:id/stats    # Get rating stats
GET    /accounts/:id/games    # Get games for this account
GET    /accounts/:id/openings # Get opening performance

# OAuth callback (for Lichess)
GET    /auth/lichess/callback?code=...
```

---

## Acceptance Criteria

- [ ] Accounts page shows list of connected accounts
- [ ] Can add Chess.com account (username only)
- [ ] Can add Lichess account (OAuth flow)
- [ ] Account card shows ratings and game counts
- [ ] Sync button fetches new games from platform
- [ ] Downloaded games appear in Games table with correct source
- [ ] Player database drawer shows win % chart
- [ ] Ratings tab shows rating history
- [ ] Openings tab shows opening performance
- [ ] Incremental sync works (doesn't re-download old games)
- [ ] Type checking passes
- [ ] Lint passes

---

## Notes

- Chess.com public API doesn't require authentication
- Lichess requires OAuth for game access
- Store tokens securely (consider encryption for production)
- Rate limiting: Chess.com has no official limits, Lichess is 30 requests/min
