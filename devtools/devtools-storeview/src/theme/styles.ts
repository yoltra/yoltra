import type { CSSProperties } from "react";
import type { ThemeTokens } from "./tokens";

export interface AppStyles {
  app: CSSProperties;
  sidebar: CSSProperties;
  panel: CSSProperties;
  panelHeader: CSSProperties;
  sectionTitle: CSSProperties;
  text: CSSProperties;
  mutedText: CSSProperties;
  code: CSSProperties;
  row: CSSProperties;
  buttonPrimary: CSSProperties;
  buttonSecondary: CSSProperties;
  buttonGhost: CSSProperties;
  input: CSSProperties;
  badgeInfo: CSSProperties;
  badgeSuccess: CSSProperties;
  badgeWarning: CSSProperties;
  badgeError: CSSProperties;
  divider: CSSProperties;
}

export function createAppStyles(theme: ThemeTokens): AppStyles {
  return {
    app: {
      minHeight: "100vh",
      background: theme.colors.background.canvas,
      color: theme.colors.foreground.primary,
      fontFamily: theme.font.family.sans,
    },

    sidebar: {
      width: 280,
      background: theme.colors.background.panel,
      borderRight: `${theme.border.width.thin}px solid ${theme.colors.border.subtle}`,
      padding: theme.spacing[4],
    },

    panel: {
      background: theme.colors.background.panel,
      border: `${theme.border.width.thin}px solid ${theme.colors.border.subtle}`,
      borderRadius: theme.radius.lg,
      boxShadow: theme.elevation.sm.boxShadow,
      padding: theme.spacing[4],
    },

    panelHeader: {
      ...theme.font.text.h3,
      color: theme.colors.foreground.primary,
      margin: 0,
      marginBottom: theme.spacing[3],
    },

    sectionTitle: {
      ...theme.font.text.label,
      color: theme.colors.foreground.muted,
      textTransform: "uppercase",
      margin: 0,
      marginBottom: theme.spacing[2],
    },

    text: {
      ...theme.font.text.body,
      color: theme.colors.foreground.primary,
      margin: 0,
    },

    mutedText: {
      ...theme.font.text.bodySm,
      color: theme.colors.foreground.secondary,
      margin: 0,
    },

    code: {
      ...theme.font.text.code,
      color: theme.colors.foreground.primary,
      background: theme.colors.background.inset,
      border: `${theme.border.width.thin}px solid ${theme.colors.border.subtle}`,
      borderRadius: theme.radius.md,
      padding: `${theme.spacing[1]}px ${theme.spacing[2]}px`,
    },

    row: {
      display: "flex",
      alignItems: "center",
      gap: theme.spacing[2],
    },

    buttonPrimary: {
      ...theme.font.text.button,
      appearance: "none",
      border: `${theme.border.width.thin}px solid ${theme.colors.interactive.primary.border}`,
      background: theme.colors.interactive.primary.bg,
      color: theme.colors.interactive.primary.fg,
      borderRadius: theme.radius.md,
      padding: `${theme.spacing[2]}px ${theme.spacing[3]}px`,
      cursor: "pointer",
      transition: [
        `background ${theme.motion.duration.fast} ${theme.motion.easing.standard}`,
        `border-color ${theme.motion.duration.fast} ${theme.motion.easing.standard}`,
        `box-shadow ${theme.motion.duration.fast} ${theme.motion.easing.standard}`,
      ].join(", "),
    },

    buttonSecondary: {
      ...theme.font.text.button,
      appearance: "none",
      border: `${theme.border.width.thin}px solid ${theme.colors.interactive.secondary.border}`,
      background: theme.colors.interactive.secondary.bg,
      color: theme.colors.interactive.secondary.fg,
      borderRadius: theme.radius.md,
      padding: `${theme.spacing[2]}px ${theme.spacing[3]}px`,
      cursor: "pointer",
      transition: [
        `background ${theme.motion.duration.fast} ${theme.motion.easing.standard}`,
        `border-color ${theme.motion.duration.fast} ${theme.motion.easing.standard}`,
      ].join(", "),
    },

    buttonGhost: {
      ...theme.font.text.button,
      appearance: "none",
      border: `${theme.border.width.thin}px solid ${theme.colors.interactive.ghost.border}`,
      background: theme.colors.interactive.ghost.bg,
      color: theme.colors.interactive.ghost.fg,
      borderRadius: theme.radius.md,
      padding: `${theme.spacing[2]}px ${theme.spacing[3]}px`,
      cursor: "pointer",
      transition: [
        `background ${theme.motion.duration.fast} ${theme.motion.easing.standard}`,
        `color ${theme.motion.duration.fast} ${theme.motion.easing.standard}`,
      ].join(", "),
    },

    input: {
      ...theme.font.text.body,
      width: "100%",
      background: theme.colors.background.elevated,
      color: theme.colors.foreground.primary,
      border: `${theme.border.width.thin}px solid ${theme.colors.border.strong}`,
      borderRadius: theme.radius.md,
      padding: `${theme.spacing[2]}px ${theme.spacing[3]}px`,
      outline: "none",
    },

    badgeInfo: {
      ...theme.font.text.label,
      display: "inline-flex",
      alignItems: "center",
      gap: theme.spacing[1],
      background: theme.colors.status.info.bg,
      color: theme.colors.status.info.fg,
      border: `${theme.border.width.thin}px solid ${theme.colors.status.info.border}`,
      borderRadius: theme.radius.round,
      padding: `6px ${theme.spacing[2]}px`,
    },

    badgeSuccess: {
      ...theme.font.text.label,
      display: "inline-flex",
      alignItems: "center",
      gap: theme.spacing[1],
      background: theme.colors.status.success.bg,
      color: theme.colors.status.success.fg,
      border: `${theme.border.width.thin}px solid ${theme.colors.status.success.border}`,
      borderRadius: theme.radius.round,
      padding: `6px ${theme.spacing[2]}px`,
    },

    badgeWarning: {
      ...theme.font.text.label,
      display: "inline-flex",
      alignItems: "center",
      gap: theme.spacing[1],
      background: theme.colors.status.warning.bg,
      color: theme.colors.status.warning.fg,
      border: `${theme.border.width.thin}px solid ${theme.colors.status.warning.border}`,
      borderRadius: theme.radius.round,
      padding: `6px ${theme.spacing[2]}px`,
    },

    badgeError: {
      ...theme.font.text.label,
      display: "inline-flex",
      alignItems: "center",
      gap: theme.spacing[1],
      background: theme.colors.status.error.bg,
      color: theme.colors.status.error.fg,
      border: `${theme.border.width.thin}px solid ${theme.colors.status.error.border}`,
      borderRadius: theme.radius.round,
      padding: `6px ${theme.spacing[2]}px`,
    },

    divider: {
      height: 1,
      border: 0,
      background: theme.colors.border.divider,
      margin: `${theme.spacing[4]}px 0`,
    },
  };
}
