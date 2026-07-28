/**
 * Files page — `/files` (PLAN-009 / FL2).
 *
 * Grid/list of imported PGN files with search + sort, an "Import File"
 * action, and a detail drawer (rename, view PGN, export, delete). Fully
 * wired to the `/files` API surface.
 *
 * Data flow:
 *  - `useQuery(["files"])` is the single source of truth for the grid.
 *  - All mutations (create / update / delete) invalidate `["files"]` so the
 *    grid and drawer stay consistent.
 */
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FolderOpen,
  Plus,
  FileText,
  BookOpen,
  Trophy,
  Puzzle,
} from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { FileCard, FileDrawer, CreateFileModal } from "../components/files";
import { GenericHeader, type SortOption } from "../components/databases";
import { PageContainer } from "../components/layout";
import { ErrorState } from "../components/ui";
import { ViewToggle } from "../components/ui";
import { fetchFiles, deleteFile, type FileDTO, type FileType } from "../lib/api";

type ViewMode = "grid" | "list";
type SortKey = "updated" | "name" | "games" | "created";

const SORT_OPTIONS: SortOption[] = [
  { label: "Last updated", value: "updated" },
  { label: "Name (A–Z)", value: "name" },
  { label: "Game count", value: "games" },
  { label: "Date created", value: "created" },
];

/** Type card definitions for the top-row summary. */
const TYPE_CARDS: {
  type: FileType;
  label: string;
  icon: typeof FileText;
  color: string;
}[] = [
  { type: "games", label: "Games", icon: FileText, color: "blue" },
  { type: "repertoire", label: "Repertoires", icon: BookOpen, color: "emerald" },
  { type: "tournament", label: "Tournaments", icon: Trophy, color: "amber" },
  { type: "puzzle", label: "Puzzles", icon: Puzzle, color: "purple" },
];

export default function FilesPage() {
  const qc = useQueryClient();

  // List query
  const {
    data: files,
    isLoading,
    error,
    refetch,
  } = useQuery<FileDTO[]>({
    queryKey: ["files"],
    queryFn: fetchFiles,
  });

  // View / filter state
  const [view, setView] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("updated");
  const [typeFilter, setTypeFilter] = useState<FileType | null>(null);

  // Drawer + modal state
  const [openId, setOpenId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Delete (from card menu) — kept here so a single confirm drives it.
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFile(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["files"] });
      setOpenId(null);
    },
  });

  // Derived: filtered + sorted list.
  const visible = useMemo(() => {
    const list = (files ?? []).filter((f) => {
      const q = search.trim().toLowerCase();
      if (q && !f.name.toLowerCase().includes(q) && !(f.description ?? "").toLowerCase().includes(q)) {
        return false;
      }
      if (typeFilter && f.type !== typeFilter) return false;
      return true;
    });
    return [...list].sort((a, b) => cmp(a, b, sort));
  }, [files, search, sort, typeFilter]);

  // Type counts for the summary cards.
  const typeCounts = useMemo(() => {
    const counts: Record<FileType, number> = { games: 0, repertoire: 0, tournament: 0, puzzle: 0 };
    for (const f of files ?? []) {
      counts[f.type]++;
    }
    return counts;
  }, [files]);

  const openFile = files?.find((f) => f.id === openId) ?? null;

  function handleDelete(file: FileDTO) {
    if (confirm(`Delete "${file.name}"? This cannot be undone.`)) {
      deleteMut.mutate(file.id);
    }
  }

  return (
    <PageContainer>
      <GenericHeader
        title="Files"
        subtitle="Import and organize your PGN files, repertoires, and puzzles."
        icon={<FolderOpen className="size-5" />}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search files…"
        sort={sort}
        sortOptions={SORT_OPTIONS}
        onSortChange={(v) => setSort(v as SortKey)}
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="mr-1.5 size-4" />
            Import File
          </Button>
        }
      />

      {/* Type summary cards */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TYPE_CARDS.map(({ type, label, icon: Icon, color }) => (
          <button
            key={type}
            type="button"
            onClick={() => setTypeFilter(typeFilter === type ? null : type)}
            className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
              typeFilter === type
                ? `border-${color}-300 bg-${color}-50 ring-1 ring-${color}-200`
                : "border-border bg-background hover:border-border hover:shadow-sm"
            }`}
          >
            <div className={`flex size-9 items-center justify-center rounded-lg bg-${color}-100 text-${color}-600`}>
              <Icon className="size-4" />
            </div>
            <div>
              <div className="text-sm font-medium">{label}</div>
              <div className="text-xs text-muted-foreground">
                {typeCounts[type]} file{typeCounts[type] === 1 ? "" : "s"}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* View toggle + count */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1 rounded-lg border border-border p-1">
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
        <span className="text-sm text-muted-foreground">
          {visible.length} file{visible.length === 1 ? "" : "s"}
          {search && files && visible.length !== files.length && (
            <> of {files.length}</>
          )}
          {typeFilter && (
            <>
              {" "}
              <button
                type="button"
                onClick={() => setTypeFilter(null)}
                className="ml-1 text-primary hover:underline"
              >
                clear filter
              </button>
            </>
          )}
        </span>
      </div>

      {/* States */}
      {isLoading && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Loading files…
        </p>
      )}
      {error && (
        <ErrorState
          title="Couldn't load files"
          description="We had trouble loading your files. Please try again."
          detail={String(error)}
          onRetry={() => refetch()}
        />
      )}
      {!isLoading && !error && visible.length === 0 && (
        <EmptyState
          hasAny={!!files && files.length > 0}
          hasFilter={!!typeFilter || !!search.trim()}
          onCreate={() => setShowCreate(true)}
          onClearFilter={() => {
            setTypeFilter(null);
            setSearch("");
          }}
        />
      )}

      {/* Grid */}
      {view === "grid" && visible.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((f) => (
            <FileCard
              key={f.id}
              file={f}
              view="grid"
              onOpen={() => setOpenId(f.id)}
              onRename={() => setOpenId(f.id)}
              onDelete={() => handleDelete(f)}
            />
          ))}
        </div>
      )}

      {/* List */}
      {view === "list" && visible.length > 0 && (
        <div className="space-y-2">
          {visible.map((f) => (
            <FileCard
              key={f.id}
              file={f}
              view="list"
              onOpen={() => setOpenId(f.id)}
              onRename={() => setOpenId(f.id)}
              onDelete={() => handleDelete(f)}
            />
          ))}
        </div>
      )}

      {/* Drawer */}
      <FileDrawer file={openFile} onClose={() => setOpenId(null)} />

      {/* Create modal */}
      {showCreate && (
        <CreateFileModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            qc.invalidateQueries({ queryKey: ["files"] });
          }}
        />
      )}
    </PageContainer>
  );
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function EmptyState({
  hasAny,
  hasFilter,
  onCreate,
  onClearFilter,
}: {
  hasAny: boolean;
  hasFilter: boolean;
  onCreate: () => void;
  onClearFilter: () => void;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border p-12 text-center">
      <FolderOpen className="mx-auto mb-4 size-12 text-muted-foreground/50" />
      <h3 className="mb-2 font-medium text-foreground">
        {hasFilter
          ? "No files match your search"
          : hasAny
            ? "No files of this type"
            : "No files imported"}
      </h3>
      <p className="mb-4 text-sm text-muted-foreground">
        {hasFilter
          ? "Try a different search term or clear the filter."
          : hasAny
            ? "Import a PGN file to get started."
            : "Import PGN files to analyze your games, build repertoires, or study puzzles."}
      </p>
      {hasFilter ? (
        <Button size="sm" variant="outline" onClick={onClearFilter}>
          Clear filter
        </Button>
      ) : (
        <Button size="sm" onClick={onCreate}>
          <Plus className="mr-1.5 size-4" />
          Import File
        </Button>
      )}
    </div>
  );
}

/** Compare two files along a sort key. */
function cmp(a: FileDTO, b: FileDTO, key: SortKey): number {
  switch (key) {
    case "name":
      return a.name.localeCompare(b.name);
    case "games":
      return a.gameCount - b.gameCount;
    case "created":
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    case "updated":
    default:
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
  }
}
