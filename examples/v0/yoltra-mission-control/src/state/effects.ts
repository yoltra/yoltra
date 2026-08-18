import { eventKeys, type DeepReadonly, type EffectSpec } from "@yoltra/core";

import type { AppEM, AppState } from "./types";

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Effects are the ASYNC layer of the pipeline. A command commits synchronously
 * (status → "deploying"), then its effect completes the maneuver a moment later
 * by emitting the follow-up event. The `meta` shows up in DevTools introspection.
 */
export const deployEffect: EffectSpec<DeepReadonly<AppState>, AppEM> = {
  when: { keys: eventKeys<AppEM>()([["command", "deploy"]]) },
  meta: { type: "effect", name: "deploySolarPanels", description: "Completes deployment after 1.5s" },
  effect: async (event, _getState, emit) => {
    if (event.channel !== "command" || event.type !== "deploy") return;
    await delay(1500);
    await emit("command", "deployed", { id: event.payload.id });
  },
};

export const transmitEffect: EffectSpec<DeepReadonly<AppState>, AppEM> = {
  when: { keys: eventKeys<AppEM>()([["command", "transmit"]]) },
  meta: { type: "effect", name: "transmitData", description: "Clears the data buffer after 1.2s" },
  effect: async (event, _getState, emit) => {
    if (event.channel !== "command" || event.type !== "transmit") return;
    await delay(1200);
    await emit("command", "transmitted", { id: event.payload.id });
  },
};

export const boostEffect: EffectSpec<DeepReadonly<AppState>, AppEM> = {
  when: { keys: eventKeys<AppEM>()([["command", "boost"]]) },
  meta: { type: "effect", name: "boostToHigherOrbit", description: "Raises altitude 1s after a boost commits" },
  effect: async (event, _getState, emit) => {
    if (event.channel !== "command" || event.type !== "boost") return;
    await delay(1000);
    await emit("command", "boosted", { id: event.payload.id });
  },
};

/**
 * The responder half of a `store.call()`.
 *
 * @remarks
 * An ordinary effect — which is the point. It answers by emitting through the `emit` it was
 * handed, so the store's causal stamp correlates the reply to the request and there is no
 * correlation id anywhere in this file.
 *
 * Each `await emit(...)` for a progress step is genuinely paced by whoever is iterating the
 * call: `emit` resolves only once its effects have run, and the call's collector is an effect
 * that does not return until the consumer has taken the step. Slow the UI down and this loop
 * slows with it, rather than filling a buffer.
 */
export const diagnosticsEffect: EffectSpec<DeepReadonly<AppState>, AppEM> = {
  when: { keys: eventKeys<AppEM>()([["diagnostics", "scan"]]) },
  meta: {
    type: "effect",
    name: "runDiagnostics",
    description: "Streams one scanStep per subsystem, then a terminal scanReport",
  },
  effect: async (event, getState, emit) => {
    if (event.channel !== "diagnostics" || event.type !== "scan") return;

    const { id } = event.payload;
    const sat = getState().fleet.satellites.find((s) => s.id === id);
    const subsystems = ["power", "antenna", "thermal", "attitude", "storage"] as const;
    const faults: string[] = [];

    for (const [index, subsystem] of subsystems.entries()) {
      await delay(220);

      // Faults are derived from real telemetry so the report is not theatre.
      const ok =
        subsystem === "power"
          ? (sat?.battery ?? 100) > 25
          : subsystem === "antenna"
            ? (sat?.signal ?? 100) > 30
            : subsystem === "storage"
              ? (sat?.dataQueued ?? 0) < 80
              : true;

      if (!ok) faults.push(subsystem);

      await emit("diagnostics", "scanStep", {
        subsystem,
        ok,
        index: index + 1,
        of: subsystems.length,
      });
    }

    await emit("diagnostics", "scanReport", { id, faults, checked: subsystems.length });
  },
};
