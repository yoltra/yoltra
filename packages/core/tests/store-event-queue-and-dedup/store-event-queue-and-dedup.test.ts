import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createStore } from "../../src/store/Store";
import type { ReducerSpec } from "../../src/types";

type EM = {
  ui: {
    ping: number;
    nested: number;
  };
};

type State = {
  counter: { value: number };
};

const reducerSpec: ReducerSpec<State["counter"], EM> = {
  state: { value: 0 },
  events: [
    ["ui", "ping"],
    ["ui", "nested"],
  ],
  reducer(state, event) {
    if (event.channel === "ui" && event.type === "ping") {
      return { value: state.value + (event.payload as number) };
    }
    if (event.channel === "ui" && event.type === "nested") {
      return { value: state.value + (event.payload as number) };
    }
    return state;
  },
};

describe("Store - event queue and deduplication", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("processes events FIFO and prevents re-entrancy from starting multiple drains", async () => {
    const nestedLogs: string[] = [];

    const store = createStore({
      name: "QueueStore",
      reducer: {
        counter: reducerSpec,
      },
    });

    // Middleware that emits nested events
    store.registerMiddleware(async (_state, event, emit) => {
      if (event.channel === "ui" && event.type === "ping") {
        nestedLogs.push("mw-before");
        await emit("ui", "nested", 2);
        nestedLogs.push("mw-after");
      }
      return true;
    });

    await store.emit("ui", "ping", 1);

    const state = store.getState();
    expect(state.counter.value).toBe(3);
    expect(nestedLogs).toEqual(["mw-before", "mw-after"]);
  });

  it("tracks processed event ids and clears them on interval", async () => {
    const store = createStore({
      name: "QueueStore2",
      reducer: {
        counter: reducerSpec,
      },
    }) as any;

    // after first emit, there should be some processed IDs
    await store.emit("ui", "ping", 1);
    const set: Set<symbol> = store.processedEventIds;
    expect(set.size).toBeGreaterThan(0);

    // advance timers to trigger cleanup interval
    vi.advanceTimersByTime(60_000);

    expect(set.size).toBe(0);
  });

  it("dispose clears the cleanup timer and processed IDs", () => {
    const store = createStore({
      name: "QueueStore3",
      reducer: {
        counter: reducerSpec,
      },
    }) as any;

    const timerBefore = store.eventIdCleanupTimer;
    expect(timerBefore).not.toBeNull();

    store.dispose();

    expect(store.eventIdCleanupTimer).toBeNull();
    expect(store.processedEventIds.size).toBe(0);
  });
});
