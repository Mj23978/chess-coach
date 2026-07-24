"use client"

import * as React from "react"
import { cn } from "@repo/ui/lib/utils"
import { Link } from "@repo/i18n/navigation"
import { cva, type VariantProps } from "class-variance-authority"

// ---------------------------------------------------------------------------
// Variant definitions
// ---------------------------------------------------------------------------

const containerVariants = cva(
  "relative flex items-center",
  {
    variants: {
      variant: {
        default: "w-full gap-8 border-b border-border/40 pb-px",
        pills: "gap-2 flex-wrap",
        segmented: "inline-flex gap-1 rounded-xl bg-muted/60 p-1 border border-border/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

const tabItemVariants = cva(
  "inline-flex items-center justify-center transition-all duration-200 font-medium select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md",
  {
    variants: {
      variant: {
        default: "px-1 pb-3 pt-1 -mb-[1.5px] border-b-2 border-transparent text-muted-foreground hover:text-foreground cursor-pointer rounded-none",
        pills: "px-4 py-2 rounded-lg text-sm cursor-pointer",
        segmented: "flex-1 px-3 py-1.5 text-sm rounded-lg cursor-pointer text-muted-foreground hover:text-foreground",
      },
      size: {
        sm: "text-xs",
        default: "text-sm",
        lg: "text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

// ---------------------------------------------------------------------------
// Type helpers
// ---------------------------------------------------------------------------

export interface SubNavTab {
  label: string
  value: string
  href?: string
  icon?: React.ReactNode
  trailing?: React.ReactNode
  disabled?: boolean
}

export interface SubNavTabsProps
  extends VariantProps<typeof containerVariants> {
  tabs: SubNavTab[]
  activeTab: string
  onTabChange?: (value: string) => void
  variant?: "default" | "pills" | "segmented"
  size?: "sm" | "default" | "lg"
  className?: string
  trailingContent?: React.ReactNode
  "aria-label"?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SubNavTabs({
  tabs,
  activeTab,
  onTabChange,
  variant = "default",
  size = "default",
  className,
  trailingContent,
  "aria-label": ariaLabel,
}: SubNavTabsProps) {
  // ------ handlers ------

  const handleSelect = React.useCallback(
    (tab: SubNavTab) => {
      if (tab.disabled) return
      onTabChange?.(tab.value)
    },
    [onTabChange],
  )

  // ------ rendering ------

  const resolveTabClasses = React.useCallback(
    (tab: SubNavTab) => {
      const isActive = activeTab === tab.value

      const activeStyle: Record<string, string> = {
        default: "text-foreground border-primary font-semibold",
        pills: "bg-primary text-primary-foreground shadow-sm",
        segmented: "bg-background text-foreground shadow-sm font-semibold",
      }

      const disabledStyle = "opacity-50 cursor-not-allowed pointer-events-none"

      return cn(
        tabItemVariants({ variant, size }),
        isActive && activeStyle[variant!],
        tab.disabled && disabledStyle,
      )
    },
    [activeTab, variant, size],
  )

  const renderTab = React.useCallback(
    (tab: SubNavTab) => {
      const classes = resolveTabClasses(tab)
      const shared = {
        role: "tab" as const,
        "aria-selected": activeTab === tab.value,
        "aria-disabled": tab.disabled || undefined,
        tabIndex: tab.disabled ? -1 : 0,
        className: classes,
      }

      const inner = (
        <>
          {tab.icon && (
            <span className="mr-1.5 inline-flex shrink-0 items-center justify-center opacity-85">
              {tab.icon}
            </span>
          )}
          <span>{tab.label}</span>
          {tab.trailing && (
            <span className="ml-1.5 inline-flex items-center justify-center">
              {tab.trailing}
            </span>
          )}
        </>
      )

      if (tab.href && !tab.disabled) {
        return (
          <Link
            key={tab.value}
            {...shared}
            href={tab.href}
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault()
              handleSelect(tab)
            }}
          >
            {inner}
          </Link>
        )
      }

      return (
        <button
          key={tab.value}
          {...shared}
          type="button"
          onClick={() => handleSelect(tab)}
          disabled={tab.disabled}
        >
          {inner}
        </button>
      )
    },
    [activeTab, resolveTabClasses, handleSelect],
  )

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(containerVariants({ variant }), className)}
    >
      <div role="tablist" className="flex items-center gap-6">
        {tabs.map(renderTab)}
      </div>

      {trailingContent && (
        <div className="ml-auto flex items-center gap-2">{trailingContent}</div>
      )}

      {/* Polish: Subtle SVG sparkle accent in underline variant */}
      {variant === "default" && !trailingContent && (
        <span className="text-primary/40 select-none ml-auto" aria-hidden="true">
          <svg
            className="h-3 w-3"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4L12 0Z" />
          </svg>
        </span>
      )}
    </nav>
  )
}

// ---------------------------------------------------------------------------
// Convenience presets
// ---------------------------------------------------------------------------

export interface SubNavPillsProps
  extends Omit<SubNavTabsProps, "variant" | "size"> {
  variant?: never
  size?: never
}

export function SubNavPills(props: SubNavPillsProps) {
  return <SubNavTabs {...props} variant="pills" size="sm" />
}

export interface SubNavSegmentedProps
  extends Omit<SubNavTabsProps, "variant" | "size"> {
  variant?: never
  size?: never
}

export function SubNavSegmented(props: SubNavSegmentedProps) {
  return <SubNavTabs {...props} variant="segmented" size="sm" />
}