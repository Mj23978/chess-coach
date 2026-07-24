"use client"

import { cn } from "@repo/ui/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const statusBadgeVariants = cva(
  "base",
  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border",
  {
    variants: {
      variant: {
        default: "bg-background border-border text-foreground",
        primary: "bg-primary-container/20 border-primary/30 text-primary",
        success: "bg-success-container/20 border-success/30 text-success",
        warning: "bg-warning-container/20 border-warning/30 text-warning",
        error: "bg-error-container/20 border-error/30 text-error",
        completed: "bg-primary-container/20 border-primary/30 text-primary",
        failed: "bg-error-container/20 border-error/30 text-error",
        processing: "bg-warning-container/20 border-warning/30 text-warning animate-pulse",
        pending: "bg-muted border-border text-muted-foreground",
        active: "bg-primary text-primary-foreground shadow-sm",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        default: "px-2.5 py-1 text-xs",
        lg: "px-3 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface StatusBadgeProps extends React.ComponentProps<"div"> {
  variant?: VariantProps<typeof statusBadgeVariants>["variant"]
  size?: VariantProps<typeof statusBadgeVariants>["size"]
  children: React.ReactNode
}

export function StatusBadge({
  variant = "default",
  size = "default",
  className,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <div className={cn(statusBadgeVariants({ variant, size }), className)} {...props}>
      {children}
    </div>
  )
}

// Pre-configured status variants for common use cases
export function CompletedBadge({ children = "Completed" }: { children?: React.ReactNode }) {
  return <StatusBadge variant="completed">{children}</StatusBadge>
}

export function FailedBadge({ children = "Failed" }: { children?: React.ReactNode }) {
  return <StatusBadge variant="failed">{children}</StatusBadge>
}

export function ProcessingBadge({ children = "Processing" }: { children?: React.ReactNode }) {
  return <StatusBadge variant="processing">{children}</StatusBadge>
}

export function ActiveBadge({ children = "Active" }: { children?: React.ReactNode }) {
  return <StatusBadge variant="active">{children}</StatusBadge>
}
