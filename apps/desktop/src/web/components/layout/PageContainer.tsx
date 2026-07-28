/**
 * PageContainer — standard page layout wrapper for chess-coach.
 *
 * Provides consistent max-width, padding, and centering across all content
 * pages. Eliminates the ad-hoc `mx-auto max-w-{3xl,4xl,6xl} p-8` patterns
 * scattered throughout the app.
 *
 * Variants:
 *   default  → max-w-7xl (1280px) — most pages (dashboard, accounts, engines, etc.)
 *   "wide"   → max-w-screen-xl (1280px) — game review, board-adjacent pages
 *   "full"   → no max-width — board page, full-bleed layouts
 */
import { type ReactNode } from "react";

interface PageContainerProps {
	children: ReactNode;
	/** Width variant. Default "default" (max-w-7xl). */
	variant?: "default" | "wide" | "full";
	/** Override the default vertical/horizontal padding. */
	className?: string;
}

const VARIANT_CLASSES = {
	default: "mx-auto max-w-7xl",
	wide: "mx-auto max-w-screen-xl",
	full: "",
} as const;

export function PageContainer({
	children,
	variant = "default",
	className,
}: PageContainerProps) {
	return (
		<div
			className={`${VARIANT_CLASSES[variant]} px-8 py-8 ${className ?? ""}`}
		>
			{children}
		</div>
	);
}
