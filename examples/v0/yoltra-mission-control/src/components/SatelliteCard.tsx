import { useRef } from "react";

import { useAtomicProp, useEmit } from "../state/store";

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

  return (
    <div className={`sat-card${low ? " low" : ""}`}>
      <div className="sat-head">
        <span className="sat-name">{name}</span>
        {/* key changes each render → the CSS pulse re-triggers */}
        <span className="render-badge" key={renders.current} title="React renders of this card">
          {renders.current} renders
        </span>
      </div>

      <div className={`sat-status status-${status}`}>{STATUS_LABEL[status] ?? status}</div>

      <Gauge label="Battery" value={battery} tone={low ? "bad" : battery < 50 ? "warn" : "ok"} />
      <Gauge label="Signal" value={signal} tone={signal < 40 ? "warn" : "ok"} />

      <div className="sat-meta">
        <span>ALT {altitude} km</span>
        <span>DATA {dataQueued} MB</span>
        <span>{panelsDeployed ? "◧ panels" : "▫ stowed"}</span>
      </div>

      <div className="sat-actions">
        <button disabled={busy} onClick={() => void emit("command", "boost", { id })}>
          Boost
        </button>
        <button disabled={busy || panelsDeployed} onClick={() => void emit("command", "deploy", { id })}>
          Deploy
        </button>
        <button disabled={busy || dataQueued === 0} onClick={() => void emit("command", "transmit", { id })}>
          Transmit
        </button>
      </div>
    </div>
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
