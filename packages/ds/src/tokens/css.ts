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

/** Foundation (theme-invariant) variables: type, spacing, radius, motion. */
function foundationVars(): string {
  const lines: string[] = [];
  lines.push(`  --yl-font-sans: ${f.font.family.sans};`);
  lines.push(`  --yl-font-mono: ${f.font.family.mono};`);
  for (const [k, v] of Object.entries(f.spacing)) lines.push(`  --yl-space-${k}: ${v}px;`);
  for (const [k, v] of Object.entries(f.radius)) lines.push(`  --yl-radius-${k}: ${typeof v === "number" ? `${v}px` : v};`);
  for (const [k, v] of Object.entries(f.elevation)) lines.push(`  --yl-elevation-${k}: ${v.boxShadow};`);
  lines.push(`  --yl-motion-fast: ${f.motion.duration.fast};`);
  lines.push(`  --yl-motion-normal: ${f.motion.duration.normal};`);
  lines.push(`  --yl-ease: ${f.motion.easing.standard};`);
  for (const [k, v] of Object.entries(f.breakpoints)) lines.push(`  --yl-bp-${k}: ${v}px;`);
  return lines.join("\n");
}

const bp = foundationTokens.breakpoints;

/**
 * Mobile-first responsive helpers. Layout is CSS-owned (per the "Yoltra NS"
 * split — JS state lives in a Yoltra store, never layout). `.yl-container`
 * centres content with fluid gutters and steps its max-width up at each
 * breakpoint. Custom props `--yl-bp-*` are also emitted for `@container`
 * queries and JS breakpoint detection.
 */
const RESPONSIVE_STYLES = `
.yl-container {
  width: 100%;
  margin-inline: auto;
  padding-inline: var(--yl-space-4);
  box-sizing: border-box;
}
@media (min-width: ${bp.sm}px) { .yl-container { padding-inline: var(--yl-space-5); } }
@media (min-width: ${bp.md}px) { .yl-container { max-width: 720px; } }
@media (min-width: ${bp.lg}px) { .yl-container { max-width: 960px; padding-inline: var(--yl-space-6); } }
@media (min-width: ${bp.xl}px) { .yl-container { max-width: 1120px; } }
.yl-visually-hidden {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}
`;

const BASE_STYLES = `
.yl-root {
  font-family: var(--yl-font-sans);
  color: var(--yl-color-fg);
  background: var(--yl-color-bg-canvas);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
.yl-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: var(--yl-space-2);
  font-family: var(--yl-font-sans); font-size: 15px; font-weight: 600; line-height: 1.2;
  padding: var(--yl-space-3) var(--yl-space-5); border-radius: var(--yl-radius-md);
  border: 1px solid transparent; cursor: pointer; text-decoration: none;
  transition: background var(--yl-motion-fast) var(--yl-ease), border-color var(--yl-motion-fast) var(--yl-ease), transform var(--yl-motion-fast) var(--yl-ease);
}
.yl-btn:active { transform: translateY(1px); }
.yl-btn:focus-visible { outline: 2px solid var(--yl-color-border-focus); outline-offset: 2px; }
.yl-btn--primary { background: var(--yl-color-btn-bg); color: var(--yl-color-btn-fg); border-color: var(--yl-color-btn-bg); }
.yl-btn--primary:hover { background: var(--yl-color-btn-bg-hover); border-color: var(--yl-color-btn-bg-hover); }
.yl-btn--primary:active { background: var(--yl-color-btn-bg-active); }
.yl-btn--ghost { background: transparent; color: var(--yl-color-fg); border-color: var(--yl-color-ghost-border); }
.yl-btn--ghost:hover { background: var(--yl-color-ghost-bg-hover); }
.yl-btn--sm { padding: var(--yl-space-2) var(--yl-space-3); font-size: 13px; }

.yl-input, .yl-select, .yl-textarea {
  font-family: var(--yl-font-sans); font-size: 14px; line-height: 1.4;
  color: var(--yl-color-fg); background: var(--yl-color-bg-canvas);
  border: 1px solid var(--yl-color-border); border-radius: var(--yl-radius-md);
  padding: var(--yl-space-2) var(--yl-space-3);
  transition: border-color var(--yl-motion-fast) var(--yl-ease), box-shadow var(--yl-motion-fast) var(--yl-ease);
}
.yl-input::placeholder, .yl-textarea::placeholder { color: var(--yl-color-fg-muted); opacity: 1; }
.yl-input:hover, .yl-select:hover, .yl-textarea:hover { border-color: var(--yl-color-border-strong); }
.yl-input:focus-visible, .yl-select:focus-visible, .yl-textarea:focus-visible {
  outline: none; border-color: var(--yl-color-border-focus);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--yl-color-brand) 24%, transparent);
}
.yl-input:disabled, .yl-select:disabled, .yl-textarea:disabled {
  color: var(--yl-color-fg-disabled); background: var(--yl-color-bg-subtle); cursor: not-allowed;
}
.yl-select { cursor: pointer; }
.yl-textarea { resize: vertical; min-height: 80px; }
.yl-input--sm, .yl-select--sm { padding: var(--yl-space-1) var(--yl-space-2); font-size: 13px; }
.yl-input--block, .yl-select--block, .yl-textarea--block { display: block; width: 100%; }
.yl-field { display: flex; flex-direction: column; gap: var(--yl-space-1); }
.yl-field > .yl-label { font-size: 13px; font-weight: 600; color: var(--yl-color-fg-secondary); }

.yl-badge {
  display: inline-flex; align-items: center; gap: var(--yl-space-1);
  font-family: var(--yl-font-sans); font-size: 12px; font-weight: 600; line-height: 1;
  padding: 3px var(--yl-space-2); border-radius: var(--yl-radius-round);
  border: 1px solid var(--yl-color-border); color: var(--yl-color-fg-secondary); background: var(--yl-color-bg-subtle);
}
.yl-badge--brand { color: var(--yl-color-brand); border-color: var(--yl-color-info-border); background: var(--yl-color-info-bg); }

.yl-code {
  position: relative; margin: var(--yl-space-4) 0;
  border-radius: var(--yl-radius-lg); border: 1px solid var(--yl-color-code-border);
  background: var(--yl-color-code-bg); overflow: hidden;
}
.yl-code__head {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--yl-space-2) var(--yl-space-3);
  border-bottom: 1px solid var(--yl-color-code-border);
  font-family: var(--yl-font-mono); font-size: 12px; color: rgba(229, 238, 248, 0.7);
}
.yl-code pre {
  margin: 0; padding: var(--yl-space-4); overflow-x: auto;
  font-family: var(--yl-font-mono); font-size: 13.5px; line-height: 1.6; color: var(--yl-color-code-fg);
}
.yl-code__copy {
  font-family: var(--yl-font-sans); font-size: 12px; font-weight: 600; cursor: pointer;
  color: rgba(229, 238, 248, 0.85); background: rgba(148, 163, 184, 0.14);
  border: 1px solid rgba(148, 163, 184, 0.22); border-radius: var(--yl-radius-sm);
  padding: 2px var(--yl-space-2); transition: background var(--yl-motion-fast) var(--yl-ease);
}
.yl-code__copy:hover { background: rgba(148, 163, 184, 0.26); }

.yl-callout {
  display: flex; gap: var(--yl-space-3); margin: var(--yl-space-4) 0;
  padding: var(--yl-space-4); border-radius: var(--yl-radius-md);
  border: 1px solid var(--yl-color-info-border); background: var(--yl-color-info-bg); color: var(--yl-color-info-fg);
}
.yl-callout--success { border-color: var(--yl-color-success-border); background: var(--yl-color-success-bg); color: var(--yl-color-success-fg); }
.yl-callout--warning { border-color: var(--yl-color-warning-border); background: var(--yl-color-warning-bg); color: var(--yl-color-warning-fg); }
.yl-callout--error { border-color: var(--yl-color-error-border); background: var(--yl-color-error-bg); color: var(--yl-color-error-fg); }
.yl-callout__icon { flex: 0 0 auto; font-size: 16px; line-height: 1.5; }
.yl-callout__body { font-size: 14px; line-height: 1.6; }
.yl-callout__body > :first-child { margin-top: 0; }
.yl-callout__body > :last-child { margin-bottom: 0; }

.yl-tabs__list { display: flex; gap: var(--yl-space-1); border-bottom: 1px solid var(--yl-color-border); }
.yl-tabs__tab {
  font-family: var(--yl-font-sans); font-size: 14px; font-weight: 600; cursor: pointer;
  padding: var(--yl-space-2) var(--yl-space-3); background: none; border: none;
  color: var(--yl-color-fg-muted); border-bottom: 2px solid transparent; margin-bottom: -1px;
}
.yl-tabs__tab[data-active="true"] { color: var(--yl-color-brand); border-bottom-color: var(--yl-color-brand); }
.yl-tabs__panel { padding-top: var(--yl-space-4); }

.yl-table { width: 100%; border-collapse: collapse; font-size: 14px; margin: var(--yl-space-4) 0; }
.yl-table th, .yl-table td { text-align: left; padding: var(--yl-space-3); border-bottom: 1px solid var(--yl-color-border); vertical-align: top; }
.yl-table th { font-weight: 600; color: var(--yl-color-fg-secondary); font-size: 13px; }
.yl-table code { font-family: var(--yl-font-mono); font-size: 13px; }
`;

/**
 * The full DS stylesheet. Inject once at the app root.
 * @param options.scoped when true, wrap theme vars under `.yl-root` instead of `:root`.
 */
export function themeCss(options: { scoped?: boolean } = {}): string {
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
    BASE_STYLES,
    RESPONSIVE_STYLES,
  ].join("\n");
}
