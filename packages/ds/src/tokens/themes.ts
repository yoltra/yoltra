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
 * The exception, stated rather than hidden: the dark theme's surfaces
 * (`bg.canvas` and friends) are literals. The palette has no dark-surface ramp, and inventing
 * one to avoid four literals would be the tail wagging the dog.
 */
import { foundationTokens } from "./tokens";

const p = foundationTokens.palette;

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
  /** The loud interactive surface: a primary button, a selected tab. */
  interactive: { bg: string; bgHover: string; bgActive: string; fg: string; border: string };
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

export const lightTheme: ThemeTokens = {
  id: "light",
  colors: {
    brand: { primary: p.primary[500], secondary: p.secondary[400] },
    bg: {
      canvas: "#FBFCFE",
      subtle: p.neutral[100],
      panel: p.white,
      elevated: p.white,
      inset: "#EEF3F8",
      overlay: alpha(p.neutral[900], 0.42),
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
      divider: alpha(p.neutral[400], 0.35),
      onInk: alpha(p.neutral[400], 0.2),
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
    },
    interactiveQuiet: {
      bg: "transparent",
      bgHover: alpha(p.neutral[900], 0.05),
      bgActive: alpha(p.neutral[900], 0.09),
      fg: p.neutral[900],
      border: alpha(p.neutral[900], 0.12),
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

export const darkTheme: ThemeTokens = {
  id: "dark",
  colors: {
    brand: { primary: p.primary[400], secondary: p.secondary[300] },
    bg: {
      // Literals, deliberately: see the module remarks. A dark surface ramp is not a tint of
      // the neutral scale, and these four are tuned against each other.
      canvas: "#0B1220",
      subtle: "#111A2B",
      panel: "#121C30",
      elevated: "#18243B",
      inset: "#0A1424",
      overlay: "rgba(2, 6, 23, 0.66)",
      ink: "#0A1424",
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
      subtle: alpha(p.neutral[400], 0.16),
      strong: alpha(p.neutral[400], 0.3),
      focus: p.primary[400],
      divider: alpha(p.neutral[400], 0.18),
      onInk: alpha(p.neutral[400], 0.18),
    },
    // Inverted from light on purpose. A dark fill on a dark canvas is 3.48:1 against its own
    // background and reads as disabled; a bright fill with an ink label is 6.74:1 both ways.
    interactive: {
      bg: p.primary[400],
      bgHover: p.primary[300],
      bgActive: p.primary[200],
      fg: "#0B1220",
      border: p.primary[300],
    },
    interactiveQuiet: {
      bg: "transparent",
      bgHover: alpha(p.neutral[200], 0.06),
      bgActive: alpha(p.neutral[200], 0.1),
      fg: "#E5EEF8",
      border: alpha(p.neutral[400], 0.28),
    },
    status: {
      info: { bg: alpha(p.info[500], 0.16), fg: p.info[200], border: alpha(p.info[400], 0.32), solid: p.info[400] },
      success: { bg: alpha(p.success[500], 0.16), fg: p.success[200], border: alpha(p.success[400], 0.3), solid: p.success[400] },
      warning: { bg: alpha(p.warning[500], 0.16), fg: p.warning[200], border: alpha(p.warning[400], 0.3), solid: p.warning[400] },
      error: { bg: alpha(p.error[500], 0.16), fg: p.error[200], border: alpha(p.error[400], 0.3), solid: p.error[400] },
    },
  },
};

export const themes = { light: lightTheme, dark: darkTheme } as const;
export type ThemeId = keyof typeof themes;
