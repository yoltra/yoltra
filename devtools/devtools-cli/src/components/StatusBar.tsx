/**
 * @module @yoltra/devtools-cli
 */

import { PROTOCOL_VERSION } from "@yoltra/devtools-protocol";
import type { HubConnectionStatus } from "@yoltra/devtools-ui";
import { Box, Text } from "ink";

const STATUS_COLORS: Record<string, string> = {
  connected: "green",
  connecting: "yellow",
  disconnected: "red",
};

/**
 * Bottom status bar showing connection status and key hints.
 *
 * Displays the hub connection state with a color-coded label,
 * the devtools protocol version, and a keyboard shortcut reference
 * for terminal navigation.
 *
 * @param props.status - The current hub connection status.
 * @public
 */
export function StatusBar({ status }: { status: HubConnectionStatus }) {
  return (
    <Box
      borderStyle='single'
      borderTop
      borderBottom={false}
      borderLeft={false}
      borderRight={false}
      paddingX={1}
    >
      <Box flexGrow={1}>
        <Text>
          Hub: <Text color={STATUS_COLORS[status] ?? "red"}>{status}</Text>
          {" | "}Protocol v{PROTOCOL_VERSION}
        </Text>
      </Box>
      <Box>
        <Text dimColor>Tab: switch | []: store | r: refresh | q: quit</Text>
      </Box>
    </Box>
  );
}
