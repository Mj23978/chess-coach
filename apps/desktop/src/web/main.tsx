/**
 * SPA entry point — mounts the React tree with the provider stack.
 *
 * The API base URL is injected by the Electrobun Bun main as
 * `window.__CHESS_COACH_API_BASE__` before this script loads. In a browser dev
 * context (plain `vite`) it falls back to localhost.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "@repo/ui/styles/globals.css";

import App from "./App";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60 * 1000 } },
});

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("#root element missing from index.html");

createRoot(rootEl).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
);
