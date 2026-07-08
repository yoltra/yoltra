import { withDevtools } from "@yoltra/devtools-browser-agent";
import { createYoltra } from "@yoltra/react";

import { todoFetchEffect } from "./effects/todo.effect";
import { rootReducer } from "./reducer";

/**
 * The Yoltra store plus every typed hook, created in one call.
 *
 * @remarks
 * - `createYoltra` collapses the store, the React context, `createHooks`, and
 *   the provider into a single call. The hooks default to this store, so a
 *   `<StoreProvider>` is optional.
 * - The event map is inferred from `rootReducer` (its `todoSpec` is typed
 *   `ReducerSpec<iTodoState, tAppEM>`).
 * - Async data-fetching lives in `todoFetchEffect` — effects are the async
 *   layer; middleware is synchronous.
 */
export const {
  store,
  StoreContext,
  StoreProvider,
  useStore,
  useEmit,
  useSelector,
  useAtomicProp,
  useAtomicProps,
  useEvent,
} = createYoltra({
  name: "Yoltra Store",
  reducer: rootReducer,
  effects: [todoFetchEffect],
  // Allow the core to apply externally-supplied state — required for the
  // DevTools Time Travel panel to rewind the store.
  devtools: { allowReplay: true },
});

// Instrument the store — streams events to the devtools hub on ws://localhost:9800.
// `allowReplay` makes the agent advertise the `replay` capability so the
// extension shows the Time Travel tab and can send TIME_TRAVEL commands.
withDevtools(store, { port: 9800, allowReplay: true });

/** Type of the store instance for use in annotations. */
export type tAppStore = typeof store;

export type { RootReducerState, tAppEM, tAppEM as AppEventMap } from "./types";
