/**
 * GenericHeader (DB2-004, DB2-005) — a reusable page header for entity-list
 * pages (Databases, Files, …).
 *
 * Renders a title + subtitle on the left and a right-aligned action row
 * (search input, sort dropdown, and an arbitrary `actions` slot for an
 * "Add" button). It owns no data — the parent supplies the search/sort state
 * via props and callbacks.
 */
import { ChevronLeft, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@repo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";

export type SortOption = { label: string; value: string };

export interface GenericHeaderProps {
  /** Page title (e.g. "Databases"). */
  title: string;
  /** Subtitle / description shown under the title. */
  subtitle?: string;
  /** Optional icon node rendered in a tinted square to the left of the title. */
  icon?: React.ReactNode;
  /** Search query value (controlled). */
  search?: string;
  /** Called on every keystroke in the search field. */
  onSearchChange?: (value: string) => void;
  /** Placeholder for the search field. */
  searchPlaceholder?: string;
  /** Current sort value (controlled). */
  sort?: string;
  /** Sort options for the dropdown. */
  sortOptions?: SortOption[];
  /** Called when the sort dropdown changes. */
  onSortChange?: (value: string) => void;
  /** Right-aligned action slot (typically an "Add" button). */
  actions?: React.ReactNode;
  /** Back link rendered above the title (router-agnostic — pass `as={Link}`). */
  backLink?: { label: string; to: string };
}

export function GenericHeader({
  title,
  subtitle,
  icon,
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  sort,
  sortOptions,
  onSortChange,
  actions,
  backLink,
}: GenericHeaderProps) {
  return (
    <header className="mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {backLink && (
            <Link
              to={backLink.to}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft className="size-3" />
              {backLink.label}
            </Link>
          )}
          <div className={`${backLink ? "mt-2" : ""} flex items-center gap-3`}>
            {icon && (
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-chess-cream text-chess-brown">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold tracking-tight">{title}</h1>
              {subtitle && (
                <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {onSearchChange && (
            <div className="relative w-56">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                variant="minimal"
                placeholder={searchPlaceholder}
                value={search ?? ""}
                onChange={(e) => onSearchChange(e.target.value)}
                className="h-9 pl-8"
              />
            </div>
          )}
          {sortOptions && onSortChange && (
            <Select value={sort} onValueChange={onSortChange}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {actions}
        </div>
      </div>
    </header>
  );
}
