/**
 * @yoltra/ds — Yoltra Design System.
 *
 * Foundation tokens, semantic themes, a CSS-variable stylesheet generator, and
 * server-safe primitive React components shared across the Yoltra website,
 * docs, and examples. Theming is driven entirely by a `data-theme` attribute on
 * the document root, so these primitives render on the server.
 *
 * Interactive controls (theme controller, tabs, copy button) that need React
 * state or browser APIs are published from the {@link module:@yoltra/ds/client}
 * entry (`@yoltra/ds/client`), which ships a real `"use client"` directive.
 *
 * @module @yoltra/ds
 */

// Tokens & themes
export { foundationTokens } from "./tokens/tokens";
export type {
  FoundationTokens,
  FontTokens,
  FontStyleToken,
  PaletteTokens,
  ColorScale,
  CSSLength,
} from "./tokens/tokens";

export { lightTheme, darkTheme, themes } from "./tokens/themes";
export type { ThemeTokens, SemanticColorTokens, ThemeId } from "./tokens/themes";

export { themeCss } from "./tokens/css";

// Server-safe primitives. Interactive primitives (CodeBlock, Tabs) and the
// theme controller (ThemeProvider/useTheme/applyTheme) live in ./client.
export { Button, ButtonLink } from "./primitives/Button";
export type { ButtonProps, ButtonLinkProps } from "./primitives/Button";
export { Badge } from "./primitives/Badge";
export type { BadgeProps } from "./primitives/Badge";
export { Callout } from "./primitives/Callout";
export type { CalloutProps } from "./primitives/Callout";
export { Table, THead, TBody, TR, TH, TD } from "./primitives/Table";
