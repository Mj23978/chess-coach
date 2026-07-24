"use client"

import * as React from "react"
import { cn } from "@repo/ui/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

// ---------------------------------------------------------------------------
// Design-system tokens (Organic Tech Synthesis)
// ---------------------------------------------------------------------------
// Primary: #496458 (Sage Green)  |  Background: #fcf9f4 (Cream)
// Border-radius tokens: 8px / 12px / 16px / 24px
// Fonts: Newsreader (headlines), Hanken Grotesk (body)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Variants (CVA)
// ---------------------------------------------------------------------------

const filterTabVariants = cva(
  "inline-flex items-center justify-center gap-1.5 font-medium transition-all duration-200 ease-out cursor-pointer select-none whitespace-nowrap",
  {
    variants: {
      /** Visual shape of each tab button. */
      variant: {
        /** Rounded rectangle with subtle shadow when active. */
        default:
          "rounded-lg px-3 py-2 text-sm data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-sm data-[active=true]:font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground",
        /** Pill-shaped button (fully rounded). */
        pills:
          "rounded-full px-4 py-2 text-sm data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:shadow-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground",
        /** Compact chip tag style. */
        chips:
          "rounded-lg px-2.5 py-1 text-xs data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:border-primary/30 data-[active=true]:font-semibold border border-border/40 text-muted-foreground hover:bg-muted/50 hover:text-foreground",
        /** Underline style -- bottom border indicator. */
        underline:
          "rounded-none px-1 py-2 text-sm border-b-2 border-transparent data-[active=true]:border-primary data-[active=true]:text-foreground data-[active=true]:font-semibold text-muted-foreground hover:text-foreground",
      },
      /**
       * Size preset that controls padding and font size.
       * Only applies when `variant` is `"default"`, `"pills"`, or `"chips"`.
       */
      size: {
        sm: "px-2 py-1 text-xs",
        default: "px-3 py-2 text-sm",
        lg: "px-4 py-2.5 text-base",
      },
    },
    compoundVariants: [
      // Override size tokens for pill variant (needs slightly different padding)
      {
        variant: "pills",
        size: "sm",
        class: "px-3 py-1.5 text-xs",
      },
      {
        variant: "pills",
        size: "default",
        class: "px-4 py-2 text-sm",
      },
      {
        variant: "pills",
        size: "lg",
        class: "px-5 py-2.5 text-base",
      },
      // Chip size overrides
      {
        variant: "chips",
        size: "sm",
        class: "px-2 py-0.5 text-[10px]",
      },
      {
        variant: "chips",
        size: "default",
        class: "px-2.5 py-1 text-xs",
      },
      {
        variant: "chips",
        size: "lg",
        class: "px-3 py-1.5 text-sm",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape of a single filter tab entry. */
export interface FilterTab {
  /** Unique identifier used to match `activeTab` and `onTabChange`. */
  value: string
  /** Human-readable label displayed on the tab. */
  label: string
  /** Optional item count displayed beside the label. */
  count?: number
  /** Optional leading icon rendered inside the tab. */
  icon?: React.ReactNode
  /** When `true` the tab is visually muted and non-interactive. */
  disabled?: boolean
}

/** Props for the root `<FilterTabs>` container. */
export interface FilterTabsProps
  extends VariantProps<typeof filterTabVariants> {
  /** Array of tab definitions to render. */
  tabs: FilterTab[]
  /** The `value` of the tab that is currently active. */
  activeTab: string
  /** Callback fired when the user selects a different tab. */
  onTabChange: (value: string) => void
  /** Additional class names applied to the outer container. */
  className?: string
  /** Accessible label for the tab group (maps to `aria-label`). */
  "aria-label"?: string
}

/** Props for the convenience `<FilterTabButton>` that renders a single tab. */
export interface FilterTabButtonProps
  extends FilterTab,
    VariantProps<typeof filterTabVariants> {
  /** Whether this tab is currently active. */
  active?: boolean
  /** Callback when the tab is clicked. */
  onClick?: () => void
  /** Additional class names. */
  className?: string
}

// ---------------------------------------------------------------------------
// FilterTabs (root)
// ---------------------------------------------------------------------------

/**
 * Tab-based filter component following the Organic Tech Synthesis design system.
 *
 * Renders a horizontal row of interactive tab buttons that act as filters.
 * Supports four visual variants (`default`, `pills`, `chips`, `underline`),
 * three size presets, and optional icons / item counts per tab.
 *
 * @example
 * ```tsx
 * <FilterTabs
 *   tabs={[
 *     { value: "all", label: "All", count: 42 },
 *     { value: "active", label: "Active", count: 12 },
 *     { value: "archived", label: "Archived", count: 30 },
 *   ]}
 *   activeTab="all"
 *   onTabChange={(v) => setSelected(v)}
 *   variant="pills"
 * />
 * ```
 */
export function FilterTabs({
  tabs,
  activeTab,
  onTabChange,
  variant = "default",
  size = "default",
  className,
  "aria-label": ariaLabel = "Filter tabs",
}: FilterTabsProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex items-center gap-1.5 flex-wrap",
        className,
      )}
    >
      {tabs.map((tab) => (
        <FilterTabButton
          key={tab.value}
          {...tab}
          active={activeTab === tab.value}
          variant={variant}
          size={size}
          onClick={() => {
            if (!tab.disabled) {
              onTabChange(tab.value)
            }
          }}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// FilterTabButton (individual tab)
// ---------------------------------------------------------------------------

/**
 * A single filter tab button.
 *
 * Useful when you need to render filter tabs outside of the
 * `<FilterTabs>` container, for example in a custom layout or
 * when composing tabs from multiple independent sources.
 *
 * @example
 * ```tsx
 * <FilterTabButton
 *   value="drafts"
 *   label="Drafts"
 *   count={5}
 *   icon={<FileIcon className="h-3.5 w-3.5" />}
 *   active={selected === "drafts"}
 *   variant="chips"
 *   onClick={() => setSelected("drafts")}
 * />
 * ```
 */
export function FilterTabButton({
  value,
  label,
  count,
  icon,
  disabled = false,
  active = false,
  variant = "default",
  size = "default",
  onClick,
  className,
}: FilterTabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      data-active={active}
      data-value={value}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        filterTabVariants({ variant, size }),
        "disabled:pointer-events-none disabled:opacity-40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        active && "ring-1 ring-primary/20",
        className,
      )}
    >
      {/* Leading icon */}
      {icon && (
        <span className="shrink-0 [&>svg]:size-4">
          {icon}
        </span>
      )}

      {/* Label text */}
      <span>{label}</span>

      {/* Optional count badge */}
      {count !== undefined && (
        <span
          className={cn(
            "ml-0.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 rounded-full px-1.5 text-[10px] font-semibold leading-none transition-colors",
            active
              ? "bg-primary/20 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Preset: FilterTabsWithAll
// ---------------------------------------------------------------------------

/** Options for the `<FilterTabsWithAll>` preset. */
export interface FilterTabsWithAllProps extends Omit<FilterTabsProps, "tabs"> {
  /** Label for the "show all" tab. Defaults to `"All"`. */
  allLabel?: string
  /** Array of filter tab definitions (the "All" tab is prepended automatically). */
  filters: Omit<FilterTab, "value">[]
  /** Value key for each filter, used as `tab.value`. Defaults to index order. */
  valueKey?: string
}

/**
 * Convenience wrapper that prepends an "All" tab to your filter definitions.
 *
 * The "All" tab's `count` is automatically computed as the sum of all other
 * tab counts (when provided), so you only need to pass per-tab counts.
 *
 * @example
 * ```tsx
 * <FilterTabsWithAll
 *   allLabel="All Projects"
 *   filters={[
 *     { label: "Active", count: 12, icon: <ZapIcon /> },
 *     { label: "Draft", count: 5 },
 *     { label: "Archived", count: 30 },
 *   ]}
 *   activeTab="all"
 *   onTabChange={setFilter}
 *   variant="default"
 * />
 * ```
 */
export function FilterTabsWithAll({
  allLabel = "All",
  filters,
  activeTab,
  onTabChange,
  valueKey,
  variant = "default",
  size = "default",
  className,
  "aria-label": ariaLabel,
}: FilterTabsWithAllProps) {
  const totalCount = filters.reduce(
    (sum, f) => sum + (f.count ?? 0),
    0,
  )

  const allTab: FilterTab = {
    value: "all",
    label: allLabel,
    count: totalCount > 0 ? totalCount : undefined,
  }

  const tabs: FilterTab[] = [
    allTab,
    ...filters.map((f, i) => ({
      ...f,
      value: (valueKey ? String((f as Record<string, unknown>)[valueKey]) : String(i)) ?? String(i),
    })),
  ]

  return (
    <FilterTabs
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={onTabChange}
      variant={variant}
      size={size}
      className={className}
      aria-label={ariaLabel ?? `Filter by ${allLabel.toLowerCase()}`}
    />
  )
}

// ---------------------------------------------------------------------------
// Preset: StatusFilterTabs
// ---------------------------------------------------------------------------

/** A status entry for use with `<StatusFilterTabs>`. */
export interface StatusFilterTab {
  value: string
  label: string
  count?: number
}

/** Props for the `<StatusFilterTabs>` preset. */
export interface StatusFilterTabsProps {
  /** Status tab definitions to render. */
  statuses: StatusFilterTab[]
  /** Currently active status value. */
  activeStatus: string
  /** Callback when the user selects a different status. */
  onStatusChange: (value: string) => void
  /** Visual variant. Defaults to `"default"`. */
  variant?: "default" | "pills" | "chips" | "underline"
  /** Additional class names for the outer container. */
  className?: string
}

/**
 * Pre-configured filter tabs optimised for status-based filtering.
 *
 * Renders each status with a small coloured dot indicator, making it easy to
 * scan status categories at a glance.
 *
 * @example
 * ```tsx
 * <StatusFilterTabs
 *   statuses={[
 *     { value: "active", label: "Active", count: 12 },
 *     { value: "pending", label: "Pending Review", count: 5 },
 *     { value: "failed", label: "Failed", count: 2 },
 *   ]}
 *   activeStatus="active"
 *   onStatusChange={setFilter}
 *   variant="chips"
 * />
 * ```
 */
export function StatusFilterTabs({
  statuses,
  activeStatus,
  onStatusChange,
  variant = "default",
  className,
}: StatusFilterTabsProps) {
  const statusColorMap: Record<string, string> = {
    active: "bg-success",
    pending: "bg-warning",
    failed: "bg-error",
    completed: "bg-primary",
    processing: "bg-warning animate-pulse",
    archived: "bg-muted-foreground",
  }

  const tabs: FilterTab[] = statuses.map((s) => ({
    ...s,
    icon: (
      <span
        className={cn(
          "inline-block rounded-full w-2 h-2 shrink-0",
          statusColorMap[s.value] ?? "bg-muted-foreground",
        )}
      />
    ),
  }))

  return (
    <FilterTabs
      tabs={tabs}
      activeTab={activeStatus}
      onTabChange={onStatusChange}
      variant={variant}
      className={className}
      aria-label="Status filter"
    />
  )
}
