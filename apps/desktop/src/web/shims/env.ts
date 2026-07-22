/**
 * Browser-side env shim.
 *
 * Vite aliases `@repo/env` to this file (see vite.config.ts) so the SPA never
 * imports the real @repo/env (which validates process.env eagerly and pulls in
 * @t3-oss/env-core). The API base URL is injected by the Electrobun Bun main
 * as `window.__CHESS_COACH_API_BASE__` before the SPA boots.
 */
const apiBase =
  (typeof window !== "undefined" &&
    (window as any).__CHESS_COACH_API_BASE__) ||
  "http://localhost:4001";

export const env = {
  NEXT_PUBLIC_API_URL: apiBase,
  NEXT_PUBLIC_APP_URL: apiBase,
};
