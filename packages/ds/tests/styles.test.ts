import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as sass from "sass-embedded";

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

const SRC = path.resolve(__dirname, "..", "src");

/**
 * Compiles every stylesheet the package ships, once.
 *
 * @remarks
 * Memoized deliberately: sass compilation is the slow part of this file, and calling it per
 * assertion recompiled thirteen files each time — enough to time the suite out under a
 * parallel run.
 */
let compiled: Array<{ name: string; css: string }> | null = null;

function compiledStyles(): Array<{ name: string; css: string }> {
  return (compiled ??= compileAll());
}

function compileAll(): Array<{ name: string; css: string }> {
  const compile = (file: string) =>
    sass.compile(file, { loadPaths: [SRC], style: "expanded" }).css;

  // Both directories that hold component styles. Scanning only `primitives` would have left
  // the overlay tier — the one that leans hardest on tokens — unchecked.
  const dirs = ["primitives", "overlay"].map((d) => path.join(SRC, d));
  return [
    { name: "base.scss", css: compile(path.join(SRC, "styles", "base.scss")) },
    ...dirs.flatMap((dir) =>
      readdirSync(dir)
        .filter((f) => f.endsWith(".scss"))
        .map((f) => ({ name: f, css: compile(path.join(dir, f)) })),
    ),
  ];
}

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
    expect(css).toContain("--yl-bp-md: 768px;");
    expect(css).not.toMatch(/--yl-bp-[a-z]+: [\d.]+rem;/);
  });

  it("keeps hairline borders in pixels", () => {
    expect(css).toContain("--yl-border-thin: 1px;");
    expect(css).not.toMatch(/--yl-border-[a-z]+: [\d.]+rem;/);
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
