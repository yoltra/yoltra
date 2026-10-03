/**
 * The decoration contract: `withX(store, config)` returning a re-typed store.
 *
 * @remarks
 * The composition property is the point. `StoreDecorator` is generic over the incoming
 * store, so `R`, `S` and `EM` are inference sites rather than fixed types: a decorator that
 * only adds events, nested inside one that also adds a slice, infers the already-widened
 * values and carries them through. Either order must produce the same store type, and that
 * is what these assert.
 *
 * Checked by `rushx typecheck`, not `rushx test`.
 */

import { describe, expectTypeOf, it } from "vitest";

import { createStore } from "../../src/store/Store";
import { defineEffect, defineSlice } from "../../src/types";
import type {
  DeepReadonly,
  Decoration,
  EventMapBase,
  StoreDecorator,
  StoreInstance,
} from "../../src/types";

type AppEM = { ui: { increment: number } };
type AppState = { counter: { value: number } };

type LogEM = { log: { line: string } };
type FlagsState = { enabled: string[] };
type FlagsEM = { flag: { enabled: { id: string } } };

const store = createStore<AppState, AppEM>({
  name: "DecoratorContract",
  reducer: {
    counter: { state: { value: 0 }, when: { keys: [["ui", "increment"]] }, reducer: (s) => s },
  },
});

// An events-only decorator: contributes a channel, no state.
function withLogging<R extends string, S extends Record<R, any>, EM extends EventMapBase>(
  s: StoreInstance<R, S, EM>,
) {
  return s.withEffect(
    defineEffect<LogEM>()({ when: { keys: [["log", "line"]] }, effect: async () => {} }),
  );
}

// A slice-and-events decorator.
function withFlags<R extends string, S extends Record<R, any>, EM extends EventMapBase>(
  s: StoreInstance<R, S, EM>,
) {
  return s.withSlice(
    "flags",
    defineSlice<FlagsEM>()({
      state: { enabled: [] } as FlagsState,
      when: { keys: [["flag", "enabled"]] },
      reducer: (st) => st,
    }),
    { owner: "@scope/flags" },
  );
}

describe("decorators compose by nesting", () => {
  it("reaches the same store type in either order", () => {
    const a = withFlags(withLogging(store));
    const b = withLogging(withFlags(store));

    // Both orders see the added slice with its real state type.
    expectTypeOf(a.getState().flags).toEqualTypeOf<DeepReadonly<FlagsState>>();
    expectTypeOf(b.getState().flags).toEqualTypeOf<DeepReadonly<FlagsState>>();

    // And the application's own slice survives both.
    expectTypeOf(a.getState().counter).toEqualTypeOf<DeepReadonly<{ value: number }>>();
    expectTypeOf(b.getState().counter).toEqualTypeOf<DeepReadonly<{ value: number }>>();

    // Every channel from every step is emittable from either order.
    a.emit("ui", "increment", 1);
    a.emit("log", "line", "x");
    a.emit("flag", "enabled", { id: "1" });
    b.emit("ui", "increment", 1);
    b.emit("log", "line", "x");
    b.emit("flag", "enabled", { id: "1" });
  });
});

describe("a decorator can require another decoration", () => {
  // Expressed as an input constraint, which needs no registry in core and still composes:
  // TypeScript infers `EM` from the argument and then checks the constraint.
  function withAudit<
    R extends string,
    S extends Record<R, any>,
    EM extends EventMapBase & FlagsEM,
  >(s: StoreInstance<R, S, EM>) {
    return s.withEffect(
      defineEffect<LogEM>()({ when: { keys: [["log", "line"]] }, effect: async () => {} }),
    );
  }

  it("accepts a store that already has the decoration", () => {
    withAudit(withFlags(store));
  });

  it("rejects one that does not, at the call site", () => {
    // @ts-expect-error - `flag` is not a channel on this store yet
    withAudit(store);
  });
});

describe("StoreDecorator describes the shape", () => {
  it("is satisfied by a pass-through decorator that adds nothing", () => {
    // The degenerate instance, and the one every instrumentation wrapper is.
    const passthrough: StoreDecorator<Decoration> = (s) => s as never;
    expectTypeOf(passthrough).not.toBeNever();
  });
});

describe("a decoration registers a reducer without a cast", () => {
  /**
   * `registerReducer` was the one member of the family that a decorator could not satisfy.
   *
   * It was typed `spec: ReducerSpec<any, EM>` — the store's *own* event map — so a spec naming a
   * channel the application's `EM` does not contain could not typecheck, and neither direction of
   * assignability held. Forward failed on `reducer`: it is a property holding a function type, not
   * a method, so `strictFunctionTypes` checks its parameters contravariantly and bivariance does
   * not rescue it. Reverse failed on `when`, whose `EventKey<EM>` is not assignable to a concrete
   * key tuple. Different members, opposite directions, so no variance annotation could help and a
   * cast was the only answer.
   *
   * A consuming project reported carrying exactly one named cast for this. These assert it is no
   * longer needed.
   */
  type LibEM = { lib: { started: string } };
  type LibState = { seen: number };

  const libSlice = defineSlice<LibEM>()({
    state: { seen: 0 } as LibState,
    when: { keys: [["lib", "started"]] },
    reducer: (s: LibState) => ({ seen: s.seen + 1 }),
  });

  it("registers a slice whose channel the store does not yet have", () => {
    function decorate<R extends string, S extends Record<R, any>, EM extends EventMapBase>(
      s: StoreInstance<R, S, EM>,
    ) {
      // No `as any`, no `as never`: the whole point of the test.
      return s.registerReducer("lib", libSlice).store;
    }
    expectTypeOf(decorate(store)).not.toBeNever();
  });

  it("widens the event map the same way registerSlice does", () => {
    const viaReducer = store.registerReducer("lib", libSlice).store;
    const viaSlice = store.registerSlice("lib", libSlice).store;
    expectTypeOf(viaReducer).toEqualTypeOf(viaSlice);
  });

  it("reaches the new slice on the returned store", () => {
    const grown = store.registerReducer("lib", libSlice).store;
    expectTypeOf(grown.getState().lib).toEqualTypeOf<DeepReadonly<LibState>>();
  });
});
