/**
 * Type-level spike for typed growth, react half (T0).
 *
 * @remarks
 * The core spike proves the store's types survive a chain. This proves the part that
 * actually matters to an application: that a slice mounted at **step three** of a decoration
 * chain still gives `useAtomicProp` a real type rather than `unknown`.
 *
 * That is the end of a long inference path - `WidenState` -> `Prettify` -> `S[R1]` ->
 * `Dotted` -> `PathValue` - and it is the first thing to break if intersections degrade.
 *
 * The chained surface is `declare`d, because the runtime lands later. What is under test is
 * whether the types compose, which is exactly what declaring it isolates.
 *
 * Checked by `rushx typecheck`, not `rushx test`.
 */

import { describe, expectTypeOf, it } from "vitest";

import { defineMiddleware, defineSlice } from "@yoltra/core";

import type { DecoratableYoltra } from "../../src/createYoltra";

type AppEM = { ui: { increment: number } };
type AppState = { counter: { value: number } };

type LibAEM = { "lib.a": { started: string } };
type LibBEM = { "lib.b": { pinged: boolean } };
type LibCEM = { "lib.c": { done: { id: string } } };

type SliceCState = { nested: { count: number }; label: string; tags: string[] };

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
  state: { nested: { count: 0 }, label: "", tags: [] } as SliceCState,
  when: { keys: [["lib.c", "done"]] },
  reducer: (s) => s,
});

declare const app: DecoratableYoltra<"counter", AppState, AppEM>;

// Slice, then middleware, then slice. The middleware step must carry step one's widening
// through untouched.
const y3 = app.withSlice("a", sliceA).withMiddleware(middlewareB).withSlice("c", sliceC);

describe("hooks widened by a three-step chain", () => {
  it("1. types useAtomicProp on the slice added at step three", () => {
    // The assertion this whole spike exists for.
    expectTypeOf(y3.useAtomicProp({ reducer: "c", property: "nested.count" })).toEqualTypeOf<
      number
    >();
    expectTypeOf(y3.useAtomicProp({ reducer: "c", property: "label" })).toEqualTypeOf<string>();
  });

  it("2. still types the application's original slice", () => {
    expectTypeOf(y3.useAtomicProp({ reducer: "counter", property: "value" })).toEqualTypeOf<
      number
    >();
  });

  it("3. types useSelector across the whole widened state", () => {
    expectTypeOf(y3.useSelector((s) => s.c.nested.count)).toEqualTypeOf<number>();
    expectTypeOf(y3.useSelector((s) => s.a.seen)).toEqualTypeOf<number>();
    expectTypeOf(y3.useSelector((s) => s.counter.value)).toEqualTypeOf<number>();
  });

  it("4. narrows useEvent on a channel a decoration contributed", () => {
    y3.useEvent("lib.c", "done", (event) => {
      expectTypeOf(event.payload).toEqualTypeOf<{ id: string }>();
    });
    y3.useEvent("lib.b", "pinged", (event) => {
      expectTypeOf(event.payload).toEqualTypeOf<boolean>();
    });
  });

  it("5. types emit for every channel the chain contributed", () => {
    const emit = y3.useEmit();
    emit("ui", "increment", 1);
    emit("lib.a", "started", "abc");
    emit("lib.b", "pinged", true);
    emit("lib.c", "done", { id: "x" });
  });

  it("6. rejects a slice no step mounted", () => {
    // @ts-expect-error - "nope" is not a slice on this store
    y3.useAtomicProp({ reducer: "nope", property: "value" });
  });
});

describe("the original view keeps working", () => {
  it("7. leaves the undecorated hooks typed as they were", () => {
    expectTypeOf(app.useAtomicProp({ reducer: "counter", property: "value" })).toEqualTypeOf<
      number
    >();

    // @ts-expect-error - the original view never learned about the decoration's slice
    app.useAtomicProp({ reducer: "c", property: "label" });
  });
});
