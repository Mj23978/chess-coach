/**
 * AppShell — the main application layout wrapper for chess-coach.
 *
 * Structure:
 *   DragRegion (top, for window dragging via Electrobun)
 *   └── SidebarProvider
 *       ├── NavigationRail (left, collapsible)
 *       └── SidebarInset (main content area)
 *
 * Electrobun provides native window chrome (title bar, minimize/maximize/close,
 * File/Edit/View menus). The SPA only needs a drag region at the top so the
 * user can move the window. All menu actions are wired to keyboard shortcuts
 * (see useKeyboardShortcuts).
 */
import { useState } from "react";
import { SidebarInset, SidebarProvider } from "@repo/ui/components/sidebar";
import { NavigationRail } from "./NavigationRail";
import { useKeyboardShortcuts } from "../../lib/useKeyboardShortcuts";
import { ModalShell } from "../ui/modal-shell";

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

	// Global keyboard shortcuts
	useKeyboardShortcuts({
		onToggleSidebar: () => setDefaultSidebarOpen((open) => !open),
		onGlobalSearch: () => {
			// Focus the search input in the navigation rail header
			const searchInput = document.querySelector<HTMLInputElement>(
				'nav input[type="text"]',
			);
			searchInput?.focus();
		},
		onNewGame,
		onImportPgn,
		onExportPgn,
	});

	return (
		<div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
			{/* Window drag region — Electrobun provides native title bar controls.
			    This thin strip lets the user drag the window by grabbing any part
			    of the top area that isn't covered by interactive elements. */}
			{/* Window drag region — Electrobun provides native title bar controls.
			    This thin strip lets the user drag the window by grabbing any part
			    of the top area that isn't covered by interactive elements. */}
			<div className="h-6 shrink-0 app-drag bg-background" />

			{/* Main content area with sidebar */}
			<SidebarProvider
				defaultOpen={defaultSidebarOpen}
				open={defaultSidebarOpen}
				onOpenChange={setDefaultSidebarOpen}
			>
				<NavigationRail
					onKeybindings={() => setKeybindingsOpen(true)}
					onToggleSidebar={() => setDefaultSidebarOpen((open) => !open)}
				/>
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
		<ModalShell
			open
			onOpenChange={(open) => !open && onClose()}
			title="Keyboard Shortcuts"
			footer={
				<button
					type="button"
					onClick={onClose}
					className="rounded bg-muted px-4 py-2 text-sm hover:bg-muted/80"
				>
					Close
				</button>
			}
		>
			<p className="text-sm text-muted-foreground">
				Keybindings configuration will be implemented in Phase 8.
			</p>
			<div className="space-y-2 text-sm">
				<div className="flex justify-between gap-8">
					<span>Toggle Sidebar</span>
					<kbd className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-foreground">
						Ctrl+B
					</kbd>
				</div>
				<div className="flex justify-between gap-8">
					<span>Global Search</span>
					<kbd className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-foreground">
						Ctrl+F
					</kbd>
				</div>
				<div className="flex justify-between gap-8">
					<span>Flip Board</span>
					<kbd className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-foreground">
						F
					</kbd>
				</div>
			</div>
		</ModalShell>
	);
}
