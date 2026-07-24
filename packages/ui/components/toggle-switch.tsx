"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cn } from "@repo/ui/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

// ---------------------------------------------------------------------------
// ToggleSwitch -- Custom toggle switch extending Radix UI Switch
// ---------------------------------------------------------------------------

const toggleSwitchVariants = cva(
  "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      /** Visual style variant. */
      variant: {
        default:
          "data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted hover:data-[state=unchecked]:bg-muted/80",
        sage: "data-[state=checked]:bg-primary data-[state=unchecked]:bg-primary/15",
        success: "data-[state=checked]:bg-success data-[state=unchecked]:bg-muted",
        warning: "data-[state=checked]:bg-warning data-[state=unchecked]:bg-muted",
        danger: "data-[state=checked]:bg-error data-[state=unchecked]:bg-muted",
      },
      /** Size of the track. */
      size: {
        sm: "h-[20px] w-9",
        default: "h-6 w-11",
        lg: "h-7 w-[52px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const thumbVariants = cva(
  "pointer-events-none block rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out",
  {
    variants: {
      size: {
        sm: "h-3.5 w-3.5 data-[state=checked]:translate-x-[14px] data-[state=unchecked]:translate-x-[3px]",
        default:
          "h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5",
        lg: "h-6 w-6 data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-0.5",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

/** Props for the root ToggleSwitch component. */
export interface ToggleSwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
    VariantProps<typeof toggleSwitchVariants> {
  /** Short descriptive label rendered next to the switch (optional). */
  label?: string
}

/**
 * An accessible toggle switch built on top of Radix UI Switch primitives.
 *
 * Follows the "Organic Tech Synthesis" design system:
 * - Primary Sage Green (`#496458`) active state
 * - Cream background (`#fcf9f4`) context
 * - Rounded pill shape (radius 9999px for the track, 50% for the thumb)
 *
 * @example
 * ```tsx
 * <ToggleSwitch
 *   checked={enabled}
 *   onCheckedChange={setEnabled}
 *   label="Dark mode"
 * />
 *
 * <ToggleSwitch variant="success" size="sm" checked={active} onCheckedChange={setActive} />
 * ```
 */
export function ToggleSwitch({
  className,
  variant = "default",
  size = "default",
  label,
  id,
  ...props
}: ToggleSwitchProps) {
  const switchId = React.useId()
  const resolvedId = id ?? switchId

  return (
    <div className="inline-flex items-center gap-2">
      <SwitchPrimitives.Root
        id={resolvedId}
        className={cn(toggleSwitchVariants({ variant, size }), className)}
        {...props}
      >
        <SwitchPrimitives.Thumb className={cn(thumbVariants({ size }))} />
      </SwitchPrimitives.Root>

      {label && (
        <label
          htmlFor={resolvedId}
          className="text-sm font-medium text-foreground cursor-pointer select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ToggleSwitchField -- Switch with a descriptive label and supporting text
// ---------------------------------------------------------------------------

/** Props for the compound ToggleSwitchField layout. */
export interface ToggleSwitchFieldProps extends ToggleSwitchProps {
  /** Main label text rendered beside the switch. */
  fieldLabel: string
  /** Optional secondary description rendered below the label. */
  description?: string
}

/**
 * A labeled toggle switch with optional description, useful for settings
 * panels and forms.
 *
 * @example
 * ```tsx
 * <ToggleSwitchField
 *   fieldLabel="Email notifications"
 *   description="Receive weekly project updates via email."
 *   checked={emailEnabled}
 *   onCheckedChange={setEmailEnabled}
 * />
 * ```
 */
export function ToggleSwitchField({
  fieldLabel,
  description,
  id,
  ...props
}: ToggleSwitchFieldProps) {
  const switchId = React.useId()

  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border/40 bg-card p-4 transition-colors hover:border-primary/20">
      <div className="flex flex-col gap-0.5">
        <label
          htmlFor={id ?? switchId}
          className="text-sm font-medium text-foreground cursor-pointer select-none"
        >
          {fieldLabel}
        </label>
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <ToggleSwitch id={id ?? switchId} {...props} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// ToggleSwitchWithIcon -- Switch with an icon indicator
// ---------------------------------------------------------------------------

/** Props for a toggle switch that renders icons instead of a plain thumb. */
export interface ToggleSwitchWithIconProps extends ToggleSwitchProps {
  /** Icon displayed when the switch is in the unchecked (off) state. */
  offIcon?: React.ReactNode
  /** Icon displayed when the switch is in the checked (on) state. */
  onIcon?: React.ReactNode
}

/**
 * A toggle switch variant that replaces the default thumb with contextual
 * icons for the on and off states.
 *
 * @example
 * ```tsx
 * <ToggleSwitchWithIcon
 *   checked={paused}
 *   onCheckedChange={setPaused}
 *   offIcon={<Play className="h-3 w-3" />}
 *   onIcon={<Pause className="h-3 w-3" />}
 * />
 * ```
 */
export function ToggleSwitchWithIcon({
  className,
  variant = "default",
  size = "default",
  offIcon,
  onIcon,
  ...props
}: ToggleSwitchWithIconProps) {
  const iconSizeClasses = {
    sm: "h-3 w-3",
    default: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  }

  return (
    <SwitchPrimitives.Root
      className={cn(toggleSwitchVariants({ variant, size }), className)}
      {...props}
    >
      <SwitchPrimitives.Thumb className={cn(thumbVariants({ size }))}>
        <span
          className={cn(
            "flex items-center justify-center text-primary absolute inset-0 transition-opacity duration-200",
            iconSizeClasses[size],
            "data-[state=checked]:opacity-0"
          )}
        >
          {offIcon}
        </span>
        <span
          className={cn(
            "flex items-center justify-center text-white absolute inset-0 transition-opacity duration-200",
            iconSizeClasses[size],
            "data-[state=unchecked]:opacity-0"
          )}
        >
          {onIcon}
        </span>
      </SwitchPrimitives.Thumb>
    </SwitchPrimitives.Root>
  )
}
