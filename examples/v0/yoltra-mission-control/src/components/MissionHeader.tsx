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
    <header className="mission-header">
      <div className="brand">
        <span className="logo">◐</span>
        <div>
          <h1>Orbital Mission Control</h1>
          <p>Yoltra — event-sourced · fine-grained · live DevTools</p>
        </div>
      </div>

      <div className="mission-stats">
        <Stat label="Mission clock" value={`T+${tick}`} />
        <Stat label="Fleet battery" value={`${avgBattery}%`} tone={avgBattery < 40 ? "warn" : "ok"} />
        <Stat label="Alerts" value={String(alerts)} tone={alerts > 0 ? "warn" : "ok"} />
      </div>

      <div className={`last-alert${alerts > 0 ? " warn" : ""}`}>{lastAlert}</div>
    </header>
  );
}

function Stat({ label, value, tone = "ok" }: { label: string; value: string; tone?: "ok" | "warn" }) {
  return (
    <div className={`stat tone-${tone}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
