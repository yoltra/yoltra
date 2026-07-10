/**
 * @module @yoltra/devtools-cli
 */

import type { StoreMetrics } from "@yoltra/devtools-protocol";
import { Box, Text } from "ink";

type MetricsData = StoreMetrics["metrics"];

/**
 * Terminal metrics dashboard -- displays store performance stats.
 *
 * Renders a two-column label/value list of key performance indicators
 * such as events/sec, average processing time, queue depth,
 * deduplication hits, and component counts.
 *
 * @param props.metrics - The metrics data object, or `null`.
 * @param props.loading - Whether metrics are being fetched.
 * @public
 */
export function MetricsDashboard({
  metrics,
  loading,
}: {
  metrics: MetricsData | null;
  loading: boolean;
}) {
  if (loading && !metrics) {
    return (
      <Box paddingX={1}>
        <Text dimColor>Loading metrics...</Text>
      </Box>
    );
  }

  if (!metrics) {
    return (
      <Box paddingX={1}>
        <Text dimColor>No metrics available</Text>
      </Box>
    );
  }

  const rows: Array<[string, string]> = [
    ["Events/sec", metrics.eventsPerSecond.toFixed(1)],
    ["Total Events", String(metrics.eventCount)],
    ["Avg Processing", `${metrics.avgProcessingTimeMs.toFixed(2)}ms`],
    ["Queue Depth", String(metrics.queueDepth)],
    ["Dedup Hits", String(metrics.dedupHits)],
    ["MW Rejections", String(metrics.middlewareRejections)],
    ["Reducers", String(metrics.reducerCount)],
    ["Effects", String(metrics.effectCount)],
    ["Middleware", String(metrics.middlewareCount)],
    ["Subscribers", String(metrics.subscriberCount)],
    ["Connectors", String(metrics.connectorCount)],
  ];

  return (
    <Box flexDirection='column' paddingX={1}>
      {rows.map(([label, value]) => (
        <Box key={label} gap={1}>
          <Text dimColor>{label.padEnd(18)}</Text>
          <Text bold color='yellow'>
            {value}
          </Text>
        </Box>
      ))}
    </Box>
  );
}
