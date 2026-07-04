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

    // Middleware that emits a nested event (synchronously queued for reduction)
    store.registerMiddleware((_state, event, emit) => {
      if (event.channel === "ui" && event.type === "ping") {
        nestedLogs.push("mw-before");
        emit("ui", "nested", 2);
        nestedLogs.push("mw-after");
      }
      return true;
    });

    await store.emit("ui", "ping", 1);

    const state = store.getState();
    expect(state.counter.value).toBe(3);
    expect(nestedLogs).toEqual(["mw-before", "mw-after"]);
  });

  it("tracks processed event fingerprints and clears them on interval (dedup enabled)", async () => {
    const store = createStore({
      name: "QueueStore2",
      reducer: {
        counter: reducerSpec,
      },
      dedupWindowMs: 50,
    }) as any;

    // after first emit, there should be some processed fingerprints
    await store.emit("ui", "ping", 1);
    const map: Map<string, number> = store.processedEvents;
    expect(map.size).toBeGreaterThan(0);

    // advance timers to trigger cleanup interval (5s intervals, prunes old entries)
    vi.advanceTimersByTime(10_000);

    // After cleanup, old entries should be pruned
    expect(map.size).toBe(0);
  });

  it("dispose clears the cleanup timer and processed fingerprints (dedup enabled)", () => {
    const store = createStore({
      name: "QueueStore3",
      reducer: {
        counter: reducerSpec,
      },
      dedupWindowMs: 50,
    }) as any;

    // Lazy: the timer is not running until a dedup-cached event starts it.
    expect(store.eventCleanupTimer).toBeNull();
    store.processedEvents.set("ui::increment::1", Date.now());
    store.ensureCleanupTimer();
    expect(store.eventCleanupTimer).not.toBeNull();

    store.dispose();

    expect(store.eventCleanupTimer).toBeNull();
    expect(store.processedEvents.size).toBe(0);
  });
});

describe("Store - deduplication is opt-in (C2)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does NOT drop rapid-fire identical events by default", async () => {
    const store = createStore({ name: "NoDedup", reducer: { counter: reducerSpec } });

    // Three identical emits in the same instant — all must be processed.
    await store.emit("ui", "ping", 1);
    await store.emit("ui", "ping", 1);
    await store.emit("ui", "ping", 1);

    expect(store.getState().counter.value).toBe(3);
    // Nothing is fingerprinted and no cleanup timer runs when dedup is off.
    expect((store as any).processedEvents.size).toBe(0);
    expect((store as any).eventCleanupTimer).toBeNull();
  });

  it("coalesces identical payloads within the window when dedupWindowMs > 0", async () => {
    const store = createStore({
      name: "ContentDedup",
      reducer: { counter: reducerSpec },
      dedupWindowMs: 50,
    });

    // Same payload, same instant → the second is a content duplicate.
    await store.emit("ui", "ping", 1);
    await store.emit("ui", "ping", 1);
    expect(store.getState().counter.value).toBe(1);

    // Past the window → fires again.
    vi.advanceTimersByTime(60);
    await store.emit("ui", "ping", 1);
    expect(store.getState().counter.value).toBe(2);
  });

  it("dedupKey coalesces only re-fires of the SAME keyed emit, even with content-dedup off", async () => {
    const store = createStore({ name: "KeyedDedup", reducer: { counter: reducerSpec } });

    // Same key, same instant → the re-fire is dropped (e.g. Strict Mode double-invoke).
    await store.emit("ui", "ping", 1, { dedupKey: "k" });
    await store.emit("ui", "ping", 1, { dedupKey: "k" });
    expect(store.getState().counter.value).toBe(1);

    // A different key is a distinct logical emit → fires.
    await store.emit("ui", "ping", 1, { dedupKey: "k2" });
    expect(store.getState().counter.value).toBe(2);

    // No key at all → always fires; an identical payload is never coalesced.
    await store.emit("ui", "ping", 1);
    expect(store.getState().counter.value).toBe(3);

    // Past the keyed window, the same key fires again.
    vi.advanceTimersByTime(150);
    await store.emit("ui", "ping", 1, { dedupKey: "k" });
    expect(store.getState().counter.value).toBe(4);
  });

  it("dedupKey honours the configured content window when dedupWindowMs > 0", async () => {
    const store = createStore({
      name: "KeyedWithWindow",
      reducer: { counter: reducerSpec },
      dedupWindowMs: 200,
    });

    // With content-dedup enabled, a keyed emit dedups within that same window.
    await store.emit("ui", "ping", 1, { dedupKey: "k" });
    await store.emit("ui", "ping", 1, { dedupKey: "k" });
    expect(store.getState().counter.value).toBe(1);

    // Still within 200ms → still deduped.
    vi.advanceTimersByTime(100);
    await store.emit("ui", "ping", 1, { dedupKey: "k" });
    expect(store.getState().counter.value).toBe(1);

    // Past 200ms → fires again.
    vi.advanceTimersByTime(150);
    await store.emit("ui", "ping", 1, { dedupKey: "k" });
    expect(store.getState().counter.value).toBe(2);
  });

  it("content-dedup fingerprints object, null, and non-serializable payloads", async () => {
    type FpEM = { ui: { obj: { a: number }; nul: null; bad: unknown } };
    const spec: ReducerSpec<{ n: number }, FpEM> = {
      state: { n: 0 },
      events: [
        ["ui", "obj"],
        ["ui", "nul"],
        ["ui", "bad"],
      ],
      reducer(state) {
        return { n: state.n + 1 };
      },
    };
    const store = createStore({ name: "Fp", reducer: { s: spec }, dedupWindowMs: 50 });

    // object payload → JSON.stringify fingerprint; identical within window coalesces
    await store.emit("ui", "obj", { a: 1 });
    await store.emit("ui", "obj", { a: 1 });
    expect(store.getState().s.n).toBe(1);

    // null payload → null fast-path
    await store.emit("ui", "nul", null);
    await store.emit("ui", "nul", null);
    expect(store.getState().s.n).toBe(2);

    // non-serializable (circular) payload → catch path → unique fingerprint, never coalesces
    const circular: { self?: unknown } = {};
    circular.self = circular;
    await store.emit("ui", "bad", circular);
    await store.emit("ui", "bad", circular);
    expect(store.getState().s.n).toBe(4);
  });
});
