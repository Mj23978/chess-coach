/**
 * Active-backend registry.
 *
 * A single `StorageBackend` is registered at process startup:
 *  - Web/server (Elysia backend): `minioBackend` (current behavior).
 *  - Desktop (Electrobun Bun main): `filesystemBackend` with an injected root.
 *
 * `index.ts` re-exports each storage function as a thin delegate to
 * `getStorageBackend()`, so consumers call the same free functions regardless
 * of which backend is active — no import paths change at the call site.
 *
 * If no backend has been registered, `getStorageBackend()` throws. This
 * catches accidental use before initialization (e.g. a tool that fires before
 * the host has selected a backend) instead of silently defaulting to a
 * possibly-wrong one.
 */
import type { StorageBackend } from "./interface.js";

let _backend: StorageBackend | null = null;

/** Register the active storage backend. Called once at host startup. */
export function setStorageBackend(backend: StorageBackend): void {
  _backend = backend;
}

/**
 * Register a backend only if none is registered yet. Lets a shared code path
 * (e.g. `apps/backend/src/index.ts`) declare a default without overriding a
 * backend an embedder (the desktop host) already set earlier in the boot
 * sequence.
 */
export function setDefaultStorageBackend(backend: StorageBackend): void {
  if (_backend === null) {
    _backend = backend;
  }
}

/** True once a backend has been registered. */
export function hasStorageBackend(): boolean {
  return _backend !== null;
}

/** The active backend. Throws if none has been registered. */
export function getStorageBackend(): StorageBackend {
  if (!_backend) {
    throw new Error(
      "[storage] No storage backend registered. Call setStorageBackend() at process startup " +
        "(minioBackend for web/server, filesystemBackend for desktop)."
    );
  }
  return _backend;
}
