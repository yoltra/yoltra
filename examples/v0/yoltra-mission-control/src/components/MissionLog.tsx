import { useCallback, useState } from "react";
import { Badge, Card, EmptyState, Heading, Inline, Stack, Text } from "@yoltra/ds";

import { useEvent } from "../state/store";

interface LogLine {
  key: number;
  type: string;
  target: string;
  blocked: boolean;
}

/**
 * The mission log, built on `useEvent`.
 *
 * `useEvent` subscribes to the **event stream** rather than to state. This component reads no
 * slice and holds no path subscription, so a battery ticking never wakes it — it wakes when a
 * command is emitted, which is exactly what a log wants.
 *
 * It is the right tool whenever the interface cares that something *happened* rather than what
 * the state now *is*: logs, toasts, sounds, analytics. Reconstructing that from state means
 * inventing a "last thing that happened" field and keeping it correct, which is a worse version
 * of the event stream already flowing past.
 *
 * The `"all"` phase is what makes this more than a list of successes. A command vetoed by the
 * safety middleware never reaches a reducer, so it leaves no trace in state at all — the only
 * place it exists is the event stream, as an *uncommitted* event. Try boosting a satellite
 * below 20% battery and watch it appear here, blocked.
 */
export function MissionLog() {
  const [lines, setLines] = useState<LogLine[]>([]);

  const record = useCallback((type: string, id: string, phase: "committed" | "uncommitted") => {
    setLines((previous) =>
      [
        { key: performance.now(), type, target: id, blocked: phase === "uncommitted" },
        ...previous,
      ].slice(0, 8),
    );
  }, []);

  // One subscription per command. The typed hook takes a literal `(channel, type)` pair, which
  // is what narrows `event.payload` to that event's shape rather than a union of all of them.
  useEvent("command", "boost", (event, _get, _emit, phase) => record("boost", event.payload.id, phase), "all");
  useEvent("command", "deploy", (event, _get, _emit, phase) => record("deploy", event.payload.id, phase), "all");
  useEvent(
    "command",
    "transmit",
    (event, _get, _emit, phase) => record("transmit", event.payload.id, phase),
    "all",
  );

  return (
    <Card padding={4} elevation="sm">
      <Stack gap={3}>
        <Inline justify="between">
          <Heading level={3} size="sm">
            Mission log
          </Heading>
          <Text size="xs" tone="muted">
            useEvent · no state subscription
          </Text>
        </Inline>

        {lines.length === 0 ? (
          <EmptyState
            icon="🛰"
            headingLevel={4}
            title="No commands yet"
            description="Send Boost, Deploy or Transmit from any satellite card."
          />
        ) : (
          <Stack gap={2} as="ul" className="mission-log__list">
            {lines.map((line) => (
              <Inline as="li" key={line.key} gap={2} justify="between">
                <Inline gap={2}>
                  <Badge variant={line.blocked ? "neutral" : "brand"}>{line.type}</Badge>
                  <Text size="sm" tone="secondary">
                    {line.target}
                  </Text>
                </Inline>
                <Text size="xs" tone={line.blocked ? "danger" : "muted"}>
                  {line.blocked ? "blocked by safety guard" : "committed"}
                </Text>
              </Inline>
            ))}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
