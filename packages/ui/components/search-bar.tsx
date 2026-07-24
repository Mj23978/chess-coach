"use client"

import * as React from "react"
import { cn } from "@repo/ui/lib/utils"
import { Search, X } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

/** Visual style variants for the SearchBar */
const searchBarVariants = cva(
  "relative flex items-center w-full transition-all duration-200",
  {
    variants: {
      /** Controls padding and text sizing */
      size: {
        sm: "rounded-lg",
        default: "rounded-xl",
        lg: "rounded-xl",
      },
      /** Visual density / emphasis level */
      variant: {
        /** Subtle background with light border, best for toolbars */
        default: "bg-muted/40 border border-border/50 focus-within:border-primary/60",
        /** Flush background, blends into surface */
        ghost: "bg-transparent border border-transparent focus-within:bg-muted/30 focus-within:border-border/50",
        /** Solid cream background with stronger border */
        filled: "bg-[#fcf9f4]/80 border border-border/60 focus-within:border-[#496458]/50",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

const inputClasses = cva(
  "w-full bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none",
  {
    variants: {
      size: {
        sm: "py-2 px-4 pl-9 text-xs",
        default: "py-2.5 px-4 pl-11 text-sm",
        lg: "py-3 px-5 pl-12 text-base",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const iconSizeClasses = {
  sm: "w-4 h-4",
  default: "w-5 h-5",
  lg: "w-6 h-6",
}

const iconPositionClasses = {
  sm: "left-3",
  default: "left-3.5",
  lg: "left-4",
}

/**
 * Props for the {@link SearchBar} component.
 *
 * @example
 * ```tsx
 * <SearchBar placeholder="Search projects..." onValueChange={setFilter} />
 * ```
 */
export interface SearchBarProps extends VariantProps<typeof searchBarVariants> {
  /** Placeholder text displayed when the input is empty */
  placeholder?: string

  /** Controlled value of the search input */
  value?: string

  /** Callback fired when the input value changes */
  onValueChange?: (value: string) => void

  /** Custom leading icon slot (overrides the default Search icon) */
  icon?: React.ReactNode

  /** When true, shows a clear (X) button when the input has a value */
  clearable?: boolean

  /** Callback fired when the clear button is clicked */
  onClear?: () => void

  /** Accessible label for the input; falls back to the placeholder */
  "aria-label"?: string

  /** Additional CSS classes applied to the outer wrapper */
  className?: string

  /** Additional CSS classes applied to the native `<input>` element */
  inputClassName?: string

  /** Props forwarded to the native `<input>` element (e.g. `onKeyDown`, `autoFocus`) */
  inputProps?: Omit<React.ComponentProps<"input">, "value" | "onChange" | "className" | "placeholder">
}

/**
 * A styled search input with an icon prefix, optional clear button, and
 * multiple visual variants that follow the "Organic Tech Synthesis" design
 * system.
 *
 * - **default** -- muted background with a light border.
 * - **ghost** -- transparent background until focused.
 * - **filled** -- warm cream (#fcf9f4) background for prominent placement.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <SearchBar placeholder="Search..." />
 *
 * // Controlled with clear button
 * <SearchBar
 *   value={query}
 *   onValueChange={setQuery}
 *   clearable
 *   size="lg"
 *   variant="filled"
 * />
 * ```
 */
export function SearchBar({
  placeholder = "Search...",
  value,
  onValueChange,
  icon,
  clearable = false,
  onClear,
  "aria-label": ariaLabel,
  className,
  inputClassName,
  inputProps,
  size = "default",
  variant = "default",
}: SearchBarProps) {
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = React.useState("")
  const currentValue = isControlled ? value : internalValue
  const hasValue = currentValue.length > 0

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value
      if (!isControlled) setInternalValue(next)
      onValueChange?.(next)
    },
    [isControlled, onValueChange],
  )

  const handleClear = React.useCallback(() => {
    if (!isControlled) setInternalValue("")
    onValueChange?.("")
    onClear?.()
  }, [isControlled, onValueChange, onClear])

  return (
    <div className={cn(searchBarVariants({ size, variant }), className)}>
      {/* Leading icon */}
      <span
        className={cn(
          "absolute inset-y-0 flex items-center pointer-events-none text-muted-foreground",
          iconPositionClasses[size],
        )}
      >
        {icon ?? <Search className={iconSizeClasses[size]} />}
      </span>

      {/* Input */}
      <input
        type="text"
        placeholder={placeholder}
        value={currentValue}
        onChange={handleChange}
        aria-label={ariaLabel ?? placeholder}
        className={cn(inputClasses({ size }), inputClassName)}
        {...inputProps}
      />

      {/* Clear button */}
      {clearable && hasValue && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className={cn("shrink-0", size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4")} />
        </button>
      )}
    </div>
  )
}
