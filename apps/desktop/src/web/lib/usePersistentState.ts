/**
 * usePersistentState — a useState wrapper that persists to localStorage.
 *
 * Stores data under a given key, loading it on mount and saving on every change.
 * Handles JSON serialization/deserialization with error boundaries for corrupt
 * data (falls back to the initial value).
 */
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Load a value from localStorage, returning `initialValue` if missing or corrupt.
 */
function loadFromStorage<T>(key: string, initialValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return initialValue;
    return JSON.parse(raw) as T;
  } catch {
    return initialValue;
  }
}

/**
 * Persist a value to localStorage. Silently ignores storage errors (quota,
 * private browsing, etc.).
 */
function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — silently degrade.
  }
}

/**
 * useState hook with automatic localStorage persistence.
 *
 * @param key     The localStorage key (namespaced, e.g. "chess-coach.board-tabs")
 * @param initial Initial value used when nothing is stored yet.
 */
export function usePersistentState<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Lazy-initialise from storage (runs once).
  const [value, setValue] = useState<T>(() => loadFromStorage(key, initial));

  // Persist every change.
  useEffect(() => {
    saveToStorage(key, value);
  }, [key, value]);

  return [value, setValue];
}
