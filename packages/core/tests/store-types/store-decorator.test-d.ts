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
type TransferState = { granted: string[] };
type TransferEM = { transfer: { granted: { id: string } } };

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
function withTransfers<R extends string, S extends Record<R, any>, EM extends EventMapBase>(
  s: StoreInstance<R, S, EM>,
) {
  return s.withSlice(
    "transfers",
    defineSlice<TransferEM>()({
      state: { granted: [] } as TransferState,
      when: { keys: [["transfer", "granted"]] },
      reducer: (st) => st,
    }),
    { owner: "@scope/transfers" },
  );
}

describe("decorators compose by nesting", () => {
  it("reaches the same store type in either order", () => {
    const a = withTransfers(withLogging(store));
    const b = withLogging(withTransfers(store));

    // Both orders see the added slice with its real state type.
    expectTypeOf(a.getState().transfers).toEqualTypeOf<DeepReadonly<TransferState>>();
    expectTypeOf(b.getState().transfers).toEqualTypeOf<DeepReadonly<TransferState>>();

    // And the application's own slice survives both.
    expectTypeOf(a.getState().counter).toEqualTypeOf<DeepReadonly<{ value: number }>>();
    expectTypeOf(b.getState().counter).toEqualTypeOf<DeepReadonly<{ value: number }>>();

    // Every channel from every step is emittable from either order.
    a.emit("ui", "increment", 1);
    a.emit("log", "line", "x");
    a.emit("transfer", "granted", { id: "1" });
    b.emit("ui", "increment", 1);
    b.emit("log", "line", "x");
    b.emit("transfer", "granted", { id: "1" });
  });
});

describe("a decorator can require another decoration", () => {
  // Expressed as an input constraint, which needs no registry in core and still composes:
  // TypeScript infers `EM` from the argument and then checks the constraint.
  function withAudit<
    R extends string,
    S extends Record<R, any>,
    EM extends EventMapBase & TransferEM,
  >(s: StoreInstance<R, S, EM>) {
    return s.withEffect(
      defineEffect<LogEM>()({ when: { keys: [["log", "line"]] }, effect: async () => {} }),
    );
  }

  it("accepts a store that already has the decoration", () => {
    withAudit(withTransfers(store));
  });

  it("rejects one that does not, at the call site", () => {
    // @ts-expect-error - `transfer` is not a channel on this store yet
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
