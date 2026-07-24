# PLAN-006: Files Page

**Phase**: 6
**Priority**: P2
**Parallel Safe**: ✅ Yes (after PLAN-001 is complete)
**Estimated Duration**: 1 week

---

## Overview

Create the files page for managing individual game files, repertoires,
tournaments, and puzzle collections. Similar to databases but for individual
items.

## Scope

### In Scope
- Database schema for files
- Files page with grid/list view
- File type classification
- Add/edit/remove files

### Out of Scope
- Database integration (separate feature)
- Advanced repertoire management (future)

---

## Tasks

### FL1: Database Schema
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| FL1-001 | Create files table schema | TODO | - |
| FL1-002 | Run db:generate migration | TODO | FL1-001 |
| FL1-003 | Run db:push to apply | TODO | FL1-002 |

### FL2: Files Page UI
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| FL2-001 | Create FilesPage component | TODO | - |
| FL2-002 | Create FileCard component | TODO | - |
| FL2-003 | Create AddFileModal component | TODO | - |
| FL2-004 | Add type picker (game/repertoire/tournament/puzzle) | TODO | FL2-003 |
| FL2-005 | Add PGN paste/file upload | TODO | FL2-003 |

### FL3: Files API Routes
| Task ID | Title | Status | Dependencies |
|---------|-------|--------|--------------|
| FL3-001 | Add GET /files endpoint | TODO | FL1-003 |
| FL3-002 | Add POST /files endpoint | TODO | FL1-003 |
| FL3-003 | Add GET /files/:id endpoint | TODO | FL1-003 |
| FL3-004 | Add PATCH /files/:id endpoint | TODO | FL1-003 |
| FL3-005 | Add DELETE /files/:id endpoint | TODO | FL1-003 |

---

## Technical Approach

### Database Schema

```typescript
// packages/db/schema/files.ts
export const filesTable = pgTable("files", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: text("type").$type<"game" | "repertoire" | "tournament" | "puzzle">().notNull(),
  pgn: text("pgn"), // Single game PGN or collection
  tags: text("tags").array(),
  metadata: json("metadata").$type<{
    event?: string;
    site?: string;
    date?: string;
    round?: string;
    white?: string;
    black?: string;
    result?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### File Types
```typescript
type FileType = "game" | "repertoire" | "tournament" | "puzzle";

const FILE_TYPE_INFO: Record<FileType, { label: string; icon: string }> = {
  game: { label: "Game", icon: "pawn" },
  repertoire: { label: "Repertoire", icon: "book" },
  tournament: { label: "Tournament", icon: "trophy" },
  puzzle: { label: "Puzzle", icon: "puzzle" },
};
```

---

## Reference Files

From `examples/pawn-appetite/`:
- Files page patterns (similar to databases)
- File picker/upload components

---

## Files to Create/Modify

### New Schema Files
- `packages/db/schema/files.ts`

### New API Files
- `packages/api/src/routes/files.ts`
- `packages/db/repositories/files-repository.ts`

### New UI Files
- `apps/desktop/src/web/pages/files.tsx`
- `apps/desktop/src/web/components/files/FileCard.tsx`
- `apps/desktop/src/web/components/files/AddFileModal.tsx`

### Modified Files
- `packages/api/src/server.ts` - Register routes
- `apps/desktop/src/web/lib/api.ts` - Add file API functions

---

## API Endpoints

```
GET    /files              # List all files
POST   /files              # Create new file
GET    /files/:id          # Get file details
PATCH  /files/:id          # Update file
DELETE /files/:id          # Delete file
```

---

## Acceptance Criteria

- [ ] Files page shows grid of file cards
- [ ] Can switch between grid and list view
- [ ] Search filters files by name
- [ ] Add file button opens modal
- [ ] Modal has type picker with 4 options
- [ ] Can paste PGN or upload file
- [ ] File card shows name and type icon
- [ ] Clicking card opens file content
- [ ] Edit allows updating PGN
- [ ] Delete removes file
- [ ] Type checking passes
- [ ] Lint passes

---

## Notes

- Files are single items, databases are collections
- Repertoire type is for opening study (future enhancement)
- Consider file size limits for PGN storage
