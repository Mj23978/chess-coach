import * as React from "react";

/**
 * Minimal theme provider stub. The desktop SPA mounts this but does no real
 * theming yet — it just passes children through so the tree renders. Swap in
 * next-themes (or a custom context) when dark mode is needed.
 */
export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => (
  <>{children}</>
);

export const useTheme = () => ({ theme: "light" as const, setTheme: () => {} });
