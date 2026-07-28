/**
 * SettingsContext — global settings provider for the SPA.
 *
 * Loads the full SettingsMap from `GET /settings` on mount, exposes it
 * via React context, and provides a `updateSettings()` helper that
 * persists changes to the API and updates local state atomically.
 *
 * Theme is applied immediately by toggling the `dark` / `light` class on
 * `document.documentElement` (Tailwind v4 `@media` → class-based dark mode).
 * System theme follows `prefers-color-scheme` via a media query listener.
 *
 * Usage:
 *   const { settings, updateSettings, isLoaded } = useSettings();
 */
import {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
	useRef,
	type ReactNode,
} from "react";
import {
	fetchSettings,
	updateSettings as apiUpdateSettings,
	type SettingsDTO,
} from "./api";

// ---------------------------------------------------------------------------
// Default settings (mirrors DEFAULT_SETTINGS in @repo/db schema/settings.ts)
// Used as fallback if the API fetch fails or hasn't completed yet.
// ---------------------------------------------------------------------------

const FALLBACK_SETTINGS: SettingsDTO = {
	theme: "system",
	boardStyle: "brown",
	showCoords: true,
	highlightLastMove: true,
	defaultEngine: "Stockfish",
	autoAnalyze: true,
	analysisDepth: 20,
	syncOnStart: true,
	syncInterval: 60,
	autoImportChessCom: true,
	autoImportLichess: true,
};

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

export interface SettingsContextValue {
	/** Current settings. Falls back to defaults until the API responds. */
	settings: SettingsDTO;
	/** True once the initial fetch has completed (success or error). */
	isLoaded: boolean;
	/** Whether the initial load or a save is in flight. */
	isSaving: boolean;
	/** Patch one or more settings. Optimistic: local state updates immediately;
	 *  API call happens in the background. On API error the state rolls back. */
	updateSettings: (patch: Partial<SettingsDTO>) => Promise<void>;
	/** Reset all settings to defaults. */
	resetSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

// ---------------------------------------------------------------------------
// Theme application
// ---------------------------------------------------------------------------

/**
 * Apply a `SettingsDTO["theme"]` value to the document root.
 * - "dark"  → add `dark` class
 * - "light" → remove `dark` class
 * - "system" → follow `prefers-color-scheme` via matchMedia
 */
function applyTheme(theme: SettingsDTO["theme"]): () => void {
	const root = document.documentElement;

	if (theme === "dark") {
		root.classList.add("dark");
		return () => {};
	}
	if (theme === "light") {
		root.classList.remove("dark");
		return () => {};
	}

	// "system" — use matchMedia to follow OS preference.
	const mq = window.matchMedia("(prefers-color-scheme: dark)");
	const onChange = () => {
		root.classList.toggle("dark", mq.matches);
	};
	onChange(); // apply immediately
	mq.addEventListener("change", onChange);
	return () => mq.removeEventListener("change", onChange);
}

// ---------------------------------------------------------------------------
// Provider component
// ---------------------------------------------------------------------------

export function SettingsProvider({ children }: { children: ReactNode }) {
	const [settings, setSettings] = useState<SettingsDTO>(FALLBACK_SETTINGS);
	const [isLoaded, setIsLoaded] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	// Track the last applied theme to avoid redundant DOM writes.
	const lastThemeRef = useRef<SettingsDTO["theme"]>(FALLBACK_SETTINGS.theme);

	// --- Load settings on mount ---
	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const loaded = await fetchSettings();
				if (!cancelled) {
					setSettings(loaded);
					setIsLoaded(true);
				}
			} catch {
				// Network error or server down — keep fallback values.
				if (!cancelled) setIsLoaded(true);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	// --- Apply theme whenever it changes ---
	useEffect(() => {
		if (settings.theme === lastThemeRef.current && isLoaded) return;
		lastThemeRef.current = settings.theme;
		const cleanup = applyTheme(settings.theme);
		return cleanup;
	}, [settings.theme, isLoaded]);

	// --- Optimistic update helper ---
	const updateSettings = useCallback(
		async (patch: Partial<SettingsDTO>) => {
			// Snapshot for rollback on failure.
			const prev = settings;
			// Optimistic: apply locally first.
			setSettings((s) => ({ ...s, ...patch }));
			setIsSaving(true);
			try {
				const saved = await apiUpdateSettings(patch);
				setSettings(saved);
			} catch {
				// Rollback on API failure.
				setSettings(prev);
			} finally {
				setIsSaving(false);
			}
		},
		[settings],
	);

	// --- Reset to defaults ---
	const resetSettings = useCallback(async () => {
		setIsSaving(true);
		try {
			// Lazy import to avoid circular dep; resetSettings is rare.
			const { resetSettings: apiReset } = await import("./api");
			const saved = await apiReset();
			setSettings(saved);
		} catch {
			// On failure keep current settings.
		} finally {
			setIsSaving(false);
		}
	}, []);

	const value: SettingsContextValue = {
		settings,
		isLoaded,
		isSaving,
		updateSettings,
		resetSettings,
	};

	return (
		<SettingsContext.Provider value={value}>
			{children}
		</SettingsContext.Provider>
	);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Access the global settings context. Must be used inside `<SettingsProvider>`.
 *
 * @throws if used outside the provider (returns null shape in dev).
 */
export function useSettings(): SettingsContextValue {
	const ctx = useContext(SettingsContext);
	if (!ctx) {
		// Graceful fallback for components rendered outside the provider
		// (e.g. during SSR or in tests). In production the provider always
		// wraps the app, so this branch should never execute.
		return {
			settings: FALLBACK_SETTINGS,
			isLoaded: false,
			isSaving: false,
			updateSettings: async () => {},
			resetSettings: async () => {},
		};
	}
	return ctx;
}
