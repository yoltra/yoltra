/**
 * @module @yoltra/devtools-storeview
 */

import type { CSSProperties } from "react";

const COLORS: Record<string, string> = {
  connected: "var(--devtools-success)",
  connecting: "var(--devtools-warning)",
  disconnected: "var(--devtools-error)",
};

const dotStyle = (status: string): CSSProperties => ({
  display: "inline-block",
  width: 8,
  height: 8,
  borderRadius: "50%",
  backgroundColor: COLORS[status] ?? COLORS.disconnected,
  flexShrink: 0,
});

/**
 * Colored dot indicating connection status.
 *
 * Renders an 8px circular indicator whose color maps to the current
 * connection state: green for connected, yellow for connecting, and
 * red for disconnected.
 *
 * @param props.status - The connection status string (`"connected"`, `"connecting"`, or `"disconnected"`).
 * @public
 */
export function ConnectionDot({ status }: { status: string }) {
  return <span style={dotStyle(status)} title={status} />;
}
