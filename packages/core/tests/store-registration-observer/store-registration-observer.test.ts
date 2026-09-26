/**
 * `onRegistrationChange`: a push seam for what is installed on a store.
 *
 * @remarks
 * `__devtoolsIntrospect()` is pull-only, so a panel's subscription list goes stale the moment
 * a decoration mounts anything, and a library that must react to another library has nothing
 * to wait on. This is that seam.
 *
 * It deliberately does not ride `instrument`: `InstrumentedEvent` is event-flow shaped, with
 * `changedPaths`, `prevValues` and `reduceTimeMs`, and topology is not an event.
 */

import { describe, it, expect, vi } from "vitest";

import { createStore } from "../../src/store/Store";
import type {
  EffectSpec,
  ReducerSpec,
  RegistrationChange,
  StoreInstance,
} from "../../src/types";

type EM = { ui: { increment: number; other: null } };
type CounterState = { value: number };

const counter: ReducerSpec<CounterState, EM> = {
  state: { value: 0 },
  when: { keys: [["ui", "increment"]] },
  reducer: (s) => s,
};

function slice(state: Record<string, unknown> = { n: 0 }): ReducerSpec<any, EM> {
  return { state, when: { keys: [["ui", "increment"]] }, reducer: (s) => s };
}

function makeStore() {
  return createStore({ name: "RegistrationObserverStore", reducer: { counter } });
}

/**
 * Collects every batch, so per-call batching can be asserted rather than assumed.
 *
 * Typed loosely on purpose: these suites build stores with different reducer sets, and
 * pinning the helper to one of them would say nothing useful about the seam under test.
 */
function collect(
  store: Pick<StoreInstance<any, any, EM>, "onRegistrationChange">,
  options?: { emitCurrent?: boolean },
) {
  const batches: Array<readonly RegistrationChange<EM>[]> = [];
  const off = store.onRegistrationChange((changes) => batches.push(changes), options);
  return { batches, off, flat: () => batches.flat() };
}

describe("single registrations", () => {
  it("reports a slice mount with provenance, owner and state", () => {
    const store = makeStore();
    const { batches } = collect(store);

    store.registerSlice("late", slice(), { owner: "@scope/late" });

    expect(batches).toHaveLength(1);
    expect(batches[0]).toEqual([
      expect.objectContaining({
        kind: "reducer",
        op: "mounted",
        name: "late",
        origin: "dynamic",
        owner: "@scope/late",
        state: "initialized",
        dispatch: "keyed",
      }),
    ]);
  });

  it("reports the disposal, with the state actually deleted", () => {
    const store = makeStore();
    const reg = store.registerSlice("late", slice());
    const { flat } = collect(store);

    reg.dispose();

    expect(flat()).toEqual([
      expect.objectContaining({ kind: "reducer", op: "unmounted", state: "deleted" }),
    ]);
  });

  it("reports middleware and effects, with the normalized matcher", () => {
    const store = makeStore();
    const { flat } = collect(store);

    store.registerMiddleware({ when: { channel: "ui" }, middleware: () => true, meta: { type: "middleware", name: "guard" } });
    // No targeting at all: the normalized form is `{ any: true }`, and an observer told
    // `undefined` would have to re-derive that.
    store.registerEffect({ effect: async () => {} } as EffectSpec<any, EM>);

    const changes = flat();
    expect(changes[0]).toEqual(
      expect.objectContaining({ kind: "middleware", name: "guard", when: { channel: "ui" } }),
    );
    expect(changes[1]).toEqual(
      expect.objectContaining({ kind: "effect", when: { any: true }, dispatch: "pattern" }),
    );
  });
});

describe("batching", () => {
  it("delivers one batch per replaceReducers, never a spurious unmount", () => {
    // `replaceReducers` updates an existing slice by unmounting and remounting it. A
    // per-change observer would see that slice vanish and reappear; one batch per call means
    // nobody observes the intermediate topology.
    const store = createStore({
      name: "BatchStore",
      reducer: { counter, doomed: slice(), kept: slice() },
    });
    const { batches } = collect(store);

    store.replaceReducers({ counter, kept: slice(), added: slice() } as any);

    expect(batches).toHaveLength(1);

    const byName = new Map(batches[0].map((c) => [`${c.name}:${c.op}`, c]));
    // Removed outright.
    expect(byName.get("doomed:unmounted")?.state).toBe("deleted");
    // Updated in place: unmounted with its state intact, then remounted preserving it.
    expect(byName.get("kept:unmounted")?.state).toBe("retained");
    expect(byName.get("kept:mounted")?.state).toBe("preserved");
    // Brand new.
    expect(byName.get("added:mounted")?.state).toBe("initialized");
  });

  it("delivers one batch for a hotReplace spanning all three kinds", () => {
    const store = createStore({
      name: "HotBatchStore",
      reducer: { counter },
      middleware: [() => true],
      effects: [{ when: { keys: [["ui", "increment"]] }, effect: async () => {} }] as Array<
        EffectSpec<any, EM>
      >,
    });
    const { batches } = collect(store);

    store.hotReplace({
      reducer: { counter } as any,
      middleware: [() => true],
      effects: [{ when: { keys: [["ui", "increment"]] }, effect: async () => {} }] as Array<
        EffectSpec<any, EM>
      >,
    });

    expect(batches).toHaveLength(1);
    const kinds = new Set(batches[0].map((c) => c.kind));
    expect(kinds).toEqual(new Set(["reducer", "middleware", "effect"]));
  });

  it("says nothing about a registration replace* preserved", () => {
    const store = makeStore();
    store.registerSlice("late", slice());
    const { flat } = collect(store);

    store.replaceReducers({ counter } as any);

    expect(flat().some((c) => c.name === "late")).toBe(false);
  });
});

describe("emitCurrent", () => {
  it("delivers everything installed, synchronously, before subscribe returns", () => {
    const store = createStore({
      name: "EmitCurrentStore",
      reducer: { counter },
      middleware: [() => true],
    });
    store.registerSlice("late", slice(), { owner: "@scope/late" });

    const seen: Array<readonly RegistrationChange<EM>[]> = [];
    // Captured inside the call: pull-then-subscribe would be two shapes and a race.
    store.onRegistrationChange((c) => seen.push(c), { emitCurrent: true });

    expect(seen).toHaveLength(1);
    const byName = new Map(seen[0].map((c) => [c.name, c]));
    expect(byName.get("counter")?.origin).toBe("spec");
    // The real origin, not a synthetic "existing" marker: filtering on provenance is the
    // main thing an observer does, and a snapshot that lied would break exactly the
    // registrations that were already there.
    expect(byName.get("late")?.origin).toBe("dynamic");
    expect(byName.get("late")?.owner).toBe("@scope/late");
  });

  it("describes every registration shape, not just the simple ones", () => {
    // The snapshot has to walk four registries and two middleware forms. Covering only a
    // keyed reducer and a bare function leaves most of it unexercised, and an observer that
    // relied on `when` or `name` for a pattern effect would find them missing.
    const store = createStore({
      name: "EmitCurrentShapesStore",
      reducer: {
        counter,
        catchAll: { state: { n: 0 }, when: { any: true }, reducer: (s: { n: number }) => s },
      },
      middleware: [
        { when: { channel: "ui" }, middleware: () => true, meta: { type: "middleware", name: "named" } },
        function bare() {
          return true;
        },
      ],
      effects: [
        { when: { keys: [["ui", "increment"]] }, effect: async () => {}, meta: { type: "effect", name: "keyed" } },
        { when: { any: true }, effect: async () => {}, meta: { type: "effect", name: "pattern" } },
      ] as Array<EffectSpec<any, EM>>,
    });

    const seen: Array<readonly RegistrationChange<EM>[]> = [];
    store.onRegistrationChange((c) => seen.push(c), { emitCurrent: true });

    const changes = seen[0]!;
    const reducers = changes.filter((c) => c.kind === "reducer");
    expect(reducers.find((c) => c.name === "counter")?.dispatch).toBe("keyed");
    // A `{ any: true }` reducer is matched at runtime, not dispatched by key.
    expect(reducers.find((c) => c.name === "catchAll")?.dispatch).toBe("pattern");
    expect(reducers.find((c) => c.name === "catchAll")?.when).toEqual({ any: true });

    const middleware = changes.filter((c) => c.kind === "middleware");
    expect(middleware.find((c) => c.name === "named")?.when).toEqual({ channel: "ui" });
    // A bare function has no meta, so its own function name is the best available label.
    expect(middleware.some((c) => c.name === "bare")).toBe(true);

    const effects = changes.filter((c) => c.kind === "effect");
    expect(effects.find((c) => c.name === "keyed")?.dispatch).toBe("keyed");
    expect(effects.find((c) => c.name === "keyed")?.when).toEqual({
      keys: [["ui", "increment"]],
    });
    expect(effects.find((c) => c.name === "pattern")?.dispatch).toBe("pattern");
  });

  it("stays silent without the option", () => {
    const store = makeStore();
    const { batches } = collect(store);
    expect(batches).toHaveLength(0);
  });
});

describe("ordering and re-entrancy", () => {
  it("runs observers after the state broadcast", () => {
    // The view layer learns a fact before a library gets to react to it. Reversed, a
    // library's own registration would publish before the originating one reached the UI.
    const store = makeStore();
    const log: string[] = [];

    store.subscribe(() => log.push("listeners"));
    store.connect({ reducer: "late" as any, property: "n" }, () => log.push("connect"));
    store.onRegistrationChange(() => log.push("observers"));

    store.registerSlice("late", slice());

    expect(log.indexOf("observers")).toBeGreaterThan(log.indexOf("listeners"));
    expect(log.indexOf("observers")).toBeGreaterThan(log.indexOf("connect"));
  });

  it("queues a registration made by an observer instead of nesting it", () => {
    // The legitimate ordering-dependency case: one decoration reacting to another. Neither
    // forbidden nor delivered re-entrantly - depth-first work, breadth-first notification.
    const store = makeStore();
    const batches: Array<readonly RegistrationChange<EM>[]> = [];
    let reacted = false;

    store.onRegistrationChange((changes) => {
      batches.push(changes);
      if (!reacted && changes.some((c) => c.name === "first")) {
        reacted = true;
        store.registerSlice("second", slice());
      }
    });

    store.registerSlice("first", slice());

    expect(batches).toHaveLength(2);
    expect(batches[0]?.[0]?.name).toBe("first");
    expect(batches[1]?.[0]?.name).toBe("second");
  });

  it("bounds a cascade rather than looping forever", () => {
    const store = makeStore();
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      let n = 0;
      store.onRegistrationChange(() => {
        n += 1;
        if (n < 500) store.registerSlice(`s${n}`, slice());
      });

      store.registerSlice("seed", slice());

      expect(error.mock.calls.some((c) => String(c[0]).includes("exceeded"))).toBe(true);
    } finally {
      error.mockRestore();
    }
  });

  it("does not deliver to an observer added during a notification", () => {
    const store = makeStore();
    const late = vi.fn();
    store.onRegistrationChange(() => {
      store.onRegistrationChange(late);
    });

    store.registerSlice("x", slice());

    expect(late).not.toHaveBeenCalled();
  });
});

describe("failure containment", () => {
  it("one throwing observer does not stop the others", () => {
    const store = makeStore();
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const after = vi.fn();
      store.onRegistrationChange(() => {
        throw new Error("observer exploded");
      });
      store.onRegistrationChange(after);

      store.registerSlice("x", slice());

      expect(after).toHaveBeenCalledTimes(1);
      expect(error).toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });

  it("warns about an async observer without awaiting it", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const store = makeStore();
      store.onRegistrationChange((() => Promise.resolve()) as never);
      store.registerSlice("x", slice());

      expect(error.mock.calls.some((c) => String(c[0]).includes("returned a Promise"))).toBe(
        true,
      );
    } finally {
      error.mockRestore();
    }
  });
});

describe("lifecycle edges", () => {
  it("dispose fires nothing and clears observers", () => {
    const store = makeStore();
    const observer = vi.fn();
    store.onRegistrationChange(observer);

    store.dispose();

    expect(observer).not.toHaveBeenCalled();
  });

  it("replay produces no registration changes", () => {
    // Replay alters state, never topology. Stated here so nobody adds a `duringReplay`
    // option to this seam by analogy with `onEvent`.
    const store = createStore({
      name: "ReplayTopologyStore",
      reducer: { counter },
      devtools: { allowReplay: true },
    });
    const { batches } = collect(store);

    store.__applyExternalState({ counter: { value: 3 } });
    store.__replayEvents({ counter: { value: 0 } }, [
      { channel: "ui", type: "increment", payload: 1, id: "r1" },
    ]);

    expect(batches).toHaveLength(0);
  });

  it("allocates nothing when nobody is observing", () => {
    // These call sites run inside `createStore`. A twenty-slice store with no observer must
    // build no change objects and no arrays at all.
    const reducers: Record<string, ReducerSpec<any, EM>> = {};
    for (let i = 0; i < 20; i += 1) reducers[`s${i}`] = slice();

    const store = createStore({ name: "QuietStore", reducer: reducers as any });

    expect((store as any).pendingRegistrationChanges).toBeNull();
    expect((store as any).registrationObservers.size).toBe(0);
  });
});

describe("shapes that only appear at runtime", () => {
  it("reports a dynamically mounted pattern slice as pattern-dispatched", () => {
    const store = makeStore();
    const { flat } = collect(store);

    store.registerSlice("catchAll", {
      state: { n: 0 },
      when: { any: true },
      reducer: (s: { n: number }) => s,
    } as ReducerSpec<any, EM>);

    expect(flat()[0]).toEqual(
      expect.objectContaining({ dispatch: "pattern", when: { any: true } }),
    );
  });

  it("reports a bare middleware function by its own name, and an unnamed one as undefined", () => {
    const store = makeStore();
    const { flat } = collect(store);

    store.registerMiddleware(function auditLog() {
      return true;
    });
    store.registerMiddleware(() => true);

    const names = flat()
      .filter((c) => c.kind === "middleware")
      .map((c) => c.name);
    expect(names[0]).toBe("auditLog");
    // An anonymous arrow has an empty name, which is not a label worth reporting.
    expect(names[1]).toBeFalsy();
  });

  it("reports an effect with no meta as unnamed", () => {
    const store = makeStore();
    const { flat } = collect(store);

    store.registerEffect({ when: { keys: [["ui", "increment"]] }, effect: async () => {} });

    expect(flat()[0]).toEqual(
      expect.objectContaining({ kind: "effect", name: undefined, dispatch: "keyed" }),
    );
  });
});

describe("collision reporting", () => {
  it("names several slices at once, with and without owners", () => {
    const store = makeStore();
    store.registerSlice("owned", slice(), { owner: "@scope/a" });
    store.registerSlice("anonymous", slice());

    expect(() =>
      store.replaceReducers({ counter, owned: slice(), anonymous: slice() } as any),
    ).toThrow(/slices.*owned.*@scope\/a.*anonymous/s);
  });

  it("uses the singular when only one slice collides", () => {
    const store = makeStore();
    store.registerSlice("owned", slice());

    expect(() => store.replaceReducers({ counter, owned: slice() } as any)).toThrow(/a slice/);
  });
});

describe("a slice that is one value", () => {
  it("announces its root when mounted late", () => {
    // `detectChangedProps(undefined, x)` reports only the root, and a primitive slice has no
    // leaf at all - so the announcement has to add `""` itself or a whole-slice subscription
    // would never hear the mount.
    const store = makeStore();
    const seen: unknown[] = [];
    store.connect({ reducer: "token" as any, property: "" }, (c) => seen.push(c.newValue));

    store.registerSlice("token", {
      state: "abc",
      when: { keys: [["ui", "increment"]] },
      reducer: (s: string) => s,
    } as ReducerSpec<any, EM>);

    expect(seen).toEqual(["abc"]);
  });
});

describe("failures found in review", () => {
  it("announces a middleware unmount only after it has actually gone", () => {
    // The disposer announced first and spliced second, so an observer that looked at the
    // store was told a middleware had been removed while it was still installed and would
    // still run for the next event.
    const store = makeStore();
    let installedWhenTold: number | undefined;

    const off = store.registerMiddleware(() => true);
    store.onRegistrationChange((changes) => {
      if (changes.some((c) => c.kind === "middleware" && c.op === "unmounted")) {
        installedWhenTold = store.__devtoolsIntrospect().middleware.length;
      }
    });

    off();

    expect(installedWhenTold).toBe(0);
  });

  it("queues a registration made from inside the emitCurrent snapshot", () => {
    // `emitCurrent` delivered outside the notifying flag, so an observer that registered on
    // first sight of the store was re-entered instead of queued - breaking the documented
    // contract on the one call most likely to trigger it.
    const store = makeStore();
    const batches: Array<readonly RegistrationChange<EM>[]> = [];
    let reacted = false;

    store.onRegistrationChange(
      (changes) => {
        batches.push(changes);
        if (!reacted) {
          reacted = true;
          store.registerSlice("reaction", slice());
        }
      },
      { emitCurrent: true },
    );

    // Two separate batches, never one nested inside the other.
    expect(batches).toHaveLength(2);
    expect(batches[0]?.some((c) => c.name === "counter")).toBe(true);
    expect(batches[1]?.[0]?.name).toBe("reaction");
  });
});
