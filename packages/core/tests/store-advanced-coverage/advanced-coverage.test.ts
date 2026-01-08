import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createStore,
  Store,
  typedEvents,
  typedActions,
  type EventMapBase,
  type ReducerSpec,
  type EffectSpec,
  type MiddlewareFunction,
} from "../../src";

type EM = {
  ui: {
    inc: number;
    noChange: null;
    dangerous: null;
  };
};

type CounterState = { value: number };

function makeBaseReducers(): Record<"counter", ReducerSpec<CounterState, EM>> {
  return {
    counter: {
      state: { value: 0 },
      events: [
        ["ui", "inc"],
        ["ui", "noChange"],
        ["ui", "dangerous"],
      ],
      reducer(state, evt) {
        if (evt.channel === "ui" && evt.type === "inc") {
          return { value: state.value + (evt.payload as number) };
        }
        if (evt.channel === "ui" && evt.type === "noChange") {
          // return a new object but with the same deep value
          return { value: state.value };
        }
        return state;
      },
    },
  };
}

describe("Store advanced coverage", () => {
  let originalNodeEnv: string | undefined;
  let originalWindow: any;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    originalWindow = (globalThis as any).window;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    (globalThis as any).window = originalWindow;
    vi.restoreAllMocks();
  });

  it("dispose clears cleanup timer and processed IDs and is idempotent", () => {
    const store = createStore({
      name: "CoverageStore-dispose",
      reducer: makeBaseReducers(),
    });

    const anyStore = store as any;

    // sanity: timer exists and we can simulate some processed IDs
    expect(anyStore.eventIdCleanupTimer).toBeTruthy();
    anyStore.processedEventIds.add(Symbol("x"));
    expect(anyStore.processedEventIds.size).toBe(1);

    store.dispose();

    expect(anyStore.eventIdCleanupTimer).toBeNull();
    expect(anyStore.processedEventIds.size).toBe(0);

    // second call should be a no-op, but still covered
    store.dispose();
    expect(anyStore.eventIdCleanupTimer).toBeNull();
  });

  it("__applyExternalState short-circuits when slices are reference equal", () => {
    const store = createStore({
      name: "CoverageStore-external-noop",
      reducer: makeBaseReducers(),
    });

    const anyStore = store as any;
    const stateBefore = store.getState();
    const listener = vi.fn();
    store.subscribe(listener);

    // pass the exact same reference; should early-return per slice
    anyStore.__applyExternalState(stateBefore);

    expect(store.getState()).toBe(stateBefore);
    expect(listener).not.toHaveBeenCalled();
  });

  it("__applyExternalState with deep-equal new slices updates state but emits no fine-grained changes", () => {
    const store = createStore({
      name: "CoverageStore-external-deep-equal",
      reducer: makeBaseReducers(),
    });

    const anyStore = store as any;
    const stateBefore = store.getState();

    const coarse = vi.fn();
    const fine = vi.fn();
    store.subscribe(coarse);
    store.connect({ reducer: "counter", property: "value" }, fine);

    // new plain object, deep-equal to the current one
    const nextPlain = {
      counter: { value: stateBefore.counter.value },
    };

    anyStore.__applyExternalState(nextPlain);

    const stateAfter = store.getState();
    // state ref changed (we re-freeze and shallow-clone)
    expect(stateAfter).not.toBe(stateBefore);
    expect(stateAfter.counter.value).toBe(stateBefore.counter.value);

    // coarser subscribers see a change
    expect(coarse).toHaveBeenCalledTimes(1);
    // but fine-grained diff detected no leaf changes, so no connector events
    expect(fine).not.toHaveBeenCalled();
  });

  it("replaceReducers re-inits DevTools baseline", async () => {
    const initSpy = vi.fn();
    const sendSpy = vi.fn();
    const subscribeSpy = vi.fn();

    (globalThis as any).window = {
      __REDUX_DEVTOOLS_EXTENSION__: {
        connect() {
          return {
            init: initSpy,
            send: sendSpy,
            subscribe: subscribeSpy,
          };
        },
      },
    };

    process.env.NODE_ENV = "test";

    const store = createStore({
      name: "CoverageStore-devtools-replaceReducers",
      reducer: makeBaseReducers(),
    });

    initSpy.mockClear(); // ignore constructor init

    const nextReducers: Record<"counter", ReducerSpec<CounterState, EM>> = {
      counter: {
        state: { value: 10 },
        events: [["ui", "inc"]],
        reducer: (state, evt) => {
          if (evt.channel === "ui" && evt.type === "inc") {
            return { value: state.value + (evt.payload as number) };
          }
          return state;
        },
      },
    };

    (store as any).replaceReducers(nextReducers, { preserveState: false });

    // DevTools baseline should be re-initialized with the current state
    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(initSpy).toHaveBeenCalledWith(store.getState());
  });

  it("hotReplace can independently replace middleware, effects, and reducers", async () => {
    const logs: string[] = [];

    const store = createStore({
      name: "CoverageStore-hotReplace",
      reducer: makeBaseReducers(),
      middleware: [
        (state, event) => {
          logs.push(`mw0:${String(event.type)}`);
          return true;
        },
      ],
      effects: [
        {
          events: [["ui", "inc"]],
          effect: async (evt, getState) => {
            logs.push(`eff0:${getState().counter.value}`);
          },
        },
      ] satisfies Array<EffectSpec<any, EM>>,
    });

    // sanity: original middleware/effect are wired
    await store.emit("ui", "inc", 1);
    expect(logs.some((l) => l.startsWith("mw0:"))).toBe(true);
    expect(logs.some((l) => l.startsWith("eff0:"))).toBe(true);

    // clear logs so we only see the *new* pipeline
    logs.length = 0;

    // replace only middleware
    store.hotReplace({
      middleware: [
        (state, event) => {
          logs.push(`mw1:${String(event.type)}`);
          return true;
        },
      ],
    });

    // replace only effects
    store.hotReplace({
      effects: [
        {
          events: [["ui", "inc"]],
          effect: async (evt, getState) => {
            logs.push(`eff1:${getState().counter.value}`);
          },
        },
      ] satisfies Array<EffectSpec<any, EM>>,
    });

    // replace only reducers (with preserveState=true path hit)
    const newReducers = {
      counter: {
        state: { value: 5 },
        events: [["ui", "inc"]],
        reducer: (state: CounterState, evt: EventUnion<EM>): CounterState => {
          if (evt.channel === "ui" && evt.type === "inc") {
            return { value: state.value + (evt.payload as number) };
          }
          return state;
        },
      },
    } satisfies Record<"counter", ReducerSpec<CounterState, EM>>;

    store.hotReplace({
      reducer: newReducers as Record<"counter", ReducerSpec<CounterState, EM>>,
      preserveState: true,
    });

    // this should go through the *new* middleware / effects / reducers
    await store.emit("ui", "inc", 1);

    // confirm that new middleware & effects ran
    expect(logs.some((l) => l.startsWith("mw1:"))).toBe(true);
    expect(logs.some((l) => l.startsWith("eff1:"))).toBe(true);

    // and make sure the old ones didn’t re-run after replacement
    expect(logs.some((l) => l.startsWith("mw0:"))).toBe(false);
    expect(logs.some((l) => l.startsWith("eff0:"))).toBe(false);
  });

  it("mountSlice handles specs with empty events array and unmountSlice path without prior subscriptions", () => {
    const store = createStore({
      name: "CoverageStore-mount-unmount",
      reducer: {
        // this slice has no events wired
        counter: {
          state: { value: 0 },
          events: [],
          reducer: (s: CounterState) => s,
        },
      } satisfies Record<"counter", ReducerSpec<CounterState, EM>>,
    });

    const anyStore = store as any;

    // unmount a non-existent slice -> covers branch where there are no unsubs
    anyStore.unmountSlice("doesNotExist", { deleteState: true });
  });

  it("unmountSlice catches errors thrown by slice unsubscribers", () => {
    const store = createStore({
      name: "CoverageStore-unmount-error",
      reducer: makeBaseReducers(),
    });

    const anyStore = store as any;

    // Overwrite sliceUnsubs to simulate unsub functions that throw
    const throwingUnsub = vi.fn(() => {
      throw new Error("boom");
    });

    anyStore.sliceUnsubs.set("counter", [throwingUnsub]);

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => { });

    anyStore.unmountSlice("counter", { deleteState: true });

    expect(throwingUnsub).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });

  it("getAtPath handles empty path, leading dots and missing branches", () => {
    const store = createStore({
      name: "CoverageStore-getAtPath",
      reducer: makeBaseReducers(),
    });

    const anyStore = store as any;
    const obj = {
      a: {
        b: [{ x: 1 }, { x: 2 }],
      },
    };

    // empty path returns the object itself
    expect(anyStore.getAtPath(obj, "")).toBe(obj);

    // leading dot is ignored
    expect(anyStore.getAtPath(obj, ".a.b.1.x")).toBe(2);

    // missing branch -> undefined
    expect(anyStore.getAtPath(obj, "a.c.d")).toBeUndefined();
  });

  it("buildAncestorPaths handles empty and dotted paths", () => {
    // empty -> []
    expect(Store.buildAncestorPaths("")).toEqual([]);

    // dotted, with leading dot
    expect(Store.buildAncestorPaths(".x.y.z")).toEqual(["x", "x.y", "x.y.z"]);
  });

  it("emit handles middleware throwing and outer emit queue error path", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => { });

    const store = createStore({
      name: "CoverageStore-emit-errors",
      reducer: makeBaseReducers(),
    });

    const anyStore = store as any;

    // 1) middleware that throws -> caught inside middleware loop, cancel propagation
    const throwingMw: MiddlewareFunction<any, EM> = () => {
      throw new Error("mw-fail");
    };

    const offMw = store.registerMiddleware(throwingMw);

    await store.emit("ui", "dangerous", null);

    expect(errorSpy).toHaveBeenCalledWith("Middleware error:", expect.any(Error));

    // Remove the throwing middleware so we can reach reducerBus.emit
    offMw();

    // 2) outer try/catch: force reducerBus.emit itself to throw
    const originalEmit = anyStore.reducerBus.emit.bind(anyStore.reducerBus);
    anyStore.reducerBus.emit = () => {
      throw new Error("bus-fail");
    };

    await store.emit("ui", "inc", 1);

    // restore to avoid breaking other tests
    anyStore.reducerBus.emit = originalEmit;

    // outer logger should have been triggered
    expect(
      errorSpy.mock.calls.some((args) =>
        String(args[0]).startsWith("Emit queue error:"),
      ),
    ).toBe(true);
  });


  it("dispatch emits events and logs a deprecation warning in non-production", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "test";

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => { });

    const store = createStore({
      name: "CoverageStore-dispatch",
      reducer: makeBaseReducers(),
    });

    const before = store.getState().counter.value;

    // use dispatch, not emit
    await store.dispatch("ui", "inc", 2);

    const after = store.getState().counter.value;

    expect(after).toBe(before + 2);
    expect(warnSpy).toHaveBeenCalledWith(
      "[@quojs/core] `store.dispatch()` is deprecated and will be removed in v1.0.0. Use `store.emit()` instead.",
    );

    warnSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });


  it("typedEvents and typedActions helper functions return typed EventKeys", () => {
    type LocalEM = {
      ui: { inc: number; dec: number };
      data: { loaded: string[] };
    };

    const makeEvents = typedEvents<LocalEM>([]);
    const makeActions = typedActions<LocalEM>([]); // deprecated alias

    const uiKeys = makeEvents("ui", ["inc", "dec"] as const);
    const dataKeys = makeActions("data", ["loaded"] as const);

    expect(uiKeys).toEqual([
      ["ui", "inc"],
      ["ui", "dec"],
    ]);
    expect(dataKeys).toEqual([["data", "loaded"]]);
  });
});
