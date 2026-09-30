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
  when: { keys: [["ui", "increment"]] },
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
  when: { keys: [["ui", "rename"]] },
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
      when: { keys: [["app", "tick"]] },
      reducer: (s) => ({ n: s.n + 1 }),
    };
    const b: ReducerSpec<{ m: number }, MultiEM> = {
      state: { m: 0 },
      when: { keys: [["app", "tick"]] },
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
      devtools: { allowReplay: true },
    });
    const changes: number[] = [];
    store.connect({ reducer: "counter", property: "value" }, (c) => changes.push(c.newValue as number));

    store.__applyExternalState({ counter: { value: 42 } });

    expect(store.getState().counter.value).toBe(42);
    expect(changes).toEqual([42]);
  });

  it("__applyExternalState throws without devtools.allowReplay (SEC-1 gate)", () => {
    const store = createStore<{ counter: CounterState }, EM>({
      name: "ExternalGated",
      reducer: { counter: counterSpec },
      // no devtools.allowReplay → external state apply (time-travel) is rejected
    });
    const before = store.getState().counter.value;

    // Refused loudly, like its sibling `__replayEvents`. Both replace the state tree wholesale
    // on behalf of a devtools client; warning in one case and throwing in the other made a
    // disabled seam look like a working one that had simply found nothing to do.
    expect(() => store.__applyExternalState({ counter: { value: 999 } })).toThrow(
      /time-travel\) is disabled/,
    );
    expect(store.getState().counter.value).toBe(before);
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

describe("an uncommitted event says why, and who", () => {
  /**
   * 0.8.0 gave attribution to the emitter and not to the observer.
   *
   * `EmitResult` gained `reason` and `vetoedBy`; the instrumentation path dropped them, so a
   * devtools panel and a JSONL trace could report `committed: false` and could not distinguish a
   * guard refusing an action from a deduplication, from a cascade breach, from no reducer
   * matching. Instrumentation is the only seam that sees uncommitted events without the observer
   * joining the pipeline, so there is nowhere else to gather it.
   */
  function instrumented(mw: MiddlewareFunction<any, EM>) {
    const store = createStore<{ counter: CounterState }, EM>({
      name: "InstrAttribution",
      reducer: { counter: counterSpec },
      middleware: [mw],
    });
    const seen: InstrumentedEvent[] = [];
    store.instrument((info) => seen.push(info));
    return { store, seen };
  }

  it("names the middleware that vetoed", async () => {
    // Passed inline rather than through a same-named `const`: a named function expression
    // assigned to a binding of its own name gets renamed by the bundler (`blockTheBlocked2`),
    // which is a real caveat for anyone reading `vetoedBy` out of a minified build.
    const { store, seen } = instrumented(function blockTheBlocked(_s, event) {
      return event.type !== "blocked";
    });

    await store.emit("ui", "blocked", null);

    expect(seen).toHaveLength(1);
    expect(seen[0]!.committed).toBe(false);
    expect(seen[0]!.reason).toBe("vetoed");
    expect(seen[0]!.vetoedBy).toBe("blockTheBlocked");
  });

  it("reports a veto with no name as vetoed by nobody", async () => {
    // An anonymous middleware has a reason and no author. Reporting `vetoedBy: ""` would be worse
    // than reporting nothing, so the field is absent rather than empty.
    const { store, seen } = instrumented((_s, event) => event.type !== "blocked");

    await store.emit("ui", "blocked", null);

    expect(seen[0]!.reason).toBe("vetoed");
    expect(seen[0]!.vetoedBy).toBeUndefined();
  });

  it("attributes a middleware that throws, because a throw is treated as a veto", async () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const { store, seen } = instrumented(function detonate() {
        throw new Error("nope");
      });

      await store.emit("ui", "increment", 1);

      expect(seen[0]!.committed).toBe(false);
      expect(seen[0]!.reason).toBe("vetoed");
      expect(seen[0]!.vetoedBy).toBe("detonate");
    } finally {
      quiet.mockRestore();
    }
  });

  it("carries neither field when the event commits", async () => {
    const { store, seen } = instrumented((_s, event) => event.type !== "blocked");

    await store.emit("ui", "increment", 1);

    expect(seen[0]!.committed).toBe(true);
    expect(seen[0]).not.toHaveProperty("reason");
    expect(seen[0]).not.toHaveProperty("vetoedBy");
  });
});
