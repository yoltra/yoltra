import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { SRC, compiledStyles } from "./support/styles";
import { foundationTokens } from "../src/tokens/tokens";
import { darkTheme, lightTheme } from "../src/tokens/themes";
import { themeCss } from "../src/tokens/css";

/**
 * The stylesheets, checked against the tokens they claim to use.
 *
 * @remarks
 * A typo in a custom property does not fail anything. `var(--yl-color-bordr)` compiles, ships,
 * and renders as though the declaration were absent — which for a border colour means no
 * border, on one component, in one theme, noticed by whoever happens to look.
 */

/** Custom properties the token sheet defines. */
let defined: Set<string> | null = null;

function definedProperties(): Set<string> {
  return (defined ??= new Set(
    [...themeCss().matchAll(/(--yl-[a-z0-9-]+)\s*:/g)].map((m) => m[1]!),
  ));
}

/**
 * Every `var(--yl-…)` in a stylesheet, and whether it supplied a fallback.
 *
 * @remarks
 * The distinction is the whole test. A reference with no fallback must resolve to a token, or
 * it resolves to nothing. A reference *with* one is a component-local property the component
 * sets per instance — `--yl-stack-gap` and its like — which by design is undefined until an
 * element carries it, and whose fallback is what must be a real token.
 */
function references(css: string): Array<{ name: string; hasFallback: boolean }> {
  return [...css.matchAll(/var\(\s*(--yl-[a-z0-9-]+)\s*(,)?/g)].map((m) => ({
    name: m[1]!,
    hasFallback: m[2] === ",",
  }));
}

/**
 * Namespaces owned by the tokens.
 *
 * @remarks
 * A reference inside one of these must resolve, fallback or not. Allowing a fallback to excuse
 * it is how `var(--yl-color-bg-surface, var(--yl-color-bg-canvas))` survived review: the
 * property never existed, the fallback always won, and cards rendered the same colour as the
 * page they sat on. Everything outside these namespaces is a component-local property, set per
 * instance, and is undefined until an element carries it.
 */
const TOKEN_NAMESPACES = [
  "--yl-color-",
  "--yl-space-",
  "--yl-radius-",
  "--yl-elevation-",
  "--yl-font-",
  "--yl-motion-",
  "--yl-border-",
  "--yl-bp-",
  "--yl-z-",
];

const isToken = (name: string): boolean =>
  name === "--yl-ease" || TOKEN_NAMESPACES.some((ns) => name.startsWith(ns));

describe("every custom property a stylesheet reads is one the tokens define", () => {
  const defined = definedProperties();

  for (const { name, css } of compiledStyles()) {
    it(`${name} references only defined properties`, () => {
      const missing = references(css)
        .filter((r) => (isToken(r.name) || !r.hasFallback) && !defined.has(r.name))
        .map((r) => r.name);

      expect([...new Set(missing)]).toEqual([]);
    });
  }

  it("and the fallbacks are real tokens too", () => {
    // A component-local property may be undefined; what it falls back to may not be.
    const fallbacks = compiledStyles().flatMap(({ css }) =>
      [...css.matchAll(/var\(\s*--yl-[a-z0-9-]+\s*,\s*var\(\s*(--yl-[a-z0-9-]+)/g)].map((m) => m[1]!),
    );

    expect([...new Set(fallbacks.filter((f) => !defined.has(f)))]).toEqual([]);
  });

  it("finds properties at all, so a silent regex change cannot make this vacuous", () => {
    expect(definedProperties().size).toBeGreaterThan(50);
    expect(compiledStyles().length).toBeGreaterThan(5);
    expect(references(compiledStyles()[1]!.css).length).toBeGreaterThan(0);
  });
});

describe("lengths are emitted against a 10px root", () => {
  const css = themeCss();

  it("converts the spacing scale to rem", () => {
    // 16px at a 62.5% root is 1.6rem. The token stays authored as 16.
    expect(foundationTokens.spacing[4]).toBe(16);
    expect(css).toContain("--yl-space-4: 1.6rem;");
    expect(css).toContain("--yl-space-1: 0.4rem;");
  });

  it("emits zero without a unit", () => {
    expect(css).toContain("--yl-space-0: 0;");
  });

  it("keeps breakpoints in pixels", () => {
    // `rem` in a media query resolves against the initial root font size, not this one, so a
    // rem breakpoint would silently be 1.6 times the number it reads as.
    expect(css).toContain("--yl-breakpoint-md: 768px;");
    expect(css).not.toMatch(/--yl-breakpoint-[a-z]+: [\d.]+rem;/);
  });

  it("keeps hairline borders in pixels", () => {
    expect(css).toContain("--yl-border-width-thin: 1px;");
    expect(css).not.toMatch(/--yl-border-width-[a-z]+: [\d.]+rem;/);
  });

  it("leaves the pill radius as a sentinel rather than converting it", () => {
    // 999.9rem is the same instruction said worse.
    expect(css).toContain("--yl-radius-round: 9999px;");
    expect(css).toContain("--yl-radius-md: 0.8rem;");
  });

  it("ships the root declaration with the lengths that assume it", () => {
    expect(css).toContain("font-size: 62.5%");
    expect(themeCss({ rootFontSize: false })).not.toContain("62.5%");
  });

  it("scopes the variables when asked", () => {
    expect(themeCss({ scoped: true })).toContain(".yl-root");
    expect(themeCss()).toContain(":root");
  });
});

/** Every leaf path through a nested token object, e.g. `status.error.border`. */
function keyPaths(value: unknown, trail: string[] = []): string[] {
  if (value === null || typeof value !== "object") return [trail.join(".")];
  return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
    keyPaths(v, [...trail, k]),
  );
}

describe("the themes agree on what they define", () => {
  it("define exactly the same semantic keys, to the leaf", () => {
    // A colour present in one theme and missing from the other is a component that loses its
    // border, or its text, in whichever theme forgot it — and only in that theme, which is
    // where a reviewer is least likely to be looking.
    expect(keyPaths(darkTheme.colors).sort()).toEqual(keyPaths(lightTheme.colors).sort());
  });

  it("gives every leaf a non-empty value", () => {
    for (const theme of [lightTheme, darkTheme]) {
      const empty = keyPaths(theme.colors).filter((path) => {
        const value = path.split(".").reduce<unknown>(
          (node, key) => (node as Record<string, unknown>)[key],
          theme.colors,
        );
        return typeof value !== "string" || value.length === 0;
      });
      expect(empty).toEqual([]);
    }
  });
});

describe("the foundation scales", () => {
  it("keeps spacing monotonic, so a larger step is never smaller", () => {
    const steps = Object.keys(foundationTokens.spacing)
      .map(Number)
      .sort((a, b) => a - b);
    const values = steps.map((s) => foundationTokens.spacing[s]!);
    expect(values).toEqual([...values].sort((a, b) => a - b));
  });

  it("gives every palette scale the same steps", () => {
    // A scale missing a step is a theme that cannot reference it, found at render time.
    const { white, black, ...scales } = foundationTokens.palette;
    const shapes = Object.values(scales).map((scale) => Object.keys(scale).sort().join(","));
    expect(new Set(shapes).size).toBe(1);
    expect(typeof white).toBe("string");
    expect(typeof black).toBe("string");
  });

  it("orders breakpoints ascending", () => {
    const { sm, md, lg, xl } = foundationTokens.breakpoints;
    expect([sm, md, lg, xl]).toEqual([sm, md, lg, xl].sort((a, b) => a - b));
  });
});

/**
 * Nothing defined in TypeScript may fail to reach CSS.
 *
 * @remarks
 * This is the regression test for the class of bug that motivated the rewrite. The emitter used
 * to name each property it emitted, so a token could be added to `foundationTokens` and simply
 * never appear: `motion.duration.slow`, two easings, `interactive.primary.border`, all of
 * `interactive.ghost.*` and the whole twelve-style type scale were all defined and all missing.
 * Nothing failed, because nothing was comparing the two.
 *
 * Counted rather than name-matched on purpose. Re-deriving each expected property name here
 * would mean copying the emitter's own kebab-casing and rename rules, and a test that repeats
 * the implementation cannot disagree with it. Counting leaves asks the one question that
 * matters, "did anything get dropped", without knowing how anything is spelled.
 */
describe("the token projection is exhaustive", () => {
  /** Leaves with a value, which is what an emitted declaration corresponds to. */
  function definedLeaves(node: unknown): number {
    if (node === null || typeof node !== "object") return node === undefined ? 0 : 1;
    return Object.values(node as Record<string, unknown>).reduce<number>(
      (n, v) => n + definedLeaves(v),
      0,
    );
  }

  /** The `:root` block, which carries the foundations plus the light theme. */
  function lightBlock(): string {
    const css = themeCss({ rootFontSize: false });
    return css.slice(0, css.indexOf(":root[data-theme='dark']"));
  }

  it("emits one declaration per token, and no token is skipped", () => {
    const { palette, ...emitted } = foundationTokens;
    const expected = definedLeaves(emitted) + definedLeaves(lightTheme.colors);
    const actual = [...lightBlock().matchAll(/--yl-[a-z0-9-]+\s*:/g)].length;

    // Equality in both directions: fewer means a token was dropped, more means something is
    // emitted that no token backs.
    expect(actual).toBe(expected);
    expect(palette).toBeDefined();
  });

  it("emits the dark theme's colours and nothing else", () => {
    const css = themeCss({ rootFontSize: false });
    const dark = css.slice(css.indexOf(":root[data-theme='dark']"));
    expect([...dark.matchAll(/--yl-[a-z0-9-]+\s*:/g)].length).toBe(
      definedLeaves(darkTheme.colors),
    );
    // Foundations are theme-invariant, so restating them under the dark selector would be dead
    // weight in every stylesheet that ships.
    expect(dark).not.toContain("--yl-space-");
    expect(dark).not.toContain("--yl-text-");
  });

  it("keeps the palette out of CSS, deliberately rather than accidentally", () => {
    // A stylesheet that can reach `primary[500]` can bypass the semantic layer, which is the
    // only thing making a theme switch work. The ramp stays a TypeScript primitive.
    const css = themeCss();
    expect(css).not.toContain("--yl-palette");
    for (const step of Object.keys(foundationTokens.palette.primary)) {
      expect(css).not.toContain(`--yl-color-primary-${step}`);
    }
  });

  it("emits the axes and roles that were previously defined and dropped", () => {
    // Spot checks on the five that were missing, plus the two-word names that exercise the
    // kebab-casing the count above deliberately does not test.
    const css = themeCss();
    for (const name of [
      "--yl-text-body-lg-size",
      "--yl-text-hero-tracking",
      "--yl-motion-duration-slow",
      "--yl-motion-ease-emphasized",
      "--yl-motion-ease-decelerated",
      "--yl-color-interactive-border",
      "--yl-color-interactive-quiet-bg-hover",
      "--yl-color-status-error-solid",
      "--yl-color-fg-link-hover",
      "--yl-font-numeric",
      "--yl-container-lg",
    ]) {
      expect(css, name).toContain(`${name}:`);
    }
  });

  it("omits an optional axis rather than emitting undefined", () => {
    // `h3` has no `letterSpacing`. Emitting `--yl-text-h3-tracking: undefined` would override an
    // inherited value with a string the parser discards, which is worse than saying nothing.
    const css = themeCss();
    expect(css).not.toContain("undefined");
    expect(css).toContain("--yl-text-h1-tracking:");
    expect(css).not.toContain("--yl-text-h3-tracking:");
  });
});

describe("the SASS breakpoint map mirrors the tokens", () => {
  it("agrees with foundationTokens.breakpoints, so the copy stays a copy", () => {
    // A media query's condition is evaluated before any custom property has a value, so SASS
    // has to hold these numbers too. What it must not hold is a *different* set of numbers.
    const mixins = readFileSync(path.join(SRC, "styles", "_mixins.scss"), "utf8");
    const map = mixins.match(/\$breakpoints:\s*\(([^)]*)\)/)?.[1];
    expect(map, "the $breakpoints map moved or was renamed").toBeDefined();

    const fromSass = Object.fromEntries(
      map!
        .split(",")
        .map((pair) => pair.split(":").map((s) => s.trim()))
        .map(([k, v]) => [k, Number(v!.replace("px", ""))]),
    );
    expect(fromSass).toEqual(foundationTokens.breakpoints);
  });
});
