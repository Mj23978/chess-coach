/**
 * Global keyboard shortcuts.
 *
 * Two exports:
 *  - `useKeyboardShortcuts({ onToggleSidebar, onGlobalSearch })` — a hook
 *    installed once from <AppShell/>. Listens for Ctrl/Cmd+B (toggle the
 *    sidebar) and Ctrl/Cmd+F (focus the title-bar search). Single-finger
 *    shortcuts (←/→, F, etc.) are owned by the page currently in view
 *    (e.g. the game-review page wires its own board nav), so they are NOT
 *    registered here — that keeps this hook free of route-awareness.
 *  - `ALL_SHORTCUTS` — the catalogue rendered by the Settings page's
 *    "Keyboard shortcuts" section, grouped by category. Keep this in sync
 *    with the actual handlers above and the per-page handlers below.
 *
 * Convention: while focus is inside an input/textarea/contenteditable, the
 * global handlers are suppressed so typing into the search box (or PGN paste
 * area) doesn't accidentally toggle the sidebar.
 */
import { useEffect } from "react";

export interface ShortcutHandler {
	onToggleSidebar?: () => void;
	onGlobalSearch?: () => void;
	onNewGame?: () => void;
	onImportPgn?: () => void;
	onExportPgn?: () => void;
}

export interface ShortcutEntry {
	/** Key label shown in the kbd chip, e.g. "Ctrl+B". */
	keys: string;
	/** Human description, e.g. "Toggle sidebar". */
	description: string;
}
export interface ShortcutGroup {
	/** Group heading, e.g. "Global". */
	category: string;
	shortcuts: ShortcutEntry[];
}

/**
 * The full catalogue of shortcuts as advertised to the user. Includes both
 * the global ones (handled here) and the page-local ones (handled in their
 * owning pages) so Settings can show them all in one place.
 */
export const ALL_SHORTCUTS: ShortcutGroup[] = [
	{
		category: "Global",
		shortcuts: [
			{ keys: "Ctrl+B", description: "Toggle sidebar" },
			{ keys: "Ctrl+F", description: "Focus search" },
			{ keys: "Ctrl+N", description: "New game" },
			{ keys: "Ctrl+O", description: "Import PGN" },
			{ keys: "Ctrl+Shift+S", description: "Export PGN" },
		],
	},
	{
		category: "Game navigation",
		shortcuts: [
			{ keys: "→", description: "Next move" },
			{ keys: "←", description: "Previous move" },
			{ keys: "Home", description: "Jump to start" },
			{ keys: "End", description: "Jump to end" },
		],
	},
];

/** True when the active element is a text-input surface. */
function isTypingTarget(): boolean {
	const el = document.activeElement as HTMLElement | null;
	if (!el) return false;
	const tag = el.tagName;
	if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
	return el.isContentEditable;
}

/** Install the global shortcut listeners for the lifetime of the calling page. */
export function useKeyboardShortcuts(handler: ShortcutHandler): void {
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			// Ctrl/Cmd+B → toggle sidebar. Suppress while typing so "B" can be
			// entered into inputs (rare, but avoids surprises).
			if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "b") {
				e.preventDefault();
				handler.onToggleSidebar?.();
				return;
			}
			// Ctrl/Cmd+F → focus global search. Browsers also bind this to their
			// own find-in-page; inside the Electrobun webview there is no native
			// find bar, so claiming it is safe and matches user expectation.
			if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "f") {
				e.preventDefault();
				handler.onGlobalSearch?.();
				return;
			}
			// Non-modifier shortcuts (if any are added later) should respect
			// typing context.
			if (isTypingTarget()) return;

			// Ctrl/Cmd+N → New game
			if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "n") {
				e.preventDefault();
				handler.onNewGame?.();
				return;
			}
			// Ctrl/Cmd+O → Import PGN
			if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "o") {
				e.preventDefault();
				handler.onImportPgn?.();
				return;
			}
			// Ctrl/Cmd+Shift+S → Export PGN
			if ((e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey && e.key.toLowerCase() === "s") {
				e.preventDefault();
				handler.onExportPgn?.();
				return;
			}
		}

		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [handler]);
}
