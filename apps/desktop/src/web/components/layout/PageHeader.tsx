/**
 * PageHeader — standardized page header for chess-coach.
 *
 * Provides consistent layout across all pages:
 *   Left: [Back link] + [Icon] + [Title + Subtitle]
 *   Right: [Actions]
 *
 * The back link appears when `backTo` is provided (deep pages like Accounts, Game Review).
 */
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

interface PageHeaderProps {
	/** Page title (required). */
	title: string;
	/** Descriptive subtitle below the title. */
	subtitle?: string;
	/** Icon displayed next to the title. */
	icon?: React.ReactNode;
	/** If set, shows a "← Back" link pointing to this path. */
	backTo?: string;
	/** Label for the back link (defaults to parent page name). */
	backLabel?: string;
	/** Action buttons rendered on the right side. */
	actions?: React.ReactNode;
	/** Additional classes on the outer wrapper. */
	className?: string;
}

export function PageHeader({
	title,
	subtitle,
	icon,
	backTo,
	backLabel,
	actions,
	className,
}: PageHeaderProps) {
	return (
		<header className={`mb-6 ${className ?? ""}`}>
			{backTo && (
				<Link
					to={backTo}
					className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
				>
					<ChevronLeft className="size-3" />
					{backLabel ?? "Back"}
				</Link>
			)}

			<div className="flex items-start justify-between gap-4">
				<div className="flex items-center gap-3">
					{icon && (
						<div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-chess-cream text-chess-brown">
							{icon}
						</div>
					)}
					<div>
						<h1 className="text-2xl font-bold tracking-tight">{title}</h1>
						{subtitle && (
							<p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
						)}
					</div>
				</div>

				{actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
			</div>
		</header>
	);
}
