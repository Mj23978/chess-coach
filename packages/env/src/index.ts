/**
 * @repo/env — process.env validation.
 *
 * Uses @t3-oss/env-core (no Next.js dependency) so it works in the Bun main
 * process and in tests. The desktop SPA does NOT import this — Vite aliases
 * `@repo/env` to a browser shim (apps/desktop/src/web/shims/env.ts).
 *
 * Every var is optional/defaulted so the desktop preload shim's dummy values
 * (S3_*, JWT_SECRET, DATABASE_URL, NEXT_PUBLIC_*) and a dev .env both validate.
 * Tighten these once the real services are wired.
 */
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "NEXT_PUBLIC_",
  server: {
    NODE_ENV: z.string().optional().default("development"),
    DATABASE_URL: z.string().optional().default("./.db"),
    BACKEND_PORT: z.coerce.number().optional().default(4001),
    JWT_SECRET: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_API_URL: z.string().optional().default("http://localhost:4001"),
    NEXT_PUBLIC_APP_URL: z.string().optional().default("http://localhost:3000"),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    BACKEND_PORT: process.env.BACKEND_PORT,
    JWT_SECRET: process.env.JWT_SECRET,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
});
