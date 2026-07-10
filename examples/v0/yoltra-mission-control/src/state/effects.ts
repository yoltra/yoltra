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
