/**
 * Toast notification provider and helpers (Phase 9: X2-004).
 *
 * Wraps the app with a Toaster component and provides convenience
 * functions for common toast patterns (success, error, info, loading).
 */
import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";

/**
 * App-level Toaster component. Place this in App.tsx.
 */
export function ToastProvider() {
	return (
		<SonnerToaster
			position="bottom-right"
			richColors
		 closeButton
			visibleToasts={5}
			toastOptions={{
				duration: 4000,
				className: "font-sans text-sm",
			}}
		/>
	);
}

/**
 * Convenience toast functions.
 */
export const toast = {
	/** Show a success toast. */
	success(title: string, opts?: { description?: string; duration?: number }) {
		return sonnerToast.success(title, {
			description: opts?.description,
			duration: opts?.duration,
		});
	},

	/** Show an error toast. */
	error(title: string, opts?: { description?: string; duration?: number }) {
		return sonnerToast.error(title, {
			description: opts?.description,
			duration: opts?.duration ?? 6000,
		});
	},

	/** Show an info toast. */
	info(title: string, opts?: { description?: string; duration?: number }) {
		return sonnerToast.info(title, {
			description: opts?.description,
			duration: opts?.duration,
		});
	},

	/** Show a warning toast. */
	warning(title: string, opts?: { description?: string; duration?: number }) {
		return sonnerToast.warning(title, {
			description: opts?.description,
			duration: opts?.duration,
		});
	},

	/** Show a loading toast (returns a dismiss function). */
	loading(title: string, opts?: { description?: string }) {
		return sonnerToast.loading(title, {
			description: opts?.description,
		});
	},

	/** Show a promise toast that resolves to success/error. */
	promise<T>(
		promise: Promise<T>,
		opts: {
			loading: string;
			success: string | ((data: T) => string);
			error: string | ((err: unknown) => string);
		},
	) {
		return sonnerToast.promise(promise, opts);
	},

	/** Dismiss a specific toast. */
	dismiss(id: string | number) {
		sonnerToast.dismiss(id);
	},

	/** Dismiss all toasts. */
	dismissAll() {
		sonnerToast.dismiss();
	},
};

/**
 * Common toast messages used throughout the app.
 */
export const TOAST_MESSAGES = {
	// Export
	PGN_COPIED: "PGN copied to clipboard",
	PGN_EXPORTED: "PGN exported successfully",
	FEN_COPIED: "FEN copied to clipboard",
	SCREENSHOT_COPIED: "Screenshot copied to clipboard",
	SCREENSHOT_SAVED: "Screenshot saved",

	// Accounts
	ACCOUNT_SYNCED: "Account synced successfully",
	ACCOUNT_ADDED: "Account added",
	ACCOUNT_REMOVED: "Account removed",

	// Games
	GAME_IMPORTED: "Game imported successfully",
	GAME_SAVED: "Game saved",
	GAME_DELETED: "Game deleted",

	// Databases
	DATABASE_CREATED: "Database created",
	DATABASE_UPDATED: "Database updated",
	DATABASE_DELETED: "Database deleted",

	// Engines
	ENGINE_ADDED: "Engine added",
	ENGINE_ACTIVATED: "Engine activated",
	ENGINE_DOWNLOADED: "Engine downloaded",
	ENGINE_REMOVED: "Engine removed",

	// Errors
	SYNC_FAILED: "Sync failed. Please try again.",
	IMPORT_FAILED: "Import failed. Please check the PGN format.",
	EXPORT_FAILED: "Export failed.",
	NETWORK_ERROR: "Connection error. Please check your network.",
	LOAD_FAILED: "Failed to load. Please try again.",
} as const;
