"use client"

import { cn } from "@repo/ui/lib/utils"
import { Button } from "./button"
import { MoreHorizontal } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

const statCardVariants = cva(
  "bg-card border border-border/40 rounded-2xl p-5 relative hover:border-primary/20 transition-all duration-150",
  {
    variants: {
      size: {
        default: "p-5",
        compact: "p-4",
        lg: "p-6",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export interface StatCardProps extends VariantProps<typeof statCardVariants> {
  title: string
  value: string | number
  change?: number | string
  changeType?: "increase" | "decrease" | "neutral"
  description?: string
  icon?: React.ReactNode
  size?: VariantProps<typeof statCardVariants>["size"]
  className?: string
  action?: React.ReactNode
}

export function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  description,
  icon,
  size = "default",
  className,
  action,
}: StatCardProps) {
  return (
    <div className={cn(statCardVariants({ size }), className)}>
      {/* Header with title and action */}
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm text-muted-foreground font-medium">{title}</span>
        {action || (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Main value with trend */}
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
        {change && (
          <span
            className={cn(
              "text-xs font-semibold flex items-center gap-0.5",
              changeType === "increase" && "text-success",
              changeType === "decrease" && "text-error",
              changeType === "neutral" && "text-muted-foreground"
            )}
          >
            {changeType === "increase" && (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            )}
            {changeType === "decrease" && (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            )}
            {typeof change === "number" && `${Math.abs(change)}%`}
            {typeof change === "string" && change}
          </span>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {/* Icon (optional) */}
      {icon && (
        <div className="absolute top-5 right-5 text-muted-foreground/50">
          {icon}
        </div>
      )}
    </div>
  )
}

// Specialized stat card with progress bar (for storage usage)
export function StorageStatCard({
  title,
  used,
  total,
  className,
}: {
  title: string
  used: number
  total: number
  className?: string
}) {
  const percentage = Math.round((used / total) * 100)

  return (
    <div className={cn(statCardVariants({ size: "compact" }), className)}>
      <span className="text-sm text-muted-foreground font-medium block mb-1">{title}</span>
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-lg font-bold text-foreground">{used} GB</span>
        <span className="text-xs text-muted-foreground">/ {total} GB</span>
      </div>
      <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mb-1">
        <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${percentage}%` }} />
      </div>
      <div className="flex justify-end">
        <span className="text-[10px] text-muted-foreground font-bold">{percentage}% used</span>
      </div>
    </div>
  )
}
