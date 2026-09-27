import { describe, expect, it } from "vitest";

import { compiledStyles } from "./support/styles";
import { themeCss } from "../src/tokens/css";
import { darkTheme, lightTheme, type ThemeTokens } from "../src/tokens/themes";

/**
 * Every colour a stylesheet sets, measured against the surface it actually lands on.
 *
 * @remarks
 * `contrast.test.ts` checks **token pairings**: that `fg.muted` works on `bg.canvas`. It cannot see
 * what a component does with them, and it says so in its own remarks. This suite closes that gap.
 * It reads the compiled CSS, resolves each `color` through the custom properties, walks up to find
 * the background the element is really sitting on, and computes the ratio.
 *
 * It exists because a defect got through: a switch knob at 1.48:1 that both suites above were
 * structurally blind to. Note that the knob still is not covered here, because it is a background
 * against a background rather than text on a surface, and it is asserted explicitly in
 * `contrast.test.ts` instead. Saying what a suite does not cover is the difference between a gate
 * and a comfort.
 *
 * Three things had to be right before this was worth committing, and a first attempt got all three
 * wrong and produced a dozen false failures:
 *
 * 1. **Translucent colours composite over what is behind them**, not over white. Measuring
 *    `rgba(23, 150, 242, 0.16)` as if it sat on a white page reports a ratio no reader ever sees,
 *    and in the dark theme it turns every translucent surface into a failure.
 * 2. **A backdrop has to come from the same state.** Pairing a resting `color` with a `:hover`
 *    background invents a combination that never renders.
 * 3. **Ancestry includes descendant selectors.** `.yl-code pre` sits on `.yl-code`'s ink surface;
 *    treating it as sitting on the page makes light text on dark look like a failure.
 */

const AA_TEXT = 4.5;

/**
 * Pairings with no contrast requirement, each with the reason.
 *
 * @remarks
 * WCAG 1.4.3 exempts text in an inactive control, and raising these until they passed would make
 * disabled copy look enabled. Listed by selector so the exemption is a decision somebody made
 * rather than a threshold quietly lowered.
 */
const EXEMPT: ReadonlyArray<{ selector: RegExp; why: string }> = [
  { selector: /:disabled/, why: "WCAG 1.4.3 exempts text in an inactive control" },
  { selector: /\[aria-disabled=.?true.?\]/, why: "the same exemption, expressed as an attribute" },
  { selector: /input:disabled/, why: "a label whose control is disabled" },
];

function srgb(c: number): number {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function parse(colour: string): { r: number; g: number; b: number; a: number } | null {
  const fn = colour.match(/rgba?\(([^)]+)\)/);
  if (fn) {
    const parts = fn[1]!.split(",").map((s) => Number(s.trim()));
    if (parts.some(Number.isNaN)) return null;
    return { r: parts[0]!, g: parts[1]!, b: parts[2]!, a: parts[3] ?? 1 };
  }
  const hex = colour.trim().match(/^#([0-9a-fA-F]{6})$/);
  if (!hex) return null;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex[1]!.slice(i, i + 2), 16));
  return { r: r!, g: g!, b: b!, a: 1 };
}

/** A colour as it renders, composited over the opaque surface beneath it. */
function over(colour: string, beneath: { r: number; g: number; b: number }) {
  const fg = parse(colour);
  if (fg === null) return null;
  if (fg.a === 1) return { r: fg.r, g: fg.g, b: fg.b };
  const mix = (f: number, b: number) => Math.round(fg.a * f + (1 - fg.a) * b);
  return { r: mix(fg.r, beneath.r), g: mix(fg.g, beneath.g), b: mix(fg.b, beneath.b) };
}

function luminance(c: { r: number; g: number; b: number }): number {
  return 0.2126 * srgb(c.r) + 0.7152 * srgb(c.g) + 0.0722 * srgb(c.b);
}

function ratio(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

/** `--name: value` pairs, first declaration winning, which is how the light block reads. */
function properties(css: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const [, name, value] of css.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    if (!out.has(name)) out.set(name, value.trim());
  }
  return out;
}

function resolve(value: string, props: Map<string, string>, depth = 0): string {
  if (depth > 10) return value;
  return value.replace(
    /var\((--[a-z0-9-]+)(?:\s*,\s*([^()]*(?:\([^()]*\)[^()]*)*))?\)/g,
    (whole, name: string, fallback?: string) => {
      const found = props.get(name);
      if (found !== undefined) return resolve(found, props, depth + 1);
      return fallback === undefined ? whole : resolve(fallback, props, depth + 1);
    },
  );
}

interface Rule {
  sheet: string;
  selector: string;
  colour?: string;
  background?: string;
}

const STATE = /:[a-z-]+(\([^)]*\))?|\[[^\]]*\]/g;
const base = (selector: string) => selector.replace(STATE, "").trim();
const state = (selector: string) => (selector.match(STATE) ?? []).join("");

/**
 * The selectors an element's backdrop can come from, innermost last.
 *
 * @remarks
 * Derived from the selector rather than the DOM, which works here because the stylesheets are
 * strict BEM: `.yl-code__head` is inside `.yl-code`. A descendant selector contributes its own
 * outer parts, which is the case a first attempt missed.
 */
function ancestry(selector: string): string[] {
  const parts = base(selector).split(/\s*[\s>+~]\s*/).filter(Boolean);
  const self = parts[parts.length - 1] ?? "";
  const outer = parts.slice(0, -1);
  const block = self.split("--")[0] ?? self;
  const chain = [...outer];
  if (block.includes("__")) chain.push(block.split("__")[0]!);
  chain.push(block);
  if (block !== self) chain.push(self);
  return chain;
}

function rulesOf(sheets: ReadonlyArray<{ name: string; css: string }>): Rule[] {
  const out: Rule[] = [];
  for (const { name, css } of sheets) {
    for (const [, selectors, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const colour = body.match(/(?:^|[;\s])color\s*:\s*([^;]+)/)?.[1]?.trim();
      const background = body.match(/(?:^|[;\s])background(?:-color)?\s*:\s*([^;]+)/)?.[1]?.trim();
      if (colour === undefined && background === undefined) continue;
      for (const selector of selectors.split(",")) {
        out.push({ sheet: name, selector: selector.trim().replace(/\s+/g, " "), colour, background });
      }
    }
  }
  return out;
}

function themeProperties(theme: ThemeTokens): Map<string, string> {
  const css = themeCss({ rootFontSize: false });
  const darkAt = css.indexOf(":root[data-theme='dark']");
  const light = properties(css.slice(0, darkAt));
  if (theme.id === "light") return light;
  const merged = new Map(light);
  for (const [k, v] of properties(css.slice(darkAt))) merged.set(k, v);
  return merged;
}

for (const theme of [lightTheme, darkTheme]) {
  describe(`what components pair, in the ${theme.id} theme`, () => {
    const sheets = compiledStyles();
    const rules = rulesOf(sheets);
    const page = parse(theme.colors.bg.canvas)!;

    /** The stack of layers under a selector, flattened to one opaque colour. */
    function backdrop(rule: Rule): { colour: { r: number; g: number; b: number }; from: string } {
      const own = state(rule.selector);
      let current = { r: page.r, g: page.g, b: page.b };
      let from = "the page";
      for (const candidate of ancestry(rule.selector)) {
        // Local properties live in the sheet that declares them, so resolution is per sheet.
        const props = new Map([
          ...themeProperties(theme),
          ...properties(sheets.find((s) => s.name === rule.sheet)!.css),
        ]);
        let best: { value: string; from: string } | null = null;
        for (const other of rules) {
          if (other.sheet !== rule.sheet || other.background === undefined) continue;
          if (base(other.selector) !== candidate) continue;
          const theirs = state(other.selector);
          if (theirs !== "" && theirs !== own) continue;
          const resolved = resolve(other.background, props);
          if (parse(resolved) === null) continue;
          if (best === null || theirs === own) best = { value: resolved, from: other.selector };
        }
        if (best === null) continue;
        const flattened = over(best.value, current);
        if (flattened === null) continue;
        current = flattened;
        from = best.from;
      }
      return { colour: current, from };
    }

    const checked = rules.filter((r) => r.colour !== undefined);

    it("finds colours to check, so a parsing change cannot make this vacuous", () => {
      expect(checked.length).toBeGreaterThan(20);
    });

    for (const rule of checked) {
      const exemption = EXEMPT.find((e) => e.selector.test(rule.selector));
      const props = new Map([
        ...themeProperties(theme),
        ...properties(sheets.find((s) => s.name === rule.sheet)!.css),
      ]);
      const resolved = resolve(rule.colour!, props);
      const parsed = parse(resolved);
      if (parsed === null) continue;

      const label = `${rule.sheet} ${rule.selector}`;
      if (exemption) {
        it(`exempts ${label}`, () => {
          // Asserted as exempt rather than skipped, so the reason stays visible.
          expect(exemption.why.length).toBeGreaterThan(0);
        });
        continue;
      }

      it(`clears AA: ${label}`, () => {
        const { colour, from } = backdrop(rule);
        const r = ratio(over(resolved, colour)!, colour);
        expect(
          r,
          `${rule.colour} resolves to ${resolved} on ${JSON.stringify(colour)} (from ${from}), ${r.toFixed(2)}:1`,
        ).toBeGreaterThanOrEqual(AA_TEXT);
      });
    }
  });
}
