import { describe, it, expect, vi } from "vitest";
import { createStore } from "../../src/store/Store";
import type { ReducerSpec, EffectSpec, MiddlewareSpec } from "../../src/types";

type EM = {
  ui: { increment: number; decrement: number };
  admin: { reset: void };
};

type State = {
  counter: { value: number };
};

const counterReducer: ReducerSpec<State["counter"], EM> = {
  state: { value: 0 },
  events: [["ui", "increment"], ["ui", "decrement"]],
  reducer(state, event) {
    if (event.channel === "ui" && event.type === "increment") {
      return { value: state.value + (event.payload as number) };
    }
    if (event.channel === "ui" && event.type === "decrement") {
      return { value: state.value - (event.payload as number) };
    }
    return state;
  },
};

describe("Store - __devtoolsIntrospect", () => {
  it("returns reducer names", () => {
    const store = createStore({
      name: "IntrospectStore",
      reducer: { counter: counterReducer },
    });

    const info = store.__devtoolsIntrospect();
    expect(info.reducers).toEqual([
      { name: "counter", when: undefined },
    ]);
  });

  it("returns keyed effects with metadata", () => {
    const store = createStore({
      name: "IntrospectStore",
      reducer: { counter: counterReducer },
      effects: [
        {
          events: [["ui", "increment"]],
          effect: vi.fn(),
          meta: { type: "effect", name: "logIncrement", description: "Logs increment events" },
        } as EffectSpec<any, EM>,
      ],
    });

    const info = store.__devtoolsIntrospect();
    expect(info.effects).toEqual([
      {
        channel: "ui",
        type: "increment",
        name: "logIncrement",
        description: "Logs increment events",
      },
    ]);
  });

  it("returns keyed effects without metadata", () => {
    const store = createStore({
      name: "IntrospectStore",
      reducer: { counter: counterReducer },
      effects: [
        {
          events: [["ui", "decrement"]],
          effect: vi.fn(),
        } as EffectSpec<any, EM>,
      ],
    });

    const info = store.__devtoolsIntrospect();
    expect(info.effects).toEqual([
      {
        channel: "ui",
        type: "decrement",
        name: undefined,
        description: undefined,
      },
    ]);
  });

  it("returns pattern-based effects with metadata", () => {
    const store = createStore({
      name: "IntrospectStore",
      reducer: { counter: counterReducer },
      effects: [
        {
          when: { any: true },
          effect: vi.fn(),
          meta: { type: "effect", name: "globalLogger", description: "Logs all events" },
        } as EffectSpec<any, EM>,
      ],
    });

    const info = store.__devtoolsIntrospect();
    expect(info.effects).toEqual([
      {
        channel: "*",
        type: "*",
        name: "globalLogger",
        description: "Logs all events",
      },
    ]);
  });

  it("returns pattern-based effects without metadata", () => {
    const store = createStore({
      name: "IntrospectStore",
      reducer: { counter: counterReducer },
      effects: [
        {
          when: { any: true },
          effect: vi.fn(),
        } as EffectSpec<any, EM>,
      ],
    });

    const info = store.__devtoolsIntrospect();
    expect(info.effects).toEqual([
      {
        channel: "*",
        type: "*",
        name: undefined,
        description: undefined,
      },
    ]);
  });

  it("returns middleware with metadata (MiddlewareSpec)", () => {
    const store = createStore({
      name: "IntrospectStore",
      reducer: { counter: counterReducer },
      middleware: [
        {
          when: { channel: "admin" },
          middleware: vi.fn(() => true),
          meta: { type: "middleware", name: "authGuard", description: "Guards admin events" },
        } as MiddlewareSpec<any, EM>,
      ],
    });

    const info = store.__devtoolsIntrospect();
    expect(info.middleware).toEqual([
      {
        name: "authGuard",
        description: "Guards admin events",
        when: { channel: "admin" },
      },
    ]);
  });

  it("returns middleware without metadata (bare function)", () => {
    const store = createStore({
      name: "IntrospectStore",
      reducer: { counter: counterReducer },
      middleware: [
        function myMiddleware() { return true; } as any,
      ],
    });

    const info = store.__devtoolsIntrospect();
    expect(info.middleware).toEqual([
      { name: "myMiddleware" },
    ]);
  });

  it("returns anonymous middleware function", () => {
    const store = createStore({
      name: "IntrospectStore",
      reducer: { counter: counterReducer },
      middleware: [
        (() => true) as any,
      ],
    });

    const info = store.__devtoolsIntrospect();
    // Anonymous arrow functions have empty string names
    expect(info.middleware).toEqual([
      { name: undefined },
    ]);
  });

  it("returns committed event subscriptions", () => {
    const store = createStore({
      name: "IntrospectStore",
      reducer: { counter: counterReducer },
    });

    store.onEvent("ui", "increment", vi.fn(), "committed");
    store.onEvent("ui", "decrement", vi.fn(), "committed");

    const info = store.__devtoolsIntrospect();
    expect(info.event).toContainEqual({ channel: "ui", type: "increment", phase: "committed" });
    expect(info.event).toContainEqual({ channel: "ui", type: "decrement", phase: "committed" });
  });

  it("returns uncommitted event subscriptions", () => {
    const store = createStore({
      name: "IntrospectStore",
      reducer: { counter: counterReducer },
    });

    store.onEvent("ui", "increment", vi.fn(), "uncommitted");

    const info = store.__devtoolsIntrospect();
    expect(info.event).toContainEqual({ channel: "ui", type: "increment", phase: "uncommitted" });
  });

  it("tracks coarse subscriber count", () => {
    const store = createStore({
      name: "IntrospectStore",
      reducer: { counter: counterReducer },
    });

    expect(store.__devtoolsIntrospect().coarse).toBe(0);

    const unsub1 = store.subscribe(vi.fn());
    const unsub2 = store.subscribe(vi.fn());
    expect(store.__devtoolsIntrospect().coarse).toBe(2);

    unsub1();
    expect(store.__devtoolsIntrospect().coarse).toBe(1);

    unsub2();
    expect(store.__devtoolsIntrospect().coarse).toBe(0);
  });

  it("reflects dynamically registered effects", () => {
    const store = createStore({
      name: "IntrospectStore",
      reducer: { counter: counterReducer },
    });

    expect(store.__devtoolsIntrospect().effects).toEqual([]);

    const unsub = store.registerEffect({
      events: [["ui", "increment"]],
      effect: vi.fn(),
      meta: { type: "effect", name: "dynamic", description: "Added at runtime" },
    });

    const info = store.__devtoolsIntrospect();
    expect(info.effects).toEqual([
      {
        channel: "ui",
        type: "increment",
        name: "dynamic",
        description: "Added at runtime",
      },
    ]);

    unsub();
    expect(store.__devtoolsIntrospect().effects).toEqual([]);
  });

  it("reflects dynamically registered middleware", () => {
    const store = createStore({
      name: "IntrospectStore",
      reducer: { counter: counterReducer },
    });

    expect(store.__devtoolsIntrospect().middleware).toEqual([]);

    const unsub = store.registerMiddleware(function logger() { return true; } as any);

    const info = store.__devtoolsIntrospect();
    expect(info.middleware).toEqual([
      { name: "logger" },
    ]);

    unsub();
    expect(store.__devtoolsIntrospect().middleware).toEqual([]);
  });

  it("returns combined keyed and pattern effects", () => {
    const store = createStore({
      name: "IntrospectStore",
      reducer: { counter: counterReducer },
      effects: [
        {
          events: [["ui", "increment"]],
          effect: vi.fn(),
          meta: { type: "effect", name: "keyedEffect" },
        } as EffectSpec<any, EM>,
        {
          when: { any: true },
          effect: vi.fn(),
          meta: { type: "effect", name: "patternEffect" },
        } as EffectSpec<any, EM>,
      ],
    });

    const info = store.__devtoolsIntrospect();
    expect(info.effects).toHaveLength(2);
    expect(info.effects[0].name).toBe("keyedEffect");
    expect(info.effects[1].name).toBe("patternEffect");
  });

  it("unsubscribed event handlers are not reported", () => {
    const store = createStore({
      name: "IntrospectStore",
      reducer: { counter: counterReducer },
    });

    const unsub = store.onEvent("ui", "increment", vi.fn(), "committed");
    expect(store.__devtoolsIntrospect().event).toHaveLength(1);

    unsub();
    expect(store.__devtoolsIntrospect().event).toHaveLength(0);
  });

  it("returns atomic (connect) subscriptions", () => {
    const store = createStore({
      name: "IntrospectStore",
      reducer: { counter: counterReducer },
    });

    expect(store.__devtoolsIntrospect().atomic).toEqual([]);

    const unsub1 = store.connect({ reducer: "counter", property: "value" }, vi.fn());
    const unsub2 = store.connect({ reducer: "counter", property: "value" }, vi.fn());

    const info = store.__devtoolsIntrospect();
    expect(info.atomic).toHaveLength(2);
    expect(info.atomic[0]).toEqual({ reducer: "counter", property: "value" });
    expect(info.atomic[1]).toEqual({ reducer: "counter", property: "value" });

    unsub1();
    expect(store.__devtoolsIntrospect().atomic).toHaveLength(1);

    unsub2();
    expect(store.__devtoolsIntrospect().atomic).toHaveLength(0);
  });

  it("returns all subscription types together", () => {
    const store = createStore({
      name: "IntrospectStore",
      reducer: { counter: counterReducer },
      effects: [
        {
          events: [["ui", "increment"]],
          effect: vi.fn(),
          meta: { type: "effect", name: "testEffect" },
        } as EffectSpec<any, EM>,
      ],
      middleware: [
        {
          when: { any: true },
          middleware: vi.fn(() => true),
          meta: { type: "middleware", name: "testMw", description: "Test middleware" },
        } as MiddlewareSpec<any, EM>,
      ],
    });

    store.connect({ reducer: "counter", property: "value" }, vi.fn());
    store.onEvent("ui", "increment", vi.fn(), "committed");
    store.subscribe(vi.fn());

    const info = store.__devtoolsIntrospect();
    expect(info.reducers).toHaveLength(1);
    expect(info.effects).toHaveLength(1);
    expect(info.middleware).toHaveLength(1);
    expect(info.atomic).toHaveLength(1);
    expect(info.event).toHaveLength(1);
    expect(info.coarse).toBe(1);
  });
});
