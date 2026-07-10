/**
 * Semantic theme tokens — light & dark. These map foundation primitives to
 * intent-based roles (background/foreground/border/interactive/status) so
 * components never reference raw palette steps directly.
 */
import { foundationTokens } from "./tokens";

const p = foundationTokens.palette;

export interface SemanticColorTokens {
  brand: { primary: string; secondary: string; info: string; success: string; warning: string; error: string };
  background: { canvas: string; subtle: string; panel: string; elevated: string; inset: string; overlay: string };
  foreground: { primary: string; secondary: string; muted: string; inverse: string; disabled: string; link: string; linkHover: string };
  border: { subtle: string; strong: string; focus: string; divider: string };
  interactive: {
    primary: { bg: string; bgHover: string; bgActive: string; fg: string; border: string };
    ghost: { bg: string; bgHover: string; bgActive: string; fg: string; border: string };
  };
  status: {
    info: { bg: string; fg: string; border: string };
    success: { bg: string; fg: string; border: string };
    warning: { bg: string; fg: string; border: string };
    error: { bg: string; fg: string; border: string };
  };
  code: { bg: string; fg: string; border: string };
}

export interface ThemeTokens {
  id: "light" | "dark";
  colors: SemanticColorTokens;
}

export const lightTheme: ThemeTokens = {
  id: "light",
  colors: {
    brand: { primary: p.primary[500], secondary: p.secondary[400], info: p.info[500], success: p.success[500], warning: p.warning[500], error: p.error[500] },
    background: { canvas: "#FBFCFE", subtle: "#F1F5F9", panel: "#FFFFFF", elevated: "#FFFFFF", inset: "#EEF3F8", overlay: "rgba(15, 23, 42, 0.42)" },
    foreground: { primary: "#0F172A", secondary: "#334155", muted: "#64748B", inverse: "#FFFFFF", disabled: "#94A3B8", link: p.primary[600], linkHover: p.primary[700] },
    border: { subtle: "#E2E8F0", strong: "#CBD5E1", focus: p.primary[500], divider: "rgba(148, 163, 184, 0.35)" },
    interactive: {
      primary: { bg: p.primary[500], bgHover: p.primary[600], bgActive: p.primary[700], fg: "#FFFFFF", border: p.primary[600] },
      ghost: { bg: "transparent", bgHover: "rgba(15, 23, 42, 0.05)", bgActive: "rgba(15, 23, 42, 0.09)", fg: "#0F172A", border: "rgba(15, 23, 42, 0.12)" },
    },
    status: {
      info: { bg: p.info[50], fg: p.info[700], border: p.info[200] },
      success: { bg: p.success[50], fg: p.success[700], border: p.success[200] },
      warning: { bg: p.warning[50], fg: p.warning[800], border: p.warning[200] },
      error: { bg: p.error[50], fg: p.error[700], border: p.error[200] },
    },
    code: { bg: "#0F172A", fg: "#E5EEF8", border: "rgba(148, 163, 184, 0.2)" },
  },
};

export const darkTheme: ThemeTokens = {
  id: "dark",
  colors: {
    brand: { primary: "#4A9DFF", secondary: "#A9AFFF", info: "#42B8FF", success: "#32D583", warning: "#FDB022", error: "#F97066" },
    background: { canvas: "#0B1220", subtle: "#111A2B", panel: "#121C30", elevated: "#18243B", inset: "#0A1424", overlay: "rgba(2, 6, 23, 0.66)" },
    foreground: { primary: "#E5EEF8", secondary: "#B6C2D2", muted: "#8A9AAF", inverse: "#08111F", disabled: "#5E7088", link: "#7FC0FF", linkHover: "#A9D8FF" },
    border: { subtle: "rgba(148, 163, 184, 0.16)", strong: "rgba(148, 163, 184, 0.3)", focus: "#4A9DFF", divider: "rgba(148, 163, 184, 0.18)" },
    interactive: {
      primary: { bg: "#1A7FE2", bgHover: "#4A9DFF", bgActive: "#84BEFF", fg: "#FFFFFF", border: "#4A9DFF" },
      ghost: { bg: "transparent", bgHover: "rgba(226, 232, 240, 0.06)", bgActive: "rgba(226, 232, 240, 0.1)", fg: "#E5EEF8", border: "rgba(148, 163, 184, 0.28)" },
    },
    status: {
      info: { bg: "rgba(23, 150, 242, 0.16)", fg: "#A9E0FF", border: "rgba(66, 184, 255, 0.32)" },
      success: { bg: "rgba(18, 183, 106, 0.16)", fg: "#9DF0C7", border: "rgba(50, 213, 131, 0.3)" },
      warning: { bg: "rgba(247, 144, 9, 0.16)", fg: "#FFD58A", border: "rgba(253, 176, 34, 0.3)" },
      error: { bg: "rgba(240, 68, 56, 0.16)", fg: "#FFB4AE", border: "rgba(249, 112, 102, 0.3)" },
    },
    code: { bg: "#0A1424", fg: "#E5EEF8", border: "rgba(148, 163, 184, 0.18)" },
  },
};

export const themes = { light: lightTheme, dark: darkTheme } as const;
export type ThemeId = keyof typeof themes;
