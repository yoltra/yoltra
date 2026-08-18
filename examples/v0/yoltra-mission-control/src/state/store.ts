import { withDevtools } from "@yoltra/devtools-browser-agent";
import { createLoopbackHub } from "@yoltra/devtools-ui";
import { createYoltra } from "@yoltra/react";

import { boostEffect, deployEffect, diagnosticsEffect, transmitEffect } from "./effects";
import { boostGuard } from "./middleware";
import { fleetReducer, missionReducer } from "./reducers";

/**
 * One in-memory loopback hub: the store agent, the hub, and the embedded panel
 * all talk over this single channel — no server, no ports, no browser extension.
 */
export const loopback = createLoopbackHub();

/**
 * One call → the store plus every typed hook. Two slices, a synchronous safety
 * middleware, three async effects, and replay enabled for time-travel.
 */
export const {
  store,
  useAtomicProp,
  useAtomicProps,
  useEmit,
  useEvent,
  useSuspenseAtomicProp,
} = createYoltra({
  name: "Orbital Mission Control",
  reducer: { fleet: fleetReducer, mission: missionReducer },
  middleware: [boostGuard],
  effects: [deployEffect, transmitEffect, boostEffect, diagnosticsEffect],
  devtools: { allowReplay: true },
});

/**
 * Commands are deduplicated by identity, not by content.
 *
 * A command button is easy to double-click, and each press would otherwise start a second
 * maneuver on a satellite already busy with the first. Passing a `dedupKey` collapses repeats
 * of the *same* command within a short window.
 *
 * Identity rather than the store-wide `dedupWindowMs`, which fingerprints
 * `(channel, type, payload)` and would also collapse genuinely distinct telemetry that
 * happened to carry the same numbers — two satellites draining by the same amount on the same
 * tick is normal, and losing one of those readings would be a real bug.
 *
 * Watch **dedup hits** climb in the panel's metrics while double-clicking a command.
 */
export const commandKey = (type: string, id: string): string => `${type}:${id}`;

// Stream every event into the loopback hub over the injected transport. The
// embedded <DevtoolsApp/> reads the same hub, so no WebSocket server is needed.
//
// Guarded like the other examples even though the transport is in-memory: the agent is a
// browser component, the panel it feeds only exists on the client, and an example that skips
// the guard because *this* transport happens to be harmless teaches the habit anyway.
if (typeof window !== "undefined") {
  withDevtools(store, {
    port: 0,
    allowReplay: true,
    allowEmit: true,
    socketFactory: loopback.agentSocketFactory,
  });
}
