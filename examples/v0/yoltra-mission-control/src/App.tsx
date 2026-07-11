import { useState } from "react";
import { Callout } from "@yoltra/ds";

import { DevtoolsPanel } from "./components/DevtoolsPanel";
import { MissionHeader } from "./components/MissionHeader";
import { SatelliteGrid } from "./components/SatelliteGrid";
import { useMissionSimulator } from "./state/simulator";

export default function App() {
  // Live telemetry can be paused — do this before time-travelling in the panel
  // so the event timeline holds still while you scrub through history.
  const [running, setRunning] = useState(true);
  useMissionSimulator(running);

  return (
    <div className="app">
      <section className="mission-pane">
        <MissionHeader />

        <div className="sim-controls">
          <button
            className={`sim-toggle${running ? "" : " paused"}`}
            onClick={() => setRunning((r) => !r)}
          >
            {running ? "❚❚ Pause telemetry" : "▶ Resume telemetry"}
          </button>
          <span className={`sim-status ${running ? "live" : "paused"}`}>
            {running ? "● LIVE" : "❚❚ PAUSED"}
          </span>
          <span className="sim-hint">
            Pause before scrubbing <b>Time Travel</b> in the panel →
          </span>
        </div>

        <Callout kind="info">
          <p>
            Telemetry streams in on its own. Send <b>Boost</b> / <b>Deploy</b> / <b>Transmit</b>{" "}
            commands, then scrub the timeline in the panel to rewind the mission. Watch each
            card&rsquo;s <b>render counter</b>: only the satellite whose data changed re-renders —
            that is fine-grained reactivity, no selectors or memoization required.
          </p>
        </Callout>
        <SatelliteGrid />
      </section>

      <DevtoolsPanel />
    </div>
  );
}
