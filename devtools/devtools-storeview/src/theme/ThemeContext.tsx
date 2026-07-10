/**
 * Theme context, provider, and hooks for the Yoltra DevTools StoreView.
 *
 * @example
 * ```tsx
 * // Wrap the app (already done by DevtoolsApp)
 * <ThemeProvider defaultTheme="dark">
 *   <MyComponent />
 * </ThemeProvider>
 *
 * // Consume tokens directly
 * const theme = useThemeTokens();
 * <div style={{ background: theme.colors.background.canvas }} />
 *
 * // Consume pre-built style objects
 * const styles = useStyles();
 * <div style={styles.panel}>...</div>
 * <button style={styles.buttonPrimary}>Save</button>
 * ```
 *
 * @module @yoltra/devtools-storeview
 */

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ThemeTokens } from "./tokens";
import { darkTheme, lightTheme } from "./themes";
import { createAppStyles, type AppStyles } from "./styles";

/** Google Fonts URL loading Inter (400–700) and JetBrains Mono (400, 500). */
const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:ital,wght@0,400;0,500&display=swap";

// ─── Context ───────────────────────────────────────────────────────────────────

interface ThemeContextValue {
  theme: ThemeTokens;
  styles: AppStyles;
  themeName: "dark" | "light";
  setTheme: (name: "dark" | "light") => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ─── Provider ──────────────────────────────────────────────────────────────────

export interface ThemeProviderProps {
  children: React.ReactNode;
  /** Initial theme. Defaults to `"dark"`. */
  defaultTheme?: "dark" | "light";
}

/**
 * Provides theme tokens and pre-built style objects to the component tree.
 *
 * On mount it injects a `<link>` for Google Fonts (Inter + JetBrains Mono)
 * if one is not already present in the document.
 *
 * @public
 */
export function ThemeProvider({ children, defaultTheme = "dark" }: ThemeProviderProps) {
  const [themeName, setThemeName] = useState<"dark" | "light">(defaultTheme);
  const fontsInjectedRef = useRef(false);

  // Inject Google Fonts once
  useEffect(() => {
    if (fontsInjectedRef.current) return;
    if (document.querySelector(`link[href="${GOOGLE_FONTS_URL}"]`)) {
      fontsInjectedRef.current = true;
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = GOOGLE_FONTS_URL;
    document.head.appendChild(link);
    fontsInjectedRef.current = true;
  }, []);

  const theme = themeName === "dark" ? darkTheme : lightTheme;

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      styles: createAppStyles(theme),
      themeName,
      setTheme: setThemeName,
      toggleTheme: () => setThemeName((n) => (n === "dark" ? "light" : "dark")),
    }),
    [theme, themeName],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// ─── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * Returns the full theme context: tokens, pre-built styles, and theme controls.
 *
 * Must be used inside a {@link ThemeProvider}.
 *
 * @public
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

/**
 * Shorthand — returns only the `ThemeTokens` object.
 *
 * @example
 * ```tsx
 * const theme = useThemeTokens();
 * <span style={{ color: theme.colors.brand.info }}>{key}</span>
 * ```
 *
 * @public
 */
export function useThemeTokens(): ThemeTokens {
  return useTheme().theme;
}

/**
 * Shorthand — returns the pre-built `AppStyles` object derived from the active theme.
 *
 * Style objects are plain `CSSProperties` and can be passed directly to `style` props.
 *
 * @example
 * ```tsx
 * const styles = useStyles();
 * <div style={styles.panel}>
 *   <h2 style={styles.panelHeader}>Events</h2>
 *   <button style={styles.buttonPrimary}>Refresh</button>
 * </div>
 * ```
 *
 * @public
 */
export function useStyles(): AppStyles {
  return useTheme().styles;
}
