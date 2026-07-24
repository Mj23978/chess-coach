"use client"

import * as React from "react"
import { cn } from "@repo/ui/lib/utils"
import { StatCard } from "@repo/ui/components/stat-card"

export interface StatGridItem {
  /** Stat label (passed to <StatCard title>). */
  label: string
  /** Stat value. */
  value: string | number
  /** Optional icon node. */
  icon?: React.ReactNode
  /** Trend direction. */
  trend?: "increase" | "decrease" | "neutral"
  /** Trend label (e.g. "+12%"). */
  trendValue?: string
  /** Optional progress (0-100) — ignored unless the underlying StatCard
   * evolves to support it; reserved for future use. */
  progress?: number
}

export interface StatGridProps {
  stats: StatGridItem[]
  /** Desired column count at the lg breakpoint. Default 4. */
  columns?: 2 | 3 | 4
  className?: string
}

const lgColClass: Record<NonNullable<StatGridProps["columns"]>, string> = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
}

/**
 * A responsive row of <StatCard/> instances. Replaces the hand-rolled 4-up
 * `<Card>` stat rows in Overview/Assets/Hyperframes/Scheduler.
 *
 * Renders as a 2-up grid on small screens and `columns`-up at lg, so stats
 * never collapse to a single column on tablet.
 */
export function StatGrid({ stats, columns = 4, className }: StatGridProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-4", lgColClass[columns], className)}>
      {stats.map((stat, i) => (
        <StatCard
          key={stat.label + i}
          title={stat.label}
          value={stat.value}
          icon={stat.icon}
          change={stat.trendValue}
          changeType={stat.trend}
        />
      ))}
    </div>
  )
}
