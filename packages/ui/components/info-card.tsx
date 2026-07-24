"use client"

import * as React from "react"
import { cn } from "@repo/ui/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

/**
 * Style variants for the InfoCard container.
 * - `default`  — Standard card with subtle border.
 * - `featured` — Draws attention with a primary-colored border accent and soft shadow.
 * - `elevated` — Lifted appearance with a drop shadow.
 * - `ghost`    — No border or shadow; relies on background contrast alone.
 * - `outlined` — Bolder border, useful for selection states or emphasised grouping.
 */
const infoCardVariants = cva(
  "bg-card border border-border/40 rounded-2xl relative overflow-hidden transition-all duration-150",
  {
    variants: {
      /** Visual style variant. */
      variant: {
        default: "border-border/40",
        featured: "border-primary/40 shadow-sm",
        elevated: "border-border/30 shadow-sm",
        ghost: "border-transparent shadow-none",
        outlined: "border-foreground/20",
      },
      /** Padding size preset. */
      size: {
        compact: "p-4",
        default: "p-5",
        lg: "p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// ---------------------------------------------------------------------------
// InfoCard
// ---------------------------------------------------------------------------

/**
 * Props for the [`InfoCard`](#) component.
 *
 * A versatile, generic container card for displaying contextual information.
 *
 * @example
 * ```tsx
 * <InfoCard
 *   title="Project Overview"
 *   description="A summary of your video generation project."
 *   icon={<VideoIcon className="h-4 w-4" />}
 *   footer={<Button size="sm">View Details</Button>}
 * >
 *   <p>12 characters, 4 workflows in progress.</p>
 * </InfoCard>
 * ```
 */
export interface InfoCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof infoCardVariants> {
  /** Card heading displayed in the header area. */
  title: string

  /** Optional supporting text rendered below the title. */
  description?: string

  /** Content rendered between the header and footer. */
  children?: React.ReactNode

  /**
   * Icon rendered inside a tinted circle alongside the title.
   * Should be an icon element sized approximately `h-4 w-4` or `h-5 w-5`.
   */
  icon?: React.ReactNode

  /**
   * Primary action rendered in the top-right corner of the header
   * (e.g. a menu button or quick-action icon).
   */
  action?: React.ReactNode

  /**
   * Secondary action area rendered at the top-right of the header,
   * separate from `action`. Useful for placing a toggle or badge
   * without overriding the default three-dot menu.
   */
  headerAction?: React.ReactNode

  /**
   * Content rendered at the bottom of the card, separated by a
   * divider border. Ideal for CTA buttons or status summaries.
   */
  footer?: React.ReactNode

  /**
   * Optional label rendered as a small badge above the title.
   * Useful for tagging (e.g. "New", "Beta", "Pro").
   */
  label?: React.ReactNode

  /**
   * When `true`, renders a decorative gradient overlay at the top of
   * the card that fades from `primary/10` to transparent. Works well
   * with the `featured` variant.
   */
  decorativeAccent?: boolean

  /**
   * HTML element to render as the root node. Defaults to `"div"`.
   * Use `"section"` or `"article"` for better semantic markup.
   */
  as?: React.ElementType
}

/**
 * A generic container card following the Organic Tech Synthesis design system.
 *
 * Provides a flexible layout with optional header (icon + title + action),
 * description, content slot, and footer. Use the `variant` and `size` props
 * to adjust visual emphasis and spacing.
 */
export function InfoCard({
  title,
  description,
  children,
  icon,
  action,
  headerAction,
  footer,
  label,
  decorativeAccent = false,
  variant = "default",
  size = "default",
  as: Component = "div",
  className,
  ...props
}: InfoCardProps) {
  return (
    <Component
      className={cn(infoCardVariants({ variant, size }), className)}
      {...props}
    >
      {/* Decorative gradient accent */}
      {decorativeAccent && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/[0.07] to-transparent"
        />
      )}

      <div className="relative z-10">
        {/* Optional label badge */}
        {label && (
          <div className="mb-3">
            {typeof label === "string" ? (
              <span className="inline-flex items-center rounded-lg bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                {label}
              </span>
            ) : (
              label
            )}
          </div>
        )}

        {/* Header row */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            {icon ? (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 rounded-xl bg-primary/10 items-center justify-center text-primary">
                  {icon}
                </div>
                <h3 className="font-semibold text-foreground truncate">{title}</h3>
              </div>
            ) : (
              <h3 className="font-semibold text-foreground truncate">{title}</h3>
            )}
          </div>

          {/* Top-right action area */}
          {(headerAction ?? action) && (
            <div className="shrink-0 ml-3">{headerAction ?? action}</div>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {description}
          </p>
        )}

        {/* Main content slot */}
        {children && (
          <div className={cn(footer && "mb-4")}>{children}</div>
        )}

        {/* Footer */}
        {(footer || (action && !headerAction)) && (
          <div className="pt-4 border-t border-border/20">
            {footer ?? (action && !headerAction ? <div className="flex justify-end">{action}</div> : null)}
          </div>
        )}
      </div>
    </Component>
  )
}

// ---------------------------------------------------------------------------
// InfoCardGroup
// ---------------------------------------------------------------------------

/**
 * Props for the [`InfoCardGroup`](#) layout component.
 */
export interface InfoCardGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Cards to render inside the group. Each child should be an `InfoCard`. */
  children: React.ReactNode

  /**
   * Grid layout strategy.
   * - `auto`     — Responsive grid that adapts column count to available width.
   * - `columns`  — Explicit column count (1, 2, 3, or 4).
   * - `stacked`  — Single-column vertical stack with consistent gap.
   */
  layout?: "auto" | "columns" | "stacked"

  /**
   * Number of columns when `layout` is `"columns"`. Ignored for other layouts.
   * @default 2
   */
  columns?: 1 | 2 | 3 | 4
}

/**
 * A layout wrapper that arranges [`InfoCard`](#) children in a consistent
 * grid or stack. Ensures uniform card sizing via CSS Grid alignment.
 *
 * @example
 * ```tsx
 * <InfoCardGroup layout="columns" columns={3}>
 *   <InfoCard title="Card A" description="..." />
 *   <InfoCard title="Card B" description="..." />
 *   <InfoCard title="Card C" description="..." />
 * </InfoCardGroup>
 * ```
 */
export function InfoCardGroup({
  children,
  layout = "auto",
  columns = 2,
  className,
  ...props
}: InfoCardGroupProps) {
  const gridClasses: Record<string, string> = {
    auto: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    columns: {
      1: "grid grid-cols-1",
      2: "grid grid-cols-1 md:grid-cols-2",
      3: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    }[columns],
    stacked: "grid grid-cols-1",
  }

  return (
    <div
      className={cn(gridClasses[layout], "gap-4 items-start", className)}
      {...props}
    >
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// InfoCardContent — structured body rows
// ---------------------------------------------------------------------------

/**
 * Props for [`InfoCardContent`](#).
 */
export interface InfoCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Body content — typically a series of [`InfoCardRow`](#) elements. */
  children: React.ReactNode
}

/**
 * A wrapper for structured content rows inside an [`InfoCard`](#).
 * Applies consistent vertical spacing between rows.
 */
export function InfoCardContent({
  children,
  className,
  ...props
}: InfoCardContentProps) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// InfoCardRow — key/value line inside InfoCardContent
// ---------------------------------------------------------------------------

/**
 * Props for [`InfoCardRow`](#).
 */
export interface InfoCardRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Row label (left side). */
  label: string

  /** Row value (right side). Can be a string or any renderable node. */
  value?: React.ReactNode

  /**
   * Visual variant for the value text.
   * - `default` — Standard muted foreground.
   * - `primary` — Emphasised with the primary colour.
   * - `success` — Green positive indicator.
   * - `warning` — Amber warning indicator.
   * - `error`   — Red error indicator.
   * - `muted`   — Extra-muted for secondary metadata.
   */
  valueVariant?: "default" | "primary" | "success" | "warning" | "error" | "muted"
}

const valueVariantClasses: Record<NonNullable<InfoCardRowProps["valueVariant"]>, string> = {
  default: "text-foreground font-medium",
  primary: "text-primary font-semibold",
  success: "text-success font-semibold",
  warning: "text-warning font-semibold",
  error: "text-error font-semibold",
  muted: "text-muted-foreground",
}

/**
 * A single key/value row meant to be rendered inside [`InfoCardContent`](#).
 *
 * @example
 * ```tsx
 * <InfoCardContent>
 *   <InfoCardRow label="Status" value="Active" valueVariant="success" />
 *   <InfoCardRow label="Last updated" value="2 hours ago" valueVariant="muted" />
 * </InfoCardContent>
 * ```
 */
export function InfoCardRow({
  label,
  value,
  valueVariant = "default",
  className,
  ...props
}: InfoCardRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between text-sm",
        className
      )}
      {...props}
    >
      <span className="text-muted-foreground">{label}</span>
      {value !== undefined && (
        <span className={cn("text-right", valueVariantClasses[valueVariant])}>
          {value}
        </span>
      )}
    </div>
  )
}
