# PLAN-005: Databases Page

**Phase**: 5
**Priority**: P1
**Parallel Safe**: ✅ Yes (after PLAN-001 is complete)
**Estimated Duration**: 1-2 weeks

---

## Overview

Create the databases page for managing game collections. Users can create
databases, import games, remove duplicates, and export collections.

## Scope

### In Scope
- Database schema for game collections
- Databases page with grid/list view
- Database management drawer
- Import/export functionality

### Out of Scope
- Position search/indexing (future enhancement)
- Cloud sync (not needed for desktop)

---

## Tasks

### DB1: Database Schema
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| DB1-001 | Create databases table schema | TODO | - |
| DB1-002 | Create databaseGames junction table | TODO | - |
| DB1-003 | Run db:generate migration | TODO | DB1-001, DB1-002 |
| DB1-004 | Run db:push to apply | TODO | DB1-003 |

### DB2: Databases Page UI
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| DB2-001 | Create DatabasesPage component | TODO | - |
| DB2-002 | Create DatabaseCard component | TODO | - |
| DB2-003 | Add Grid/List view toggle | TODO | DB2-001 |
| DB2-004 | Create GenericHeader component | TODO | - |
| DB2-005 | Add search/sort/add actions | TODO | DB2-004 |
| DB2-006 | Create DatabaseDrawer component | TODO | - |
| DB2-007 | Add rename/description fields | TODO | DB2-006 |
| DB2-008 | Add explore games action | TODO | DB2-006 |
| DB2-009 | Add remove duplicates action | TODO | DB2-006 |
| DB2-010 | Add export games action | TODO | DB2-006 |

### DB3: Database API Routes
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| DB3-001 | Add GET /databases endpoint | TODO | DB1-004 |
| DB3-002 | Add POST /databases endpoint | TODO | DB1-004 |
| DB3-003 | Add GET /databases/:id endpoint | TODO | DB1-004 |
| DB3-004 | Add PATCH /databases/:id endpoint | TODO | DB1-004 |
| DB3-005 | Add DELETE /databases/:id endpoint | TODO | DB1-004 |
| DB3-006 | Add POST /databases/:id/games endpoint | TODO | DB1-004 |
| DB3-007 | Add GET /databases/:id/export endpoint | TODO | DB1-004 |

---

## Technical Approach

### Database Schema

```typescript
// packages/db/schema/databases.ts
export const databasesTable = pgTable("databases", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: text("type").$type<"games" | "puzzles" | "repertoire">().default("games"),
  description: text("description"),
  isIndexed: boolean("is_indexed").default(false),
  gameCount: integer("game_count").default(0),
  storageBytes: integer("storage_bytes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Junction table for database <-> game relationship
export const databaseGamesTable = pgTable("database_games", {
  databaseId: uuid("database_id").references(() => databasesTable.id),
  gameId: uuid("game_id").references(() => gamesTable.id),
  indexedAt: timestamp("indexed_at"),
});
```

### Database Card Display
```typescript
interface DatabaseCardProps {
  id: string;
  name: string;
  type: "games" | "puzzles" | "repertoire";
  isIndexed: boolean;
  gameCount: number;
  storageBytes: number;
  onOpen: () => void;
}
```

### Export Format
```typescript
// Export as PGN file
async function exportDatabase(databaseId: string): Promise<string> {
  const games = await db
    .select()
    .from(gamesTable)
    .innerJoin(databaseGamesTable, eq(databaseGamesTable.gameId, gamesTable.id))
    .where(eq(databaseGamesTable.databaseId, databaseId));
  
  return games.map(g => g.games.pgn).join("\n\n");
}
```

---

## Reference Files

From `examples/pawn-appetite/`:
- `src/features/databases/DatabasesPage.tsx` (if exists)
- Similar patterns from Files page

---

## Files to Create/Modify

### New Schema Files
- `packages/db/schema/databases.ts`

### New API Files
- `packages/api/src/routes/databases.ts`
- `packages/db/repositories/databases-repository.ts`

### New UI Files
- `apps/desktop/src/web/pages/databases.tsx`
- `apps/desktop/src/web/components/databases/DatabaseCard.tsx`
- `apps/desktop/src/web/components/databases/DatabaseDrawer.tsx`
- `apps/desktop/src/web/components/databases/GenericHeader.tsx`

### Modified Files
- `packages/api/src/server.ts` - Register routes
- `apps/desktop/src/web/lib/api.ts` - Add database API functions

---

## API Endpoints

```
GET    /databases              # List all databases
POST   /databases              # Create new database
GET    /databases/:id          # Get database details
PATCH  /databases/:id          # Update database (rename, description)
DELETE /databases/:id          # Delete database (and junction records)
POST   /databases/:id/games    # Add games to database
DELETE /databases/:id/games    # Remove games from database
GET    /databases/:id/export   # Export as PGN
POST   /databases/:id/dedup    # Remove duplicate games
```

---

## Acceptance Criteria

- [ ] Databases page shows grid of database cards
- [ ] Can switch between grid and list view
- [ ] Search filters databases by name
- [ ] Sort by name, game count, date
- [ ] Create new database button works
- [ ] Database card shows name, game count, storage size
- [ ] Clicking card opens drawer
- [ ] Drawer allows rename and description
- [ ] Explore games shows filtered games list
- [ ] Export creates downloadable PGN
- [ ] Remove duplicates works correctly
- [ ] Type checking passes
- [ ] Lint passes

---

## Notes

- Databases are logical groupings, not separate physical storage
- Game deduplication based on PGN similarity
- Indexing is a placeholder for future position search
