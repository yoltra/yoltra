/**
 * @module @yoltra/devtools-cli
 */

import type { EventLogEntry } from "@yoltra/devtools-ui";
import { Box, Text } from "ink";

/**
 * Terminal event timeline -- shows the last N events.
 *
 * Renders a scrollable table of event log entries in the terminal,
 * showing committed/bounced status, channel, type, and a truncated
 * payload preview. Limits display to the most recent `maxVisible` entries.
 *
 * @param props.entries - The full array of event log entries.
 * @param props.maxVisible - Maximum number of entries shown at once (default 20).
 * @public
 */
export function EventTimeline({
  entries,
  maxVisible = 20,
}: {
  entries: EventLogEntry[];
  maxVisible?: number;
}) {
  const visible = entries.slice(-maxVisible);

  if (visible.length === 0) {
    return (
      <Box paddingX={1} paddingY={1}>
        <Text dimColor>No events recorded</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection='column' paddingX={1}>
      <Box gap={2} marginBottom={1}>
        <Text bold dimColor>
          {"  "}
        </Text>
        <Text bold dimColor>
          {"Channel".padEnd(15)}
        </Text>
        <Text bold dimColor>
          {"Type".padEnd(20)}
        </Text>
        <Text bold dimColor>
          Payload
        </Text>
      </Box>
      {visible.map((entry, i) => (
        <Box key={`${entry.event.id}-${i}`} gap={2}>
          <Text color={entry.committed ? "green" : "red"}>
            {entry.committed ? "\u25CF" : "\u25CB"}
          </Text>
          <Text color='blue'>{entry.event.channel.padEnd(15)}</Text>
          <Text>{entry.event.type.padEnd(20)}</Text>
          <Text dimColor>
            {entry.event.payload != null
              ? JSON.stringify(entry.event.payload).slice(0, 50)
              : "\u2014"}
          </Text>
        </Box>
      ))}
      {entries.length > maxVisible && (
        <Text dimColor>... {entries.length - maxVisible} more events</Text>
      )}
    </Box>
  );
}
