"use client"

import * as React from "react"
import { cn } from "@repo/ui/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import { Button } from "./button"

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

const emptyStateVariants = cva(
  "flex flex-col items-center justify-center text-center px-6",
  {
    variants: {
      /** Visual emphasis level for the container. */
      variant: {
        /** Standard centered layout with no background treatment. */
        default: "py-16",
        /** Soft card appearance with rounded corners, border, and background. */
        card: "py-12 rounded-2xl border border-border/40 bg-card shadow-sm",
        /** Minimal spacing; ideal for inline or compact placements. */
        compact: "py-8",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

/**
 * Props for the [`EmptyState`](#) component.
 *
 * A versatile placeholder shown when a list, section, or view has no data.
 * Accepts an optional illustration slot, a headline, supporting description,
 * and a primary action rendered as a button or custom node.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   title="No projects yet"
 *   description="Create your first project to start generating AI videos."
 *   action={<Button onClick={onCreate}>New Project</Button>}
 * />
 * ```
 */
export interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  /** Primary headline rendered below the illustration or icon. */
  title?: string

  /**
   * Supporting body text rendered below the title.
   * Use this to explain *why* the list is empty or suggest next steps.
   */
  description?: string

  /**
   * Small icon rendered inside a tinted circle above the title.
   * Ignored when `illustration` is provided.
   * Should be an icon element sized approximately `h-6 w-6`.
   */
  icon?: React.ReactNode

  /**
   * Custom illustration replacing the default decorative SVG and the icon
   * circle. Can be any renderable node (image, complex SVG, Lottie, etc.).
   * When provided, `icon` is ignored.
   */
  illustration?: React.ReactNode

  /**
   * Primary call-to-action rendered below the description.
   * Typically a `Button` element, but any renderable node is accepted.
   */
  action?: React.ReactNode

  /**
   * Secondary action rendered beside the primary action (e.g. "Learn more"
   * link). Only shown when `action` is also present.
   */
  secondaryAction?: React.ReactNode
}

/**
 * A styled empty / placeholder state following the Organic Tech Synthesis
 * design system.
 *
 * Displays a decorative illustration (or a fallback icon), a headline,
 * optional description, and up to two action slots. Use the `variant` prop
 * to switch between a free-standing layout (`default`), a card container
 * (`card`), or a compact inline variant (`compact`).
 */
export function EmptyState({
  title = "No items found",
  description,
  icon,
  action,
  secondaryAction,
  illustration,
  variant = "default",
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(emptyStateVariants({ variant }), className)}
      role="status"
      aria-live="polite"
      {...props}
    >
      {/* Illustration or fallback icon */}
      {illustration ?? (
        <div className="mb-8">
          {icon ? (
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {icon}
            </div>
          ) : (
            <DefaultIllustration />
          )}
        </div>
      )}

      {/* Text content */}
      <div className="mx-auto max-w-sm">
        <h3 className="text-headline-sm text-foreground mb-2">{title}</h3>
        {description && (
          <p className="text-sm leading-relaxed text-muted-foreground mb-6">
            {description}
          </p>
        )}

        {/* Actions */}
        {(action || secondaryAction) && (
          <div className="flex flex-col items-center gap-3">
            {action}
            {secondaryAction && (
              <span className="text-sm text-muted-foreground">
                {secondaryAction}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// DefaultIllustration
// ---------------------------------------------------------------------------

/**
 * The built-in decorative SVG shown when no `illustration` or `icon` is
 * provided. Uses design-system-aware colors and organic / hand-drawn
 * inspired shapes.
 */
function DefaultIllustration() {
  return (
    <div className="relative mx-auto h-32 w-32" aria-hidden="true">
      <svg
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
      >
        {/* Background circle — primary tint */}
        <circle
          cx="64"
          cy="64"
          r="52"
          className="fill-primary/[0.06]"
        />

        {/* Document outline */}
        <rect
          x="36"
          y="28"
          width="56"
          height="72"
          rx="6"
          className="stroke-primary/20"
          strokeWidth="1.5"
        />

        {/* Folded corner */}
        <path
          d="M76 28v16h16"
          className="stroke-primary/20"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Content lines */}
        <line x1="48" y1="56" x2="80" y2="56" className="stroke-primary/15" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="48" y1="66" x2="72" y2="66" className="stroke-primary/15" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="48" y1="76" x2="64" y2="76" className="stroke-primary/15" strokeWidth="1.5" strokeLinecap="round" />

        {/* Sparkle accent — top-right */}
        <path
          d="M98 22l2 4 4 2-4 2-2 4-2-4-4-2 4-2z"
          className="fill-primary/30"
        />

        {/* Sparkle accent — bottom-left */}
        <path
          d="M30 98l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5z"
          className="fill-primary/20"
        />
      </svg>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Specialized Empty States
// ---------------------------------------------------------------------------

/**
 * Props for specialized empty-state convenience wrappers.
 */
interface SpecializedEmptyStateProps {
  /** Callback invoked when the primary action button is clicked. */
  onCreate?: () => void
}

/**
 * Empty state for the Characters list — displayed when a project has no
 * character profiles yet.
 */
export function EmptyCharactersState({
  onCreate,
}: SpecializedEmptyStateProps) {
  return (
    <EmptyState
      title="No characters yet"
      description="Create your first character to maintain visual consistency across your generated videos."
      icon={
        <svg
          className="h-7 w-7"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
          <path d="M4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      }
      action={
        onCreate && (
          <Button size="sm" onClick={onCreate}>
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            >
              <path d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Character
          </Button>
        )
      }
    />
  )
}

/**
 * Empty state for the Voices list — displayed when a project has no
 * voice configurations yet.
 */
export function EmptyVoicesState({
  onCreate,
}: SpecializedEmptyStateProps) {
  return (
    <EmptyState
      title="No voices configured"
      description="Set up your first voice model to enable text-to-speech generation for your scripts."
      icon={
        <svg
          className="h-7 w-7"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
        </svg>
      }
      action={
        onCreate && (
          <Button size="sm" onClick={onCreate}>
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            >
              <path d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Voice
          </Button>
        )
      }
    />
  )
}

/**
 * Empty state for the Projects list — displayed when the user has not
 * created any projects yet.
 */
export function EmptyProjectsState({
  onCreate,
}: SpecializedEmptyStateProps) {
  return (
    <EmptyState
      title="No projects yet"
      description="Start by creating a project to organize your characters, scripts, and video workflows."
      icon={
        <svg
          className="h-7 w-7"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
        </svg>
      }
      action={
        onCreate && (
          <Button size="sm" onClick={onCreate}>
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            >
              <path d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Project
          </Button>
        )
      }
    />
  )
}

/**
 * Empty state for search results — displayed when a query yields no
 * matching items.
 */
export function EmptySearchState({
  query,
}: {
  /** The search query that returned no results. */
  query?: string
}) {
  return (
    <EmptyState
      title="No results found"
      description={
        query
          ? `We could not find anything matching "${query}". Try adjusting your search terms or filters.`
          : "Try adjusting your search terms or filters to find what you are looking for."
      }
      icon={
        <svg
          className="h-7 w-7"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
      }
    />
  )
}
