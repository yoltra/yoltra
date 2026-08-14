import { describe, it, expect } from "vitest";
import { createStore } from "../../src/store/Store";
import type { ReducerSpec } from "../../src/types";

type EM = {
  ui: {
    setCounter: number;
    increment: number;
  };
};

type State = {
  base: { value: number };
  dynamic?: { value: number };
};

const baseReducer: ReducerSpec<State["base"], EM> = {
  state: { value: 0 },
  when: { keys: [
    ["ui", "setCounter"],
    ["ui", "increment"],
  ] },
  reducer(state, event) {
    if (event.channel === "ui" && event.type === "setCounter") {
      return { value: event.payload as number };
    }
    if (event.channel === "ui" && event.type === "increment") {
      return { value: state.value + (event.payload as number) };
    }
    return state;
  },
};

describe("Store - dynamic slices", () => {
  it("registerReducer adds a slice that responds to events and can be disposed", async () => {
    const store = createStore({
      name: "DynamicSlicesStore",
      reducer: {
        base: baseReducer,
      },
    });

    const dynamicSpec: ReducerSpec<{ value: number }, EM> = {
      state: { value: 10 },
      when: { keys: [["ui", "increment"]] },
      reducer(state, event) {
        if (event.channel === "ui" && event.type === "increment") {
          return { value: state.value + (event.payload as number) };
        }
        return state;
      },
    };

    const disposeDynamic = store.registerReducer("dynamic", dynamicSpec);

    await store.emit("ui", "increment", 5);
    let state: any = store.getState();

    expect(state.base.value).toBe(5);
    expect(state.dynamic.value).toBe(15);

    disposeDynamic();

    // Use different payload to avoid deduplication
    await store.emit("ui", "increment", 6);
    state = store.getState();
    expect(state.base.value).toBe(11);
    expect((state as any).dynamic).toBeUndefined();
  });

  it("replaceReducers preserves state when requested", async () => {
    const store = createStore({
      name: "DynamicSlicesStore2",
      reducer: {
        base: baseReducer,
      },
    });

    await store.emit("ui", "setCounter", 10);
    const before = store.getState();
    expect(before.base.value).toBe(10);

    const newReducer: ReducerSpec<State["base"], EM> = {
      state: { value: 999 },
      when: { keys: [["ui", "increment"]] },
      reducer(state, event) {
        if (event.channel === "ui" && event.type === "increment") {
          return { value: state.value + (event.payload as number) * 2 };
        }
        return state;
      },
    };

    store.replaceReducers(
      {
        base: newReducer,
      } as any,
      { preserveState: true },
    );

    const afterReplace = store.getState();
    expect(afterReplace.base.value).toBe(10);

    await store.emit("ui", "increment", 3);
    const finalState = store.getState();
    expect(finalState.base.value).toBe(16);
  });

  it("replaceReducers removes obsolete slices", async () => {
    const store = createStore({
      name: "DynamicSlicesStore3",
      reducer: {
        base: baseReducer,
      },
    });

    const extraSpec: ReducerSpec<{ flag: boolean }, EM> = {
      state: { flag: false },
      when: { keys: [["ui", "increment"]] },
      reducer(state, _event) {
        return { flag: !state.flag };
      },
    };

    store.registerReducer("extra", extraSpec);

    let state: any = store.getState();
    expect(state.extra.flag).toBe(false);

    store.replaceReducers(
      {
        base: baseReducer,
      } as any,
      { preserveState: true },
    );

    state = store.getState();
    expect(state.base.value).toBe(0);
    expect((state as any).extra).toBeUndefined();
  });

  it("hotReplace delegates to replaceReducers/middleware/effects", () => {
    const store = createStore({
      name: "HotReplaceStore",
      reducer: {
        base: baseReducer,
      },
    });

    const newReducer: ReducerSpec<State["base"], EM> = {
      state: { value: 1 },
      when: { keys: [["ui", "increment"]] },
      reducer(s, e) {
        if (e.channel === "ui" && e.type === "increment") {
          return { value: s.value + 1 };
        }
        return s;
      },
    };

    store.hotReplace({
      reducer: { base: newReducer } as any,
      preserveState: false,
    });

    const state = store.getState();
    expect(state.base.value).toBe(1);
  });

  // The registry is a plain object, so `name in this.reducers` also answers true for every key
  // on `Object.prototype`. A slice named after one of them was refused as already existing —
  // and the error named a reducer the store had never been given.
  it("accepts a slice named after an Object.prototype key", async () => {
    const store = createStore<State, EM>({
      name: "prototype-keys",
      reducer: { base: baseReducer },
    });

    for (const name of ["toString", "constructor", "valueOf", "hasOwnProperty"]) {
      expect(() =>
        store.registerReducer(name, {
          state: { value: 0 },
          when: { keys: [["ui", "setCounter"]] },
          reducer: (_s, e) => ({ value: e.payload as number }),
        }),
      ).not.toThrow();
    }

    await store.emit("ui", "setCounter", 7);
    expect((store.getState() as any).toString.value).toBe(7);

    // The guard still does its real job.
    expect(() => store.registerReducer("base", baseReducer)).toThrow(/already exists/);
  });
});
