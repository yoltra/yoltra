/**
 * @module @yoltra/devtools-cli
 */

import type { StoreSubscriptions } from "@yoltra/devtools-protocol";
import { Box, Text } from "ink";

type SubscriptionData = Omit<
  StoreSubscriptions,
  "type" | "timestamp" | "sourceId" | "sourceRole" | "storeId"
>;

function formatWhen(when: unknown): string {
  if (!when || typeof when !== "object") return String(when);
  const w = when as Record<string, unknown>;
  if (w.any === true) return "any";
  if (w.channel) return `channel: ${w.channel}`;
  if (w.channels) return `channels: ${(w.channels as string[]).join(", ")}`;
  if (w.keys) return `keys: ${JSON.stringify(w.keys)}`;
  return JSON.stringify(when);
}

/**
 * Terminal subscriptions panel.
 *
 * Displays sectioned lists of atomic subscriptions, event subscriptions,
 * coarse subscribers, reducers, effects, and middleware for the
 * selected store in the terminal.
 *
 * @param props.data - Subscription data for the store, or `null`.
 * @param props.loading - Whether subscription data is being fetched.
 * @public
 */
export function SubscriptionsPanel({
  data,
  loading,
}: {
  data: SubscriptionData | null;
  loading: boolean;
}) {
  if (loading && !data) {
    return (
      <Box paddingX={1}>
        <Text dimColor>Loading subscriptions...</Text>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box paddingX={1}>
        <Text dimColor>No subscription data</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection='column' paddingX={1} gap={1}>
      <Box flexDirection='column'>
        <Text bold>Atomic Subscriptions ({data.atomic.length})</Text>
        {data.atomic.map((sub, i) => (
          <Text key={i}>
            {" "}
            <Text color='blue'>{sub.reducer}</Text>.{sub.property}
          </Text>
        ))}
        {data.atomic.length === 0 && <Text dimColor> None</Text>}
      </Box>

      <Box flexDirection='column'>
        <Text bold>Event Subscriptions ({data.event.length})</Text>
        {data.event.map((sub, i) => (
          <Text key={i}>
            {" "}
            <Text color='blue'>
              {sub.channel}::{sub.type}
            </Text>{" "}
            ({sub.phase})
          </Text>
        ))}
        {data.event.length === 0 && <Text dimColor> None</Text>}
      </Box>

      <Text bold>Coarse Subscribers: {data.coarse}</Text>

      <Box flexDirection='column'>
        <Text bold>Reducers ({data.reducers.length})</Text>
        {data.reducers.map((r, i) => (
          <Text key={i}>
            {" "}
            <Text color='blue'>{r.name}</Text>
          </Text>
        ))}
      </Box>

      <Box flexDirection='column'>
        <Text bold>Effects ({data.effects.length})</Text>
        {data.effects.map((e, i) => (
          <Text key={i}>
            {" "}
            <Text color='blue'>
              {e.channel}::{e.type}
            </Text>
            {e.name ? ` \u2014 ${e.name}` : ""}
            {e.description ? ` (${e.description})` : ""}
          </Text>
        ))}
        {data.effects.length === 0 && <Text dimColor> None</Text>}
      </Box>

      <Box flexDirection='column'>
        <Text bold>Middleware ({data.middleware.length})</Text>
        {data.middleware.map((m, i) => (
          <Text key={i}>
            {" "}
            <Text color='blue'>{m.name ?? `middleware-${i}`}</Text>
            {m.description ? ` \u2014 ${m.description}` : ""}
            {m.when ? <Text dimColor> [when: {formatWhen(m.when)}]</Text> : ""}
          </Text>
        ))}
        {data.middleware.length === 0 && <Text dimColor> None</Text>}
      </Box>
    </Box>
  );
}
