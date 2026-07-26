/**
 * Databases page — `/databases` (PLAN-005 / DB2-001 … DB2-010).
 *
 * Grid/list of game-collection databases with search + sort, a "New Database"
 * action, and a detail drawer (rename, explore, dedup, export, delete). Fully
 * wired to the `/databases` API surface.
 *
 * Data flow:
 *  - `useQuery(["databases"])` is the single source of truth for the grid.
 *  - All mutations (create / update / delete / add / remove / dedup) invalidate
 *    `["databases"]` (and `["database-games", id]` where relevant) so the grid
 *    and drawer stay consistent.
 */
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Database, Plus } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import {
  DatabaseCard,
  DatabaseDrawer,
  CreateDatabaseModal,
  AddGamesModal,
  GenericHeader,
  type SortOption,
} from "../components/databases";
import {
  fetchDatabases,
  deleteDatabase,
  type DatabaseDTO,
} from "../lib/api";

type ViewMode = "grid" | "list";
type SortKey = "updated" | "name" | "games" | "created";

const SORT_OPTIONS: SortOption[] = [
  { label: "Last updated", value: "updated" },
  { label: "Name (A–Z)", value: "name" },
  { label: "Game count", value: "games" },
  { label: "Date created", value: "created" },
];

export default function DatabasesPage() {
  const qc = useQueryClient();

  // List query
  const { data: databases, isLoading, error } = useQuery<DatabaseDTO[]>({
    queryKey: ["databases"],
    queryFn: fetchDatabases,
  });

  // View / filter state
  const [view, setView] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("updated");

  // Drawer + modal state
  const [openId, setOpenId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [addTarget, setAddTarget] = useState<DatabaseDTO | null>(null);

  // Delete (from card menu) — kept here so a single confirm drives it.
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteDatabase(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["databases"] });
      setOpenId(null);
    },
  });

  // Derived: filtered + sorted list.
  const visible = useMemo(() => {
    const list = (databases ?? []).filter((d) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        (d.description ?? "").toLowerCase().includes(q)
      );
    });
    const sorted = [...list].sort((a, b) => cmp(a, b, sort));
    return sorted;
  }, [databases, search, sort]);

  const openDatabase = databases?.find((d) => d.id === openId) ?? null;

  function handleDelete(database: DatabaseDTO) {
    if (
      confirm(
        `Delete "${database.name}"? This removes the database and unlinks its games. The underlying game records are kept.`,
      )
    ) {
      deleteMut.mutate(database.id);
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-8">
      <GenericHeader
        title="Databases"
        subtitle="Organize your game collections and opening repertoires."
        icon={<Database className="size-5" />}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search databases…"
        sort={sort}
        sortOptions={SORT_OPTIONS}
        onSortChange={(v) => setSort(v as SortKey)}
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="mr-1.5 size-4" />
            New Database
          </Button>
        }
      />

      {/* View toggle + count */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1 rounded-lg border border-neutral-200 p-1">
          <ViewToggle
            mode="grid"
            active={view === "grid"}
            onClick={() => setView("grid")}
          />
          <ViewToggle
            mode="list"
            active={view === "list"}
            onClick={() => setView("list")}
          />
        </div>
        <span className="text-sm text-neutral-500">
          {visible.length} database{visible.length === 1 ? "" : "s"}
          {search && databases && visible.length !== databases.length && (
            <> of {databases.length}</>
          )}
        </span>
      </div>

      {/* States */}
      {isLoading && (
        <p className="py-12 text-center text-sm text-neutral-500">
          Loading databases…
        </p>
      )}
      {error && (
        <p className="py-12 text-center text-sm text-red-600">
          Failed to load databases: {String(error)}
        </p>
      )}
      {!isLoading && !error && visible.length === 0 && (
        <EmptyState
          hasAny={!!databases && databases.length > 0}
          onCreate={() => setShowCreate(true)}
        />
      )}

      {/* Grid */}
      {view === "grid" && visible.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((d) => (
            <DatabaseCard
              key={d.id}
              database={d}
              view="grid"
              onOpen={() => setOpenId(d.id)}
              onRename={() => setOpenId(d.id)}
              onDelete={() => handleDelete(d)}
            />
          ))}
        </div>
      )}

      {/* List */}
      {view === "list" && visible.length > 0 && (
        <div className="space-y-2">
          {visible.map((d) => (
            <DatabaseCard
              key={d.id}
              database={d}
              view="list"
              onOpen={() => setOpenId(d.id)}
              onRename={() => setOpenId(d.id)}
              onDelete={() => handleDelete(d)}
            />
          ))}
        </div>
      )}

      {/* Drawer */}
      <DatabaseDrawer
        database={openDatabase}
        onClose={() => setOpenId(null)}
        onAddGames={(d) => setAddTarget(d)}
      />

      {/* Add-games modal */}
      {addTarget && (
        <AddGamesModal
          database={addTarget}
          onClose={() => setAddTarget(null)}
          onAdded={() => {
            qc.invalidateQueries({ queryKey: ["databases"] });
            qc.invalidateQueries({
              queryKey: ["database-games", addTarget.id],
            });
          }}
        />
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateDatabaseModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            qc.invalidateQueries({ queryKey: ["databases"] });
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small view helpers
// ---------------------------------------------------------------------------

function ViewToggle({
  mode,
  active,
  onClick,
}: {
  mode: ViewMode;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = mode === "grid" ? GridIcon : ListIcon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center rounded px-2 py-1 text-sm transition-colors ${
        active
          ? "bg-neutral-100 text-neutral-900"
          : "text-neutral-500 hover:bg-neutral-50"
      }`}
      aria-label={`${mode} view`}
      aria-pressed={active}
    >
      <Icon className="size-4" />
    </button>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="3.5" cy="6" r="1" />
      <circle cx="3.5" cy="12" r="1" />
      <circle cx="3.5" cy="18" r="1" />
    </svg>
  );
}

function EmptyState({
  hasAny,
  onCreate,
}: {
  hasAny: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-300 p-12 text-center">
      <Database className="mx-auto mb-4 size-12 text-neutral-300" />
      <h3 className="mb-2 font-medium text-neutral-700">
        {hasAny ? "No databases match your search" : "No databases yet"}
      </h3>
      <p className="mb-4 text-sm text-neutral-500">
        {hasAny
          ? "Try a different search term."
          : "Create a database to organize your games by theme, opening, or event."}
      </p>
      {!hasAny && (
        <Button size="sm" onClick={onCreate}>
          <Plus className="mr-1.5 size-4" />
          Create Database
        </Button>
      )}
    </div>
  );
}

/** Compare two databases along a sort key (ascending; caller reverses for desc). */
function cmp(a: DatabaseDTO, b: DatabaseDTO, key: SortKey): number {
  switch (key) {
    case "name":
      return a.name.localeCompare(b.name);
    case "games":
      return a.gameCount - b.gameCount;
    case "created":
      return (
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    case "updated":
    default:
      return (
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      );
  }
}
