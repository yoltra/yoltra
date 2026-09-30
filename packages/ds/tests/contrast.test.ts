import { describe, expect, it } from "vitest";

import { foundationTokens } from "../src/tokens/tokens";
import { darkTheme, lightTheme, type ThemeTokens } from "../src/tokens/themes";

/**
 * Contrast, as an assertion rather than an intention.
 *
 * @remarks
 * The brand blue shipped at 4.06:1 against white for four minor releases. Two separate
 * consumers measured it, filed it and shipped local overrides; nothing in this package noticed,
 * because nothing here had ever computed a ratio.
 *
 * jsdom applies no stylesheet and resolves no custom property, so an axe check running against
 * rendered components cannot see colour at all. That is not a gap this suite can close by
 * rendering harder: the values are the only thing available to a unit test, and the values are
 * enough, because a token pairing that fails here fails in every browser too.
 *
 * What this cannot check is which pairs a component actually uses. A stylesheet is free to put
 * `fg.muted` on `interactive.bg` and no assertion here would know. `styles.test.ts` pins that
 * every property a stylesheet reads exists; pinning that every *pairing* is sensible needs a
 * real browser, and is noted in the tracker rather than pretended at.
 */

const AA_TEXT = 4.5;
const AA_LARGE = 3;
/** WCAG 1.4.11, for a border or a control's fill: it has to be findable, not readable. */
const AA_NON_TEXT = 3;

function srgb(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function parse(colour: string): { r: number; g: number; b: number; a: number } {
  const rgba = colour.match(/rgba?\(([^)]+)\)/);
  if (rgba) {
    const [r, g, b, a = "1"] = rgba[1]!.split(",").map((s) => s.trim());
    return { r: Number(r), g: Number(g), b: Number(b), a: Number(a) };
  }
  const hex = colour.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return { r: r!, g: g!, b: b!, a: 1 };
}

/**
 * A colour as it actually renders, composited over what sits behind it.
 *
 * @remarks
 * Half the dark theme's surfaces are translucent. Measuring `rgba(23, 150, 242, 0.16)` as if it
 * were opaque would report a ratio no reader ever sees, which is a worse failure than not
 * measuring: it would pass while the real pairing failed.
 */
function flatten(colour: string, backdrop: string): { r: number; g: number; b: number } {
  const fg = parse(colour);
  if (fg.a === 1) return fg;
  const bg = flatten(backdrop, "#FFFFFF");
  const mix = (f: number, b: number) => Math.round(fg.a * f + (1 - fg.a) * b);
  return { r: mix(fg.r, bg.r), g: mix(fg.g, bg.g), b: mix(fg.b, bg.b) };
}

function luminance(colour: string, backdrop: string): number {
  const { r, g, b } = flatten(colour, backdrop);
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
}

/** Contrast ratio, with both colours resolved against the page behind them. */
function ratio(fg: string, bg: string, page: string): number {
  const a = luminance(fg, bg === "transparent" ? page : bg);
  const b = luminance(bg === "transparent" ? page : bg, page);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/** Every pairing a component can reasonably produce, named as a reader would describe it. */
function pairings(t: ThemeTokens) {
  const c = t.colors;
  const page = c.bg.canvas;
  const text: Array<[string, string, string]> = [
    ["fg.default on canvas", c.fg.default, c.bg.canvas],
    ["fg.default on subtle", c.fg.default, c.bg.subtle],
    ["fg.default on panel", c.fg.default, c.bg.panel],
    ["fg.default on elevated", c.fg.default, c.bg.elevated],
    ["fg.default on inset", c.fg.default, c.bg.inset],
    ["fg.secondary on canvas", c.fg.secondary, c.bg.canvas],
    ["fg.secondary on panel", c.fg.secondary, c.bg.panel],
    ["fg.muted on canvas", c.fg.muted, c.bg.canvas],
    ["fg.muted on panel", c.fg.muted, c.bg.panel],
    ["fg.brand on canvas", c.fg.brand, c.bg.canvas],
    ["fg.brand on panel", c.fg.brand, c.bg.panel],
    ["fg.link on canvas", c.fg.link, c.bg.canvas],
    ["fg.link on panel", c.fg.link, c.bg.panel],
    ["fg.linkHover on canvas", c.fg.linkHover, c.bg.canvas],
    ["fg.onInk on ink", c.fg.onInk, c.bg.ink],
    ["interactive label on its fill", c.interactive.fg, c.interactive.bg],
    ["interactive label on hover", c.interactive.fg, c.interactive.bgHover],
    ["interactive label on active", c.interactive.fg, c.interactive.bgActive],
    ["danger label on its fill", c.interactiveDanger.fg, c.interactiveDanger.bg],
    ["danger label on hover", c.interactiveDanger.fg, c.interactiveDanger.bgHover],
    ["danger label on active", c.interactiveDanger.fg, c.interactiveDanger.bgActive],
    ["quiet label on canvas", c.interactiveQuiet.fg, c.bg.canvas],
    ["quiet label on its hover", c.interactiveQuiet.fg, c.interactiveQuiet.bgHover],
    ["fg.inverse on interactive fill", c.fg.inverse, c.interactive.bg],
  ];
  for (const kind of ["info", "success", "warning", "error"] as const) {
    text.push([`status.${kind} label on its surface`, c.status[kind].fg, c.status[kind].bg]);
  }
  // Borders are deliberately absent except the focus ring. WCAG 1.4.11 covers a boundary that is
  // *required to identify a control*, which a focus ring is and a card's edge is not, and
  // `border.subtle` / `border.strong` are decorative at 1.2:1 and 1.45:1. Whether an input's
  // border needs to clear 3:1 is a real question, and it is a question about which pairing a
  // component chooses rather than about the tokens: it is recorded in the tracker, not asserted
  // here where a passing number would imply more than it proves.
  const nonText: Array<[string, string, string]> = [
    ["focus ring on canvas", c.border.focus, c.bg.canvas],
    ["focus ring on panel", c.border.focus, c.bg.panel],
    ["interactive fill on canvas", c.interactive.bg, c.bg.canvas],
    ["danger fill on canvas", c.interactiveDanger.bg, c.bg.canvas],
    // A switch knob's position *is* the state, so the knob has to be findable against both
    // tracks. It was `fg.inverse` on `border.strong`, which is 1.48:1 in the light theme: a white
    // dot on a pale grey groove. Using a text token as a knob background was the root error.
    ["switch knob on its resting track", c.bg.panel, c.interactive.track],
    ["switch knob on its checked track", c.bg.panel, c.interactive.bg],
    ["resting track against the page", c.interactive.track, c.bg.canvas],
  ];
  for (const kind of ["info", "success", "warning", "error"] as const) {
    nonText.push([`status.${kind} accent on canvas`, c.status[kind].solid, c.bg.canvas]);
  }
  return { page, text, nonText };
}

for (const theme of [lightTheme, darkTheme]) {
  describe(`the ${theme.id} theme`, () => {
    const { page, text, nonText } = pairings(theme);

    for (const [name, fg, bg] of text) {
      it(`clears AA for text: ${name}`, () => {
        const r = ratio(fg, bg, page);
        expect(r, `${name} is ${r.toFixed(2)}:1 (${fg} on ${bg})`).toBeGreaterThanOrEqual(AA_TEXT);
      });
    }

    for (const [name, fg, bg] of nonText) {
      it(`clears the non-text threshold: ${name}`, () => {
        const r = ratio(fg, bg, page);
        expect(r, `${name} is ${r.toFixed(2)}:1 (${fg} on ${bg})`).toBeGreaterThanOrEqual(AA_NON_TEXT);
      });
    }

    it("keeps the brand colour usable for display type, where it is allowed to be", () => {
      // `brand.primary` is the identity colour and is 4.06:1 on white in the light theme: fine
      // for a logo or a hero, and why `fg.brand` exists for everything smaller.
      const r = ratio(theme.colors.brand.primary, page, page);
      expect(r).toBeGreaterThanOrEqual(AA_LARGE);
    });

    it("leaves disabled text exempt rather than quietly darkening it", () => {
      // WCAG 1.4.3 has no contrast requirement for text in an inactive control. Raising this to
      // pass would make disabled copy look enabled, which is the opposite of the intent, so the
      // assertion is that it stays *below* the threshold and is therefore a deliberate choice.
      const r = ratio(theme.colors.fg.disabled, page, page);
      expect(r).toBeLessThan(AA_TEXT);
      expect(r).toBeGreaterThan(1.5);
    });
  });
}

describe("the accessible roles are a step off the brand, not a new colour", () => {
  it("draws fg.brand and the interactive fill from the palette", () => {
    const p = foundationTokens.palette.primary;
    // Inventing a colour to fix the contrast would have left the palette with a step nothing
    // used and a value nothing explained. 600 was already there and already passed.
    expect(lightTheme.colors.fg.brand).toBe(p[600]);
    expect(lightTheme.colors.interactive.bg).toBe(p[600]);
    expect(lightTheme.colors.brand.primary).toBe(p[500]);
  });
});
