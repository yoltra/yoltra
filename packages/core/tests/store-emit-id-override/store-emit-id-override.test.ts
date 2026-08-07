import { describe, it, expect } from "vitest";

import { createStore } from "../../src/store/Store";
import type { InstrumentedEvent, ReducerSpec } from "../../src/types";

type EM = { ui: { tick: null; rename: { title: string } } };

type LogState = { ids: string[] };
type AppState = { log: LogState };

const logSpec: ReducerSpec<LogState, EM> = {
  state: { ids: [] },
  when: { any: true },
  reducer(state, event) {
    return { ids: [...state.ids, event.id] };
  },
};

describe("Store - emit id override, idFactory and skipDedup", () => {
  it("uses a caller-supplied id verbatim, everywhere", async () => {
    const store = createStore<AppState, EM>({ name: "IdOverride", reducer: { log: logSpec } });

    const instrumented: InstrumentedEvent[] = [];
    store.instrument((info) => instrumented.push(info));

    await store.emit("ui", "rename", { title: "A" }, { id: "origin-event-42" });

    expect(store.getState().log.ids).toEqual(["origin-event-42"]);
    expect(instrumented[0]!.event.id).toBe("origin-event-42");
  });

  it("generates an id when none is supplied", async () => {
    const store = createStore<AppState, EM>({ name: "IdGenerated", reducer: { log: logSpec } });

    await store.emit("ui", "rename", { title: "A" });
    await store.emit("ui", "rename", { title: "B" });

    const [first, second] = store.getState().log.ids;
    expect(typeof first).toBe("string");
    expect(first).not.toBe(second);
  });

  it("does NOT treat a repeated explicit id as a duplicate", async () => {
    const store = createStore<AppState, EM>({ name: "IdNotDedup", reducer: { log: logSpec } });

    // `id` is identity, not a dedup key: distinct payloads must both land.
    await store.emit("ui", "rename", { title: "A" }, { id: "same" });
    await store.emit("ui", "rename", { title: "B" }, { id: "same" });

    expect(store.getState().log.ids).toEqual(["same", "same"]);
  });

  it("honours a custom idFactory", async () => {
    let n = 0;
    const store = createStore<AppState, EM>({
      name: "IdFactory",
      reducer: { log: logSpec },
      idFactory: () => `evt-${++n}`,
    });

    await store.emit("ui", "tick", null);
    await store.emit("ui", "tick", null);

    expect(store.getState().log.ids).toEqual(["evt-1", "evt-2"]);
  });

  it("lets an explicit id win over the idFactory", async () => {
    const store = createStore<AppState, EM>({
      name: "IdFactoryOverride",
      reducer: { log: logSpec },
      idFactory: () => "from-factory",
    });

    await store.emit("ui", "tick", null, { id: "explicit" });
    await store.emit("ui", "tick", null);

    expect(store.getState().log.ids).toEqual(["explicit", "from-factory"]);
  });

  it("collapses identical payloads inside the dedup window by default", async () => {
    const store = createStore<AppState, EM>({
      name: "DedupOn",
      reducer: { log: logSpec },
      dedupWindowMs: 1000,
      idFactory: (() => {
        let n = 0;
        return () => `evt-${++n}`;
      })(),
    });

    await store.emit("ui", "tick", null);
    await store.emit("ui", "tick", null);

    // Baseline: this is the behaviour skipDedup exists to escape.
    expect(store.getState().log.ids).toEqual(["evt-1"]);
  });

  it("bypasses the store dedup window when skipDedup is set", async () => {
    const store = createStore<AppState, EM>({
      name: "SkipDedup",
      reducer: { log: logSpec },
      dedupWindowMs: 1000,
      idFactory: (() => {
        let n = 0;
        return () => `evt-${++n}`;
      })(),
    });

    await store.emit("ui", "tick", null, { skipDedup: true });
    await store.emit("ui", "tick", null, { skipDedup: true });
    await store.emit("ui", "tick", null, { skipDedup: true });

    expect(store.getState().log.ids).toEqual(["evt-1", "evt-2", "evt-3"]);
  });

  it("bypasses identity-based dedup too, taking precedence over dedupKey", async () => {
    const store = createStore<AppState, EM>({
      name: "SkipDedupKey",
      reducer: { log: logSpec },
      idFactory: (() => {
        let n = 0;
        return () => `evt-${++n}`;
      })(),
    });

    await store.emit("ui", "tick", null, { dedupKey: "k" });
    await store.emit("ui", "tick", null, { dedupKey: "k" }); // dropped
    await store.emit("ui", "tick", null, { dedupKey: "k", skipDedup: true }); // lands anyway

    // Two events land, not one. Note the ids are consecutive: a deduped emit returns
    // before an id is assigned, so it never consumes the idFactory.
    expect(store.getState().log.ids).toEqual(["evt-1", "evt-2"]);
  });

  it("leaves dedup active when skipDedup is explicitly false", async () => {
    const store = createStore<AppState, EM>({
      name: "SkipDedupFalse",
      reducer: { log: logSpec },
      dedupWindowMs: 1000,
      idFactory: (() => {
        let n = 0;
        return () => `evt-${++n}`;
      })(),
    });

    await store.emit("ui", "tick", null, { skipDedup: false });
    await store.emit("ui", "tick", null, { skipDedup: false });

    expect(store.getState().log.ids).toEqual(["evt-1"]);
  });
});
