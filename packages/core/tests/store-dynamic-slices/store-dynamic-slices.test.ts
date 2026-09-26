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

describe("typed growth at runtime", () => {
  // The runtime half of the decoration feature. The type half lives in
  // tests/store-types/store-extend.test-d.ts; these are the behaviours that must hold for
  // the types to be telling the truth.

  it("returns the same store object, re-typed", () => {
    // Decoration is type-level only. A wrapper or a copy would silently detach every
    // existing subscription, so identity is the contract.
    const store = createStore({ name: "IdentityStore", reducer: { base: baseReducer } });

    const widened = store.withSlice("added", {
      state: { n: 0 },
      when: { keys: [["ui", "increment"]] },
      reducer: (s: { n: number }) => s,
    } as ReducerSpec<{ n: number }, EM>);

    expect(widened).toBe(store);
  });

  it("leaves existing subscriptions and state untouched", async () => {
    const store = createStore({ name: "UntouchedStore", reducer: { base: baseReducer } });

    const coarse = vi.fn();
    store.subscribe(coarse);
    const events = vi.fn();
    store.onEvent("ui", "increment", events);

    await store.emit("ui", "increment", 1);
    const coarseBefore = coarse.mock.calls.length;
    const eventsBefore = events.mock.calls.length;

    store.withSlice("added", {
      state: { n: 0 },
      when: { keys: [["ui", "increment"]] },
      reducer: (s: { n: number }) => ({ n: s.n + 1 }),
    } as ReducerSpec<{ n: number }, EM>);

    await store.emit("ui", "increment", 2);

    // The pre-existing subscriptions still fire, and the pre-existing slice still reduces.
    expect(coarse.mock.calls.length).toBeGreaterThan(coarseBefore);
    expect(events.mock.calls.length).toBe(eventsBefore + 1);
    expect((store.getState() as any).base.value).toBe(3);
  });

  it("chains, and every slice ends up mounted and reducing", async () => {
    const store = createStore({ name: "ChainStore", reducer: { base: baseReducer } });

    const slice = (start: number): ReducerSpec<{ n: number }, EM> => ({
      state: { n: start },
      when: { keys: [["ui", "increment"]] },
      reducer: (s) => ({ n: s.n + 1 }),
    });

    store
      .withSlice("a", slice(10))
      .withMiddleware(() => true)
      .withSlice("b", slice(20));

    await store.emit("ui", "increment", 1);

    const state = store.getState() as any;
    expect(state.a.n).toBe(11);
    expect(state.b.n).toBe(21);
  });

  it("wakes a connect subscription when the slice it watches is mounted late", async () => {
    // registerReducer broadcast to `listeners` (so useSelector woke) but emitted nothing on
    // the connector bus (so useAtomicProp, useAtomicProps and the Suspense hooks never did).
    // A component subscribed to a path inside a decoration's slice simply never rendered,
    // which would have made the whole feature ship a documented-as-working path that does
    // not work.
    const store = createStore({ name: "LateMountStore", reducer: { base: baseReducer } });

    const seen: unknown[] = [];
    store.connect({ reducer: "late" as any, property: "n" }, (chg) => {
      seen.push(chg.newValue);
    });

    store.registerSlice("late", {
      state: { n: 7 },
      when: { keys: [["ui", "increment"]] },
      reducer: (s: { n: number }) => ({ n: s.n + 1 }),
    } as ReducerSpec<{ n: number }, EM>);

    expect(seen).toEqual([7]);

    // And it keeps working afterwards, through the ordinary commit path.
    await store.emit("ui", "increment", 1);
    expect(seen).toEqual([7, 8]);
  });

  it("returns a disposer that still works as a bare function", () => {
    // Back-compat: the return widened from a function to a callable object, so every
    // existing `const off = store.registerReducer(...); off();` must be untouched.
    const store = createStore({ name: "BackCompatStore", reducer: { base: baseReducer } });

    const off = store.registerReducer("tmp", {
      state: { n: 0 },
      when: { keys: [["ui", "increment"]] },
      reducer: (s: { n: number }) => s,
    } as ReducerSpec<{ n: number }, EM>);

    expect(typeof off).toBe("function");
    expect((store.getState() as any).tmp).toBeDefined();

    off();
    expect((store.getState() as any).tmp).toBeUndefined();
  });

  it("also exposes .store and .dispose on that return", () => {
    const store = createStore({ name: "RegistrationShapeStore", reducer: { base: baseReducer } });

    const reg = store.registerSlice(
      "tmp",
      {
        state: { n: 0 },
        when: { keys: [["ui", "increment"]] },
        reducer: (s: { n: number }) => s,
      } as ReducerSpec<{ n: number }, EM>,
      { owner: "@scope/pkg" },
    );

    expect(reg.store).toBe(store);
    reg.dispose();
    expect((store.getState() as any).tmp).toBeUndefined();
  });

  it("names the owner when a disposed slice is read again in development", () => {
    // The one place the type/runtime gap is catchable: after the disposer runs, a widened
    // type still promises the slice. Better a named error than `undefined` from a type that
    // said `number`.
    const store = createStore({ name: "DisposedReadStore", reducer: { base: baseReducer } });

    const reg = store.registerSlice(
      "gone",
      {
        state: { n: 0 },
        when: { keys: [["ui", "increment"]] },
        reducer: (s: { n: number }) => s,
      } as ReducerSpec<{ n: number }, EM>,
      { owner: "@scope/pkg" },
    );
    reg.dispose();

    expect(() => store.connect({ reducer: "gone" as any, property: "n" }, () => {})).toThrow(
      /@scope\/pkg/,
    );
  });

  it("lets a slice be remounted under the same name after disposal", () => {
    const store = createStore({ name: "RemountStore", reducer: { base: baseReducer } });
    const spec = {
      state: { n: 1 },
      when: { keys: [["ui", "increment"]] },
      reducer: (s: { n: number }) => s,
    } as ReducerSpec<{ n: number }, EM>;

    store.registerSlice("again", spec).dispose();
    store.registerSlice("again", spec);

    expect(() =>
      store.connect({ reducer: "again" as any, property: "n" }, () => {}),
    ).not.toThrow();
  });
});

describe("failures found in review", () => {
  it("hotReplace refuses before swapping anything, not half-way through", async () => {
    // replaceReducers throws rather than take over a slice a library owns, and hotReplace
    // ran middleware and effects first - so the refusal left the new module's middleware
    // running against the old reducers. A partial hot reload is harder to diagnose than a
    // refused one.
    const calls: string[] = [];
    const store = createStore({
      name: "HalfAppliedStore",
      reducer: { base: baseReducer },
      middleware: [
        (() => {
          calls.push("original");
          return true;
        }) as any,
      ],
    });
    store.registerSlice("owned", {
      state: { n: 0 },
      when: { keys: [["ui", "increment"]] },
      reducer: (s: { n: number }) => s,
    } as ReducerSpec<any, EM>);

    expect(() =>
      store.hotReplace({
        reducer: { base: baseReducer, owned: baseReducer } as any,
        middleware: [
          (() => {
            calls.push("replacement");
            return true;
          }) as any,
        ],
      }),
    ).toThrow(/owned/);

    calls.length = 0;
    await store.emit("ui", "increment", 1);

    // The original pipeline, untouched. Nothing was swapped.
    expect(calls).toEqual(["original"]);
  });

  it("keeps effect metadata that another live registration still shares", () => {
    // effectMeta is keyed by the effect *function*, and one function can back several
    // registrations. Deleting on the first disposal stripped the name and description of
    // the ones still live, which a panel then showed as unnamed.
    const store = createStore({ name: "SharedMetaStore", reducer: { base: baseReducer } });

    const shared = async () => {};
    const first = store.registerEffect({
      when: { keys: [["ui", "increment"]] },
      effect: shared,
      meta: { type: "effect", name: "shared" },
    });
    store.registerEffect({
      when: { keys: [["ui", "other"]] },
      effect: shared,
      meta: { type: "effect", name: "shared" },
    });

    first();

    const remaining = store.__devtoolsIntrospect().effects;
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.name).toBe("shared");
  });

  it("makes both disposers idempotent", () => {
    const store = createStore({ name: "IdempotentStore", reducer: { base: baseReducer } });
    const listener = vi.fn();
    store.subscribe(listener);

    const sliceOff = store.registerSlice("tmp", {
      state: { n: 0 },
      when: { keys: [["ui", "increment"]] },
      reducer: (s: { n: number }) => s,
    } as ReducerSpec<any, EM>);
    const mwOff = store.registerMiddleware(() => true);

    sliceOff();
    mwOff();
    const afterFirst = listener.mock.calls.length;

    // A second call used to re-announce the removal and re-broadcast to every listener,
    // for things that had already gone.
    sliceOff();
    mwOff();

    expect(listener.mock.calls.length).toBe(afterFirst);
  });
});
