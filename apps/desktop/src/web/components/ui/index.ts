/**
 * App-level shared UI helpers barrel.
 *
 * The design-system package (@repo/ui) ships the *primitive* pieces (Radix
 * toast, buttons, etc.). Anything that is app-specific — the imperative toast
 * store, the chessground error boundary — lives here and is re-exported so the
 * rest of the SPA imports from a single `../components/ui` surface:
 *
 *   import { BoardErrorBoundary, toast, TOAST_MESSAGES } from "../components/ui";
 *
 * Note: `<Toaster/>` is rendered once at the app root (App.tsx); consumers
 * only need the `toast.*` methods.
 */
export { BoardErrorBoundary } from "./BoardErrorBoundary";
export { toast, TOAST_MESSAGES, Toaster } from "./toast";
