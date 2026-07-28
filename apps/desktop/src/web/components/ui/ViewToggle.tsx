/**
 * ViewToggle — shared grid/list view toggle for collection pages.
 * Extracted from Engines, Databases, and Files pages to eliminate duplication.
 */

export type ViewMode = "grid" | "list";

interface ViewToggleProps {
	mode: ViewMode;
	active: boolean;
	onClick: () => void;
}

export function ViewToggle({ mode, active, onClick }: ViewToggleProps) {
	const Icon = mode === "grid" ? GridIcon : ListIcon;
	return (
		<button
			type="button"
			onClick={onClick}
			className={`flex items-center justify-center rounded px-2 py-1 text-sm transition-colors ${
				active
					? "bg-chess-cream text-chess-brown"
					: "text-muted-foreground hover:bg-chess-cream/50"
			}`}
			aria-label={`${mode} view`}
			aria-pressed={active}
		>
			<Icon className="size-4" />
		</button>
	);
}

function GridIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<rect x="3" y="3" width="7" height="7" rx="1" />
			<rect x="14" y="3" width="7" height="7" rx="1" />
			<rect x="3" y="14" width="7" height="7" rx="1" />
			<rect x="14" y="14" width="7" height="7" rx="1" />
		</svg>
	);
}

function ListIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={2}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<line x1="8" y1="6" x2="21" y2="6" />
			<line x1="8" y1="12" x2="21" y2="12" />
			<line x1="8" y1="18" x2="21" y2="18" />
			<circle cx="3.5" cy="6" r="1" />
			<circle cx="3.5" cy="12" r="1" />
			<circle cx="3.5" cy="18" r="1" />
		</svg>
	);
}
