/**
 * Engine management routes.
 *
 * Endpoints:
 *   GET    /engines              list all configured engines
 *   GET    /engines/catalog     list downloadable engines from catalog
 *   POST   /engines              add an engine (local path)
 *   POST   /engines/download     download an engine from catalog
 *   PATCH  /engines/:id          update engine config
 *   POST   /engines/:id/activate set as active engine
 *   DELETE /engines/:id          delete an engine config
 *   GET    /engines/:id/options  get UCI options from engine binary
 *
 * The active engine is used by the /games/:id/analyze route.
 */
import { Elysia, t } from "elysia";
import { existsSync, mkdirSync, unlinkSync, statSync, accessSync, constants } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { engineRepository } from "@repo/db";
import { UciEngine } from "../engine/process";
import { resetEngine } from "../engine";
import type { UciOption } from "../engine/uci-types";

// Engine catalog — predefined downloadable engines.
// Each OS entry is filtered to show only what the current platform supports.
// "lite" suffix indicates a build with fewer CPU instruction sets (SSE4.1
// instead of AVX2) — compatible with older CPUs at slightly lower performance.
const ENGINE_CATALOG = [
  // ── Windows ──────────────────────────────────────────────────────────
  {
    name: "Stockfish",
    version: "18",
    os: "windows",
    downloadUrl: "https://github.com/official-stockfish/Stockfish/releases/latest/download/stockfish-windows-x86-64-avx2.zip",
    pathInArchive: "stockfish/stockfish-windows-x86-64-avx2.exe",
    elo: 3635,
    downloadSize: 76_955_020,
    image: "https://upload.wikimedia.org/wikipedia/commons/3/3a/NewLogoSF.png",
  },
  {
    name: "Stockfish",
    version: "18 Lite",
    os: "windows",
    downloadUrl: "https://github.com/official-stockfish/Stockfish/releases/latest/download/stockfish-windows-x86-64-sse41-popcnt.zip",
    pathInArchive: "stockfish/stockfish-windows-x86-64-sse41-popcnt.exe",
    elo: 3635,
    downloadSize: 72_000_000,
    image: "https://upload.wikimedia.org/wikipedia/commons/3/3a/NewLogoSF.png",
  },
  // ── macOS ARM ────────────────────────────────────────────────────────
  {
    name: "Stockfish",
    version: "18",
    os: "macos-arm64",
    downloadUrl: "https://github.com/official-stockfish/Stockfish/releases/latest/download/stockfish-macos-arm64.zip",
    pathInArchive: "stockfish/stockfish-macos-arm64",
    elo: 3635,
    downloadSize: 75_000_000,
    image: "https://upload.wikimedia.org/wikipedia/commons/3/3a/NewLogoSF.png",
  },
  // ── macOS Intel ──────────────────────────────────────────────────────
  {
    name: "Stockfish",
    version: "18",
    os: "macos",
    downloadUrl: "https://github.com/official-stockfish/Stockfish/releases/latest/download/stockfish-macos-x86-64.zip",
    pathInArchive: "stockfish/stockfish-macos-x86-64",
    elo: 3635,
    downloadSize: 75_000_000,
    image: "https://upload.wikimedia.org/wikipedia/commons/3/3a/NewLogoSF.png",
  },
  // ── Linux ────────────────────────────────────────────────────────────
  {
    name: "Stockfish",
    version: "18",
    os: "linux",
    downloadUrl: "https://github.com/official-stockfish/Stockfish/releases/latest/download/stockfish-ubuntu-x86-64-avx2.tar",
    pathInArchive: "stockfish/stockfish-ubuntu-x86-64-avx2",
    elo: 3635,
    downloadSize: 79_953_920,
    image: "https://upload.wikimedia.org/wikipedia/commons/3/3a/NewLogoSF.png",
  },
  {
    name: "Stockfish",
    version: "18 Lite",
    os: "linux",
    downloadUrl: "https://github.com/official-stockfish/Stockfish/releases/latest/download/stockfish-ubuntu-x86-64-sse41-popcnt.tar",
    pathInArchive: "stockfish/stockfish-ubuntu-x86-64-sse41-popcnt",
    elo: 3635,
    downloadSize: 72_000_000,
    image: "https://upload.wikimedia.org/wikipedia/commons/3/3a/NewLogoSF.png",
  },
];

/** Get the engines storage directory (in app data). */
function getEnginesDir(): string {
  // In dev: monorepo root / engines
  // In built app: APP_DATA_DIR / engines
  const appDataDir = process.env.APP_DATA_DIR ?? process.cwd();
  const enginesDir = join(appDataDir, "engines");
  if (!existsSync(enginesDir)) {
    mkdirSync(enginesDir, { recursive: true });
  }
  return enginesDir;
}

/** Get platform identifier for catalog filtering. */
function getPlatform(): string {
  const isWin = process.platform === "win32";
  const isMac = process.platform === "darwin";
  if (isWin) return "windows";
  if (isMac) return process.arch === "arm64" ? "macos-arm64" : "macos";
  return "linux";
}

/** Check if a path points to a valid engine binary. */
async function validateEnginePath(path: string): Promise<{ valid: boolean; options?: UciOption[]; error?: string }> {
  if (!existsSync(path)) {
    return { valid: false, error: "File not found" };
  }

  // On Unix, check executable permission
  if (process.platform !== "win32") {
    try {
      accessSync(path, constants.X_OK);
    } catch {
      return { valid: false, error: "File exists but is not executable. Try: chmod +x " + path };
    }
  }
  
  try {
    const engine = await UciEngine.create(path);
    await engine.terminate();
    return { valid: true, options: [] };
  } catch (err) {
    return { 
      valid: false, 
      error: `Failed to start engine: ${err instanceof Error ? err.message : String(err)}` 
    };
  }
}

/** Extract a ZIP/TAR archive to the engines directory. */
async function extractArchive(archivePath: string, destDir: string): Promise<void> {
  // Use Bun's built-in decompression
  const file = Bun.file(archivePath);
  const buffer = await file.arrayBuffer();
  
  // For simplicity, use a shell command to extract
  // In production, you'd use a proper archive library
  const isZip = archivePath.endsWith(".zip");
  const isTar = archivePath.endsWith(".tar") || archivePath.endsWith(".tar.gz") || archivePath.endsWith(".tgz");
  
  if (isZip) {
    // Use unzip on Unix, PowerShell on Windows
    if (process.platform === "win32") {
      await Bun.$`powershell -Command "Expand-Archive -Path '${archivePath}' -DestinationPath '${destDir}' -Force"`.quiet();
    } else {
      await Bun.$`unzip -o '${archivePath}' -d '${destDir}'`.quiet();
    }
  } else if (isTar) {
    await Bun.$`tar -xf '${archivePath}' -C '${destDir}'`.quiet();
  }
}

export const enginesRoutes = new Elysia({ prefix: "/engines" })
  // List all configured engines
  .get("/", async () => {
    const engines = await engineRepository.list();
    // Check existence for each engine
    const withExists = await Promise.all(
      engines.map(async (e) => {
        const exists = e.path ? existsSync(e.path) : false;
        if (e.exists !== exists) {
          await engineRepository.setExists(e.id, exists);
        }
        return { ...e, exists };
      })
    );
    return { engines: withExists };
  })
  
  // Get downloadable engines catalog (filtered by platform)
  .get("/catalog", async () => {
    const platform = getPlatform();
    const available = ENGINE_CATALOG.filter((e) => e.os === platform);
    return { engines: available, platform };
  })
  
  // Add an engine from local path
  .post(
    "/",
    async ({ body, set }) => {
      const { name, path: enginePath, version, elo, image } = body;
      
      // Validate the path
      const validation = await validateEnginePath(enginePath);
      if (!validation.valid) {
        set.status = 400;
        return { error: validation.error };
      }
      
      // Check if path already registered
      const existing = await engineRepository.list();
      if (existing.some((e) => e.path === enginePath)) {
        set.status = 400;
        return { error: "Engine at this path is already registered" };
      }
      
      const engine = await engineRepository.create({
        name: name ?? basename(enginePath),
        version,
        path: enginePath,
        exists: true,
        isActive: existing.length === 0, // First engine becomes active
        elo,
        image,
        options: validation.options,
      });
      
      return { engine };
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        path: t.String({ minLength: 1 }),
        version: t.Optional(t.String()),
        elo: t.Optional(t.Number()),
        image: t.Optional(t.String()),
      }),
    }
  )
  
  // Download an engine from catalog
  .post(
    "/download",
    async ({ body, set }) => {
      const { catalogIndex } = body;
      const platform = getPlatform();
      const catalogEngine = ENGINE_CATALOG.filter((e) => e.os === platform)[catalogIndex];
      
      if (!catalogEngine) {
        set.status = 400;
        return { error: "Invalid engine selection for this platform" };
      }
      
      const enginesDir = getEnginesDir();
      const archivePath = join(enginesDir, basename(catalogEngine.downloadUrl));
      const extractDir = join(enginesDir, `${catalogEngine.name.toLowerCase()}-${catalogEngine.version}`);
      
      // Download the archive
      try {
        const response = await fetch(catalogEngine.downloadUrl);
        if (!response.ok) {
          throw new Error(`Download failed: ${response.status}`);
        }
        
        const fileBuffer = await response.arrayBuffer();
        await Bun.write(archivePath, fileBuffer);
        
        // Extract
        if (!existsSync(extractDir)) {
          mkdirSync(extractDir, { recursive: true });
        }
        await extractArchive(archivePath, extractDir);
        
        // Find the binary
        const binaryPath = join(extractDir, catalogEngine.pathInArchive);
        if (!existsSync(binaryPath)) {
          // Try to find it in the extracted directory
          throw new Error(`Binary not found at expected path: ${catalogEngine.pathInArchive}`);
        }
        
        // Make executable on Unix
        if (process.platform !== "win32") {
          await Bun.$`chmod +x '${binaryPath}'`.quiet();
        }
        
        // Create engine record
        const engine = await engineRepository.create({
          name: catalogEngine.name,
          version: catalogEngine.version,
          path: binaryPath,
          downloadUrl: catalogEngine.downloadUrl,
          exists: true,
          isActive: (await engineRepository.list()).length === 0,
          elo: catalogEngine.elo,
          image: catalogEngine.image,
        });
        
        // Clean up archive
        try {
          unlinkSync(archivePath);
        } catch {
          // Ignore cleanup errors
        }
        
        return { engine };
      } catch (err) {
        set.status = 500;
        return { 
          error: "Download failed", 
          message: err instanceof Error ? err.message : String(err) 
        };
      }
    },
    {
      body: t.Object({
        catalogIndex: t.Number({ minimum: 0 }),
      }),
    }
  )
  
  // Update engine config
  .patch(
    "/:id",
    async ({ params: { id }, body, set }) => {
      const existing = await engineRepository.getById(id);
      if (!existing) {
        set.status = 404;
        return { error: "Engine not found" };
      }
      
      const engine = await engineRepository.update(id, body);
      return { engine };
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        options: t.Optional(t.Any()),
      }),
    }
  )
  
  // Set engine as active
  .post("/:id/activate", async ({ params: { id }, set }) => {
    const existing = await engineRepository.getById(id);
    if (!existing) {
      set.status = 404;
      return { error: "Engine not found" };
    }
    if (!existing.exists) {
      set.status = 400;
      return { error: "Engine binary not found" };
    }
    
    const engine = await engineRepository.setActive(id);
    // Reset the singleton so the next analyze() call uses the new engine.
    await resetEngine();
    return { engine };
  })
  
  // Delete engine config
  .delete("/:id", async ({ params: { id }, set }) => {
    const existing = await engineRepository.getById(id);
    if (!existing) {
      set.status = 404;
      return { error: "Engine not found" };
    }
    
    await engineRepository.delete(id);
    return { success: true };
  })
  
  // Health check — validate the active engine is usable
  .get("/health", async () => {
    try {
      const active = await engineRepository.getActive();
      if (!active) {
        return { status: "no_active_engine" as const, message: "No engine is set as active." };
      }
      if (!active.path) {
        return { status: "no_path" as const, engineId: active.id, message: "Active engine has no binary path configured." };
      }
      if (!existsSync(active.path)) {
        return { status: "missing" as const, engineId: active.id, path: active.path, message: "Engine binary not found on disk." };
      }
      // On Unix, check executable bit
      if (process.platform !== "win32") {
        try {
          accessSync(active.path, constants.X_OK);
        } catch {
          return { status: "not_executable" as const, engineId: active.id, path: active.path, message: "Engine binary is not executable. Run: chmod +x " + active.path };
        }
      }
      // Try to spawn the engine
      try {
        const eng = await UciEngine.create(active.path);
        await eng.terminate();
        return { status: "ok" as const, engineId: active.id, name: active.name, path: active.path, message: "Engine is operational." };
      } catch (err) {
        return { status: "spawn_failed" as const, engineId: active.id, path: active.path, message: `Engine binary failed to start: ${err instanceof Error ? err.message : String(err)}` };
      }
    } catch (err) {
      return { status: "error" as const, message: `Health check failed: ${err instanceof Error ? err.message : String(err)}` };
    }
  })

  // Get UCI options from engine binary
  .get("/:id/options", async ({ params: { id }, set }) => {
    const engine = await engineRepository.getById(id);
    if (!engine) {
      set.status = 404;
      return { error: "Engine not found" };
    }
    if (!engine.path || !existsSync(engine.path)) {
      set.status = 400;
      return { error: "Engine binary not found" };
    }
    
    // For now, return stored options. In a full implementation,
    // we'd spawn the engine and parse its "option" lines.
    return { options: engine.options ?? [] };
  });
