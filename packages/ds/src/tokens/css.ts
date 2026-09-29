/**
 * Emits the design tokens as `--yl-*` custom properties.
 *
 * @remarks
 * Variables only. Component styles are SASS, compiled to one stylesheet per component, because
 * a single sheet carrying every component's rules is a cost every application pays regardless
 * of what it imports and, unlike the JavaScript, cannot be tree-shaken.
 *
 * **The projection is exhaustive rather than hand-written, and that is the point.** This file
 * used to list twenty-seven `put()` calls naming each property to emit, which meant a token
 * could be added to the TypeScript and silently never reach CSS. Five had:
 * `interactive.primary.border`, all of `interactive.ghost.*`, `motion.duration.slow`, two of
 * the three easings, and the entire twelve-style type scale. Nothing failed, so nothing was
 * noticed; `Typography.scss` simply hardcoded twenty-five values that had tokens all along.
 *
 * So every leaf is walked. A namespace declares its prefix, how to render a value, and any leaf
 * renames, and cannot decide to skip one. `tests/styles.test.ts` asserts the converse: that
 * every leaf in the token objects appears in the output.
 */
import { foundationTokens } from "./tokens";
import { lightTheme, darkTheme, type ThemeTokens } from "./themes";

const f = foundationTokens;

/**
 * Pixels to `rem`, under a 10px root.
 *
 * @remarks
 * `base.css` sets `html { font-size: 62.5% }`, so 1rem is 10px and a length reads as its pixel
 * value divided by ten. Tokens stay authored in px because the numbers are legible that way,
 * `spacing[4]` is 16 rather than 1.6, and only the emitted value carries the unit.
 *
 * `rem` rather than `px` so a reader's font-size preference still scales the interface. The
 * smaller root makes the arithmetic easy; it does not make the sizing fixed.
 *
 * @internal
 */
function rem(px: number): string {
  return px === 0 ? "0" : `${px / 10}rem`;
}

/** `bodyLg` to `body-lg`, `onInk` to `on-ink`, `2xl` unchanged. */
function kebab(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

interface Leaf {
  path: string[];
  value: unknown;
}

/**
 * Every leaf under a node, depth-first.
 *
 * @remarks
 * A leaf is anything that is not a plain object, so a string, a number, or `undefined` for an
 * optional axis the caller left out. Depth is unbounded on purpose: the shape of the token
 * objects is allowed to change without this needing to know.
 */
function leaves(node: unknown, trail: string[] = []): Leaf[] {
  if (node === null || typeof node !== "object") return [{ path: trail, value: node }];
  return Object.entries(node as Record<string, unknown>).flatMap(([k, v]) => leaves(v, [...trail, k]));
}

interface Namespace {
  /** The `--yl-` suffix this namespace owns. */
  prefix: string;
  node: unknown;
  /** Leaf key to emitted segment, where the token's own name reads badly in CSS. */
  rename?: Readonly<Record<string, string>>;
  format: (value: unknown, path: string[]) => string;
}

const raw = (v: unknown) => String(v);
const px = (v: unknown) => `${String(v)}px`;
const remPx = (v: unknown) => rem(Number(v));

/**
 * Leaf names for the type scale.
 *
 * @remarks
 * `fontSize` would emit `--yl-text-h1-font-size`, which stutters, and `lineHeight` reads as a
 * length when it is a ratio. `leading` and `tracking` are what the values actually are.
 */
const TEXT_AXES = {
  fontFamily: "family",
  fontSize: "size",
  fontWeight: "weight",
  lineHeight: "leading",
  letterSpacing: "tracking",
  textTransform: "transform",
} as const;

/** The theme-invariant namespaces. */
function foundationNamespaces(): Namespace[] {
  return [
    { prefix: "font", node: f.font.family, format: raw },
    {
      prefix: "text",
      node: f.font.text,
      rename: TEXT_AXES,
      format: (v, path) => {
        const axis = path[path.length - 1];
        if (axis === "fontSize") return remPx(v);
        // Point at the family token rather than restating the stack. Twelve styles naming the
        // same seven fallbacks is a kilobyte of duplication in a file every application loads,
        // and it would let a style drift from the family it claims to use.
        if (axis === "fontFamily") return `var(--yl-font-${v === f.font.family.mono ? "mono" : "sans"})`;
        return raw(v);
      },
    },
    { prefix: "font-weight", node: f.fontWeight, format: raw },
    { prefix: "font-numeric", node: f.fontNumeric, format: raw },
    { prefix: "space", node: f.spacing, format: remPx },
    {
      prefix: "radius",
      node: f.radius,
      // `round` is a "make it a pill" sentinel rather than a measurement, so it stays a raw
      // length; converting it would emit 999.9rem, which is the same thing said worse.
      format: (v, path) => (path[path.length - 1] === "round" ? px(v) : remPx(v)),
    },
    { prefix: "elevation", node: f.elevation, format: raw },
    // Hairlines stay in px. `0.1rem` invites sub-pixel rounding, and a 1px border is a 1px
    // border regardless of how large the reader has set their text.
    { prefix: "border-width", node: f.borderWidth, format: px },
    // Unitless, and deliberately not converted: a stacking order is an ordinal, not a length.
    { prefix: "z", node: f.zIndex, format: raw },
    { prefix: "motion-duration", node: f.motion.duration, format: raw },
    { prefix: "motion-ease", node: f.motion.easing, format: raw },
    // Breakpoints and measures stay in px: `rem` inside a media query resolves against the
    // *initial* root font size, not the 62.5% one, so a rem breakpoint would silently be 1.6
    // times the number it reads as.
    { prefix: "breakpoint", node: f.breakpoints, format: px },
    { prefix: "container", node: f.container, format: px },
  ];
}

function declarations(namespaces: readonly Namespace[]): string {
  const lines: string[] = [];
  for (const ns of namespaces) {
    for (const { path, value } of leaves(ns.node)) {
      // An absent optional axis (a style with no `letterSpacing`) emits nothing rather than
      // `--yl-text-h3-tracking: undefined`, which would override an inherited value with garbage.
      if (value === undefined) continue;
      const segments = path.map((k) => ns.rename?.[k] ?? kebab(k));
      lines.push(`  --yl-${[ns.prefix, ...segments].join("-")}: ${ns.format(value, path)};`);
    }
  }
  return lines.join("\n");
}

/** The semantic colour roles of one theme. */
function themeVars(theme: ThemeTokens): string {
  return declarations([{ prefix: "color", node: theme.colors, format: raw }]);
}

function foundationVars(): string {
  return declarations(foundationNamespaces());
}

/**
 * The design tokens, as CSS custom properties.
 *
 * @remarks
 * The same values ship as `@yoltra/ds/styles/tokens.css`, generated from this function at build
 * time. Prefer the file; use this when the stylesheet has to be inlined, as in a server render.
 *
 * Pair it with `@yoltra/ds/styles/base.css`, which sets the 10px root these lengths assume.
 *
 * The palette is deliberately absent. It is a primitive, and a stylesheet that reaches for
 * `primary[500]` has bypassed the semantic layer that makes a theme switch work.
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
