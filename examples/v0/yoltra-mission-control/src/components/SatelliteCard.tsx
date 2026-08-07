import { useRef } from "react";
import { Badge, Button, ButtonGroup, Card, Divider, Inline, Stack, Text } from "@yoltra/ds";

import { commandKey, useAtomicProp, useEmit } from "../state/store";

const STATUS_LABEL: Record<string, string> = {
  idle: "IDLE",
  boosting: "BOOSTING",
  deploying: "DEPLOYING",
  transmitting: "TRANSMIT",
};

/**
 * A single satellite card. Every field is a **typed-path** subscription, so this
 * component re-renders ONLY when one of its own satellite's leaves changes —
 * never when another satellite updates. The render counter makes that visible.
 *
 * The chrome is `@yoltra/ds`: a `Card` for the surface, `Stack` and `Inline` for spacing from
 * the scale, `Button` and `ButtonGroup` for the commands. What stays bespoke is the telemetry
 * itself — the gauges and status colours — because a design system should not have opinions
 * about what a satellite's battery looks like.
 */
export function SatelliteCard({ index, id, name }: { index: number; id: string; name: string }) {
  const battery = useAtomicProp("fleet", (p) => p.satellites[index].battery);
  const signal = useAtomicProp("fleet", (p) => p.satellites[index].signal);
  const altitude = useAtomicProp("fleet", (p) => p.satellites[index].altitude);
  const dataQueued = useAtomicProp("fleet", (p) => p.satellites[index].dataQueued);
  const status = useAtomicProp("fleet", (p) => p.satellites[index].status);
  const panelsDeployed = useAtomicProp("fleet", (p) => p.satellites[index].panelsDeployed);

  const emit = useEmit();
  const renders = useRef(0);
  renders.current += 1;

  const busy = status !== "idle";
  const low = battery < 20;

  /**
   * Commands carry a `dedupKey`, so a double-clicked button is one command rather than two.
   * Identity dedup rather than the store-wide content window, which would also collapse
   * telemetry that legitimately repeats.
   */
  const command = (type: "boost" | "deploy" | "transmit") => () =>
    void emit("command", type, { id }, { dedupKey: commandKey(type, id) });

  return (
    <Card padding={4} elevation="sm" className={`sat-card${low ? " low" : ""}`}>
      <Stack gap={3}>
        <Inline justify="between">
          <Text weight="bold">{name}</Text>
          {/* key changes each render → the CSS pulse re-triggers */}
          <span className="render-badge" key={renders.current} title="React renders of this card">
            {renders.current} renders
          </span>
        </Inline>

        <div className={`sat-status status-${status}`}>{STATUS_LABEL[status] ?? status}</div>

        <Stack gap={2}>
          <Gauge label="Battery" value={battery} tone={low ? "bad" : battery < 50 ? "warn" : "ok"} />
          <Gauge label="Signal" value={signal} tone={signal < 40 ? "warn" : "ok"} />
        </Stack>

        <Divider />

        <Inline gap={2} justify="between">
          <Text size="xs" tone="muted">
            ALT {altitude} km
          </Text>
          <Text size="xs" tone="muted">
            DATA {dataQueued} MB
          </Text>
          <Badge variant={panelsDeployed ? "brand" : "neutral"}>
            {panelsDeployed ? "panels out" : "stowed"}
          </Badge>
        </Inline>

        <ButtonGroup label={`${name} commands`}>
          <Button variant="ghost" size="sm" disabled={busy} onClick={command("boost")}>
            Boost
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={busy || panelsDeployed}
            onClick={command("deploy")}
          >
            Deploy
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={busy || dataQueued === 0}
            onClick={command("transmit")}
          >
            Transmit
          </Button>
        </ButtonGroup>
      </Stack>
    </Card>
  );
}

function Gauge({ label, value, tone }: { label: string; value: number; tone: "ok" | "warn" | "bad" }) {
  return (
    <div className="gauge">
      <div className="gauge-label">
        <span>{label}</span>
        <span>{Math.round(value)}%</span>
      </div>
      <div className="gauge-track">
        <div
          className={`gauge-fill tone-${tone}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}
