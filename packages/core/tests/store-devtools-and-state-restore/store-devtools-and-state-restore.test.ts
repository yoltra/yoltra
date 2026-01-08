import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createStore } from "../../src/store/Store";
import type { ReducerSpec } from "../../src/types";

type EM = {
  ui: { set: number };
};

type State = {
  counter: { value: number };
};

const reducerSpec: ReducerSpec<State["counter"], EM> = {
  state: { value: 0 },
  events: [["ui", "set"]],
  reducer(state, event) {
    if (event.channel === "ui" && event.type === "set") {
      return { value: event.payload as number };
    }
    return state;
  },
};

describe("Store - DevTools integration and external state restore", () => {
  let originalWindow: any;
  let devtools: {
    init: ReturnType<typeof vi.fn>;
    send: ReturnType<typeof vi.fn>;
    subscribe: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    originalWindow = (globalThis as any).window;

    devtools = {
      init: vi.fn(),
      send: vi.fn(),
      subscribe: vi.fn(),
    };

    (globalThis as any).window = {
      __REDUX_DEVTOOLS_EXTENSION__: {
        connect: vi.fn(() => devtools),
      },
    };

    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    (globalThis as any).window = originalWindow;
  });

  it("connects to DevTools when extension is available", () => {
    const store = createStore({
      name: "DevToolsStore",
      reducer: {
        counter: reducerSpec,
      },
    });

    // DevTools init should have been called at least once with current state
    expect(devtools.init).toHaveBeenCalled();
  });

  it("applies state from DevTools JUMP_TO_STATE and notifies connectors and subscribers", () => {
    const store = createStore({
      name: "DevToolsStore",
      reducer: {
        counter: reducerSpec,
      },
    });

    const changes: any[] = [];
    const coarse: number[] = [];

    store.connect({ reducer: "counter", property: "value" }, (chg) => {
      changes.push({ old: chg.oldValue, next: chg.newValue });
    });

    store.subscribe(() => {
      coarse.push(Date.now());
    });

    const msgHandler = devtools.subscribe.mock.calls[0][0] as (msg: any) => void;

    msgHandler({
      type: "DISPATCH",
      payload: { type: "JUMP_TO_STATE" },
      state: JSON.stringify({ counter: { value: 42 } }),
    });

    const state = store.getState();
    expect(state.counter.value).toBe(42);

    expect(changes).toEqual([{ old: 0, next: 42 }]);
    expect(coarse.length).toBe(1);
  });

  it("handles IMPORT_STATE by applying the last computed state", () => {
    const store = createStore({
      name: "DevToolsStore",
      reducer: {
        counter: reducerSpec,
      },
    });

    const msgHandler = devtools.subscribe.mock.calls[0][0] as (msg: any) => void;

    msgHandler({
      type: "DISPATCH",
      payload: { type: "IMPORT_STATE" },
      nextLiftedState: {
        computedStates: [
          { state: { counter: { value: 1 } } },
          { state: { counter: { value: 2 } } },
          { state: { counter: { value: 99 } } },
        ],
      },
    });

    const state = store.getState();
    expect(state.counter.value).toBe(99);
  });

  it("COMMIT re-inits DevTools with current state", async () => {
    const store = createStore({
      name: "DevToolsStore",
      reducer: {
        counter: reducerSpec,
      },
    });

    const msgHandler = devtools.subscribe.mock.calls[0][0] as (msg: any) => void;

    await store.emit("ui", "set", 5);

    msgHandler({
      type: "DISPATCH",
      payload: { type: "COMMIT" },
    });

    expect(devtools.init).toHaveBeenCalled();
    const lastInitArg = devtools.init.mock.calls.at(-1)![0];
    expect(lastInitArg.counter.value).toBe(5);
  });
});
