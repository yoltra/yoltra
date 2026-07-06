import type { ReducerSpec } from "@yoltra/core";

import type { AppEM, FleetState, MissionState, Satellite } from "./types";

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

const NAMES = ["Aurora", "Borealis", "Cassini", "Drake", "Echo", "Fenix"];

export const INITIAL_FLEET: FleetState = {
  satellites: NAMES.map((name, i) => ({
    id: `sat-${i}`,
    name,
    battery: 68 + Math.round(Math.random() * 28),
    signal: 55 + Math.round(Math.random() * 40),
    altitude: 500 + i * 30,
    dataQueued: 0,
    panelsDeployed: false,
    status: "idle" as const,
  })),
};

export const INITIAL_MISSION: MissionState = {
  tick: 0,
  alerts: 0,
  lastAlert: "All systems nominal",
  phase: "nominal",
};

/**
 * Update exactly one satellite (a new array + one new object). The store's
 * change detection then reports only that satellite's changed leaf paths, so
 * only the matching card re-renders — this is the whole fine-grained story.
 */
function patchSat(state: FleetState, id: string, patch: Partial<Satellite>): FleetState {
  let touched = false;
  const satellites = state.satellites.map((s) => {
    if (s.id !== id) return s;
    touched = true;
    return { ...s, ...patch };
  });
  return touched ? { satellites } : state;
}

/** The `fleet` slice owns the telemetry + command channels. */
export const fleetReducer: ReducerSpec<FleetState, AppEM> = {
  when: { channels: ["telemetry", "command"] },
  state: INITIAL_FLEET,
  meta: { type: "reducer", name: "fleet", description: "Satellite telemetry + commands" },
  reducer: (state, event) => {
    const p = event.payload as { id: string; amount?: number; value?: number; mb?: number };
    const sat = state.satellites.find((s) => s.id === p.id);
    if (!sat) return state;

    switch (event.type) {
      case "drain":
        return patchSat(state, p.id, { battery: clamp(sat.battery - (p.amount ?? 0)) });
      case "signalShift":
        return patchSat(state, p.id, { signal: clamp(p.value ?? sat.signal) });
      case "collect":
        return patchSat(state, p.id, { dataQueued: sat.dataQueued + (p.mb ?? 0) });
      case "boost":
        return patchSat(state, p.id, { status: "boosting", battery: clamp(sat.battery - 15) });
      case "boosted":
        return patchSat(state, p.id, { status: "idle", altitude: sat.altitude + 40 });
      case "deploy":
        return patchSat(state, p.id, { status: "deploying" });
      case "deployed":
        return patchSat(state, p.id, {
          status: "idle",
          panelsDeployed: true,
          battery: clamp(sat.battery + 25),
        });
      case "transmit":
        return patchSat(state, p.id, { status: "transmitting" });
      case "transmitted":
        return patchSat(state, p.id, { status: "idle", dataQueued: 0 });
      default:
        return state;
    }
  },
};

/** The `mission` slice owns the system channel (clock + alerts). */
export const missionReducer: ReducerSpec<MissionState, AppEM> = {
  when: { channel: "system" },
  state: INITIAL_MISSION,
  meta: { type: "reducer", name: "mission", description: "Mission clock + alerts" },
  reducer: (state, event) => {
    switch (event.type) {
      case "tick":
        return { ...state, tick: state.tick + 1 };
      case "alert": {
        const { message } = event.payload as { message: string };
        return { ...state, alerts: state.alerts + 1, lastAlert: message, phase: "caution" };
      }
      default:
        return state;
    }
  },
};
