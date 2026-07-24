import type { ElectrobunConfig } from "electrobun";
import pkg from "./package.json" assert { type: "json" };

export default {
  app: {
    name: "Chess Coach",
    identifier: "ChessCoach",
    version: pkg.version || "0.0.0",
  },
  build: {
    bun: {
      entrypoint: "src/bun/index.ts",
      // Externalize modules that perform runtime-only require() of optional
      // dependencies the bundler can't statically resolve. Playwright's
      // coreBundle.js does `require("chromium-bidi/...")` inside a try/catch at
      // runtime (the bidi protocol is only used for WebDriver BiDi sessions);
      // Bun.build tries to resolve it at bundle time and fails. Marking these
      // as external keeps them as runtime require()s against node_modules,
      // which resolves to the installed package (or no-ops if absent).
      external: [
        "playwright-core",
        "playwright",
        "chromium-bidi",
        "playwright-chromium",
      ],
    },
    // No `views.mainview.entrypoint` — the Chess Coach UI is a Vite-built React SPA,
    // not an Electroview RPC client. The SPA talks to the in-process Elysia
    // server over plain HTTP (cookies + SSE work natively in the webview), so
    // there is zero Electrobun RPC surface and no Electroview bootstrap needed.
    //
    // The SPA is built by `vite build` (the `build:web` script) directly into
    // `views/mainview/` (see vite.config.ts → build.outDir). That directory is
    // then copied verbatim into the app bundle via the copy directive below.
    // The result: `views://mainview/` serves the full SPA (index.html +
    // index.js + assets/) exactly as a static host would.
    views: {},
    copy: {
      // Vite builds into `views/mainview/` (index.html + index.js + assets/).
      // Copy the whole directory into the app bundle so `views://mainview/`
      // resolves to the full SPA. `cpSync` is recursive (see electrobun cli).
      "views/mainview": "views/mainview",
      // PGlite native sidecars. `bun build` emits a single `index.js` at
      // `Resources/app/bun/index.js` but drops the WASM/data/tarball assets
      // PGlite loads via `new URL(..., import.meta.url)`.
      //
      // The base path differs between the two PGlite code paths because the
      // extension submodules (dist/vector/index.js, dist/pgtap/index.js) use a
      // `../` prefix while the core chunk uses `./`. Once inlined into the
      // single-file bundle, import.meta.url is the bundle's own URL, so:
      //   - core WASM/data (`./pglite.data`, `./pglite.wasm`, `./initdb.wasm`)
      //     resolve NEXT TO the bundle → Resources/app/bun/
      //   - extension tarballs (`../vector.tar.gz`, `../pgtap.tar.gz`) resolve
      //     ONE LEVEL UP from the bundle → Resources/app/
      // The prebuild (`scripts/stage-native-assets.mjs`) stages all five
      // files into `native-assets/`; the copy directives below place each at
      // the path its resolver expects.
      "native-assets/pglite.data": "bun/pglite.data",
      "native-assets/pglite.wasm": "bun/pglite.wasm",
      "native-assets/initdb.wasm": "bun/initdb.wasm",
      "native-assets/vector.tar.gz": "vector.tar.gz",
      "native-assets/pgtap.tar.gz": "pgtap.tar.gz",
      // Drizzle SQL migrations. The desktop Bun main resolves MIGRATIONS_DIR
      // relative to the bundle (Resources/app/bun/index.js → ../migrations =
      // Resources/app/migrations) so runMigrations finds the journal + .sql
      // files. Without these the bundled app boots against an empty schema.
      "native-assets/migrations": "migrations",
    },
    mac: {
      bundleCEF: false,
      codesign: false,
      notarize: false,
    },
    linux: {
      bundleCEF: false,
    },
    win: {
      bundleCEF: false,
      // Window/taskbar icon (16/32/48/256 multiresolution .ico, also reused as
      // the tray image in main.ts via `views://mainview/favicon.ico`).
      icon: "src/web/public/favicon.ico",
    },
  },
  runtime: {
    // Keep the process alive when the window closes so background work
    // (workflows, scheduled jobs, the in-process Elysia server) keeps
    // running. The user re-opens the window from the tray or fully quits
    // via the tray's "Quit" item. See main.ts for the window-recreation
    // logic (Electrobun destroys the native window on close, so "Show"
    // from tray builds a fresh BrowserWindow).
    exitOnLastWindowClosed: false,
  },
} satisfies ElectrobunConfig;
