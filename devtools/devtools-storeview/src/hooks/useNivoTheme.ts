/**
 * @module @yoltra/devtools-storeview
 */

import type { Theme } from "@nivo/core";
import { useMemo } from "react";

/**
 * Reads the active devtools CSS custom properties from the document root
 * and returns a Nivo {@link Theme} object styled for the dark devtools palette.
 *
 * @remarks
 * Memoised on an empty dependency array — the theme is computed once on
 * mount. The values are read from `getComputedStyle(document.documentElement)`
 * at render time so they pick up any overrides set by the VS Code extension.
 *
 * @public
 */
export function useNivoTheme(): Theme {
  return useMemo(() => {
    const s = getComputedStyle(document.documentElement);
    const v = (name: string) => s.getPropertyValue(name).trim();
    return {
      background: v("--devtools-bg"),
      text: {
        fill: v("--devtools-fg"),
        fontSize: 11,
        fontFamily: v("--devtools-font-mono"),
      },
      grid: {
        line: { stroke: v("--devtools-border"), strokeWidth: 1 },
      },
      axis: {
        ticks: {
          text: { fill: v("--devtools-fg-secondary"), fontSize: 10 },
          line: { stroke: v("--devtools-border"), strokeWidth: 1 },
        },
        legend: {
          text: { fill: v("--devtools-fg-muted"), fontSize: 11 },
        },
        domain: {
          line: { stroke: v("--devtools-border"), strokeWidth: 1 },
        },
      },
      tooltip: {
        container: {
          background: v("--devtools-bg-secondary"),
          color: v("--devtools-fg"),
          border: `1px solid ${v("--devtools-border")}`,
          borderRadius: "3px",
          fontSize: 11,
          fontFamily: v("--devtools-font-mono"),
          padding: "6px 10px",
        },
      },
      legends: {
        text: { fill: v("--devtools-fg-secondary"), fontSize: 10 },
      },
      labels: {
        text: { fill: v("--devtools-fg"), fontSize: 11 },
      },
    };
  }, []);
}
