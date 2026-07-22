import { defineConfig } from "drizzle-kit";

export default defineConfig({
  // The single schema barrel. drizzle-kit picks up every table re-exported here.
  schema: "./schema.pg.ts",
  // Emit migration SQL next to @repo/api so the desktop bundle's MIGRATIONS_DIR
  // resolution (packages/api/migrations) keeps working. Run `bun run db:generate`.
  out: "../api/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // Local PGlite file used when pushing from this package. The desktop app
    // overrides this at runtime via __CHESS_COACH_DESKTOP__.
    url: "../api/.db",
  },
});
