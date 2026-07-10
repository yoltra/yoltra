import { withDevtools } from "@yoltra/devtools-browser-agent";
import { createLoopbackHub } from "@yoltra/devtools-ui";
import { createYoltra } from "@yoltra/react";

import { boostEffect, deployEffect, transmitEffect } from "./effects";
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
export const { store, useAtomicProp, useAtomicProps, useEmit, useEvent } = createYoltra({
  name: "Orbital Mission Control",
  reducer: { fleet: fleetReducer, mission: missionReducer },
  middleware: [boostGuard],
  effects: [deployEffect, transmitEffect, boostEffect],
  devtools: { allowReplay: true },
});

// Stream every event into the loopback hub over the injected transport. The
// embedded <DevtoolsApp/> reads the same hub, so no WebSocket server is needed.
withDevtools(store, {
  port: 0,
  allowReplay: true,
  allowEmit: true,
  socketFactory: loopback.agentSocketFactory,
});
