/**
 * PageContainer — standard page layout wrapper for chess-coach.
 *
 * Provides consistent max-width + padding across all content pages. Eliminates
 * the ad-hoc `mx-auto max-w-{3xl,4xl,6xl} p-8` patterns scattered throughout.
 *
 * Layout context: this sits inside `<SidebarInset>`, which already pushes the
 * content column right of the sidebar (`pl-(--sidebar-width)`). We therefore do
 * NOT re-center with `mx-auto` on the default/wide variants — centering a
 * near-full-width block inside an already-pushed column only adds asymmetric
 * dead margin on the right. `max-w-*` stays as a ceiling for ultra-wide
 * monitors so content doesn't stretch past a readable measure.
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
	default: "max-w-7xl mx-auto",
	wide: "max-w-screen-xl mx-auto",
	full: "",
} as const;

export function PageContainer({
	children,
	variant = "default",
	className,
}: PageContainerProps) {
	return (
		<div className={`${VARIANT_CLASSES[variant]} px-6 py-8 ${className ?? ""}`}>
			{children}
		</div>
	);
}
