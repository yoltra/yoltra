import { describe, it, expect, vi } from "vitest";

import type { MiddlewareFunction, EffectSpec } from "../../src/types";
import { makeStore, AppState, AppEvents } from "./support/setupStore";

describe("Store - middleware and effects", () => {
  it("runs middleware in order and allows cancellation", async () => {
    const store = makeStore();

    const order: string[] = [];

    const mw1: MiddlewareFunction<AppState, AppEvents> = async (_state, _event) => {
      order.push("mw1");
      return true;
    };

    const mw2: MiddlewareFunction<AppState, AppEvents> = async (_state, event) => {
      order.push("mw2");
      if (event.type === "dangerous") return false;
      return true;
    };

    const mw3: MiddlewareFunction<AppState, AppEvents> = async () => {
      order.push("mw3");
      return true;
    };

    store.registerMiddleware(mw1);
    store.registerMiddleware(mw2);
    store.registerMiddleware(mw3);

    await store.emit("ui", "increment", 1);
    await store.emit("ui", "dangerous", null);

    const state = store.getState();
    expect(state.counter.value).toBe(1);
    expect(order).toEqual(["mw1", "mw2", "mw3", "mw1", "mw2"]);
  });

  it("logs middleware errors and cancels propagation", async () => {
    const store = makeStore();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const mw1: MiddlewareFunction<AppState, AppEvents> = () => {
      throw new Error("mw boom");
    };

    store.registerMiddleware(mw1);

    await store.emit("ui", "increment", 1);

    // error logged, but state should remain unchanged because propagation stops
    const state = store.getState();
    expect(state.counter.value).toBe(0);
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("runs effects after reducers and passes final state", async () => {
    const store = makeStore();
    const calls: Array<{ payload: any; value: number }> = [];

    const effectSpec: EffectSpec<Readonly<AppState>, AppEvents> = {
      events: [["ui", "increment"]],
      effect: async (evt, getState) => {
        const s = getState();
        calls.push({ payload: evt.payload, value: s.counter.value });
      },
    };

    store.registerEffect(effectSpec);

    await store.emit("ui", "increment", 2);
    await store.emit("ui", "increment", 3);

    expect(calls).toEqual([
      { payload: 2, value: 2 },
      { payload: 3, value: 5 },
    ]);
  });

  it("logs effect errors but continues processing other effects", async () => {
    const store = makeStore();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const calls: number[] = [];

    const badEffect: EffectSpec<Readonly<AppState>, AppEvents> = {
      events: [["ui", "increment"]],
      effect: async () => {
        throw new Error("effect boom");
      },
    };

    const goodEffect: EffectSpec<Readonly<AppState>, AppEvents> = {
      events: [["ui", "increment"]],
      effect: async (_evt, getState) => {
        calls.push(getState().counter.value);
      },
    };

    store.registerEffect(badEffect);
    store.registerEffect(goodEffect);

    await store.emit("ui", "increment", 1);

    expect(calls).toEqual([1]);
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("replaceMiddleware swaps out the entire pipeline", async () => {
    const store = makeStore();

    const logs: string[] = [];

    const mwOld: MiddlewareFunction<AppState, AppEvents> = async () => {
      logs.push("old");
      return true;
    };

    store.registerMiddleware(mwOld);

    await store.emit("ui", "increment", 1);
    expect(logs).toEqual(["old"]);

    const mwNew: MiddlewareFunction<AppState, AppEvents> = async () => {
      logs.push("new");
      return true;
    };

    store.replaceMiddleware([mwNew]);

    // Use different payload to avoid deduplication
    await store.emit("ui", "increment", 2);
    expect(logs).toEqual(["old", "new"]);
  });

  it("replaceEffects swaps out all registered effects", async () => {
    const store = makeStore();

    const calls: string[] = [];

    const oldEffect: EffectSpec<Readonly<AppState>, AppEvents> = {
      events: [["ui", "increment"]],
      effect: async () => {
        calls.push("old");
      },
    };

    const newEffect: EffectSpec<Readonly<AppState>, AppEvents> = {
      events: [["ui", "increment"]],
      effect: async () => {
        calls.push("new");
      },
    };

    store.replaceEffects([oldEffect]);

    await store.emit("ui", "increment", 1);
    expect(calls).toEqual(["old"]);

    store.replaceEffects([newEffect]);
    // Use different payload to avoid deduplication
    await store.emit("ui", "increment", 2);
    expect(calls).toEqual(["old", "new"]);
  });
});
