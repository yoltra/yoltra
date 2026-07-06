/**
 * Domain + event-map types for the Orbital Mission Control demo.
 *
 * The event map (`AppEM`) is what makes `emit` fully typed and what the DevTools
 * timeline groups events by: one entry per `channel.type`.
 */

export type SatStatus = "idle" | "boosting" | "deploying" | "transmitting";

export interface Satellite {
  id: string;
  name: string;
  /** 0–100 */
  battery: number;
  /** 0–100 */
  signal: number;
  /** kilometres */
  altitude: number;
  /** megabytes queued for transmission */
  dataQueued: number;
  panelsDeployed: boolean;
  status: SatStatus;
}

/** `fleet` reducer slice. */
export interface FleetState {
  satellites: Satellite[];
}

/** `mission` reducer slice. */
export interface MissionState {
  tick: number;
  alerts: number;
  lastAlert: string;
  phase: "nominal" | "caution";
}

/** Full app state — one field per reducer slice. */
export interface AppState {
  fleet: FleetState;
  mission: MissionState;
}

/**
 * Typed event map: channel → type → payload.
 *
 * NB: this must be a `type`, not an `interface`. `EventMapBase` is
 * `Record<string, …>`, and a TS interface has no implicit index signature, so
 * an interface would not satisfy that constraint.
 */
export type AppEM = {
  telemetry: {
    drain: { id: string; amount: number };
    signalShift: { id: string; value: number };
    collect: { id: string; mb: number };
  };
  command: {
    boost: { id: string };
    deploy: { id: string };
    transmit: { id: string };
    boosted: { id: string };
    deployed: { id: string };
    transmitted: { id: string };
  };
  system: {
    tick: null;
    alert: { message: string };
  };
}
