"use client"

import * as React from "react"
import { cn } from "@repo/ui/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

/**
 * Status dot variants mapped to semantic workflow states.
 *
 * - `default`   -- neutral / inactive indicator
 * - `primary`   -- generic active or highlighted state
 * - `success`   -- completed, approved, or healthy
 * - `warning`   -- needs attention, awaiting approval
 * - `error`     -- failed, rejected, or critical
 * - `completed` -- workflow step finished (uses success colour)
 * - `failed`    -- workflow step errored (uses error colour)
 * - `processing`-- currently running (pulsing animation)
 * - `pending`   -- waiting in queue (muted appearance)
 * - `active`    -- currently selected or live
 * - `paused`    -- temporarily suspended
 * - `skipped`   -- step was bypassed intentionally
 */
const statusDotVariants = cva("rounded-full inline-flex-shrink-0", {
  variants: {
    variant: {
      default: "bg-muted-foreground",
      primary: "bg-primary",
      success: "bg-success",
      warning: "bg-warning",
      error: "bg-error",
      completed: "bg-success",
      failed: "bg-error",
      processing: "bg-warning animate-pulse",
      pending: "bg-muted-foreground/40",
      active: "bg-primary shadow-[0_0_0_3px_rgba(73,100,88,0.2)]",
      paused: "bg-muted-foreground/60",
      skipped: "bg-muted-foreground/25",
    },
    size: {
      sm: "w-1.5 h-1.5",
      default: "w-2 h-2",
      lg: "w-2.5 h-2.5",
      xl: "w-3 h-3",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

/** Extract the variant union types from the CVA config. */
type StatusVariant = NonNullable<VariantProps<typeof statusDotVariants>["variant"]>
type StatusSize = NonNullable<VariantProps<typeof statusDotVariants>["size"]>

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Props for the base `StatusDot` component. */
export interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** The semantic status represented by the dot. */
  variant?: StatusVariant
  /** Size of the dot. */
  size?: StatusSize
  /** Whether to render an outer ring / glow around the dot. */
  ring?: boolean
}

/** Props for the composite `StatusLabel` component (dot + text). */
export interface StatusLabelProps extends Omit<StatusDotProps, "ring"> {
  /** Text rendered next to the dot. */
  label: string
  /** Placement of the label relative to the dot. */
  labelPlacement?: "right" | "left"
}

/** Props for the animated `PulsingStatusDot` which always pulses. */
export interface PulsingStatusDotProps extends Omit<StatusDotProps, "variant"> {
  /** The status colour to pulse with. Defaults to `"warning"`. */
  variant?: StatusVariant
  /** Pulse duration in seconds. Defaults to `2`. */
  pulseDuration?: number
}

// ---------------------------------------------------------------------------
// StatusDot
// ---------------------------------------------------------------------------

/**
 * A small circular indicator that communicates a semantic workflow state
 * through colour and optional animation.
 *
 * @example
 * ```tsx
 * <StatusDot variant="processing" size="lg" />
 * <StatusDot variant="completed" ring />
 * ```
 */
export function StatusDot({
  variant = "default",
  size = "default",
  ring = false,
  className,
  "aria-label": ariaLabel,
  ...props
}: StatusDotProps) {
  return (
    <span
      role="status"
      aria-label={ariaLabel ?? variant}
      className={cn(
        statusDotVariants({ variant, size }),
        ring && [
          "ring-2 ring-offset-2 ring-offset-background",
          variant === "success" && "ring-success/30",
          variant === "completed" && "ring-success/30",
          variant === "warning" && "ring-warning/30",
          variant === "error" && "ring-error/30",
          variant === "failed" && "ring-error/30",
          variant === "processing" && "ring-warning/30",
          variant === "primary" && "ring-primary/30",
          variant === "active" && "ring-primary/30",
          "ring-muted-foreground/20",
        ],
        className,
      )}
      {...props}
    />
  )
}

// ---------------------------------------------------------------------------
// StatusLabel
// ---------------------------------------------------------------------------

/**
 * Combines a `StatusDot` with a text label for inline use in tables,
 * lists, and sidebar items.
 *
 * @example
 * ```tsx
 * <StatusLabel variant="processing" label="Generating..." />
 * <StatusLabel variant="completed" label="Done" labelPlacement="left" />
 * ```
 */
export function StatusLabel({
  variant = "default",
  size = "default",
  label,
  labelPlacement = "right",
  className,
  ...props
}: StatusLabelProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        labelPlacement === "left" && "flex-row-reverse",
        className,
      )}
      {...props}
    >
      <StatusDot variant={variant} size={size} />
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </span>
  )
}

// ---------------------------------------------------------------------------
// PulsingStatusDot
// ---------------------------------------------------------------------------

/**
 * A status dot with a continuous, configurable pulse animation.
 * Useful for long-running background processes or live indicators.
 *
 * @example
 * ```tsx
 * <PulsingStatusDot variant="success" pulseDuration={3} />
 * ```
 */
export function PulsingStatusDot({
  variant = "warning",
  size = "default",
  pulseDuration = 2,
  className,
  "aria-label": ariaLabel,
  ...props
}: PulsingStatusDotProps) {
  const style = React.useMemo(
    () => ({ "--pulse-duration": `${pulseDuration}s` }) as React.CSSProperties,
    [pulseDuration],
  )

  return (
    <span
      role="status"
      aria-label={ariaLabel ?? variant}
      className={cn(
        statusDotVariants({ variant, size }),
        "animate-[status-pulse_var(--pulse-duration)_ease-in-out_infinite]",
        className,
      )}
      style={style}
      {...props}
    />
  )
}

// ---------------------------------------------------------------------------
// Pre-configured workflow convenience components
// ---------------------------------------------------------------------------

/** Dot representing a workflow step that is currently running. */
export function ProcessingDot({
  size = "default",
  className,
  ...props
}: Omit<StatusDotProps, "variant" | "ring">) {
  return <StatusDot variant="processing" size={size} className={className} {...props} />
}

/** Dot representing a successfully completed workflow step. */
export function CompletedDot({
  size = "default",
  ring = false,
  className,
  ...props
}: Omit<StatusDotProps, "variant">) {
  return <StatusDot variant="completed" size={size} ring={ring} className={className} {...props} />
}

/** Dot representing a failed workflow step. */
export function FailedDot({
  size = "default",
  ring = false,
  className,
  ...props
}: Omit<StatusDotProps, "variant">) {
  return <StatusDot variant="failed" size={size} ring={ring} className={className} {...props} />
}

/** Dot representing a step waiting to be executed. */
export function PendingDot({
  size = "default",
  className,
  ...props
}: Omit<StatusDotProps, "variant" | "ring">) {
  return <StatusDot variant="pending" size={size} className={className} {...props} />
}

/** Dot representing the currently active / selected step. */
export function ActiveDot({
  size = "default",
  className,
  ...props
}: Omit<StatusDotProps, "variant">) {
  return <StatusDot variant="active" size={size} ring className={className} {...props} />
}

/** Dot representing a step that was intentionally skipped. */
export function SkippedDot({
  size = "default",
  className,
  ...props
}: Omit<StatusDotProps, "variant" | "ring">) {
  return <StatusDot variant="skipped" size={size} className={className} {...props} />
}

/** Dot representing a step that is paused or suspended (awaiting approval). */
export function PausedDot({
  size = "default",
  className,
  ...props
}: Omit<StatusDotProps, "variant" | "ring">) {
  return <StatusDot variant="paused" size={size} className={className} {...props} />
}
