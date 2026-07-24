import * as React from "react"

import { cn } from "@repo/ui/lib/utils"

interface InputProps extends React.ComponentProps<"input"> {
	variant?: "default" | "minimal" | "underline" | "filled"
}

function Input({
	className,
	type,
	variant = "default",
	...props
}: InputProps) {
	return (
		<input
			type={type}
			data-slot="input"
			data-variant={variant}
			className={cn(
				// Base input styles
				"file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground w-full min-w-0 bg-transparent text-base outline-none transition-all duration-200 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
				// Variant-specific styles
				variant === "default" && [
					// Minimal 4-sided stroke with soft corners
					"h-10 rounded-lg border-2 border-input bg-background px-4 py-2 shadow-sm",
					// Focus states - sage green transition
					"focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10",
					// Error states
					"aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/10",
				],
				variant === "minimal" && [
					// Lighter 4-sided stroke
					"h-10 rounded-lg border border-input bg-background px-4 py-2",
					"focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
					"aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
				],
				variant === "underline" && [
					// Bottom border only
					"h-10 rounded-none border-b-2 border-input bg-transparent px-0 py-2",
					"focus-visible:border-primary focus-visible:ring-0",
					"aria-invalid:border-destructive aria-invalid:ring-0",
				],
				variant === "filled" && [
					// Subtle background with bottom border
					"h-10 rounded-lg border-b-2 border-input bg-surface-container px-4 py-2",
					"focus-visible:border-primary focus-visible:bg-surface-container-high focus-visible:ring-0",
					"aria-invalid:border-destructive aria-invalid:ring-0",
				],
				// File input styles
				"file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
				className
			)}
			{...props}
		/>
	)
}

// Organic Tech specialized input variants
function MinimalInput(props: React.ComponentProps<"input">) {
	return <Input {...props} variant="underline" />
}

function FilledInput(props: React.ComponentProps<"input">) {
	return <Input {...props} variant="filled" />
}

export { Input, MinimalInput, FilledInput }
