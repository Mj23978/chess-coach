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
  server: {
    NODE_ENV: z.string().optional().default("development"),
    // The desktop host always sets this before @repo/db imports; standalone
    // reads it from .env. PGlite accepts a filesystem path.
    DATABASE_URL: z.string().optional().default("./.db"),
    // Elysia listen port for the standalone backend.
    BACKEND_PORT: z.coerce.number().optional().default(4001),

    // Better-Auth / sessions.
    JWT_SECRET: z.string().min(1),

    // S3/MinIO — the desktop filesystem backend ignores these, but @repo/env
    // still requires the keys to be present. Dummies are fine.
    S3_BUCKET: z.string().optional().default("chess-coach"),
    S3_ENDPOINT: z.string().optional().default("http://localhost:9000"),
    S3_ACCESS_KEY: z.string().optional().default("noop"),
    S3_SECRET_KEY: z.string().optional().default("noop"),
  },
  client: {
    // Set by the desktop Bun main to the in-process API URL; read from .env in
    // a server/web build.
    NEXT_PUBLIC_API_URL: z.string().optional().default("http://localhost:4001"),
    NEXT_PUBLIC_APP_URL: z.string().optional().default("http://localhost:3000"),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    BACKEND_PORT: process.env.BACKEND_PORT,
    JWT_SECRET: process.env.JWT_SECRET,
    S3_BUCKET: process.env.S3_BUCKET,
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_ACCESS_KEY: process.env.S3_ACCESS_KEY,
    S3_SECRET_KEY: process.env.S3_SECRET_KEY,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
});
