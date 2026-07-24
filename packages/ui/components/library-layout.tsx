"use client"

import * as React from "react"
import { cn } from "@repo/ui/lib/utils"
import { EmptyState } from "@repo/ui/components/empty-state"
import { SearchBar } from "@repo/ui/components/search-bar"

// ---------------------------------------------------------------------------
// Grid config
// ---------------------------------------------------------------------------

const columnConfigs = {
  /** Default library grid: 1 → 2 → 3 → 4. */
  default: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  /** Wide cards (idea/script): 1 → 2 → 3. */
  wide: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  /** Compact cards (character avatars): 2 → 3 → 5. */
  compact: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
} as const

const gapConfigs = {
  "gap-3": "gap-3",
  "gap-4": "gap-4",
  "gap-5": "gap-5",
} as const

// ---------------------------------------------------------------------------
// LibraryLayout
// ---------------------------------------------------------------------------

export interface LibraryLayoutProps<T> {
  /** Items to render. */
  items: T[]
  /** Card render function — receives an item, returns a node (usually a card). */
  renderItem: (item: T, index: number) => React.ReactNode
  /** Optional `key` extractor. Falls back to index. */
  getKey?: (item: T, index: number) => React.Key
  /** Loading state — shows a skeleton grid. */
  isLoading?: boolean
  /** Number of skeleton placeholders to show while loading. Default 8. */
  skeletonCount?: number
  /** Empty state — shown when items is empty and not loading. Pass an <EmptyState/> or string. */
  emptyState?: React.ReactNode
  /** Optional toolbar rendered above the grid. Usually <LibraryToolbar/>. */
  toolbar?: React.ReactNode
  /** Grid column config. Defaults to "default" (1/2/3/4). */
  columns?: keyof typeof columnConfigs
  /** Grid gap. Default "gap-4". */
  gap?: keyof typeof gapConfigs
  /** Extra className for the grid container. */
  className?: string
}

/**
 * The shared layout for every hub/list page (Cast, Creative, Assets,
 * Scheduler, …). Consolidates the `grid grid-cols-X gap-Y` + skeleton +
 * empty-state pattern that was inlined in every page.
 *
 * - `isLoading`  → render a skeleton grid.
 * - empty + idle → render `emptyState` (falls back to a generic <EmptyState/>).
 * - otherwise    → responsive grid of `renderItem(item)`.
 *
 * @example
 * ```tsx
 * <LibraryLayout
 *   items={ideas}
 *   isLoading={isPending}
 *   renderItem={(idea) => <IdeaCard key={idea.id} idea={idea} projectId={projectId} />}
 *   emptyState={<EmptyIdeasState onCreate={() => setOpen(true)} />}
 *   toolbar={<LibraryToolbar search={...} actions={<Button>New</Button>} />}
 * />
 * ```
 */
export function LibraryLayout<T>({
  items,
  renderItem,
  getKey,
  isLoading = false,
  skeletonCount = 8,
  emptyState,
  toolbar,
  columns = "default",
  gap = "gap-4",
  className,
}: LibraryLayoutProps<T>) {
  return (
    <div className="flex flex-col gap-5">
      {toolbar}

      {isLoading ? (
        <div className={cn(columnConfigs[columns], gapConfigs[gap], className)}>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <LibraryCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className={cn("w-full", className)}>
          {emptyState ?? <DefaultEmptyState />}
        </div>
      ) : (
        <div className={cn(columnConfigs[columns], gapConfigs[gap], "items-start", className)}>
          {items.map((item, index) => {
            const key = getKey ? getKey(item, index) : index
            return <React.Fragment key={key}>{renderItem(item, index)}</React.Fragment>
          })}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// LibraryToolbar
// ---------------------------------------------------------------------------

export interface LibraryToolbarProps {
  /** Controlled search input. Omit to hide search. */
  search?: {
    value: string
    onChange: (v: string) => void
    placeholder?: string
  }
  /** Filter area — usually <FilterTabs/> or <StatusFilterTabs/>. */
  filters?: React.ReactNode
  /** Right-aligned action area — usually a "Create" <Button/>. */
  actions?: React.ReactNode
  className?: string
}

/**
 * Toolbar rendered above a <LibraryLayout/> grid. Composes an optional
 * <SearchBar/>, filter tabs, and action buttons in a responsive flex row.
 * Consolidates the header pattern repeated in every hub page.
 */
export function LibraryToolbar({
  search,
  filters,
  actions,
  className,
}: LibraryToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        {search && (
          <div className="w-full sm:max-w-xs">
            <SearchBar
              value={search.value}
              onValueChange={search.onChange}
              placeholder={search.placeholder ?? "Search…"}
              clearable
              size="sm"
            />
          </div>
        )}
        {filters && <div className="flex-shrink-0">{filters}</div>}
      </div>
      {actions && <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

/** A neutral placeholder card that matches the InfoCard footprint. */
function LibraryCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/40 bg-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-9 w-9 rounded-xl bg-muted/50 animate-pulse" />
        <div className="h-4 w-24 rounded bg-muted/50 animate-pulse" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 w-full rounded bg-muted/40 animate-pulse" />
        <div className="h-3 w-2/3 rounded bg-muted/40 animate-pulse" />
      </div>
      <div className="space-y-2 pt-4 border-t border-border/20">
        <div className="flex justify-between">
          <div className="h-3 w-16 rounded bg-muted/40 animate-pulse" />
          <div className="h-3 w-12 rounded bg-muted/40 animate-pulse" />
        </div>
        <div className="flex justify-between">
          <div className="h-3 w-16 rounded bg-muted/40 animate-pulse" />
          <div className="h-3 w-12 rounded bg-muted/40 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

/** Fallback empty state when none is provided. */
function DefaultEmptyState() {
  return <EmptyState title="Nothing here yet" description="Items will appear here once they're created." />
}
