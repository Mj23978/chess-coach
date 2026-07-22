/**
 * @repo/ui — minimal shared component library for chess-coach.
 *
 * Source-consumed: no build step. Apps import raw `.tsx` via the
 * `./components/*` and `./lib/*` exports.
 */
import * as React from "react";
import { TooltipProvider } from "./components/tooltip";
import { ThemeProvider } from "./providers/theme";

export const DesignSystemProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <ThemeProvider defaultTheme="light">
    <TooltipProvider>{children}</TooltipProvider>
  </ThemeProvider>
);

export { ThemeProvider } from "./providers/theme";
