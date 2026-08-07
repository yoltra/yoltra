/**
 * The mission-control pipeline, asserted layer by layer: reducers commit synchronously,
 * the middleware gate vetoes before anything commits, and the effects complete each
 * maneuver on a timer the tests fast-forward.
 *
 * The store is built here from the same specs `store.ts` composes — reducers, guard,
 * effects — with one difference: a deterministic fleet instead of the randomized one,
 * because a test that depends on `Math.random()` is a coin, not a test.
 */

import { createStore } from "@yoltra/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { boostEffect, deployEffect, transmitEffect } from "../src/state/effects";
import { boostGuard } from "../src/state/middleware";
import { fleetReducer, missionReducer, INITIAL_MISSION } from "../src/state/reducers";
import type { AppEM, AppState, Satellite } from "../src/state/types";

const sat = (id: string, over: Partial<Satellite> = {}): Satellite => ({
  id,
  name: id,
  battery: 80,
  signal: 70,
  altitude: 500,
  dataQueued: 0,
  panelsDeployed: false,
  status: "idle",
  ...over,
});

function buildStore(satellites: Satellite[]) {
  return createStore<AppState, AppEM>({
    name: "mission-control-test",
    reducer: {
      fleet: { ...fleetReducer, state: { satellites } },
      mission: { ...missionReducer, state: { ...INITIAL_MISSION } },
    },
    middleware: [boostGuard],
    effects: [deployEffect, transmitEffect, boostEffect],
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("the fleet reducer", () => {
  it("patches exactly one satellite and leaves the others' references alone", async () => {
    const store = buildStore([sat("sat-0"), sat("sat-1"), sat("sat-2")]);
    const before = store.getState().fleet.satellites;

    await store.emit("telemetry", "drain", { id: "sat-1", amount: 30 });

    const after = store.getState().fleet.satellites;
    expect(after[1].battery).toBe(50);
    // The fine-grained story, stated as identity: untouched satellites are the same
    // objects, so no card but sat-1's has any reason to re-render.
    expect(after[0]).toBe(before[0]);
    expect(after[2]).toBe(before[2]);
    expect(after[1]).not.toBe(before[1]);
  });

  it("clamps telemetry at the physical bounds", async () => {
    const store = buildStore([sat("sat-0", { battery: 10 })]);

    await store.emit("telemetry", "drain", { id: "sat-0", amount: 200 });
    expect(store.getState().fleet.satellites[0].battery).toBe(0);

    await store.emit("telemetry", "signalShift", { id: "sat-0", value: 400 });
    expect(store.getState().fleet.satellites[0].signal).toBe(100);
  });

  it("ignores telemetry for a satellite that does not exist", async () => {
    const store = buildStore([sat("sat-0")]);
    const before = store.getState().fleet;

    await store.emit("telemetry", "drain", { id: "sat-9", amount: 30 });

    expect(store.getState().fleet).toBe(before);
  });
});

describe("the command pipeline", () => {
  it("commits a deploy synchronously and completes it from the effect", async () => {
    const store = buildStore([sat("sat-0", { battery: 90 })]);

    // `emit` resolves once the effects it started are done, and the deploy effect is
    // sitting on a 1.5s timer — so hold the promise, advance the clock, then await it.
    const emitted = store.emit("command", "deploy", { id: "sat-0" });
    await vi.advanceTimersByTimeAsync(0);
    expect(store.getState().fleet.satellites[0].status).toBe("deploying");
    expect(store.getState().fleet.satellites[0].panelsDeployed).toBe(false);

    await vi.advanceTimersByTimeAsync(1500);
    await emitted;

    const after = store.getState().fleet.satellites[0];
    expect(after.status).toBe("idle");
    expect(after.panelsDeployed).toBe(true);
    // +25 from the deployment, clamped at 100.
    expect(after.battery).toBe(100);
  });

  it("boosts, then raises the orbit when the effect lands", async () => {
    const store = buildStore([sat("sat-0", { battery: 50, altitude: 500 })]);

    const emitted = store.emit("command", "boost", { id: "sat-0" });
    await vi.advanceTimersByTimeAsync(0);
    expect(store.getState().fleet.satellites[0].status).toBe("boosting");
    expect(store.getState().fleet.satellites[0].battery).toBe(35);

    await vi.advanceTimersByTimeAsync(1000);
    await emitted;

    const after = store.getState().fleet.satellites[0];
    expect(after.status).toBe("idle");
    expect(after.altitude).toBe(540);
  });

  it("transmits and clears the buffer", async () => {
    const store = buildStore([sat("sat-0", { dataQueued: 42 })]);

    const emitted = store.emit("command", "transmit", { id: "sat-0" });
    await vi.advanceTimersByTimeAsync(0);
    expect(store.getState().fleet.satellites[0].status).toBe("transmitting");

    await vi.advanceTimersByTimeAsync(1200);
    await emitted;

    expect(store.getState().fleet.satellites[0].dataQueued).toBe(0);
    expect(store.getState().fleet.satellites[0].status).toBe("idle");
  });
});

describe("the boost guard", () => {
  it("vetoes a boost below 20% battery and raises the alert instead", async () => {
    const store = buildStore([sat("sat-0", { battery: 15, altitude: 500 })]);

    await store.emit("command", "boost", { id: "sat-0" });

    // The reducer never ran: no status change, no battery cost.
    const target = store.getState().fleet.satellites[0];
    expect(target.status).toBe("idle");
    expect(target.battery).toBe(15);

    // The guard answered with an alert on its own channel.
    const mission = store.getState().mission;
    expect(mission.alerts).toBe(1);
    expect(mission.lastAlert).toContain("LOW BATTERY");
    expect(mission.phase).toBe("caution");

    // And the vetoed command never reaches the effect: no boost completion later.
    await vi.advanceTimersByTimeAsync(5000);
    expect(store.getState().fleet.satellites[0].altitude).toBe(500);
  });
});

describe("the mission clock", () => {
  it("counts ticks", async () => {
    const store = buildStore([sat("sat-0")]);

    await store.emit("system", "tick", null);
    await store.emit("system", "tick", null);

    expect(store.getState().mission.tick).toBe(2);
  });
});
