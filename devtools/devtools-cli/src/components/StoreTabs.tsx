/**
 * @module @yoltra/devtools-cli
 */

import type { RegisteredStore } from "@yoltra/devtools-ui";
import { Box, Text } from "ink";

const STATUS_SYMBOLS: Record<string, string> = {
  connected: "\u25CF",
  connecting: "\u25CB",
  disconnected: "\u25CB",
};

const STATUS_COLORS: Record<string, string> = {
  connected: "green",
  connecting: "yellow",
  disconnected: "red",
};

/**
 * Store tabs row at the top of the CLI.
 *
 * Renders a horizontal list of connected store names with color-coded
 * status symbols. The currently selected store is highlighted with
 * bold and underline styling.
 *
 * @param props.stores - Array of registered stores.
 * @param props.selectedIndex - Index of the currently selected store.
 * @public
 */
export function StoreTabs({
  stores,
  selectedIndex,
}: {
  stores: RegisteredStore[];
  selectedIndex: number;
}) {
  if (stores.length === 0) {
    return (
      <Box paddingX={1}>
        <Text dimColor>No stores connected</Text>
      </Box>
    );
  }

  return (
    <Box paddingX={1} gap={2}>
      {stores.map((store, i) => (
        <Box key={store.id} gap={1}>
          <Text color={STATUS_COLORS[store.status] ?? "red"}>
            {STATUS_SYMBOLS[store.status] ?? "\u25CB"}
          </Text>
          <Text bold={i === selectedIndex} underline={i === selectedIndex}>
            {store.name}
          </Text>
        </Box>
      ))}
    </Box>
  );
}
