import { createStore } from "../../../src/store/Store";
import type { ReducerSpec, MiddlewareFunction } from "../../../src/types";

export type AppState = {
  counter: { value: number };
};

export type AppEvents = {
  ui: {
    increment: number;
    decrement: number;
    dangerous: null;
    blocked: null;
  };
};

const reducerSpec: ReducerSpec<AppState["counter"], AppEvents> = {
  state: { value: 0 },
  events: [
    ["ui", "increment"],
    ["ui", "decrement"],
    ["ui", "dangerous"],
    ["ui", "blocked"],
  ],
  reducer(state, event) {
    if (event.channel === "ui" && event.type === "increment") {
      return { value: state.value + (event.payload as number) };
    }
    if (event.channel === "ui" && event.type === "decrement") {
      return { value: state.value - (event.payload as number) };
    }
    return state;
  },
};

/**
 * Creates a store without middleware (all events are committed).
 */
export function makeStore() {
  return createStore({
    name: "EventSubscriptionsStore",
    reducer: {
      counter: reducerSpec,
    },
  });
}

/**
 * Creates a store with middleware that blocks "blocked" and "dangerous" events.
 */
export function makeStoreWithBlockingMiddleware() {
  const blockingMiddleware: MiddlewareFunction<AppState, AppEvents> = (
    _state,
    event,
  ) => {
    if (event.type === "blocked" || event.type === "dangerous") {
      return false; // Reject the event
    }
    return true;
  };

  return createStore({
    name: "EventSubscriptionsStoreWithMiddleware",
    reducer: {
      counter: reducerSpec,
    },
    middleware: [blockingMiddleware],
  });
}
