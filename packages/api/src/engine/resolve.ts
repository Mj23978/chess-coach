/**
 * Resolve the Stockfish binary path for this host.
 *
 * Two contexts (mirroring the MIGRATIONS_DIR resolution in the desktop bun
 * preload shim):
 *
 *  - Dev (`electrobun dev` / `bun --filter=@repo/api run dev`): the binary
 *    lives in a checked-in-or-dropped `binaries/` folder at the monorepo
 *    root, named per platform: `stockfish-win.exe` / `stockfish-macos` /
 *    `stockfish-linux`. Drop one there to enable analysis locally.
 *
 *  - Built desktop bundle: `electrobun.config.ts` `copy` ships the resolved
 *    binary next to the bundle at `Resources/app/binaries/stockfish-<os>`,
 *    and this resolver finds it relative to the bundled index.js.
 *
 * The engine is OPTIONAL for the app to boot (review of pre-analyzed games
 * works without it). `resolveStockfishPath()` returns `null` when no binary
 * is found; the `/engine` route then 503s with a helpful message.
 */
import { existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Per-platform binary filename (no extension on non-Windows). */
function platformBinaryName(): string | null {
  const isWin = process.platform === "win32";
  const isMac = process.platform === "darwin";
  const isLinux = process.platform === "linux";
  if (isWin) return "stockfish-win.exe";
  if (isMac) return process.arch === "arm64" ? "stockfish-macos-arm64" : "stockfish-macos";
  if (isLinux) return "stockfish-linux";
  return null;
}

/**
 * Resolve the Stockfish binary path, or `null` if not found.
 * Probes dev + bundled locations in order.
 */
export function resolveStockfishPath(): string | null {
  const name = platformBinaryName();
  if (!name) return null;

  const thisFileDir = dirname(fileURLToPath(import.meta.url));
  // Note: after `bun build`, import.meta.url is the bundle's URL.
  const candidates = [
    // Dev: monorepo root / binaries (this file is at packages/api/src/engine/)
    resolve(thisFileDir, "../../../../binaries", name),
    // Built desktop bundle: Resources/app/binaries/<name> (bundled index.js
    // lives at Resources/app/bun/index.js, so binaries is two dirs up).
    resolve(thisFileDir, "../../binaries", name),
    // Cwd fallback (running standalone from repo root).
    resolve(process.cwd(), "binaries", name),
  ];

  return candidates.find((p) => existsSync(p)) ?? null;
}
