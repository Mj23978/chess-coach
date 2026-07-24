import * as React from "react"

import { cn } from "@repo/ui/lib/utils"

interface TextareaProps extends React.ComponentProps<"textarea"> {
	variant?: "default" | "minimal" | "underline" | "filled"
}

function Textarea({
	className,
	variant = "default",
	...props
}: TextareaProps) {
	return (
		<textarea
			data-slot="textarea"
			data-variant={variant}
			className={cn(
				// Base textarea styles
				"placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex min-h-24 w-full bg-transparent text-base outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-y",
				// Variant-specific styles
				variant === "default" && [
					// Minimal 4-sided stroke with soft corners
					"rounded-lg border-2 border-input bg-background px-4 py-3 shadow-sm",
					// Focus states - sage green transition
					"focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10",
					// Error states
					"aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/10",
				],
				variant === "minimal" && [
					// Lighter 4-sided stroke
					"rounded-lg border border-input bg-background px-4 py-3",
					"focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
					"aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
				],
				variant === "underline" && [
					// Bottom border only
					"rounded-none border-b-2 border-input bg-transparent px-0 py-3",
					"focus-visible:border-primary focus-visible:ring-0",
					"aria-invalid:border-destructive aria-invalid:ring-0",
				],
				variant === "filled" && [
					// Subtle background with bottom border
					"rounded-lg border-b-2 border-input bg-surface-container px-4 py-3",
					"focus-visible:border-primary focus-visible:bg-surface-container-high focus-visible:ring-0",
					"aria-invalid:border-destructive aria-invalid:ring-0",
				],
				className
			)}
			{...props}
		/>
	)
}

// Organic Tech specialized textarea variants
function MinimalTextarea(props: React.ComponentProps<"textarea">) {
	return <Textarea {...props} variant="underline" />
}

function FilledTextarea(props: React.ComponentProps<"textarea">) {
	return <Textarea {...props} variant="filled" />
}

export { Textarea, MinimalTextarea, FilledTextarea }
