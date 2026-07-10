import { createStore } from "../../../src/store/Store";
import type { ReducerSpec } from "../../../src/types";

export type AppState = {
  counter: { value: number };
};

export type AppEvents = {
  ui: {
    increment: number;
    dangerous: null;
  };
};

export const reducerSpec: ReducerSpec<AppState["counter"], AppEvents> = {
  state: { value: 0 },
  events: [
    ["ui", "increment"],
    ["ui", "dangerous"],
  ],
  reducer(state, event) {
    if (event.channel === "ui" && event.type === "increment") {
      return { value: state.value + (event.payload as number) };
    }
    return state;
  },
};

export function makeStore() {
  const store = createStore({
    name: "MiddlewareEffectsStore",
    reducer: {
      counter: reducerSpec,
    },
  });

  return store;
}
