/**
 * AppShell — the main application layout wrapper for chess-coach.
 *
 * Structure:
 *   SidebarProvider
 *   ├── NavigationRail (left, collapsible)
 *   └── SidebarInset (main content area)
 *
 * Electrobun provides native window chrome (title bar with minimize/maximize/
 * close and the File/Edit/View menus), so the SPA renders no drag region or
 * window controls of its own. All menu actions are wired to keyboard shortcuts
 * (see useKeyboardShortcuts); the keybindings modal here reflects the same
 * ALL_SHORTCUTS catalogue the Settings page renders.
 */
import { useRef, useState } from "react";
import { SidebarInset, SidebarProvider } from "@repo/ui/components/sidebar";
import { Button } from "@repo/ui/components/button";
import {
	NavigationRail,
	type NavigationRailHandle,
} from "./NavigationRail";
import { useKeyboardShortcuts, ALL_SHORTCUTS } from "../../lib/useKeyboardShortcuts";
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
	const railRef = useRef<NavigationRailHandle>(null);

	// Global keyboard shortcuts. Ctrl+F focuses the rail's search input via the
	// rail's imperative handle — no DOM querySelector reach-in.
	useKeyboardShortcuts({
		onToggleSidebar: () => setDefaultSidebarOpen((open) => !open),
		onGlobalSearch: () => railRef.current?.focusSearch(),
		onNewGame,
		onImportPgn,
		onExportPgn,
	});

	return (
		<div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
			<SidebarProvider
				defaultOpen={defaultSidebarOpen}
				open={defaultSidebarOpen}
				onOpenChange={setDefaultSidebarOpen}
			>
				<NavigationRail
					ref={railRef}
					onKeybindings={() => setKeybindingsOpen(true)}
					onToggleSidebar={() => setDefaultSidebarOpen((open) => !open)}
				/>
				{/*
					Page content wrapper — DO NOT use <SidebarInset> here.
					SidebarInset injects extra margin/padding (the "inset" card
					variant: m-2, rounded-xl, shadow) and a pl-(--sidebar-width)
					push that this layout doesn't want — PageContainer + the rail's
					own positioning already handle spacing. Instead this bare <main>
					owns the vertical scroll:
					  • The AppShell root (h-screen overflow-hidden) clips body
					    double-scroll, so scroll MUST live one level down.
					  • flex-1 + min-h-0: let it fill the column beside the rail
					    AND shrink below content height so overflow engages.
					    (min-h-0 is load-bearing — without it a flex child won't
					    scroll, which was the original "page not scrollable" bug.)
					  • min-w-0: keep wide tables/boards from forcing horizontal
					    blowout of the flex row.
				*/}
				<main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
					{children}
				</main>
		</SidebarProvider>

			{keybindingsOpen && (
				<KeybindingsModal onClose={() => setKeybindingsOpen(false)} />
			)}
		</div>
	);
}

/**
 * Keybindings modal. Renders the live ALL_SHORTCUTS catalogue (same source the
 * Settings page uses), grouped by category — no hand-maintained duplicate list.
 */
function KeybindingsModal({ onClose }: { onClose: () => void }) {
	return (
		<ModalShell
			open
			onOpenChange={(open) => !open && onClose()}
			title="Keyboard Shortcuts"
			description="Quick actions available anywhere in the app."
			footer={
				<Button type="button" variant="outline" onClick={onClose}>
					Close
				</Button>
			}
		>
			<div className="space-y-4">
				{ALL_SHORTCUTS.map((group) => (
					<div key={group.category}>
						<h3 className="mb-2 text-sm font-medium text-foreground">
							{group.category}
						</h3>
						<div className="rounded-lg border border-border">
							{group.shortcuts.map((shortcut, i) => (
								<div
									key={shortcut.keys}
									className={`flex items-center justify-between px-3 py-2 text-sm ${
										i !== group.shortcuts.length - 1
											? "border-b border-border"
											: ""
									}`}
								>
									<span className="text-muted-foreground">
										{shortcut.description}
									</span>
									<kbd className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-foreground">
										{shortcut.keys}
									</kbd>
								</div>
							))}
						</div>
					</div>
				))}

				<p className="text-xs text-muted-foreground">
					Shortcuts are active globally. Game navigation shortcuts only work
					when a board is visible.
				</p>
			</div>
		</ModalShell>
	);
}
