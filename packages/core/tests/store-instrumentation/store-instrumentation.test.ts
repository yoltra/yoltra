import { describe, it, expect, vi } from "vitest";

import { createStore } from "../../src/store/Store";
import type { InstrumentedEvent, MiddlewareFunction, ReducerSpec } from "../../src/types";

type EM = {
  ui: {
    increment: number;
    rename: { id: string; title: string };
    blocked: null;
  };
};
type CounterState = { value: number };
type TodosState = { items: Array<{ id: string; title: string }> };
type AppState = { counter: CounterState; todos: TodosState };

const counterSpec: ReducerSpec<CounterState, EM> = {
  state: { value: 0 },
  events: [["ui", "increment"]],
  reducer(state, event) {
    if (event.type === "increment") return { value: state.value + (event.payload as number) };
    return state;
  },
};

const todosSpec: ReducerSpec<TodosState, EM> = {
  state: {
    items: [
      { id: "a", title: "A" },
      { id: "b", title: "B" },
    ],
  },
  events: [["ui", "rename"]],
  reducer(state, event) {
    if (event.type === "rename") {
      const { id, title } = event.payload as { id: string; title: string };
      return { items: state.items.map((t) => (t.id === id ? { ...t, title } : t)) };
    }
    return state;
  },
};

describe("Store - instrumentation (B1)", () => {
  it("delivers committed events with precise changed paths, values, and timing", async () => {
    const store = createStore<AppState, EM>({
      name: "Instr",
      reducer: { counter: counterSpec, todos: todosSpec },
    });
    const seen: InstrumentedEvent[] = [];
    const off = store.instrument((info) => seen.push(info));

    await store.emit("ui", "rename", { id: "a", title: "A2" });

    expect(seen).toHaveLength(1);
    const info = seen[0]!;
    expect(info.committed).toBe(true);
    expect(info.event.channel).toBe("ui");
    expect(info.event.type).toBe("rename");
    expect(typeof info.event.id).toBe("string");
    // Exact leaf path, slice-prefixed — no re-diff needed downstream.
    expect(info.changedPaths).toEqual(["todos.items.0.title"]);
    expect(info.prevValues["todos.items.0.title"]).toBe("A");
    expect(info.nextValues["todos.items.0.title"]).toBe("A2");
    expect(typeof info.reduceTimeMs).toBe("number");
    expect(info.reduceTimeMs).toBeGreaterThanOrEqual(0);

    off();
    await store.emit("ui", "increment", 1);
    expect(seen).toHaveLength(1); // unsubscribed → no further deliveries
  });

  it("reports vetoed events with committed=false and no changed paths", async () => {
    const block: MiddlewareFunction<any, EM> = (_s, event) => event.type !== "blocked";
    const store = createStore<{ counter: CounterState }, EM>({
      name: "InstrBlock",
      reducer: { counter: counterSpec },
      middleware: [block],
    });
    const seen: InstrumentedEvent[] = [];
    store.instrument((info) => seen.push(info));

    await store.emit("ui", "blocked", null);

    expect(seen).toHaveLength(1);
    expect(seen[0]!.committed).toBe(false);
    expect(seen[0]!.changedPaths).toEqual([]);
    expect(seen[0]!.prevValues).toEqual({});
  });

  it("aggregates changed paths across multiple slices in one event", async () => {
    type MultiEM = { app: { tick: number } };
    const a: ReducerSpec<{ n: number }, MultiEM> = {
      state: { n: 0 },
      events: [["app", "tick"]],
      reducer: (s) => ({ n: s.n + 1 }),
    };
    const b: ReducerSpec<{ m: number }, MultiEM> = {
      state: { m: 0 },
      events: [["app", "tick"]],
      reducer: (s) => ({ m: s.m + 10 }),
    };
    const store = createStore({ name: "Multi", reducer: { a, b } });
    const seen: InstrumentedEvent[] = [];
    store.instrument((info) => seen.push(info));

    await store.emit("app", "tick", 1);

    expect([...seen[0]!.changedPaths].sort()).toEqual(["a.n", "b.m"]);
    expect(seen[0]!.nextValues["a.n"]).toBe(1);
    expect(seen[0]!.nextValues["b.m"]).toBe(10);
  });

  it("__devtoolsIntrospect exposes dedupHits and queueDepth", () => {
    const store = createStore<{ counter: CounterState }, EM>({
      name: "Introspect",
      reducer: { counter: counterSpec },
    });
    const snap = store.__devtoolsIntrospect();
    expect(typeof snap.dedupHits).toBe("number");
    expect(typeof snap.queueDepth).toBe("number");
    expect(snap.reducers.map((r) => r.name)).toContain("counter");
  });

  it("__applyExternalState applies a snapshot and notifies fine-grained paths", () => {
    const store = createStore<{ counter: CounterState }, EM>({
      name: "External",
      reducer: { counter: counterSpec },
    });
    const changes: number[] = [];
    store.connect({ reducer: "counter", property: "value" }, (c) => changes.push(c.newValue as number));

    store.__applyExternalState({ counter: { value: 42 } });

    expect(store.getState().counter.value).toBe(42);
    expect(changes).toEqual([42]);
  });

  it("isolates a throwing observer without breaking the emit", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const store = createStore<{ counter: CounterState }, EM>({
      name: "InstrThrow",
      reducer: { counter: counterSpec },
    });
    const seen: InstrumentedEvent[] = [];
    store.instrument(() => {
      throw new Error("observer boom");
    });
    store.instrument((info) => seen.push(info));

    await store.emit("ui", "increment", 1);

    // The throwing observer is isolated; state update and the good observer proceed.
    expect(store.getState().counter.value).toBe(1);
    expect(seen).toHaveLength(1);
    expect(seen[0]!.changedPaths).toEqual(["counter.value"]);
    expect(errorSpy).toHaveBeenCalledWith("Instrumentation observer error:", expect.any(Error));

    errorSpy.mockRestore();
  });
});
