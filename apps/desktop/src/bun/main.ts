/**
 * Electrobun Bun main — real boot sequence.
 *
 * Imported dynamically by `./index.ts` AFTER the environment is configured
 * (`.env` loaded, desktop defaults set). This file can safely import `@repo/*`
 * packages because `process.env` is now valid per `@repo/env`'s schema.
 *
 * Boot sequence:
 *  1. Initialize PGlite (in-process Postgres — same DB layer as the web app).
 *  2. Register the filesystem storage backend (replaces MinIO/S3).
 *  3. Start the in-process Elysia server (`@repo/api`) on a free localhost port.
 *  4. Create the main `BrowserWindow` pointing at the Vite-built SPA, and
 *     inject the API base URL before it loads.
 *  5. Create a system tray icon with a menu (Show / Open API / Quit).
 *
 * Close-to-tray behavior: Electrobun's native close callback is not
 * preventable (it fires after the OS has already destroyed the window).
 * With `exitOnLastWindowClosed: false` (electrobun.config.ts), closing the
 * window leaves the process — and the in-process backend — running. The
 * tray's "Show Chess Coach" action builds a fresh BrowserWindow (the old native
 * handle is gone). "Quit" is the only way to fully exit.
 */
import { BrowserWindow, Tray, Utils } from "electrobun/bun";
import { initDB } from "@repo/db";
import {
  setStorageBackend,
  filesystemBackend,
  setFilesystemRoot,
} from "@repo/storage";
import { startElysiaServer } from "./server";

const { storageDir } = (globalThis as any).__CHESS_COACH_DESKTOP__ as {
  storageDir: string;
};

// ---------------------------------------------------------------------------
// 1. Initialize PGlite (in-process Postgres).
// ---------------------------------------------------------------------------
// initDB() (in @repo/db) reads process.env.DATABASE_URL LIVE and logs the
// resolved path itself — we don't log it here to avoid a misleading duplicate.
// The preload shim (index.ts) sets DATABASE_URL to ${APP_DATA_DIR}/chess-coach.db
// before this file is even imported.
await initDB();

// ---------------------------------------------------------------------------
// 2. Register the filesystem storage backend.
// ---------------------------------------------------------------------------
setFilesystemRoot(storageDir);
setStorageBackend(filesystemBackend);
console.log(`[desktop] Filesystem storage root: ${storageDir}`);

// Dev mode: when running under `electrobun dev`, point the webview at the
// Vite dev server (started separately via `dev:web`) for hot reload. The
// built bundle defines `process.env.NODE_ENV = "production"` (see
// vite.config.ts), so this is only true in the dev shell — the built app
// always loads the bundled `views://mainview/index.html`. Declared early
// because it's used both by the CORS allowlist (before the server starts)
// and by the window factory below.
const isDev = process.env.NODE_ENV !== "production";
const DEV_WEBVIEW_URL = "http://127.0.0.1:5173/";

// ---------------------------------------------------------------------------
// 3. Start the in-process Elysia server on a free localhost port.
// ---------------------------------------------------------------------------
const port = await pickFreePort(4001);
process.env.BACKEND_PORT = String(port);
process.env.BETTER_AUTH_URL = `http://localhost:${port}`;
process.env.NEXT_PUBLIC_API_URL = `http://localhost:${port}`;
process.env.NEXT_PUBLIC_APP_URL = `http://localhost:${port}`;

// In dev mode the webview loads from the Vite dev server (a different origin
// than the API), so the API's CORS allowlist must include it or every fetch
// — Better-Auth, /health, React Query — gets blocked by the browser. The
// server.ts CORS config reads this at module-load time (which happens during
// startElysiaServer below), so it must be set first. No-op in production
// (the built bundle loads from `views://`, same-origin, no CORS exercised).
if (isDev) {
  process.env.CORS_ALLOW_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173";
}

// Better-Auth runs a SEPARATE origin check from CORS (origin-check.mjs): on
// any cookie-bearing request it compares the Origin header against its
// trusted list, which it builds from (a) the baseURL origin, (b)
// options.trustedOrigins, and (c) this env var. The desktop webview's origin
// is never the API origin — it's `views://mainview` in production and the
// Vite dev URL in dev — so without this, sign-in/sign-up (the first
// cookie-bearing auth calls) fail with "Invalid origin". CORS_ALLOW_ORIGINS
// above does NOT cover this; it only affects the Elysia CORS layer. Both
// origins are listed so dev and prod both pass the check.
process.env.BETTER_AUTH_TRUSTED_ORIGINS =
  "views://mainview,http://localhost:5173,http://127.0.0.1:5173";

await startElysiaServer(port);
console.log(`[desktop] Elysia API listening on http://localhost:${port}`);

const apiBase = `http://localhost:${port}`;

// ---------------------------------------------------------------------------
// 4. Window factory + close-to-tray bookkeeping.
// ---------------------------------------------------------------------------
// Electrobun destroys the native window on close (the `close` event is void
// and cannot be prevented). So "minimize to tray" = let the window close,
// keep the process alive (exitOnLastWindowClosed: false), and rebuild the
// window when the user clicks "Show" in the tray.
let mainWindow: BrowserWindow | null = null;

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    title: "Chess Coach",
    url: isDev ? DEV_WEBVIEW_URL : "views://mainview/index.html",
    frame: { x: 100, y: 100, width: 1440, height: 900 },
    // Allow bundled views + the Vite dev server + the in-process API + OAuth
    // provider domains. Block everything else so no third-party content can
    // reach the webview.
    navigationRules: isDev
      ? "views://*,http://127.0.0.1:*,http://localhost:*,https://accounts.google.com/*,https://github.com/login/*,https://login.microsoftonline.com/*,^*"
      : "views://*,http://localhost:*,https://accounts.google.com/*,https://github.com/login/*,https://login.microsoftonline.com/*,^*",
  });

  if (isDev) {
    console.log(`[desktop] Dev mode — webview loading ${DEV_WEBVIEW_URL} (Vite HMR)`);
  }

  // Inject the API base URL into the webview's global scope before the SPA's
  // first render. The SPA reads this from `window.__CHESS_COACH_API_BASE__`.
  win.webview.executeJavascript(
    `window.__CHESS_COACH_API_BASE__ = ${JSON.stringify(apiBase)};`,
  );

  // Windows-only webview viewport workaround.
  //
  // Fix: hook webview "dom-ready" — by then WebView2 exists AND the page has
  // loaded. Nudge the window size by 1px and immediately back. Each nudge
  // triggers a real WM_SIZE that reaches the webview with the correct
  // GetClientRect dimensions, so it re-measures and emits the right viewport.
  // A previous 50ms-setTimeout attempt failed because it fired before WebView2
  // finished initializing. dom-ready is the right gate.
  //
  // Windows-only — the bug is specific to the Win32 frame-vs-client mismatch.
  if (process.platform === "win32") {
    win.webview.on("dom-ready", () => {
      try {
        const frame = win.getFrame();
        win.setSize(frame.width, frame.height - 1);
        win.setSize(frame.width, frame.height);
      } catch (err) {
        console.warn("[desktop] webview viewport nudge failed:", err);
      }
    });
  }

  // Track the window so we know whether to rebuild on "Show". The native
  // close fires asynchronously; once it does, BrowserWindowMap no longer
  // holds this id, so we treat a missing id as "closed → hidden to tray".
  const winId = win.id;
  win.on("close", () => {
    console.log(`[desktop] Window ${winId} closed → minimized to tray`);
    mainWindow = null;
  });

  return win;
}

mainWindow = createWindow();

// ---------------------------------------------------------------------------
// 5. System tray.
// ---------------------------------------------------------------------------
// The tray icon reuses the web app's favicon, shipped via Vite's public/
// → views/mainview/ copy. `views://mainview/favicon.ico` resolves through
// Tray.resolveImagePath() to the bundled views folder.
const tray = new Tray({
  title: "Chess Coach",
  image: "views://mainview/favicon.ico",
  template: false,
  width: 16,
  height: 16,
});

function showWindow() {
  // The previous window's native handle is gone after a close, so we always
  // build a fresh one. Cheap (the SPA is already in the bundle) and avoids
  // tracking whether the old handle is still valid.
  if (!mainWindow) {
    mainWindow = createWindow();
  }
  mainWindow.show();
}

function openApiInBrowser() {
  // Open the in-process Elysia root in the user's default browser. Useful for
  // debugging (hit /health, /api/auth/* directly).
  Utils.openExternal(apiBase);
}

function quitApp() {
  tray.remove();
  Utils.quit();
}

tray.setMenu([
  { label: "Show Chess Coach", action: "show" },
  { label: `Open API (:${port})`, action: "open-api" },
  { type: "divider" },
  { label: "Quit", action: "quit" },
]);

// `tray-clicked` fires for both the icon click and menu-item clicks; the
// payload's `action` field tells them apart. Clicking the icon itself
// (no action) shows the window — standard tray behavior.
tray.on("tray-clicked", (event: unknown) => {
  const e = event as { data?: { action?: string } };
  const action = e?.data?.action;
  if (action === "show" || !action) {
    showWindow();
  } else if (action === "open-api") {
    openApiInBrowser();
  } else if (action === "quit") {
    quitApp();
  }
});

console.log(`[desktop] Tray ready — close the window to minimize, use Quit to exit`);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Find the first free TCP port at or after `start`.
 *
 * Probes a small range starting at the configured backend port. The Elysia
 * server then binds to the picked port explicitly.
 */
async function pickFreePort(start: number): Promise<number> {
  const net = await import("node:net");
  for (let port = start; port < start + 100; port++) {
    const free = await new Promise<boolean>((resolve) => {
      const tester = net.createServer();
      tester.once("error", () => resolve(false));
      tester.once("listening", () => {
        tester.close(() => resolve(true));
      });
      tester.listen(port, "127.0.0.1");
    });
    if (free) return port;
  }
  // Fallback: let the OS pick one.
  return new Promise<number>((resolve, reject) => {
    const tester = net.createServer();
    tester.once("error", reject);
    tester.listen(0, "127.0.0.1", () => {
      const addr = tester.address();
      if (addr && typeof addr === "object") {
        tester.close(() => resolve(addr.port));
      } else {
        reject(new Error("Could not pick a free port"));
      }
    });
  });
}
