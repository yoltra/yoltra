/**
 * Yoltra Design System — foundation tokens.
 *
 * A brand-anchored primitive scale (color, type, space, radius, elevation,
 * motion) shared by the website, docs, and examples. Adapted from the Yoltra
 * DevTools token set and decoupled from any editor/VS Code theming so it can
 * stand alone as the public design language.
 *
 * Brand: primary blue `#1A7FE2`, ink `#0F172A`. Type: Inter + JetBrains Mono.
 */

export type CSSLength = number | string;

export interface FontStyleToken {
  fontFamily: string;
  fontSize: CSSLength;
  fontWeight: number;
  lineHeight: number | string;
  letterSpacing?: CSSLength;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
}

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface PaletteTokens {
  primary: ColorScale;
  secondary: ColorScale;
  info: ColorScale;
  success: ColorScale;
  warning: ColorScale;
  error: ColorScale;
  neutral: ColorScale;
  white: string;
  black: string;
}

export interface FontTokens {
  family: { sans: string; mono: string };
  text: {
    hero: FontStyleToken;
    h1: FontStyleToken;
    h2: FontStyleToken;
    h3: FontStyleToken;
    h4: FontStyleToken;
    bodyLg: FontStyleToken;
    body: FontStyleToken;
    bodySm: FontStyleToken;
    label: FontStyleToken;
    button: FontStyleToken;
    caption: FontStyleToken;
    code: FontStyleToken;
  };
}

export interface FoundationTokens {
  font: FontTokens;
  palette: PaletteTokens;
  /** Mobile-first breakpoint scale (min-width, px). Layout is CSS-owned. */
  breakpoints: { sm: number; md: number; lg: number; xl: number };
  spacing: Record<number, number>;
  radius: {
    none: number;
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    "2xl": number;
    round: number;
  };
  elevation: Record<"none" | "xs" | "sm" | "md" | "lg" | "xl", { boxShadow: string }>;
  border: { width: { none: 0; thin: number; medium: number; thick: number } };
  motion: {
    duration: { fast: string; normal: string; slow: string };
    easing: { standard: string; emphasized: string; decelerated: string };
  };
}

const SANS = ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "sans-serif"].join(", ");
const MONO = ['"JetBrains Mono"', '"SFMono-Regular"', "Consolas", '"Liberation Mono"', "Menlo", "monospace"].join(", ");

export const foundationTokens: FoundationTokens = {
  font: {
    family: { sans: SANS, mono: MONO },
    text: {
      hero: { fontFamily: SANS, fontSize: 56, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em" },
      h1: { fontFamily: SANS, fontSize: 36, fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em" },
      h2: { fontFamily: SANS, fontSize: 26, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.01em" },
      h3: { fontFamily: SANS, fontSize: 20, fontWeight: 650, lineHeight: 1.3 },
      h4: { fontFamily: SANS, fontSize: 17, fontWeight: 600, lineHeight: 1.35 },
      bodyLg: { fontFamily: SANS, fontSize: 18, fontWeight: 400, lineHeight: 1.65 },
      body: { fontFamily: SANS, fontSize: 16, fontWeight: 400, lineHeight: 1.6 },
      bodySm: { fontFamily: SANS, fontSize: 14, fontWeight: 400, lineHeight: 1.5 },
      label: { fontFamily: SANS, fontSize: 13, fontWeight: 600, lineHeight: 1.3, letterSpacing: "0.01em" },
      button: { fontFamily: SANS, fontSize: 15, fontWeight: 600, lineHeight: 1.2 },
      caption: { fontFamily: SANS, fontSize: 12, fontWeight: 500, lineHeight: 1.3, letterSpacing: "0.02em" },
      code: { fontFamily: MONO, fontSize: 13.5, fontWeight: 500, lineHeight: 1.6 },
    },
  },

  palette: {
    primary: { 50: "#EFF6FF", 100: "#DBEBFF", 200: "#B8D8FF", 300: "#84BEFF", 400: "#4A9DFF", 500: "#1A7FE2", 600: "#116BC2", 700: "#0E5598", 800: "#10497D", 900: "#123F68" },
    secondary: { 50: "#F2F3FF", 100: "#E5E7FF", 200: "#CDD1FF", 300: "#A9AFFF", 400: "#7D83FF", 500: "#6369F1", 600: "#4D52D4", 700: "#3F43AC", 800: "#34388B", 900: "#2C306F" },
    info: { 50: "#EEF8FF", 100: "#D8F0FF", 200: "#B5E4FF", 300: "#7FD2FF", 400: "#42B8FF", 500: "#1796F2", 600: "#0E7BC8", 700: "#10629F", 800: "#13517F", 900: "#15466A" },
    success: { 50: "#ECFDF3", 100: "#D1FADF", 200: "#A6F4C5", 300: "#6CE9A6", 400: "#32D583", 500: "#12B76A", 600: "#039855", 700: "#027A48", 800: "#05603A", 900: "#054F31" },
    warning: { 50: "#FFFAEB", 100: "#FEF0C7", 200: "#FEDF89", 300: "#FEC84B", 400: "#FDB022", 500: "#F79009", 600: "#DC6803", 700: "#B54708", 800: "#93370D", 900: "#7A2E0E" },
    error: { 50: "#FEF3F2", 100: "#FEE4E2", 200: "#FECDCA", 300: "#FDA29B", 400: "#F97066", 500: "#F04438", 600: "#D92D20", 700: "#B42318", 800: "#912018", 900: "#7A271A" },
    neutral: { 50: "#F8FAFC", 100: "#F1F5F9", 200: "#E2E8F0", 300: "#CBD5E1", 400: "#94A3B8", 500: "#64748B", 600: "#475569", 700: "#334155", 800: "#1E293B", 900: "#0F172A" },
    white: "#FFFFFF",
    black: "#000000",
  },

  breakpoints: { sm: 480, md: 768, lg: 1024, xl: 1280 },

  spacing: { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64, 20: 80, 24: 96, 32: 128 },

  radius: { none: 0, xs: 4, sm: 6, md: 8, lg: 12, xl: 16, "2xl": 20, round: 9999 },

  elevation: {
    none: { boxShadow: "none" },
    xs: { boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)" },
    sm: { boxShadow: "0 2px 6px rgba(15, 23, 42, 0.08)" },
    md: { boxShadow: "0 6px 16px rgba(15, 23, 42, 0.12)" },
    lg: { boxShadow: "0 12px 24px rgba(15, 23, 42, 0.16)" },
    xl: { boxShadow: "0 18px 40px rgba(15, 23, 42, 0.22)" },
  },

  border: { width: { none: 0, thin: 1, medium: 2, thick: 3 } },

  motion: {
    duration: { fast: "120ms", normal: "180ms", slow: "260ms" },
    easing: {
      standard: "cubic-bezier(0.2, 0, 0, 1)",
      emphasized: "cubic-bezier(0.2, 0, 0, 1.2)",
      decelerated: "cubic-bezier(0, 0, 0, 1)",
    },
  },
};
