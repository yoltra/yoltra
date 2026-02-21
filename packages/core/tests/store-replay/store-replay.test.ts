import { describe, it, expect, vi } from "vitest";
import { createStore } from "../../src/store/Store";
import type { ReducerSpec, EffectSpec, MiddlewareSpec } from "../../src/types";

type EM = {
  math: { add: number; multiply: number };
};

type State = {
  counter: { value: number };
};

const counterReducer: ReducerSpec<State["counter"], EM> = {
  state: { value: 0 },
  events: [["math", "add"], ["math", "multiply"]],
  reducer(state, event) {
    if (event.channel === "math" && event.type === "add") {
      return { value: state.value + (event.payload as number) };
    }
    if (event.channel === "math" && event.type === "multiply") {
      return { value: state.value * (event.payload as number) };
    }
    return state;
  },
};

describe("Store - __replayEvents", () => {
  it("throws when replay is not enabled (default)", () => {
    const store = createStore({
      name: "NoReplayStore",
      reducer: { counter: counterReducer },
    });

    expect(() => {
      store.__replayEvents({ counter: { value: 0 } }, []);
    }).toThrow("[yoltra] Event replay is disabled");
  });

  it("throws when replay is explicitly disabled", () => {
    const store = createStore({
      name: "DisabledReplayStore",
      reducer: { counter: counterReducer },
      devtools: { allowReplay: false },
    });

    expect(() => {
      store.__replayEvents({ counter: { value: 0 } }, []);
    }).toThrow("[yoltra] Event replay is disabled");
  });

  it("applies snapshot then replays events through reducers", () => {
    const store = createStore({
      name: "ReplayStore",
      reducer: { counter: counterReducer },
      devtools: { allowReplay: true },
    });

    // Set up initial state via normal emit
    // Now replay from a snapshot with a sequence of events
    store.__replayEvents({ counter: { value: 10 } }, [
      { channel: "math", type: "add", payload: 5, id: "replay-1" },
      { channel: "math", type: "multiply", payload: 2, id: "replay-2" },
    ]);

    // snapshot(10) + add(5) = 15, then multiply(2) = 30
    expect(store.getState().counter.value).toBe(30);
  });

  it("applies snapshot with empty events array", () => {
    const store = createStore({
      name: "ReplayStore",
      reducer: { counter: counterReducer },
      devtools: { allowReplay: true },
    });

    store.__replayEvents({ counter: { value: 42 } }, []);

    expect(store.getState().counter.value).toBe(42);
  });

  it("skips middleware during replay", async () => {
    const middlewareFn = vi.fn(() => false); // Would block all events normally

    const store = createStore({
      name: "ReplayStore",
      reducer: { counter: counterReducer },
      middleware: [
        {
          when: { any: true },
          middleware: middlewareFn,
        } as MiddlewareSpec<any, EM>,
      ],
      devtools: { allowReplay: true },
    });

    // Normal emit should be blocked by middleware
    await store.emit("math", "add", 5);
    expect(store.getState().counter.value).toBe(0); // Blocked

    // Replay should skip middleware entirely
    store.__replayEvents({ counter: { value: 0 } }, [
      { channel: "math", type: "add", payload: 5, id: "replay-1" },
    ]);

    expect(store.getState().counter.value).toBe(5); // Not blocked
    // Middleware should NOT have been called during replay (only during the normal emit)
    expect(middlewareFn).toHaveBeenCalledTimes(1);
  });

  it("skips effects during replay", async () => {
    const effectFn = vi.fn();

    const store = createStore({
      name: "ReplayStore",
      reducer: { counter: counterReducer },
      effects: [
        {
          events: [["math", "add"]],
          effect: effectFn,
        } as EffectSpec<any, EM>,
      ],
      devtools: { allowReplay: true },
    });

    // Normal emit triggers the effect
    await store.emit("math", "add", 1);
    expect(effectFn).toHaveBeenCalledTimes(1);

    // Replay should NOT trigger effects
    effectFn.mockClear();
    store.__replayEvents({ counter: { value: 0 } }, [
      { channel: "math", type: "add", payload: 5, id: "replay-1" },
    ]);

    expect(effectFn).not.toHaveBeenCalled();
    expect(store.getState().counter.value).toBe(5);
  });

  it("notifies coarse subscribers during replay", () => {
    const store = createStore({
      name: "ReplayStore",
      reducer: { counter: counterReducer },
      devtools: { allowReplay: true },
    });

    const listener = vi.fn();
    store.subscribe(listener);

    store.__replayEvents({ counter: { value: 0 } }, [
      { channel: "math", type: "add", payload: 1, id: "replay-1" },
      { channel: "math", type: "add", payload: 2, id: "replay-2" },
    ]);

    // Listener called: once for snapshot apply + once per event that changes state
    // Snapshot changes state (0 -> 0 is same ref but __applyExternalState checks slices)
    // Each add event changes state
    expect(listener).toHaveBeenCalled();
    expect(store.getState().counter.value).toBe(3);
  });

  it("notifies committed event subscribers during replay", () => {
    const store = createStore({
      name: "ReplayStore",
      reducer: { counter: counterReducer },
      devtools: { allowReplay: true },
    });

    const handler = vi.fn();
    store.onEvent("math", "add", handler, "committed");

    store.__replayEvents({ counter: { value: 0 } }, [
      { channel: "math", type: "add", payload: 7, id: "replay-1" },
    ]);

    expect(handler).toHaveBeenCalled();
  });

  it("event IDs are strings (crypto.randomUUID format)", async () => {
    const store = createStore({
      name: "IDTestStore",
      reducer: { counter: counterReducer },
    });

    let capturedId: any;
    store.onEvent("math", "add", (event) => {
      capturedId = event.id;
    });

    await store.emit("math", "add", 1);

    expect(typeof capturedId).toBe("string");
    // UUID v4 format: 8-4-4-4-12 hex chars
    expect(capturedId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});
