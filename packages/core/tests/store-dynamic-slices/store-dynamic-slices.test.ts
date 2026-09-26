import { describe, it, expect, vi } from "vitest";
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

  it("replaceReducers preserves a slice registered at runtime, and its state", async () => {
    // This asserted the opposite. `replace*` exists to replace what the *application*
    // authored; a slice a library mounted with `registerReducer` was never in that set, and
    // no caller of `replaceReducers(myReducers)` means "and also delete the slice a
    // decoration mounted, along with its state". The old behaviour meant the HMR line core's
    // own docstring recommends deleted a library's slice on the first file save, with no
    // error and no warning.
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
    await store.emit("ui", "increment", 1);
    expect((store.getState() as any).extra.flag).toBe(true);

    store.replaceReducers({ base: baseReducer } as any, { preserveState: true });

    const state: any = store.getState();
    expect(state.extra).toBeDefined();
    // Its state survives too, not just its registration.
    expect(state.extra.flag).toBe(true);

    // And it still reduces, so the reducer-bus wiring was not quietly dropped.
    await store.emit("ui", "increment", 1);
    expect((store.getState() as any).extra.flag).toBe(false);
  });

  it("removes a runtime slice under { scope: \"all\" }", () => {
    // The escape hatch restores the old semantics exactly, for a caller that genuinely wants
    // them - a test harness resetting a store between cases.
    const store = createStore({
      name: "DynamicSlicesScopeAll",
      reducer: { base: baseReducer },
    });

    store.registerReducer("extra", {
      state: { flag: false },
      when: { keys: [["ui", "increment"]] },
      reducer: (s: { flag: boolean }) => s,
    } as ReducerSpec<{ flag: boolean }, EM>);

    store.replaceReducers({ base: baseReducer } as any, { scope: "all" });

    expect((store.getState() as any).extra).toBeUndefined();
  });

  it("still replaces spec slices, which is what replace* is for", () => {
    // The regression guard for the constructor's `spec` tag. Without it, `replace*` would
    // find nothing of spec provenance and silently become a no-op - and no other test here
    // would notice, because they all assert that things are *preserved*.
    const store = createStore({
      name: "DynamicSlicesSpecStillReplaced",
      reducer: {
        base: baseReducer,
        doomed: {
          state: { n: 0 },
          when: { keys: [["ui", "increment"]] },
          reducer: (s: { n: number }) => s,
        } as ReducerSpec<{ n: number }, EM>,
      },
    });

    expect((store.getState() as any).doomed).toBeDefined();

    store.replaceReducers({ base: baseReducer } as any);

    expect((store.getState() as any).doomed).toBeUndefined();
  });

  it("refuses to take over a runtime slice, and changes nothing when it refuses", () => {
    // An application authoring a slice a library owns is a real mistake, and a silent
    // takeover is the worst outcome: the library keeps a disposer for a slice that is no
    // longer its own. Throwing half-applied would be worse still.
    const store = createStore({
      name: "DynamicSlicesCollision",
      reducer: { base: baseReducer },
    });

    store.registerReducer("owned", {
      state: { n: 7 },
      when: { keys: [["ui", "increment"]] },
      reducer: (s: { n: number }) => s,
    } as ReducerSpec<{ n: number }, EM>);

    const before = store.getState();

    expect(() =>
      store.replaceReducers({
        base: baseReducer,
        owned: {
          state: { n: 0 },
          when: { keys: [["ui", "increment"]] },
          reducer: (s: { n: number }) => s,
        },
      } as any),
    ).toThrow(/owned/);

    // Nothing moved.
    expect(store.getState()).toBe(before);
    expect((store.getState() as any).owned.n).toBe(7);
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

describe("provenance across the other seams", () => {
  it("does not warn when a snapshot predates a runtime slice", () => {
    // A snapshot taken before a decoration mounted legitimately lacks its slice. Warning
    // would fire on every step of every time-travel scrub and point at nothing actionable.
    const store = createStore({
      name: "SnapshotProvenanceStore",
      reducer: { base: baseReducer },
      devtools: { allowReplay: true },
    });
    store.registerReducer("late", {
      state: { n: 0 },
      when: { keys: [["ui", "increment"]] },
      reducer: (s: { n: number }) => s,
    } as ReducerSpec<{ n: number }, EM>);

    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      store.__applyExternalState({ base: { value: 3 } });

      const warnings = warn.mock.calls.map((c) => String(c[0])).join("\n");
      expect(warnings).not.toContain("late");
      // The slice is retained, not blanked.
      expect((store.getState() as any).late).toEqual({ n: 0 });
    } finally {
      warn.mockRestore();
    }
  });

  it("still warns for a spec slice the snapshot forgot", () => {
    // The guard is narrow: a snapshot missing a slice the application authored is still a
    // real problem worth naming.
    const store = createStore({
      name: "SnapshotSpecWarnStore",
      reducer: {
        base: baseReducer,
        other: {
          state: { n: 0 },
          when: { keys: [["ui", "increment"]] },
          reducer: (s: { n: number }) => s,
        } as ReducerSpec<{ n: number }, EM>,
      },
      devtools: { allowReplay: true },
    });

    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      store.__applyExternalState({ base: { value: 3 } });
      expect(warn.mock.calls.map((c) => String(c[0])).join("\n")).toContain("other");
    } finally {
      warn.mockRestore();
    }
  });

  it("clears provenance on dispose", () => {
    const store = createStore({
      name: "DisposeProvenanceStore",
      reducer: { base: baseReducer },
    });
    store.registerReducer("late", {
      state: { n: 0 },
      when: { keys: [["ui", "increment"]] },
      reducer: (s: { n: number }) => s,
    } as ReducerSpec<{ n: number }, EM>);

    store.dispose();

    const info = store.__devtoolsIntrospect();
    expect(info.middleware).toEqual([]);
    expect((store as any).sliceOrigin.size).toBe(0);
    expect((store as any).sliceOwner.size).toBe(0);
  });

  it("reports owner for introspection without letting it decide preservation", () => {
    // `owner` is a label. If preservation depended on it, a library that forgot to pass one
    // would have its state deleted on the next hot reload - correctness must not rest on
    // anyone remembering a string.
    const store = createStore({
      name: "OwnerStore",
      reducer: { base: baseReducer },
    });

    store.registerReducer("named", {
      state: { n: 0 },
      when: { keys: [["ui", "increment"]] },
      reducer: (s: { n: number }) => s,
    } as ReducerSpec<{ n: number }, EM>);
    store.registerReducer("anonymous", {
      state: { n: 0 },
      when: { keys: [["ui", "increment"]] },
      reducer: (s: { n: number }) => s,
    } as ReducerSpec<{ n: number }, EM>);

    store.replaceReducers({ base: baseReducer } as any);

    const state = store.getState() as any;
    expect(state.named).toBeDefined();
    expect(state.anonymous).toBeDefined();

    const origins = store
      .__devtoolsIntrospect()
      .reducers.filter((r) => r.name !== "base")
      .map((r) => r.origin);
    expect(origins).toEqual(["dynamic", "dynamic"]);
  });
});
