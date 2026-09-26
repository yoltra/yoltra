import { describe, it, expect, vi } from "vitest";

import { createStore } from "../../src/store/Store";
import type { DeepReadonly, MiddlewareFunction, EffectSpec } from "../../src/types";
import { makeStore, reducerSpec } from "./support/setupStore";
import type { AppState, AppEvents } from "./support/setupStore";

describe("Store - middleware and effects", () => {
  it("runs middleware in order and allows cancellation", async () => {
    const store = makeStore();

    const order: string[] = [];

    const mw1: MiddlewareFunction<AppState, AppEvents> = (_state, _event) => {
      order.push("mw1");
      return true;
    };

    const mw2: MiddlewareFunction<AppState, AppEvents> = (_state, event) => {
      order.push("mw2");
      if (event.type === "dangerous") return false;
      return true;
    };

    const mw3: MiddlewareFunction<AppState, AppEvents> = () => {
      order.push("mw3");
      return true;
    };

    store.registerMiddleware(mw1);
    store.registerMiddleware(mw2);
    store.registerMiddleware(mw3);

    await store.emit("ui", "increment", 1);
    await store.emit("ui", "dangerous", null);

    const state = store.getState();
    expect(state.counter.value).toBe(1);
    expect(order).toEqual(["mw1", "mw2", "mw3", "mw1", "mw2"]);
  });

  it("logs middleware errors and cancels propagation", async () => {
    const store = makeStore();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const mw1: MiddlewareFunction<AppState, AppEvents> = () => {
      throw new Error("mw boom");
    };

    store.registerMiddleware(mw1);

    await store.emit("ui", "increment", 1);

    // error logged, but state should remain unchanged because propagation stops
    const state = store.getState();
    expect(state.counter.value).toBe(0);
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("runs effects after reducers and passes final state", async () => {
    const store = makeStore();
    const calls: Array<{ payload: any; value: number }> = [];

    const effectSpec: EffectSpec<Readonly<AppState>, AppEvents> = {
      when: { keys: [["ui", "increment"]] },
      effect: async (evt, getState) => {
        const s = getState();
        calls.push({ payload: evt.payload, value: s.counter.value });
      },
    };

    store.registerEffect(effectSpec);

    await store.emit("ui", "increment", 2);
    await store.emit("ui", "increment", 3);

    expect(calls).toEqual([
      { payload: 2, value: 2 },
      { payload: 3, value: 5 },
    ]);
  });

  it("logs effect errors but continues processing other effects", async () => {
    const store = makeStore();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const calls: number[] = [];

    const badEffect: EffectSpec<Readonly<AppState>, AppEvents> = {
      when: { keys: [["ui", "increment"]] },
      effect: async () => {
        throw new Error("effect boom");
      },
    };

    const goodEffect: EffectSpec<Readonly<AppState>, AppEvents> = {
      when: { keys: [["ui", "increment"]] },
      effect: async (_evt, getState) => {
        calls.push(getState().counter.value);
      },
    };

    store.registerEffect(badEffect);
    store.registerEffect(goodEffect);

    await store.emit("ui", "increment", 1);

    expect(calls).toEqual([1]);
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("delivers effect errors to onEffectError and still resolves emit() (CORE-3)", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const seen: Array<{ error: unknown; channel: string; type: string }> = [];

    const store = createStore({
      name: "EffectErrorStore",
      reducer: { counter: reducerSpec },
      onEffectError: (error, event) => {
        seen.push({ error, channel: event.channel, type: event.type });
      },
    });

    const boom = new Error("effect boom");
    store.registerEffect({
      when: { keys: [["ui", "increment"]] },
      effect: async () => {
        throw boom;
      },
    });

    // await emit() must RESOLVE (never reject) even though the effect throws...
    // A failing effect never rejects the emit — the reduce already committed synchronously.
    await expect(store.emit("ui", "increment", 1)).resolves.toMatchObject({ committed: true });

    // ...and the error must have been delivered to onEffectError with its event,
    // and still logged to the console (the hook augments, not replaces, logging).
    expect(seen).toEqual([{ error: boom, channel: "ui", type: "increment" }]);
    expect(errorSpy).toHaveBeenCalled();

    // The synchronous reduce still committed — effect failure never rolls back state.
    expect(store.getState().counter.value).toBe(1);

    errorSpy.mockRestore();
  });

  it("replaceMiddleware replaces spec middleware and preserves runtime middleware", async () => {
    // This asserted that `replaceMiddleware` removed everything. A middleware registered at
    // runtime was never part of what the caller is replacing, and the disposer it handed
    // back silently became a no-op afterwards.
    const store = makeStore();
    const logs: string[] = [];

    const mwDynamic: MiddlewareFunction<DeepReadonly<AppState>, AppEvents> = () => {
      logs.push("dynamic");
      return true;
    };
    store.registerMiddleware(mwDynamic);

    await store.emit("ui", "increment", 1);
    expect(logs).toEqual(["dynamic"]);

    const mwSpec: MiddlewareFunction<DeepReadonly<AppState>, AppEvents> = () => {
      logs.push("spec");
      return true;
    };
    store.replaceMiddleware([mwSpec]);

    logs.length = 0;
    await store.emit("ui", "increment", 2);

    // Both run, and the order is reproduced rather than incidental: spec middleware exists
    // at construction and dynamic middleware is appended after it, so a preserving replace
    // must put the new spec entries first. A dynamic auth guard moving from first to last
    // changes which events get vetoed.
    expect(logs).toEqual(["spec", "dynamic"]);
  });

  it("replaceMiddleware removes runtime middleware under { scope: \"all\" }", async () => {
    const store = makeStore();
    const logs: string[] = [];

    store.registerMiddleware((() => {
      logs.push("dynamic");
      return true;
    }) as MiddlewareFunction<DeepReadonly<AppState>, AppEvents>);

    store.replaceMiddleware([], { scope: "all" });

    await store.emit("ui", "increment", 1);
    expect(logs).toEqual([]);
  });

  it("still replaces spec middleware, which is what replaceMiddleware is for", async () => {
    // The regression guard for the constructor's `spec` tag. Miss that tag and
    // `replaceMiddleware` finds nothing of spec provenance and quietly becomes a no-op,
    // which every other test here would happily pass.
    const logs: string[] = [];
    const store = createStore({
      name: "SpecMiddlewareStore",
      reducer: { counter: reducerSpec },
      middleware: [
        (() => {
          logs.push("original");
          return true;
        }) as MiddlewareFunction<any, AppEvents>,
      ],
    });

    await store.emit("ui", "increment", 1);
    expect(logs).toEqual(["original"]);

    store.replaceMiddleware([]);

    logs.length = 0;
    await store.emit("ui", "increment", 2);
    expect(logs).toEqual([]);
  });

  it("preserves a runtime effect across replaceEffects, and drops spec ones", async () => {
    const calls: string[] = [];
    const store = createStore({
      name: "EffectProvenanceStore",
      reducer: { counter: reducerSpec },
      effects: [
        {
          when: { keys: [["ui", "increment"]] },
          effect: async () => {
            calls.push("spec");
          },
        },
      ] satisfies Array<EffectSpec<any, AppEvents>>,
    });

    store.registerEffect({
      when: { keys: [["ui", "increment"]] },
      effect: async () => {
        calls.push("dynamic");
      },
    });
    // A pattern effect too: the two live in different registries and both must be honoured.
    store.registerEffect({
      when: { any: true },
      effect: async () => {
        calls.push("dynamic-pattern");
      },
    });

    await store.emit("ui", "increment", 1);
    expect(calls.sort()).toEqual(["dynamic", "dynamic-pattern", "spec"]);

    store.replaceEffects([]);

    calls.length = 0;
    await store.emit("ui", "increment", 2);
    expect(calls.sort()).toEqual(["dynamic", "dynamic-pattern"]);

    store.replaceEffects([], { scope: "all" });

    calls.length = 0;
    await store.emit("ui", "increment", 3);
    expect(calls).toEqual([]);
  });

  it("replaceEffects swaps out all registered effects", async () => {
    const store = makeStore();

    const calls: string[] = [];

    const oldEffect: EffectSpec<Readonly<AppState>, AppEvents> = {
      when: { keys: [["ui", "increment"]] },
      effect: async () => {
        calls.push("old");
      },
    };

    const newEffect: EffectSpec<Readonly<AppState>, AppEvents> = {
      when: { keys: [["ui", "increment"]] },
      effect: async () => {
        calls.push("new");
      },
    };

    store.replaceEffects([oldEffect]);

    await store.emit("ui", "increment", 1);
    expect(calls).toEqual(["old"]);

    store.replaceEffects([newEffect]);
    // Use different payload to avoid deduplication
    await store.emit("ui", "increment", 2);
    expect(calls).toEqual(["old", "new"]);
  });
});

describe("Store - middleware veto semantics", () => {
  // The old test was `!result`, so every falsy return vetoed. A middleware that did its work
  // and fell off the end silently swallowed every event it matched, and the symptom -
  // reducers stopping for one channel - looks like a routing, `when` or registration-order
  // problem. Nothing about it pointed at the missing `return`.

  /** Emits once and reports whether the reducer actually saw the event. */
  async function committedWith(
    mw: (...args: never[]) => unknown,
  ): Promise<{ committed: boolean; value: number }> {
    const store = makeStore();
    store.registerMiddleware(mw as unknown as MiddlewareFunction<DeepReadonly<AppState>, AppEvents>);
    const result = await store.emit("ui", "increment", 5);
    return { committed: result.committed, value: store.getState().counter.value };
  }

  it("allows the event when middleware returns nothing", async () => {
    // The reported symptom, and the reason this change exists.
    const { committed, value } = await committedWith(() => {
      /* does its work, returns nothing */
    });
    expect(committed).toBe(true);
    expect(value).toBe(5);
  });

  it("allows the event for every other falsy return", async () => {
    // `0` is the one most likely to be written by accident - a counter, a length, an index.
    for (const falsy of [0, "", null, Number.NaN] as const) {
      const { committed, value } = await committedWith(() => falsy);
      expect(committed).toBe(true);
      expect(value).toBe(5);
    }
  });

  it("allows the event when middleware returns true", async () => {
    const { committed, value } = await committedWith(() => true);
    expect(committed).toBe(true);
    expect(value).toBe(5);
  });

  it("vetoes only on an explicit false, and notifies uncommitted subscribers", async () => {
    const store = makeStore();
    const seen: string[] = [];
    store.onEvent(
      "ui",
      "increment",
      () => {
        seen.push("uncommitted");
      },
      "uncommitted",
    );
    store.onEvent(
      "ui",
      "increment",
      () => {
        seen.push("committed");
      },
      "committed",
    );

    store.registerMiddleware((() => false) as unknown as MiddlewareFunction<DeepReadonly<AppState>, AppEvents>);

    const result = await store.emit("ui", "increment", 5);

    expect(result.committed).toBe(false);
    expect(store.getState().counter.value).toBe(0);
    expect(seen).toEqual(["uncommitted"]);
  });

  it("still vetoes when middleware throws, and names the event", async () => {
    // Kept deliberately: a guard that crashed has not decided the event is safe. But the
    // log has to say so, because "the event vanished" and "the middleware threw" look
    // nothing alike from the outside.
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const store = makeStore();
      store.registerMiddleware(
        (() => {
          throw new Error("guard exploded");
        }) as unknown as MiddlewareFunction<DeepReadonly<AppState>, AppEvents>,
      );

      const result = await store.emit("ui", "increment", 5);

      expect(result.committed).toBe(false);
      expect(store.getState().counter.value).toBe(0);

      const logged = errorSpy.mock.calls.map((c) => String(c[0])).join("\n");
      expect(logged).toContain("ui/increment");
      expect(logged).toContain("vetoed");
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("lets a later middleware veto what an earlier one had no opinion on", async () => {
    // Order still matters; "no opinion" must not short-circuit the rest of the chain.
    const store = makeStore();
    const order: string[] = [];

    store.registerMiddleware(((): void => {
      order.push("silent");
    }) as unknown as MiddlewareFunction<DeepReadonly<AppState>, AppEvents>);
    store.registerMiddleware((() => {
      order.push("veto");
      return false;
    }) as unknown as MiddlewareFunction<DeepReadonly<AppState>, AppEvents>);

    const result = await store.emit("ui", "increment", 5);

    expect(order).toEqual(["silent", "veto"]);
    expect(result.committed).toBe(false);
    expect(store.getState().counter.value).toBe(0);
  });
});
