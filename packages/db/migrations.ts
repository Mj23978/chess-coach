import type { PGlite } from "@electric-sql/pglite";
import { promises as fs } from "node:fs";
import path from "node:path";

interface JournalEntry {
  idx: number;
  version: string;
  when: number;
  tag: string;
  breakpoints: boolean;
}

interface Journal {
  entries: JournalEntry[];
}

// Migrations directory. Defaults to `./migrations` relative to the process
// cwd (the standalone backend at `packages/api` has `migrations/` there), but
// can be overridden via `MIGRATIONS_DIR` env — the Electrobun desktop host sets
// this to the `@repo/api` package's migrations directory because its cwd is
// `apps/desktop/`, not `packages/api/`.
const MIGRATIONS_DIR = path.resolve(
  process.env.MIGRATIONS_DIR ?? String(process.cwd()),
  "./migrations",
);

export async function runMigrations(pglite: PGlite, verbose: boolean = true) {
  try {
    const journalPath = path.join(MIGRATIONS_DIR, "meta/_journal.json");

    if (verbose) {
      // Debug: log the path type
      console.log("Migrations directory path type:", typeof MIGRATIONS_DIR, MIGRATIONS_DIR);
      console.log("Journal path type:", typeof journalPath, journalPath);
    }

    // 1. Verify the migrations journal exists
    try {
      await fs.access(journalPath);
    } catch {
      console.warn(`No migration journal found at ${journalPath}. Skipping migrations.`);
      return;
    }

    // 2. Read and parse the Drizzle journal
    const journalRaw = await fs.readFile(journalPath, "utf-8");
    const journal = JSON.parse(journalRaw) as Journal;

    // 3. Ensure extensions and the tracking table exist
    await pglite.exec("CREATE EXTENSION IF NOT EXISTS vector;");
    await pglite.exec(`
      CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
        id SERIAL PRIMARY KEY,
        tag TEXT UNIQUE NOT NULL,
        created_at BIGINT
      );
    `);

    // 4. Retrieve already applied migrations from the database
    const result = await pglite.query<{ tag: string }>(
      'SELECT tag FROM "__drizzle_migrations";'
    );
    const appliedTags = new Set(result.rows.map((row) => row.tag));

    // 5. Execute any missing migrations in order
    for (const entry of journal.entries) {
      if (appliedTags.has(entry.tag)) {
        continue; // Skip already applied migrations
      }

      const sqlFilePath = path.join(MIGRATIONS_DIR, `${entry.tag}.sql`);
      if (verbose) {
        console.info(`Applying migration: ${entry.tag}`);
      }
      const sqlContent = await fs.readFile(sqlFilePath, "utf-8");

      // Drizzle uses "--> statement-breakpoint" to split operations in SQL files
      const statements = sqlContent
        .split("--> statement-breakpoint")
        .map((statement) => statement.trim())
        .filter(Boolean);

      // Apply statements within a transaction so we don't end up with partial migrations.
      // Each statement is wrapped with error-tolerance for "already exists" cases so that
      // booting against an existing database (created before the __drizzle_migrations
      // tracking table existed) does not fail on duplicate types/tables/indexes.
      await pglite.transaction(async (tx) => {
        for (const statement of statements) {
          try {
            await tx.exec(statement);
          } catch (stmtErr: any) {
            const code = stmtErr?.code ?? "";
            const message = String(stmtErr?.message ?? "");

            // Skip "already exists" errors for types, tables, indexes, constraints.
            const isDuplicate =
              code === "42710" || // duplicate_object (type, enum, etc.)
              code === "42P07" || // duplicate_table
              code === "42P06" || // duplicate_schema
              message.includes("already exists") ||
              message.includes("duplicate") ||
              message.includes("relation already exists");

            if (!isDuplicate) {
              throw stmtErr;
            }

            if (verbose) {
              const firstLine = message.includes("\n")
                ? message.split("\n")[0]
                : message;
              console.warn(
                `Migration "${entry.tag}": skipped duplicate object: ${firstLine}`
              );
            }
          }
        }
        // Record this migration as successfully run
        await tx.query(
          'INSERT INTO "__drizzle_migrations" (tag, created_at) VALUES ($1, $2);',
          [entry.tag, entry.when]
        );
      });
    }

    if (verbose) {
      console.log("Migrations applied successfully.");
    }
  } catch (error) {
    console.error("Error running migrations:", error);
    throw error;
  }
}
