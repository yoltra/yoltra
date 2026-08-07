/**
 * Emits the Yoltra DS stylesheet as a string: `--yl-*` custom properties for
 * light (`:root`) and dark (`[data-theme="dark"]`) plus base styles for every
 * primitive. Consumers inject this once (e.g. a `<style>` in the root layout),
 * so primitives render on the server without a React context — only the theme
 * *toggle* needs to be a client component.
 */
import { foundationTokens } from "./tokens";
import { lightTheme, darkTheme, type ThemeTokens } from "./themes";

const f = foundationTokens;

/** Flatten a semantic theme into `--yl-color-*` variable declarations. */
function themeVars(theme: ThemeTokens): string {
  const c = theme.colors;
  const lines: string[] = [];
  const put = (name: string, value: string) => lines.push(`  --yl-color-${name}: ${value};`);

  put("brand", c.brand.primary);
  put("brand-secondary", c.brand.secondary);
  put("bg-canvas", c.background.canvas);
  put("bg-subtle", c.background.subtle);
  put("bg-panel", c.background.panel);
  put("bg-elevated", c.background.elevated);
  put("bg-inset", c.background.inset);
  put("bg-overlay", c.background.overlay);
  put("fg", c.foreground.primary);
  put("fg-secondary", c.foreground.secondary);
  put("fg-muted", c.foreground.muted);
  put("fg-inverse", c.foreground.inverse);
  put("fg-disabled", c.foreground.disabled);
  put("link", c.foreground.link);
  put("link-hover", c.foreground.linkHover);
  put("border", c.border.subtle);
  put("border-strong", c.border.strong);
  put("border-focus", c.border.focus);
  put("divider", c.border.divider);
  put("btn-bg", c.interactive.primary.bg);
  put("btn-bg-hover", c.interactive.primary.bgHover);
  put("btn-bg-active", c.interactive.primary.bgActive);
  put("btn-fg", c.interactive.primary.fg);
  put("ghost-bg-hover", c.interactive.ghost.bgHover);
  put("ghost-border", c.interactive.ghost.border);
  put("code-bg", c.code.bg);
  put("code-fg", c.code.fg);
  put("code-border", c.code.border);
  for (const s of ["info", "success", "warning", "error"] as const) {
    put(`${s}-bg`, c.status[s].bg);
    put(`${s}-fg`, c.status[s].fg);
    put(`${s}-border`, c.status[s].border);
  }
  return lines.join("\n");
}

/** Foundation (theme-invariant) variables: type, spacing, radius, stacking order, motion. */
/**
 * Pixels to `rem`, under a 10px root.
 *
 * @remarks
 * `base.css` sets `html { font-size: 62.5% }`, so 1rem is 10px and a length reads as its
 * pixel value divided by ten. Tokens stay authored in px because the numbers are legible
 * that way — `spacing[4]` is 16, not 1.6 — and only the emitted value carries the unit.
 *
 * `rem` rather than `px` so a reader's font-size preference still scales the interface. The
 * smaller root makes the arithmetic easy; it does not make the sizing fixed.
 *
 * @internal
 */
function rem(px: number): string {
  return px === 0 ? "0" : `${px / 10}rem`;
}

function foundationVars(): string {
  const lines: string[] = [];
  lines.push(`  --yl-font-sans: ${f.font.family.sans};`);
  lines.push(`  --yl-font-mono: ${f.font.family.mono};`);
  for (const [k, v] of Object.entries(f.spacing)) lines.push(`  --yl-space-${k}: ${rem(v)};`);
  for (const [k, v] of Object.entries(f.radius)) {
    // `round` is a "make it a pill" sentinel rather than a measurement, so it stays a raw
    // length; converting it would emit 999.9rem, which is the same thing said worse.
    const value = typeof v !== "number" ? v : k === "round" ? `${v}px` : rem(v);
    lines.push(`  --yl-radius-${k}: ${value};`);
  }
  for (const [k, v] of Object.entries(f.elevation)) lines.push(`  --yl-elevation-${k}: ${v.boxShadow};`);
  // Hairlines stay in px. `0.1rem` invites sub-pixel rounding, and a 1px border is a 1px
  // border regardless of how large the reader has set their text.
  for (const [k, v] of Object.entries(f.border.width)) lines.push(`  --yl-border-${k}: ${v}px;`);
  // Unitless, and deliberately not converted: a stacking order is an ordinal, not a length.
  for (const [k, v] of Object.entries(f.zIndex)) lines.push(`  --yl-z-${k}: ${v};`);
  lines.push(`  --yl-motion-fast: ${f.motion.duration.fast};`);
  lines.push(`  --yl-motion-normal: ${f.motion.duration.normal};`);
  lines.push(`  --yl-ease: ${f.motion.easing.standard};`);
  // Breakpoints stay in px too: `rem` inside a media query resolves against the *initial*
  // root font size, not the 62.5% one, so a rem breakpoint would silently be 1.6x its value.
  for (const [k, v] of Object.entries(f.breakpoints)) lines.push(`  --yl-bp-${k}: ${v}px;`);
  return lines.join("\n");
}


/**
 * Mobile-first responsive helpers. Layout is CSS-owned (per the "Yoltra NS"
 * split — JS state lives in a Yoltra store, never layout). `.yl-container`
 * centres content with fluid gutters and steps its max-width up at each
 * breakpoint. Custom props `--yl-bp-*` are also emitted for `@container`
 * queries and JS breakpoint detection.
 */
/**
 * The design tokens, as CSS custom properties.
 *
 * @remarks
 * Variables only. Component styles are SASS, compiled to one stylesheet per component and
 * imported by the consumers that use them — a single sheet carrying every component's rules
 * is a cost every application pays regardless of what it imports, and unlike the JavaScript
 * it cannot be tree-shaken.
 *
 * The same values ship as `@yoltra/ds/styles/tokens.css`, generated from this function at
 * build time. Prefer the file; use this when the stylesheet has to be inlined, as in a server
 * render.
 *
 * Pair it with `@yoltra/ds/styles/base.css`, which sets the 10px root these lengths assume.
 *
 * @param options.scoped - Wrap the variables under `.yl-root` instead of `:root`, for an
 * application embedding Yoltra components inside a page it does not own.
 * @param options.rootFontSize - Emit the 62.5% root declaration alongside the variables.
 * `false` leaves it out, for an application that sets its own root; every `--yl-*` length is
 * then relative to whatever that is.
 *
 * @example
 * ```tsx
 * // A server render, inlining the variables before first paint.
 * <style dangerouslySetInnerHTML={{ __html: themeCss() }} />
 * ```
 *
 * @public
 */
export function themeCss(options: { scoped?: boolean; rootFontSize?: boolean } = {}): string {
  const lightSelector = options.scoped ? ".yl-root, .yl-root[data-theme='light']" : ":root, :root[data-theme='light']";
  const darkSelector = options.scoped ? ".yl-root[data-theme='dark']" : ":root[data-theme='dark']";
  return [
    `${lightSelector} {`,
    foundationVars(),
    themeVars(lightTheme),
    `}`,
    `${darkSelector} {`,
    themeVars(darkTheme),
    `}`,
    // The root declaration belongs with the lengths that assume it: emitting `1.6rem` while
    // leaving the root at 16px silently renders everything 1.6 times too large.
    options.rootFontSize === false ? "" : "html { font-size: 62.5%; }",
  ]
    .filter(Boolean)
    .join("\n");
}
