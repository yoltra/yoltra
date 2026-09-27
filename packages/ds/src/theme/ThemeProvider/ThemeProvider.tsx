"use client";

/**
 * Generic theme controller for consumers that do NOT wire their own state.
 * Reflects the active theme onto `document.documentElement[data-theme]` and
 * persists it. The Yoltra website replaces this with a Yoltra-store-backed
 * controller (dogfooding), but the DOM contract — `data-theme` on the root —
 * is identical, so the DS CSS variables resolve either way.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ThemeId } from "../../tokens/themes";

// One definition, shared with the script that runs before the first paint. A provider writing one
// key while that script reads another restores nothing, and says nothing about it.
import { THEME_STORAGE_KEY as STORAGE_KEY } from "../noFlashScript";

/** What {@link useTheme} returns. @public */
export interface ThemeContextValue {
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
/**
 * Sets `data-theme` on the document root.
 *
 * @remarks
 * The whole theming mechanism is this attribute: every colour is a CSS custom property
 * redefined under `[data-theme='dark']`, so switching is one attribute write and no React
 * re-render. Call it directly to theme a page that does not mount {@link ThemeProvider}.
 *
 * @example
 * ```ts
 * // Before hydration, from an inline script, to avoid a flash of the wrong theme.
 * applyTheme(localStorage.getItem("theme") === "dark" ? "dark" : "light");
 * ```
 *
 * @public
 */
export function applyTheme(theme: ThemeId): void {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

/**
 * The stored theme, if there is a usable one.
 *
 * @remarks
 * Three ways this goes wrong, all of them seen in the wild and none of them the caller's fault:
 *
 * - **Reading throws.** `localStorage` is a getter that raises a `SecurityError` when site data
 *   is blocked, which is the default in some privacy configurations. An uncaught throw here runs
 *   inside an effect and takes the tree down, so a blocked cookie jar becomes a blank page.
 * - **The value is not a theme.** Nothing stops another script writing to this key, and
 *   `setAttribute("data-theme", "purple")` matches no selector, leaving every colour at its
 *   light-theme default with no way to tell why.
 * - **There is no `localStorage` at all**, in a non-browser renderer.
 *
 * All three return `null`, which is what the caller's `??` needs in order to fall through to the
 * system preference.
 */
function storedTheme(): ThemeId | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "dark" || value === "light" ? value : null;
  } catch {
    return null;
  }
}

/**
 * Holds the current theme and applies it to the document.
 *
 * @example
 * ```tsx
 * <ThemeProvider defaultTheme="dark">
 *   <App />
 * </ThemeProvider>
 * ```
 *
 * @public
 */
export function ThemeProvider({ children, defaultTheme = "light" }: { children: ReactNode; defaultTheme?: ThemeId }) {
  const [theme, setThemeState] = useState<ThemeId>(defaultTheme);

  useEffect(() => {
    const system = typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initial = storedTheme() ?? system;
    setThemeState(initial);
    applyTheme(initial);
  }, []);

  const setTheme = useCallback((t: ThemeId) => {
    setThemeState(t);
    applyTheme(t);
    // Persistence is the part allowed to fail. Storage throws when it is blocked or full, and a
    // theme the reader chose and can see is worth more than the promise of remembering it.
    try {
      if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* The preference is not persisted. The theme still applied. */
    }
  }, []);

  const toggle = useCallback(() => setTheme(theme === "dark" ? "light" : "dark"), [theme, setTheme]);

  const value = useMemo(() => ({ theme, setTheme, toggle }), [theme, setTheme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Reads and sets the current theme.
 *
 * @throws When called outside {@link ThemeProvider} — a hook that silently returned a default
 * would leave a toggle that renders correctly and changes nothing.
 *
 * @example
 * ```tsx
 * const { theme, setTheme } = useTheme();
 * <Button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>Toggle theme</Button>
 * ```
 *
 * @public
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a <ThemeProvider>");
  return ctx;
}
