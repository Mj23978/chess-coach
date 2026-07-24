/**
 * AppShell — the main application layout wrapper for chess-coach.
 *
 * Structure:
 *   TitleBar (top, fixed height)
 *   └── SidebarProvider
 *       ├── NavigationRail (left, collapsible)
 *       └── SidebarInset (main content area)
 *
 * The sidebar uses @repo/ui Sidebar components with a collapsible "icon" mode.
 * This provides a narrow icon rail when collapsed, full-width sidebar when expanded.
 */
import { useState } from "react";
import { SidebarInset, SidebarProvider } from "@repo/ui/components/sidebar";
import { NavigationRail } from "./NavigationRail";
import { TitleBar } from "./TitleBar";

interface AppShellProps {
	children: React.ReactNode;
	onNewGame?: () => void;
	onImportPgn?: () => void;
	onExportPgn?: () => void;
}

export function AppShell({
	children,
	onNewGame,
	onImportPgn,
	onExportPgn,
}: AppShellProps) {
	const [keybindingsOpen, setKeybindingsOpen] = useState(false);
	const [defaultSidebarOpen, setDefaultSidebarOpen] = useState(true);

	return (
		<div className="flex h-screen flex-col overflow-hidden">
			{/* Title bar */}
			<TitleBar
				onNewGame={onNewGame}
				onImportPgn={onImportPgn}
				onExportPgn={onExportPgn}
				onToggleSidebar={() => setDefaultSidebarOpen((open) => !open)}
			/>

			{/* Main content area with sidebar */}
			<SidebarProvider
				defaultOpen={defaultSidebarOpen}
				open={defaultSidebarOpen}
				onOpenChange={setDefaultSidebarOpen}
			>
				<NavigationRail onKeybindings={() => setKeybindingsOpen(true)} />
				<SidebarInset className="flex-1 overflow-auto">{children}</SidebarInset>
			</SidebarProvider>

			{/* Keybindings modal placeholder - would be implemented later */}
			{keybindingsOpen && (
				<KeybindingsModal onClose={() => setKeybindingsOpen(false)} />
			)}
		</div>
	);
}

/**
 * Placeholder keybindings modal.
 * Will be implemented properly in Phase 8 (Settings & Keybindings).
 */
function KeybindingsModal({ onClose }: { onClose: () => void }) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-lg">
				<h2 className="mb-4 text-lg font-semibold">Keyboard Shortcuts</h2>
				<p className="mb-4 text-sm text-neutral-600">
					Keybindings configuration will be implemented in Phase 8.
				</p>
				<div className="space-y-2 text-sm">
					<div className="flex justify-between gap-8">
						<span>Toggle Sidebar</span>
						<kbd className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-xs">
							Ctrl+B
						</kbd>
					</div>
					<div className="flex justify-between gap-8">
						<span>Global Search</span>
						<kbd className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-xs">
							Ctrl+F
						</kbd>
					</div>
					<div className="flex justify-between gap-8">
						<span>Flip Board</span>
						<kbd className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-xs">
							F
						</kbd>
					</div>
				</div>
				<button
					type="button"
					onClick={onClose}
					className="mt-4 rounded bg-neutral-100 px-4 py-2 text-sm hover:bg-neutral-200"
				>
					Close
				</button>
			</div>
		</div>
	);
}
