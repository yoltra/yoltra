import { describe, it, expect, vi } from "vitest";

import { createStore } from "../../src/store/Store";
import type { ReducerSpec } from "../../src/types";

type EM = { ui: { increment: number } };
type CounterState = { value: number };

const counterSpec: ReducerSpec<CounterState, EM> = {
  state: { value: 0 },
  events: [["ui", "increment"]],
  reducer: (s, e) => (e.type === "increment" ? { value: s.value + (e.payload as number) } : s),
};

describe("Medium core hardening", () => {
  it("keeps effect metadata store-owned: no caller mutation, no cross-store bleed (CORE-5)", () => {
    const effect = async () => {};

    const a = createStore({
      name: "A",
      reducer: { counter: counterSpec },
      effects: [
        { events: [["ui", "increment"]], effect, meta: { type: "effect", name: "A-meta" } },
      ],
    });
    const b = createStore({
      name: "B",
      reducer: { counter: counterSpec },
      effects: [
        { events: [["ui", "increment"]], effect, meta: { type: "effect", name: "B-meta" } },
      ],
    });

    // The caller's shared function is never mutated with framework metadata.
    expect((effect as unknown as { __quoMeta?: unknown }).__quoMeta).toBeUndefined();

    // Each store reports its OWN metadata for the same handler — no bleed.
    const named = (s: ReturnType<typeof createStore>) =>
      (s as any).__devtoolsIntrospect().effects.find((e: any) => e.name);
    expect(named(a).name).toBe("A-meta");
    expect(named(b).name).toBe("B-meta");
  });

  it("retains a slice missing from an external snapshot instead of blanking it (CORE-6)", () => {
    type S2 = { a: { x: number }; b: { y: number } };
    const aSpec: ReducerSpec<S2["a"], EM> = {
      state: { x: 1 },
      events: [["ui", "increment"]],
      reducer: (s) => s,
    };
    const bSpec: ReducerSpec<S2["b"], EM> = {
      state: { y: 2 },
      events: [["ui", "increment"]],
      reducer: (s) => s,
    };
    const store = createStore({
      name: "S",
      reducer: { a: aSpec, b: bSpec },
      devtools: { allowReplay: true },
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Snapshot omits slice `b`.
    (store as any).__applyExternalState({ a: { x: 9 } });

    expect(store.getState().a.x).toBe(9); // applied
    expect(store.getState().b).toEqual({ y: 2 }); // retained, not undefined
    expect(() => store.getState().b.y).not.toThrow();
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });

  it("starts the dedup prune timer on use and stops it when the cache drains (CORE-4)", async () => {
    vi.useFakeTimers();
    try {
      const store = createStore({ name: "S", reducer: { counter: counterSpec } });
      const internal = store as any;

      // No dedup used yet → no timer, empty cache.
      expect(internal.eventCleanupTimer).toBeNull();

      // An identity (dedupKey) emit at the default windowMs 0 caches an entry
      // AND lazily starts the prune timer — the old code only started it when
      // dedupWindowMs > 0, so keyed entries leaked until the 1000-entry cap.
      await store.emit("ui", "increment", 1, { dedupKey: "k1" });
      expect(internal.processedEvents.size).toBe(1);
      expect(internal.eventCleanupTimer).not.toBeNull();

      // Once the entry expires, the interval prunes it and stops itself.
      await vi.advanceTimersByTimeAsync(5001);
      expect(internal.processedEvents.size).toBe(0);
      expect(internal.eventCleanupTimer).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("types emit against the merged event map of all slices (TYPE-3)", async () => {
    type UiEM = { ui: { inc: number } };
    type DataEM = { data: { load: string } };

    const ui: ReducerSpec<{ n: number }, UiEM> = {
      state: { n: 0 },
      events: [["ui", "inc"]],
      reducer: (s, e) => (e.type === "inc" ? { n: s.n + (e.payload as number) } : s),
    };
    const data: ReducerSpec<{ q: string }, DataEM> = {
      state: { q: "" },
      events: [["data", "load"]],
      reducer: (s, e) => (e.type === "load" ? { q: e.payload as string } : s),
    };

    const store = createStore({ name: "Merged", reducer: { ui, data } });

    // Both channels must typecheck — before TYPE-3, collapsing the slices' event
    // maps made one of these emits unsound (wrong channel/type acceptance).
    await store.emit("ui", "inc", 2);
    await store.emit("data", "load", "hello");

    expect(store.getState().ui.n).toBe(2);
    expect(store.getState().data.q).toBe("hello");
  });
});
