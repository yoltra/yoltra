import { describe, it, expect } from "vitest";

import { createStore } from "../../src/store/Store";
import type { EffectSpec, MiddlewareFunction, ReducerSpec } from "../../src/types";

type EmitEM = {
  ui: {
    increment: number;
    start: null;
  };
};
type CounterState = { value: number };
type AppState = { counter: CounterState };

const counterSpec: ReducerSpec<CounterState, EmitEM> = {
  state: { value: 0 },
  events: [
    ["ui", "increment"],
    ["ui", "start"],
  ],
  reducer(state, event) {
    if (event.type === "increment") {
      return { value: state.value + (event.payload as number) };
    }
    return state;
  },
};

describe("Store - emit semantics (C3)", () => {
  it("updates state synchronously after emit, even with middleware present", async () => {
    const passthrough: MiddlewareFunction<AppState, EmitEM> = () => true;
    const store = createStore({
      name: "SyncEmit",
      reducer: { counter: counterSpec },
      middleware: [passthrough],
    });

    // Not awaited: the whole reduce phase (middleware + reducers) runs
    // synchronously, so getState() is correct the moment emit() returns.
    const done = store.emit("ui", "increment", 5);
    expect(store.getState().counter.value).toBe(5);

    await done;
  });

  it("notifies coarse subscribers synchronously within emit", () => {
    const store = createStore({ name: "CoarseSync", reducer: { counter: counterSpec } });
    let notified = 0;
    store.subscribe(() => {
      notified++;
    });

    void store.emit("ui", "increment", 1); // not awaited
    expect(notified).toBe(1);
    expect(store.getState().counter.value).toBe(1);
  });

  it("resolves the emit promise only after this event's effects complete", async () => {
    const order: string[] = [];
    const store = createStore({ name: "PromiseEmit", reducer: { counter: counterSpec } });

    const effect: EffectSpec<Readonly<AppState>, EmitEM> = {
      events: [["ui", "increment"]],
      effect: async () => {
        await new Promise((r) => setTimeout(r, 10));
        order.push("effect-done");
      },
    };
    store.registerEffect(effect);

    await store.emit("ui", "increment", 1);
    order.push("emit-resolved");

    expect(order).toEqual(["effect-done", "emit-resolved"]);
  });

  it("re-entrant emit inside an effect resolves only after it is fully processed", async () => {
    const order: string[] = [];
    const store = createStore({ name: "Reentrant", reducer: { counter: counterSpec } });

    const outer: EffectSpec<Readonly<AppState>, EmitEM> = {
      events: [["ui", "start"]],
      effect: async (_e, _getState, emit) => {
        order.push("outer:before-nested");
        await emit("ui", "increment", 1);
        order.push("outer:after-nested");
      },
    };
    const nested: EffectSpec<Readonly<AppState>, EmitEM> = {
      events: [["ui", "increment"]],
      effect: async () => {
        await new Promise((r) => setTimeout(r, 5));
        order.push("nested:effect-done");
      },
    };
    store.registerEffect(outer);
    store.registerEffect(nested);

    await store.emit("ui", "start", null);

    // The `await emit(...)` inside the outer effect waited for the nested event's
    // own effect to finish before continuing — honest promise, no deadlock.
    expect(order).toEqual(["outer:before-nested", "nested:effect-done", "outer:after-nested"]);
    expect(store.getState().counter.value).toBe(1);
  });
});
