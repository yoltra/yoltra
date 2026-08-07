import { Badge, Card, Heading, Inline, Stack, Text } from "@yoltra/ds";

import { useAtomicProp, useAtomicProps } from "../state/store";

export function MissionHeader() {
  // Single-path subscriptions to the `mission` slice.
  const tick = useAtomicProp("mission", (p) => p.tick);
  const alerts = useAtomicProp("mission", (p) => p.alerts);
  const lastAlert = useAtomicProp("mission", (p) => p.lastAlert);

  // A WILDCARD subscription: recompute the fleet's average battery whenever ANY
  // satellite battery changes (`satellites.**` matches every leaf beneath it).
  const avgBattery = useAtomicProps(
    [{ reducer: "fleet", property: "satellites.**" }],
    (s) => {
      const sats = s.fleet.satellites;
      return Math.round(sats.reduce((a, x) => a + x.battery, 0) / sats.length);
    },
  );

  return (
    <Stack gap={4} as="header" className="mission-header">
      <Inline gap={4} justify="between">
        <Inline gap={3}>
          <img className="logo" src="/logo.svg" width={34} height={34} alt="Yoltra" />
          <Stack gap={2}>
            <Heading level={1} size="lg">
              Orbital Mission Control
            </Heading>
            <Inline gap={2}>
              <Badge variant="brand">Yoltra</Badge>
              <Badge>event-sourced</Badge>
              <Badge>fine-grained</Badge>
              <Badge>live DevTools</Badge>
            </Inline>
          </Stack>
        </Inline>

        <Inline gap={3}>
          <Stat label="Mission clock" value={`T+${tick}`} />
          <Stat label="Fleet battery" value={`${avgBattery}%`} warn={avgBattery < 40} />
          <Stat label="Alerts" value={String(alerts)} warn={alerts > 0} />
        </Inline>
      </Inline>

      <Text size="sm" tone={alerts > 0 ? "danger" : "muted"}>
        {lastAlert}
      </Text>
    </Stack>
  );
}

/**
 * A single figure with its label.
 *
 * Built here rather than imported: the design system has no `Stat`, and a component this
 * specific to one dashboard is not obviously the design system's business. It is a `Card`
 * with a `Stack` inside, which is the point — the primitives compose into the thing the
 * application needs without the design system having to anticipate it.
 */
function Stat({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <Card padding={3} elevation="none" className="stat">
      <Stack gap={1}>
        <Text size="lg" weight="bold" tone={warn ? "danger" : "default"}>
          {value}
        </Text>
        <Text size="xs" tone="muted">
          {label}
        </Text>
      </Stack>
    </Card>
  );
}
