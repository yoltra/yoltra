/**
 * @module @yoltra/devtools-cli
 */

import { Box, Text } from "ink";

import type { EventLogEntry } from "@yoltra/devtools-ui";

/**
 * Terminal time-travel view: position in the recorded history, and where it can move.
 *
 * @remarks
 * The graphical panel scrubs with a slider; a terminal has arrow keys, so the same navigation is
 * driven from the keyboard and this renders the state of it. Left and right step through the
 * log, `r` returns to live.
 *
 * @param props.entries - The recorded event log.
 * @param props.currentIndex - Index currently being viewed.
 * @param props.isTimeTraveling - Whether the store is pinned to a past point.
 * @param props.frameCount - Timeline length frozen at travel-start, so a live store cannot
 * shift the position under the reader.
 * @param props.canReplay - Whether the selected store advertises the replay capability.
 * @public
 */
export function TimeTravelPanel({
  entries,
  currentIndex,
  isTimeTraveling,
  frameCount,
  canReplay,
}: {
  entries: EventLogEntry[];
  currentIndex: number;
  isTimeTraveling: boolean;
  frameCount?: number | null;
  canReplay: boolean;
}) {
  if (!canReplay) {
    return (
      <Box paddingX={1}>
        <Text dimColor>
          This store did not advertise the replay capability, so it cannot be time-travelled.
          Enable it with {"createStore({ devtools: { allowReplay: true } })"}.
        </Text>
      </Box>
    );
  }

  const total = frameCount ?? entries.length;
  const position = isTimeTraveling ? currentIndex : total - 1;
  const entry = entries[position];

  if (total === 0) {
    return (
      <Box paddingX={1}>
        <Text dimColor>No events recorded yet.</Text>
      </Box>
    );
  }

  // A slider drawn in text: enough to see position at a glance without a mouse.
  const width = 40;
  const filled = total > 1 ? Math.round((position / (total - 1)) * (width - 1)) : 0;
  const track = `${"─".repeat(Math.max(0, filled))}●${"─".repeat(Math.max(0, width - filled - 1))}`;

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text color={isTimeTraveling ? "yellow" : "green"}>{track}</Text>
      <Box marginTop={1}>
        <Text>
          Event {position + 1} / {total}
          {entry ? (
            <Text color="cyan">
              {" — "}
              {entry.event.channel}.{entry.event.type}
            </Text>
          ) : null}
          {isTimeTraveling ? <Text color="yellow"> (time-travelling)</Text> : null}
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>← / → step · r resume live</Text>
      </Box>
    </Box>
  );
}
