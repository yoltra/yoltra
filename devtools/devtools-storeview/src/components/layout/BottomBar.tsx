/**
 * @module @yoltra/devtools-storeview
 */

import { PROTOCOL_VERSION } from "@yoltra/devtools-protocol";
import type { HubConnectionStatus } from "@yoltra/devtools-ui";
import { ConnectionDot } from "../shared/ConnectionDot";

const containerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  height: "var(--devtools-bottombar-height)",
  background: "var(--devtools-bg-secondary)",
  borderTop: "1px solid var(--devtools-border)",
  padding: "0 var(--devtools-spacing-md)",
  fontSize: "var(--devtools-font-size-sm)",
  color: "var(--devtools-fg-muted)",
  flexShrink: 0,
};

/**
 * Bottom bar showing hub connection status and protocol version.
 *
 * Displays a {@link ConnectionDot} with the current hub status label
 * on the left and the devtools protocol version on the right.
 *
 * @param props.status - The hub connection status string.
 * @public
 */
export function BottomBar({ status }: { status: HubConnectionStatus }) {
  return (
    <footer style={containerStyle}>
      <span
        style={{ display: "flex", alignItems: "center", gap: "var(--devtools-spacing-sm)" }}
      >
        <ConnectionDot status={status} />
        Hub: {status}
      </span>
      <span>Protocol v{PROTOCOL_VERSION}</span>
    </footer>
  );
}
