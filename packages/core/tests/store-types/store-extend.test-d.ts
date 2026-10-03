/**
 * Type-level spike for typed growth (T0).
 *
 * @remarks
 * This file is the go/no-go for the whole decoration feature. It asserts the one thing no
 * runtime test can: that a store's types grow as it is decorated, and that inference
 * *survives the chain* rather than collapsing to `string`, `any` or `never` after two
 * intersections.
 *
 * The store surface is `declare`d rather than built with `createStore`, because the runtime
 * methods do not exist yet. What is under test is the type machinery, and declaring the
 * surface tests exactly that and nothing else.
 *
 * Checked by `rushx typecheck` (`tsc -p tsconfig.vitest.json --noEmit`), not by `rushx test`
 * - vitest strips types rather than verifying them.
 */

import { describe, expectTypeOf, it } from "vitest";

import { createStore } from "../../src/store/Store";
import { defineEffect, defineMiddleware, defineSlice } from "../../src/types";
import type {
  DeepReadonly,
  Dotted,
  EMAddOf,
  MiddlewareFunction,
  ReducerSpec,
  StoreInstance,
  Unsubscribe,
} from "../../src/types";

// ── The application, before any decoration ────────────────────────────────────

type AppEM = { ui: { increment: number } };
type AppState = { counter: { value: number } };

// A real store now, not a declared one: the runtime carries the surface the spike proved.
//
// The explicit `<S, EM>` overload, not the inferring one. An unannotated spec literal gives
// `EMFromReducersStrict` nothing to infer an event map from, so `EM` lands on `EventMapBase` - whose
// index signatures accept **any** channel and payload, which would quietly make every
// negative assertion below vacuous.
const store = createStore<AppState, AppEM>({
  name: "ExtendTypes",
  reducer: {
    counter: {
      state: { value: 0 },
      when: { keys: [["ui", "increment"]] },
      reducer: (s) => s,
    },
  },
});

// ── Three decorations, each contributing its own event map ────────────────────

type LibAEM = { "lib.a": { started: string } };
type LibBEM = { "lib.b": { pinged: boolean } };
type LibCEM = { "lib.c": { done: { id: string } } };

type SliceCState = { nested: { count: number }; label: string };

const sliceA = defineSlice<LibAEM>()({
  state: { seen: 0 },
  when: { keys: [["lib.a", "started"]] },
  reducer: (s) => s,
});

const middlewareB = defineMiddleware<LibBEM>()({
  when: { any: true },
  middleware: () => true,
});

const sliceC = defineSlice<LibCEM>()({
  state: { nested: { count: 0 }, label: "" } as SliceCState,
  when: { keys: [["lib.c", "done"]] },
  reducer: (s) => s,
});

// The chain under test. Slice, then middleware, then slice: the middleware step must carry
// the first slice's widening through untouched, which is the composition property.
const s1 = store.withSlice("a", sliceA);
const s2 = s1.withMiddleware(middlewareB);
const s3 = s2.withSlice("c", sliceC);

describe("the decoration chain", () => {
  it("1. compiles across three steps", () => {
    expectTypeOf(s3).not.toBeNever();
    expectTypeOf(s3).not.toBeAny();
  });

  it("2. carries slice state through two intersections", () => {
    // The step-three slice, read back after the chain. This is the assertion that fails if
    // intersections degrade.
    expectTypeOf(s3.getState().c).toEqualTypeOf<DeepReadonly<SliceCState>>();
    // And the earlier steps survive.
    expectTypeOf(s3.getState().a).toEqualTypeOf<DeepReadonly<{ seen: number }>>();
    expectTypeOf(s3.getState().counter).toEqualTypeOf<DeepReadonly<{ value: number }>>();
  });

  it("3. accepts every channel the chain contributed, and no others", () => {
    // The application's own channel.
    s3.emit("ui", "increment", 1);
    // Step one's slice.
    s3.emit("lib.a", "started", "abc");
    // Step two's middleware - the spec form widens the map even though it adds no state.
    s3.emit("lib.b", "pinged", true);
    // Step three's slice.
    s3.emit("lib.c", "done", { id: "x" });

    // @ts-expect-error - a channel no step contributed
    s3.emit("lib.nope", "started", "abc");

    // @ts-expect-error - right channel, wrong payload type
    s3.emit("lib.a", "started", 123);
  });

  it("4. keeps Dotted resolving to a literal union on a late slice", () => {
    // The inference-degradation canary. If chaining degrades, this becomes `string`.
    expectTypeOf<Dotted<SliceCState>>().toEqualTypeOf<"nested" | "label" | "nested.count">();
  });
});

// Fixtures for the conflicting-payload case. `declare` is only legal at module scope.
type ClashOne = { ui: { increment: number } };
type ClashTwo = { ui: { increment: string } };

const clashing = defineSlice<ClashTwo>()({
  state: { x: 0 },
  when: { keys: [["ui", "increment"]] },
  reducer: (s) => s,
});

declare const clashBase: StoreInstance<"counter", AppState, ClashOne>;
const clashed = clashBase.withSlice("clash", clashing);

describe("compatibility and guards", () => {
  it("5. leaves today's registerReducer return usable as a bare disposer", () => {
    const real = createStore({
      name: "Compat",
      reducer: {
        counter: {
          state: { value: 0 },
          when: { keys: [["ui", "increment"]] },
          reducer: (s: { value: number }) => s,
        } satisfies ReducerSpec<{ value: number }, AppEM>,
      },
    });

    const off: Unsubscribe = real.registerReducer("later", {
      state: { n: 0 },
      when: { any: true },
      reducer: (s: { n: number }) => s,
    });
    off();
  });

  it("6. does not widen when the slice name is not a literal", () => {
    const name: string = "dynamic";
    const widened = store.withSlice(name, sliceA);
    // `Record<string, St>` would make every slice lookup resolve to the new slice's state,
    // destroying inference application-wide. Degrading to "no widening" is the safe failure.
    expectTypeOf(widened.getState().counter).toEqualTypeOf<DeepReadonly<{ value: number }>>();
  });

  it("7. intersects a conflicting payload to never, as documented", () => {
    // Documented behaviour, pinned rather than fixed: the payloads intersect, so the event
    // becomes uncallable at the call site rather than erroring at the registration that
    // caused it. A ConflictingKeys detector is a recorded follow-up.
    // @ts-expect-error - `number & string` is never
    clashed.emit("ui", "increment", 1);
  });

  it("8. does not widen the event map for a bare middleware function", () => {
    // Stated loudly in the docs because it is the most surprising consequence of the design:
    // `MiddlewareFunction`'s event parameter is `EventUnion<EM>`, a mapped type TypeScript
    // cannot infer `EM` back out of. Only the branded spec form can widen.
    const bare: MiddlewareFunction<DeepReadonly<AppState>, AppEM> = () => true;
    expectTypeOf<EMAddOf<typeof bare>>().toEqualTypeOf<{}>();

    const widened = store.withMiddleware(bare);
    // @ts-expect-error - a bare function contributed no channels
    widened.emit("lib.b", "pinged", true);
  });

  it("9. widens from an effect spec too", () => {
    const effectC = defineEffect<LibCEM>()({
      when: { keys: [["lib.c", "done"]] },
      effect: async () => {},
    });
    const widened = store.withEffect(effectC);
    widened.emit("lib.c", "done", { id: "y" });
  });
});
