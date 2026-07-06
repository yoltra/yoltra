import { DevtoolsPanel } from "./components/DevtoolsPanel";
import { MissionHeader } from "./components/MissionHeader";
import { SatelliteGrid } from "./components/SatelliteGrid";
import { useMissionSimulator } from "./state/simulator";

export default function App() {
  useMissionSimulator();

  return (
    <div className="app">
      <section className="mission-pane">
        <MissionHeader />
        <p className="hint">
          Telemetry streams in on its own. Send <b>Boost</b> / <b>Deploy</b> / <b>Transmit</b>{" "}
          commands, then scrub the timeline in the panel to rewind the mission. Watch each card&rsquo;s{" "}
          <b>render counter</b>: only the satellite whose data changed re-renders — that is
          fine-grained reactivity, no selectors or memoization required.
        </p>
        <SatelliteGrid />
      </section>

      <DevtoolsPanel />
    </div>
  );
}
