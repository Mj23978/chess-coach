/**
 * Vite configuration for the Chess Coach desktop SPA.
 *
 * The SPA is served by Electrobun via the virtual `views://mainview/` scheme
 * (NOT http), so `base: "./"` is required — relative asset paths resolve
 * against the document URL. Absolute paths (`/index.js`) 404 under WebView2.
 *
 * `@repo/env` is aliased to a browser shim (`src/web/shims/env.ts`) so the SPA
 * never pulls in the server-side env validation; it reads the API base from
 * `window.__CHESS_COACH_API_BASE__` (injected by the Bun main before boot).
 *
 * The built bundle outputs to `views/mainview/` so Electrobun's `copy`
 * directive can bundle it as `views://mainview/index.html`.
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

const webRoot = resolve(__dirname, "src/web");
const packagesRoot = resolve(__dirname, "../../packages");
const desktopRoot = __dirname;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: resolve(__dirname, "src/web"),
  // Relative asset paths — see header comment.
  base: "./",
  resolve: {
    alias: [
      // Browser-side env shim (reads window.__CHESS_COACH_API_BASE__).
      {
        find: "@repo/env",
        replacement: resolve(desktopRoot, "src/web/shims/env.ts"),
      },
      // Monorepo path aliases. `@/` → src/web, `@repo/*` → packages/*.
      { find: /^@\/(.*)$/, replacement: resolve(webRoot, "$1") },
      { find: /^@repo\/(.*)$/, replacement: resolve(packagesRoot, "$1") },
    ],
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env.NEXT_PUBLIC_API_URL": "window.__CHESS_COACH_API_BASE__",
    "process.env.NEXT_PUBLIC_APP_URL": "window.__CHESS_COACH_API_BASE__",
  },
  build: {
    outDir: resolve(desktopRoot, "views/mainview"),
    emptyOutDir: true,
    target: "es2022",
    sourcemap: true,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        // Stable entry chunk name so the generated index.html's `./index.js`
        // reference matches after every build.
        entryFileNames: "index.js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },
  server: {
    port: 5173,
    strictPort: true,
    host: "127.0.0.1",
    proxy: {
      "/api": {
        target: `http://127.0.0.1:${process.env.CHESS_COACH_DEV_API_PORT || 4001}`,
        changeOrigin: true,
      },
      "/health": {
        target: `http://127.0.0.1:${process.env.CHESS_COACH_DEV_API_PORT || 4001}`,
        changeOrigin: true,
      },
    },
  },
});
