"use client";

/**
 * Generic theme controller for consumers that do NOT wire their own state.
 * Reflects the active theme onto `document.documentElement[data-theme]` and
 * persists it. The Yoltra website replaces this with a Yoltra-store-backed
 * controller (dogfooding), but the DOM contract — `data-theme` on the root —
 * is identical, so the DS CSS variables resolve either way.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ThemeId } from "../tokens/themes";

const STORAGE_KEY = "yoltra-theme";

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  toggle: () => void;
}

/**
 * This module is part of the `@yoltra/ds/client` entry (`"use client"`), so it
 * is only ever evaluated on the client — `createContext` at module scope is
 * safe and no lazy indirection is needed.
 */
const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Apply the theme to the document root. Safe to call before hydration. */
export function applyTheme(theme: ThemeId): void {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

export function ThemeProvider({ children, defaultTheme = "light" }: { children: ReactNode; defaultTheme?: ThemeId }) {
  const [theme, setThemeState] = useState<ThemeId>(defaultTheme);

  useEffect(() => {
    const stored = (typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY)) as ThemeId | null;
    const system = typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initial = stored ?? system;
    setThemeState(initial);
    applyTheme(initial);
  }, []);

  const setTheme = useCallback((t: ThemeId) => {
    setThemeState(t);
    applyTheme(t);
    if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, t);
  }, []);

  const toggle = useCallback(() => setTheme(theme === "dark" ? "light" : "dark"), [theme, setTheme]);

  const value = useMemo(() => ({ theme, setTheme, toggle }), [theme, setTheme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a <ThemeProvider>");
  return ctx;
}
