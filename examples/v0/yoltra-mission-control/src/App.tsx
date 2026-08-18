import { useState } from "react";
import { Callout, Container, Inline, Kbd, Stack, Switch, Text } from "@yoltra/ds";

import { DevtoolsPanel } from "./components/DevtoolsPanel";
import { MissionHeader } from "./components/MissionHeader";
import { DiagnosticsPanel } from "./components/DiagnosticsPanel";
import { MissionLog } from "./components/MissionLog";
import { OrbitalForecast } from "./components/OrbitalForecast";
import { SatelliteGrid } from "./components/SatelliteGrid";
import { useMissionSimulator } from "./state/simulator";

export default function App() {
  // Live telemetry can be paused — do this before time-travelling in the panel
  // so the event timeline holds still while you scrub through history.
  const [running, setRunning] = useState(true);
  useMissionSimulator(running);

  return (
    <div className="app">
      <Container as="section" className="mission-pane">
        <Stack gap={5}>
          <MissionHeader />

          <Inline gap={4} justify="between" className="sim-controls">
            {/* A Switch rather than a Button: this is a setting that takes effect the moment
                it is flipped, and `role="switch"` is what makes a screen reader say so. */}
            <Switch
              id="telemetry"
              label={running ? "Telemetry live" : "Telemetry paused"}
              checked={running}
              onChange={(e) => setRunning(e.target.checked)}
            />
            <Text size="xs" tone="muted">
              Pause before scrubbing <Kbd>Time Travel</Kbd> in the panel
            </Text>
          </Inline>

          <Callout kind="info">
            <p>
              Telemetry streams in on its own. Send <b>Boost</b> / <b>Deploy</b> /{" "}
              <b>Transmit</b> commands, then scrub the timeline in the panel to rewind the
              mission. Watch each card&rsquo;s <b>render counter</b>: only the satellite whose
              data changed re-renders — that is fine-grained reactivity, no selectors or
              memoization required.
            </p>
            <p>
              <b>Run scan</b> in Diagnostics is a <code>store.call()</code> — one request, many
              replies. The panel iterates the call for each subsystem step and awaits it for the
              final report. Tick <b>slow render</b> and the responder slows down with it: its
              <code>await emit(...)</code> does not resolve until the UI has taken the step.
            </p>
            <p>
              Double-click a command and watch <b>dedup hits</b> climb in the panel&rsquo;s
              metrics: the second press carries the same <code>dedupKey</code> and is collapsed
              rather than starting a second maneuver.
            </p>
          </Callout>

          <Inline gap={4} align="stretch" className="mission-asides">
            <MissionLog />
            <OrbitalForecast />
          </Inline>

          <DiagnosticsPanel satelliteId="sat-1" />

          <SatelliteGrid />
        </Stack>
      </Container>

      <DevtoolsPanel />
    </div>
  );
}
