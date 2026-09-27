/**
 * Semantic theme tokens, light and dark.
 *
 * @remarks
 * This is the layer components are allowed to read. It maps the primitives in `./tokens` onto
 * **intents** (a background, a foreground, an interactive surface), so a component says what a
 * colour is *for* and the theme decides what it *is*.
 *
 * Two rules keep it honest.
 *
 * **Every value derives from the palette.** Where a role needs transparency it uses
 * {@link alpha} on a palette step rather than an `rgba()` literal, because a hand-typed
 * `rgba(148, 163, 184, 0.16)` is `neutral[400]` said in a way no one can grep for. The dark
 * theme previously restated a dozen palette steps as literals, which made the palette a second
 * source of truth for exactly the theme nobody reviews as carefully.
 *
 * **No role is named after a component.** There is no `btn` or `code` here. A button reads
 * `interactive`, a code block reads the `ink` surface, and both roles stay meaningful for the
 * next component that needs them. Naming a global token after one component makes that
 * component's internals public API.
 *
 * **Both themes are built in functions, not assigned from literals.** Every value here reads a
 * palette ramp, and a member expression at module scope is something a bundler must assume could
 * invoke a getter. That made the two theme objects unconditional side effects, so an application
 * importing a single component shipped both themes and the whole palette: 6.3 KB where 0.3 KB was
 * needed. Inside a function body those reads are ordinary, and the annotated calls below are
 * droppable when nothing uses the result. The typical-import size budget is set thin enough to
 * catch it if this is ever undone.
 */
import { palette as p } from "./tokens";

/**
 * A palette step at partial opacity.
 *
 * @remarks
 * Keeps a translucent role traceable to the colour it came from. `alpha(p.neutral[400], 0.35)`
 * says which grey and how much of it; `rgba(148, 163, 184, 0.35)` says neither.
 *
 * @internal
 */
function alpha(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Two colours blended, as a hex literal.
 *
 * @remarks
 * The dark theme's surfaces used to be four hand-picked hexes, which made them the one part of
 * this file the palette did not explain. They are now mixed from the brand pair, carbon
 * `neutral[900]` and the deepest brand blue `primary[900]`, so "why is the panel this colour"
 * has an answer, and a brand change moves the whole theme instead of leaving it behind.
 *
 * Mixed at author time rather than with CSS `color-mix()`: these have to be plain values so the
 * contrast suite can measure them and a snapshot can record them.
 *
 * @internal
 */
function mix(from: string, to: string, ratio: number): string {
  const channels = (hex: string) =>
    [0, 2, 4].map((i) => parseInt(hex.replace("#", "").slice(i, i + 2), 16));
  const [a, b] = [channels(from), channels(to)];
  const out = a.map((v, i) => Math.round(v + (b[i]! - v) * ratio));
  return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

export interface SemanticColorTokens {
  /**
   * The brand colours, for identity rather than for text.
   *
   * @remarks
   * `primary` is `#1A7FE2`, which is 4.06:1 on white: enough for a logo or display type under
   * WCAG's large-text threshold, and **not** enough for body copy. Text that wants to look
   * branded reads `fg.brand`, which is a step darker and passes.
   */
  brand: { primary: string; secondary: string };
  /** Surfaces, from the page backwards. `ink` is the always-dark surface code sits on. */
  bg: { canvas: string; subtle: string; panel: string; elevated: string; inset: string; overlay: string; ink: string };
  /** Text and icons. `onInk` is for content on the `ink` surface, which does not flip with the theme. */
  fg: { default: string; secondary: string; muted: string; inverse: string; disabled: string; brand: string; link: string; linkHover: string; onInk: string };
  border: { subtle: string; strong: string; focus: string; divider: string; onInk: string };
  /**
   * The loud interactive surface: a primary button, a selected tab.
   *
   * @remarks
   * `track` is the *unfilled* part of a control, the groove a switch knob slides along or the
   * remainder of a progress bar. It is a role rather than a switch-local value because a slider
   * and a progress bar want the same surface, and it has to be dark enough that a pale knob is
   * visible against it: WCAG 1.4.11 treats a knob's position as the state indicator, so it needs
   * 3:1. A switch knob was previously `fg.inverse` on `border.strong`, which is 1.48:1.
   */
  interactive: { bg: string; bgHover: string; bgActive: string; fg: string; border: string; track: string };
  /**
   * The quiet interactive surface: a ghost button, a menu item, a dialog's close control.
   *
   * @remarks
   * Shared rather than owned by `Button`, because three components already reach for it. It was
   * called `ghost`, which named a button variant and left `Modal` and `Popover` borrowing a
   * button's internals.
   */
  interactiveQuiet: { bg: string; bgHover: string; bgActive: string; fg: string; border: string };
  /**
   * Feedback colours. `solid` is the accent on its own.
   *
   * @remarks
   * The `bg`/`fg`/`border` triad covers a filled callout and nothing else. Consumers that
   * wanted a bare accent to tint or to draw a rule with reached for `--yl-color-success` and
   * `--yl-color-danger`, neither of which existed, so both fell through to a hardcoded hex that
   * did not flip with the theme.
   */
  status: {
    info: { bg: string; fg: string; border: string; solid: string };
    success: { bg: string; fg: string; border: string; solid: string };
    warning: { bg: string; fg: string; border: string; solid: string };
    error: { bg: string; fg: string; border: string; solid: string };
  };
}

export interface ThemeTokens {
  id: "light" | "dark";
  colors: SemanticColorTokens;
}

/**
 * Built in a function rather than assigned from a literal, which is not a style choice.
 *
 * @remarks
 * Every value here reads a palette ramp, and a member expression at module scope is something a
 * bundler must assume could invoke a getter. That made both theme objects unconditional side
 * effects, so an application importing one component shipped both themes and the palette they
 * read. Inside a function body those reads are ordinary, and the annotated call below is
 * droppable when nothing uses the result.
 */
function buildLightTheme(): ThemeTokens {
  return {
    id: "light",
    colors: {
      brand: { primary: p.primary[500], secondary: p.secondary[400] },
      bg: {
        canvas: /*#__PURE__*/ mix(p.white, p.primary[50], 0.25),
        subtle: p.neutral[100],
        panel: p.white,
        elevated: p.white,
        inset: "#EEF3F8",
        overlay: /*#__PURE__*/ alpha(p.neutral[900], 0.42),
        ink: p.neutral[900],
      },
      fg: {
        default: p.neutral[900],
        secondary: p.neutral[700],
        muted: p.neutral[500],
        inverse: p.white,
        // No contrast minimum applies: WCAG 1.4.3 exempts text in an inactive control, and
        // darkening this until it passed would make disabled copy look enabled.
        disabled: p.neutral[400],
        // A step darker than `brand.primary`, which is the whole point: 5.38:1 on white against
        // the brand's 4.06:1. Brand-coloured *text* has to clear the text threshold.
        brand: p.primary[600],
        link: p.primary[600],
        linkHover: p.primary[700],
        onInk: "#E5EEF8",
      },
      border: {
        subtle: p.neutral[200],
        strong: p.neutral[300],
        focus: p.primary[600],
        divider: /*#__PURE__*/ alpha(p.neutral[400], 0.35),
        onInk: /*#__PURE__*/ alpha(p.neutral[400], 0.2),
      },
      // `primary[600]`, not `[500]`: white on `[500]` is 4.06:1, which fails for a button label.
      // On `[600]` it is 5.38:1, and the step already existed, so the palette did not need a new
      // colour invented for it.
      interactive: {
        bg: p.primary[600],
        bgHover: p.primary[700],
        bgActive: p.primary[800],
        fg: p.white,
        border: p.primary[700],
        // Mid-grey rather than a pale border colour, so a white knob reads against it: 4.76:1.
        track: p.neutral[500],
      },
      interactiveQuiet: {
        bg: "transparent",
        bgHover: /*#__PURE__*/ alpha(p.neutral[900], 0.05),
        bgActive: /*#__PURE__*/ alpha(p.neutral[900], 0.09),
        fg: p.neutral[900],
        border: /*#__PURE__*/ alpha(p.neutral[900], 0.12),
      },
      // `solid` is step 600, not 500. An accent that indicates state has to clear 3:1 against the
      // page under WCAG 1.4.11, and at 500 success is 2.55:1 and warning 2.29:1. One step covers
      // all four kinds, so none of them needs a special case.
      status: {
        info: { bg: p.info[50], fg: p.info[700], border: p.info[200], solid: p.info[600] },
        success: { bg: p.success[50], fg: p.success[700], border: p.success[200], solid: p.success[600] },
        warning: { bg: p.warning[50], fg: p.warning[800], border: p.warning[200], solid: p.warning[600] },
        error: { bg: p.error[50], fg: p.error[700], border: p.error[200], solid: p.error[600] },
      },
    },
  };
}

export const lightTheme: ThemeTokens = /*#__PURE__*/ buildLightTheme();

/** See {@link buildLightTheme} for why this is a function. */
function buildDarkTheme(): ThemeTokens {
  // Brand carbon with brand blue mixed into it, and the base every other dark surface steps
  // from. 16% is enough that the surface reads as blue-black rather than neutral grey, which is
  // what makes a dark Yoltra interface look like Yoltra, and little enough that text contrast is
  // unaffected.
  //
  // Declared here rather than at module scope on purpose: hoisted, its arguments are member
  // expressions a bundler cannot prove pure, and that one statement kept the whole palette in
  // every consumer's bundle.
  const DARK_BASE = mix(p.neutral[900], p.primary[900], 0.16);

  return {
    id: "dark",
    colors: {
      brand: { primary: p.primary[400], secondary: p.secondary[300] },
      // Every surface is `DARK_BASE` stepped toward black or toward `neutral[800]`, so the ramp is
      // one decision rather than five, and it is anchored on the brand rather than on taste.
      bg: {
        canvas: /*#__PURE__*/ mix(DARK_BASE, p.black, 0.34),
        subtle: /*#__PURE__*/ mix(DARK_BASE, p.black, 0.16),
        panel: DARK_BASE,
        elevated: /*#__PURE__*/ mix(DARK_BASE, p.neutral[800], 0.3),
        inset: /*#__PURE__*/ mix(DARK_BASE, p.black, 0.52),
        overlay: /*#__PURE__*/ alpha(/*#__PURE__*/ mix(DARK_BASE, p.black, 0.62), 0.66),
        ink: /*#__PURE__*/ mix(DARK_BASE, p.black, 0.52),
      },
      fg: {
        default: "#E5EEF8",
        secondary: "#B6C2D2",
        muted: "#8A9AAF",
        inverse: "#08111F",
        disabled: "#5E7088",
        brand: p.primary[400],
        link: p.primary[300],
        linkHover: p.primary[200],
        onInk: "#E5EEF8",
      },
      border: {
        subtle: /*#__PURE__*/ alpha(p.neutral[400], 0.16),
        strong: /*#__PURE__*/ alpha(p.neutral[400], 0.3),
        focus: p.primary[400],
        divider: /*#__PURE__*/ alpha(p.neutral[400], 0.18),
        onInk: /*#__PURE__*/ alpha(p.neutral[400], 0.18),
      },
      // Inverted from light on purpose. A dark fill on a dark canvas is 3.48:1 against its own
      // background and reads as disabled; a bright fill with an ink label is 6.74:1 both ways.
      interactive: {
        bg: p.primary[400],
        bgHover: p.primary[300],
        bgActive: p.primary[200],
        fg: "#0B1220",
        border: p.primary[300],
        // Light in the dark theme, because the knob here is dark. Both states keep the same knob.
        track: p.neutral[400],
      },
      interactiveQuiet: {
        bg: "transparent",
        bgHover: /*#__PURE__*/ alpha(p.neutral[200], 0.06),
        bgActive: /*#__PURE__*/ alpha(p.neutral[200], 0.1),
        fg: "#E5EEF8",
        border: /*#__PURE__*/ alpha(p.neutral[400], 0.28),
      },
      status: {
        info: { bg: /*#__PURE__*/ alpha(p.info[500], 0.16), fg: p.info[200], border: /*#__PURE__*/ alpha(p.info[400], 0.32), solid: p.info[400] },
        success: { bg: /*#__PURE__*/ alpha(p.success[500], 0.16), fg: p.success[200], border: /*#__PURE__*/ alpha(p.success[400], 0.3), solid: p.success[400] },
        warning: { bg: /*#__PURE__*/ alpha(p.warning[500], 0.16), fg: p.warning[200], border: /*#__PURE__*/ alpha(p.warning[400], 0.3), solid: p.warning[400] },
        error: { bg: /*#__PURE__*/ alpha(p.error[500], 0.16), fg: p.error[200], border: /*#__PURE__*/ alpha(p.error[400], 0.3), solid: p.error[400] },
      },
    },
  };
}

export const darkTheme: ThemeTokens = /*#__PURE__*/ buildDarkTheme();

export const themes = { light: lightTheme, dark: darkTheme } as const;
export type ThemeId = keyof typeof themes;
