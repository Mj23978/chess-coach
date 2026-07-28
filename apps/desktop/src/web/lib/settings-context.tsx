/**
 * SettingsContext — global settings provider for the SPA.
 *
 * Persistence strategy: localStorage (primary) + API (sync target).
 *
 * The settings DB table may not exist yet (migration pending), so the API
 * is treated as best-effort. localStorage provides instant, reliable
 * persistence that works offline and survives restarts. When the API
 * becomes available (migration generated), it acts as the authoritative
 * store and overrides localStorage on successful fetch.
 *
 * Theme is applied immediately by toggling the `dark` / `light` class on
 * `document.documentElement` (Tailwind v4 class-based dark mode via
 * `@custom-variant dark (&:is(.dark *))` in globals.css).
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
// ---------------------------------------------------------------------------

const FALLBACK_SETTINGS: SettingsDTO = {
	theme: "system",
	boardStyle: "brown",
	showCoords: true,
	highlightLastMove: true,
	defaultEngine: "Stockfish",
	autoAnalyze: true,
	// 15 is the "fast" tier (matches pawn-appetite) — ~3-8s per position on
	// Stockfish Lite with multiPv=3. Users who want deeper can bump it in
	// Settings; anything above ~22 gets very slow on Lite for little gain.
	analysisDepth: 15,
	syncOnStart: true,
	syncInterval: 60,
	autoImportChessCom: true,
	autoImportLichess: true,
};

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

const LS_KEY = "chess-coach:settings";

function readLocalSettings(): SettingsDTO | null {
	try {
		const raw = localStorage.getItem(LS_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		// Basic shape validation — ensure every key is present.
		if (
			typeof parsed === "object" &&
			parsed !== null &&
			"theme" in parsed &&
			"boardStyle" in parsed
		) {
			return parsed as SettingsDTO;
		}
		return null;
	} catch {
		return null;
	}
}

function writeLocalSettings(settings: SettingsDTO): void {
	try {
		localStorage.setItem(LS_KEY, JSON.stringify(settings));
	} catch {
		// localStorage full or unavailable — silent. API will still attempt sync.
	}
}

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

export interface SettingsContextValue {
	/** Current settings. Falls back to defaults until loaded. */
	settings: SettingsDTO;
	/** True once the initial load has completed (success or error). */
	isLoaded: boolean;
	/** Whether the initial load or a save is in flight. */
	isSaving: boolean;
	/** Patch one or more settings. Local state + localStorage update
	 *  immediately; API call is best-effort (no rollback on failure). */
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
 *
 * Returns a cleanup function that removes any matchMedia listener.
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
	// Initialize from localStorage synchronously so the first paint is correct.
	const [settings, setSettings] = useState<SettingsDTO>(() => {
		return readLocalSettings() ?? FALLBACK_SETTINGS;
	});
	const [isLoaded, setIsLoaded] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	// Track the last applied theme to avoid redundant DOM writes.
	const lastThemeRef = useRef<SettingsDTO["theme"]>(settings.theme);
	// Track the last-applied full settings object so we don't overwrite
	// newer local writes with stale API responses.
	const settingsRef = useRef<SettingsDTO>(settings);
	settingsRef.current = settings;

	// --- Load settings on mount ---
	// 1. localStorage is already loaded synchronously above.
	// 2. Try API in background; if it succeeds, its values override localStorage
	//    (authoritative store wins). If it fails, keep the localStorage values.
	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const loaded = await fetchSettings();
				if (!cancelled) {
					setSettings(loaded);
					writeLocalSettings(loaded);
					setIsLoaded(true);
				}
			} catch {
				// API unavailable (e.g. settings table doesn't exist yet).
				// Keep the localStorage values — they're already applied.
				if (!cancelled) setIsLoaded(true);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	// --- Apply theme whenever it changes ---
	useEffect(() => {
		// Always apply on mount (isLoaded may be false but we have a theme).
		// Skip redundant re-application only after initial load is complete.
		if (isLoaded && settings.theme === lastThemeRef.current) return;
		lastThemeRef.current = settings.theme;
		const cleanup = applyTheme(settings.theme);
		return cleanup;
	}, [settings.theme, isLoaded]);

	// --- Optimistic update helper ---
	const updateSettings = useCallback(
		async (patch: Partial<SettingsDTO>) => {
			const next = { ...settingsRef.current, ...patch };
			// Apply locally + persist to localStorage immediately.
			setSettings(next);
			writeLocalSettings(next);

			// Fire API in background — best-effort. On failure we keep
			// the local state (no rollback) because localStorage already
			// persisted the change and the UI already reflects it.
			setIsSaving(true);
			try {
				const saved = await apiUpdateSettings(patch);
				// API succeeded — use its response as the canonical state
				// and sync back to localStorage.
				setSettings(saved);
				writeLocalSettings(saved);
			} catch {
				// API unavailable — the localStorage + local state are
				// already correct. Nothing to roll back.
				console.debug(
					"[settings] API unavailable for update; using localStorage.",
				);
			} finally {
				setIsSaving(false);
			}
		},
		// No dependency on `settings` — we use settingsRef.current instead
		// to avoid stale closures. This callback is stable.
		[],
	);

	// --- Reset to defaults ---
	const resetSettings = useCallback(async () => {
		setIsSaving(true);
		const defaults = FALLBACK_SETTINGS;
		setSettings(defaults);
		writeLocalSettings(defaults);
		try {
			const { resetSettings: apiReset } = await import("./api");
			const saved = await apiReset();
			setSettings(saved);
			writeLocalSettings(saved);
		} catch {
			// API unavailable — localStorage and local state already
			// reset to defaults.
			console.debug(
				"[settings] API unavailable for reset; using localStorage.",
			);
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
 */
export function useSettings(): SettingsContextValue {
	const ctx = useContext(SettingsContext);
	if (!ctx) {
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
