import { describe, it, expect, vi } from "vitest";

import { createStore } from "../../src/store/Store";
import type { EffectSpec, MiddlewareFunction, ReducerSpec } from "../../src/types";

type EmitEM = {
  ui: {
    increment: number;
    start: null;
  };
};
type CounterState = { value: number };
type AppState = { counter: CounterState };

const counterSpec: ReducerSpec<CounterState, EmitEM> = {
  state: { value: 0 },
  when: { keys: [
    ["ui", "increment"],
    ["ui", "start"],
  ] },
  reducer(state, event) {
    if (event.type === "increment") {
      return { value: state.value + (event.payload as number) };
    }
    return state;
  },
};

describe("Store - emit semantics (C3)", () => {
  it("updates state synchronously after emit, even with middleware present", async () => {
    const passthrough: MiddlewareFunction<AppState, EmitEM> = () => true;
    const store = createStore({
      name: "SyncEmit",
      reducer: { counter: counterSpec },
      middleware: [passthrough],
    });

    // Not awaited: the whole reduce phase (middleware + reducers) runs
    // synchronously, so getState() is correct the moment emit() returns.
    const done = store.emit("ui", "increment", 5);
    expect(store.getState().counter.value).toBe(5);

    await done;
  });

  it("notifies coarse subscribers synchronously within emit", () => {
    const store = createStore({ name: "CoarseSync", reducer: { counter: counterSpec } });
    let notified = 0;
    store.subscribe(() => {
      notified++;
    });

    void store.emit("ui", "increment", 1); // not awaited
    expect(notified).toBe(1);
    expect(store.getState().counter.value).toBe(1);
  });

  it("resolves the emit promise only after this event's effects complete", async () => {
    const order: string[] = [];
    const store = createStore({ name: "PromiseEmit", reducer: { counter: counterSpec } });

    const effect: EffectSpec<Readonly<AppState>, EmitEM> = {
      when: { keys: [["ui", "increment"]] },
      effect: async () => {
        await new Promise((r) => setTimeout(r, 10));
        order.push("effect-done");
      },
    };
    store.registerEffect(effect);

    await store.emit("ui", "increment", 1);
    order.push("emit-resolved");

    expect(order).toEqual(["effect-done", "emit-resolved"]);
  });

  it("re-entrant emit inside an effect resolves only after it is fully processed", async () => {
    const order: string[] = [];
    const store = createStore({ name: "Reentrant", reducer: { counter: counterSpec } });

    const outer: EffectSpec<Readonly<AppState>, EmitEM> = {
      when: { keys: [["ui", "start"]] },
      effect: async (_e, _getState, emit) => {
        order.push("outer:before-nested");
        await emit("ui", "increment", 1);
        order.push("outer:after-nested");
      },
    };
    const nested: EffectSpec<Readonly<AppState>, EmitEM> = {
      when: { keys: [["ui", "increment"]] },
      effect: async () => {
        await new Promise((r) => setTimeout(r, 5));
        order.push("nested:effect-done");
      },
    };
    store.registerEffect(outer);
    store.registerEffect(nested);

    await store.emit("ui", "start", null);

    // The `await emit(...)` inside the outer effect waited for the nested event's
    // own effect to finish before continuing — honest promise, no deadlock.
    expect(order).toEqual(["outer:before-nested", "nested:effect-done", "outer:after-nested"]);
    expect(store.getState().counter.value).toBe(1);
  });
});

describe("why an event did not commit", () => {
  // `committed: false` used to arrive from three unrelated causes through one shared frozen
  // object, so a caller could not tell a guard refusing an action from a double-click being
  // collapsed. Those want opposite responses: show the refusal, say nothing about the
  // duplicate.

  type EM = { ui: { go: number } };
  const noop: ReducerSpec<{ n: number }, EM> = {
    state: { n: 0 },
    when: { keys: [["ui", "go"]] },
    reducer: (s) => s,
  };

  it("says nothing when the event did commit", async () => {
    const store = createStore({ name: "ReasonOk", reducer: { s: noop } });
    const result = await store.emit("ui", "go", 1);

    expect(result.committed).toBe(true);
    expect(result.reason).toBeUndefined();
    expect(result.vetoedBy).toBeUndefined();
  });

  it("reports a veto, and names the middleware that refused", async () => {
    const store = createStore({
      name: "ReasonVeto",
      reducer: { s: noop },
      middleware: [
        {
          when: { any: true },
          middleware: () => false,
          meta: { type: "middleware", name: "quotaGuard" },
        },
      ],
    });

    const result = await store.emit("ui", "go", 1);

    expect(result).toMatchObject({ committed: false, reason: "vetoed", vetoedBy: "quotaGuard" });
  });

  it("falls back to a bare middleware's own function name", async () => {
    const store = createStore({ name: "ReasonVetoFn", reducer: { s: noop } });
    store.registerMiddleware(function adminOnly() {
      return false;
    });

    expect(await store.emit("ui", "go", 1)).toMatchObject({ vetoedBy: "adminOnly" });
  });

  it("leaves vetoedBy absent when the middleware is anonymous", async () => {
    const store = createStore({ name: "ReasonVetoAnon", reducer: { s: noop } });
    store.registerMiddleware(() => false);

    const result = await store.emit("ui", "go", 1);
    expect(result.reason).toBe("vetoed");
    expect(result.vetoedBy).toBeUndefined();
  });

  it("reports a veto when middleware throws, too", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const store = createStore({ name: "ReasonThrow", reducer: { s: noop } });
      store.registerMiddleware(function exploder() {
        throw new Error("boom");
      });

      expect(await store.emit("ui", "go", 1)).toMatchObject({
        reason: "vetoed",
        vetoedBy: "exploder",
      });
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("distinguishes a suppressed duplicate from a veto", async () => {
    // The distinction that motivates the whole field: a submit button must show a refusal
    // and stay silent about a double-click.
    const store = createStore({
      name: "ReasonDedup",
      reducer: { s: noop },
      dedupWindowMs: 1_000,
    });

    const first = await store.emit("ui", "go", 1);
    const second = await store.emit("ui", "go", 1);

    expect(first.committed).toBe(true);
    expect(second).toMatchObject({ committed: false, reason: "deduped" });
    expect(second.vetoedBy).toBeUndefined();
  });
});

describe("onSubscriberError", () => {
  type EM = { ui: { go: number } };
  const noop: ReducerSpec<{ n: number }, EM> = {
    state: { n: 0 },
    when: { keys: [["ui", "go"]] },
    reducer: (s) => s,
  };

  it("reports a throwing subscriber, and does not stop the others", async () => {
    // The fourth of a set. Reducers, effects, rejections and cascades all had a hook;
    // subscribers had the console and nothing else, so an application could not route a
    // failing one to its own error reporting.
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const onSubscriberError = vi.fn();
      const after = vi.fn();
      const store = createStore({
        name: "SubscriberErrors",
        reducer: { s: noop },
        onSubscriberError,
      });

      store.onEvent("ui", "go", () => {
        throw new Error("subscriber exploded");
      });
      store.onEvent("ui", "go", after);

      await store.emit("ui", "go", 1);

      expect(after).toHaveBeenCalledTimes(1);
      expect(onSubscriberError).toHaveBeenCalledTimes(1);
      const [err, event, phase] = onSubscriberError.mock.calls[0]!;
      expect((err as Error).message).toBe("subscriber exploded");
      expect(event).toMatchObject({ channel: "ui", type: "go" });
      expect(phase).toBe("committed");
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("reports a rejected promise from an async subscriber", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const onSubscriberError = vi.fn();
      const store = createStore({
        name: "SubscriberAsyncErrors",
        reducer: { s: noop },
        onSubscriberError,
      });

      store.onEvent("ui", "go", async () => {
        throw new Error("async exploded");
      });

      await store.emit("ui", "go", 1);
      await Promise.resolve();

      expect(onSubscriberError).toHaveBeenCalledTimes(1);
    } finally {
      errorSpy.mockRestore();
    }
  });
});
