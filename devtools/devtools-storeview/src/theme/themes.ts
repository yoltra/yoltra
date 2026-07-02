import { foundationTokens, type ThemeTokens } from "./tokens";

const p = foundationTokens.palette;

export const lightTheme: ThemeTokens = {
  id: "light",
  font: foundationTokens.font,
  spacing: foundationTokens.spacing,
  radius: foundationTokens.radius,
  elevation: foundationTokens.elevation,
  border: foundationTokens.border,
  motion: foundationTokens.motion,
  colors: {
    brand: {
      primary: p.primary[500],
      secondary: p.secondary[400],
      info: p.info[500],
      success: p.success[500],
      warning: p.warning[500],
      error: p.error[500],
    },

    background: {
      canvas: "#F6F8FC",
      subtle: "#EEF3F8",
      panel: "#FFFFFF",
      elevated: "#FFFFFF",
      inset: "#EAF0F7",
      overlay: "rgba(15, 23, 42, 0.42)",
    },

    foreground: {
      primary: "#0F172A",
      secondary: "#334155",
      muted: "#64748B",
      inverse: "#FFFFFF",
      disabled: "#94A3B8",
      link: p.primary[600],
      linkHover: p.primary[700],
    },

    border: {
      subtle: "#E2E8F0",
      strong: "#CBD5E1",
      focus: p.primary[500],
      divider: "rgba(148, 163, 184, 0.35)",
    },

    interactive: {
      primary: {
        bg: p.primary[500],
        bgHover: p.primary[600],
        bgActive: p.primary[700],
        fg: "#FFFFFF",
        border: p.primary[600],
      },
      secondary: {
        bg: p.secondary[50],
        bgHover: p.secondary[100],
        bgActive: p.secondary[200],
        fg: p.secondary[700],
        border: p.secondary[200],
      },
      ghost: {
        bg: "transparent",
        bgHover: "rgba(15, 23, 42, 0.05)",
        bgActive: "rgba(15, 23, 42, 0.09)",
        fg: "#0F172A",
        border: "transparent",
      },
    },

    status: {
      info: {
        bg: p.info[50],
        fg: p.info[700],
        border: p.info[200],
      },
      success: {
        bg: p.success[50],
        fg: p.success[700],
        border: p.success[200],
      },
      warning: {
        bg: p.warning[50],
        fg: p.warning[800],
        border: p.warning[200],
      },
      error: {
        bg: p.error[50],
        fg: p.error[700],
        border: p.error[200],
      },
    },

    state: {
      hover: "rgba(15, 23, 42, 0.05)",
      active: "rgba(15, 23, 42, 0.08)",
      selected: "rgba(26, 127, 226, 0.12)",
      focusRing: "rgba(26, 127, 226, 0.35)",
      disabledBg: "#F1F5F9",
      disabledFg: "#94A3B8",
    },
  },
};

export const darkTheme: ThemeTokens = {
  id: "dark",
  font: foundationTokens.font,
  spacing: foundationTokens.spacing,
  radius: foundationTokens.radius,
  elevation: {
    none: {
      boxShadow: "none",
    },
    xs: {
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.35)",
    },
    sm: {
      boxShadow: "0 4px 10px rgba(0, 0, 0, 0.35)",
    },
    md: {
      boxShadow: "0 8px 18px rgba(0, 0, 0, 0.42)",
    },
    lg: {
      boxShadow: "0 14px 28px rgba(0, 0, 0, 0.48)",
    },
    xl: {
      boxShadow: "0 20px 44px rgba(0, 0, 0, 0.55)",
    },
  },
  border: foundationTokens.border,
  motion: foundationTokens.motion,
  colors: {
    brand: {
      primary: "#4A9DFF",
      secondary: "#A9AFFF",
      info: "#42B8FF",
      success: "#32D583",
      warning: "#FDB022",
      error: "#F97066",
    },

    background: {
      canvas: "#0B1220",
      subtle: "#111A2B",
      panel: "#121C30",
      elevated: "#18243B",
      inset: "#0A1424",
      overlay: "rgba(2, 6, 23, 0.66)",
    },

    foreground: {
      primary: "#E5EEF8",
      secondary: "#B6C2D2",
      muted: "#8A9AAF",
      inverse: "#08111F",
      disabled: "#5E7088",
      link: "#7FC0FF",
      linkHover: "#A9D8FF",
    },

    border: {
      subtle: "rgba(148, 163, 184, 0.16)",
      strong: "rgba(148, 163, 184, 0.3)",
      focus: "#4A9DFF",
      divider: "rgba(148, 163, 184, 0.18)",
    },

    interactive: {
      primary: {
        bg: "#1A7FE2",
        bgHover: "#4A9DFF",
        bgActive: "#84BEFF",
        fg: "#FFFFFF",
        border: "#4A9DFF",
      },
      secondary: {
        bg: "rgba(125, 131, 255, 0.16)",
        bgHover: "rgba(125, 131, 255, 0.24)",
        bgActive: "rgba(125, 131, 255, 0.34)",
        fg: "#D9DCFF",
        border: "rgba(125, 131, 255, 0.36)",
      },
      ghost: {
        bg: "transparent",
        bgHover: "rgba(226, 232, 240, 0.06)",
        bgActive: "rgba(226, 232, 240, 0.1)",
        fg: "#E5EEF8",
        border: "transparent",
      },
    },

    status: {
      info: {
        bg: "rgba(23, 150, 242, 0.16)",
        fg: "#A9E0FF",
        border: "rgba(66, 184, 255, 0.32)",
      },
      success: {
        bg: "rgba(18, 183, 106, 0.16)",
        fg: "#9DF0C7",
        border: "rgba(50, 213, 131, 0.3)",
      },
      warning: {
        bg: "rgba(247, 144, 9, 0.16)",
        fg: "#FFD58A",
        border: "rgba(253, 176, 34, 0.3)",
      },
      error: {
        bg: "rgba(240, 68, 56, 0.16)",
        fg: "#FFB4AE",
        border: "rgba(249, 112, 102, 0.3)",
      },
    },

    state: {
      hover: "rgba(226, 232, 240, 0.06)",
      active: "rgba(226, 232, 240, 0.1)",
      selected: "rgba(74, 157, 255, 0.2)",
      focusRing: "rgba(74, 157, 255, 0.4)",
      disabledBg: "#132033",
      disabledFg: "#5E7088",
    },
  },
};
