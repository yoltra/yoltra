/**
 * Type-level tests for what `useAtomicProp` infers.
 *
 * @remarks
 * These are the end of the chain that starts at `Dotted` and `PathValue` in `@yoltra/core`:
 * those types decide what an editor offers after `property:` and what the hook hands back. A
 * change to either can leave every runtime test green while quietly turning a component's value
 * into `unknown` — which is what a subscription to a root-value slice used to be, because
 * `PathValue<T, "">` resolved to `never` and the call fell through to the untyped overload.
 *
 * Written against `createYoltra`, the way an application actually gets its hooks, so the
 * assertions cover the real inference path rather than the types in isolation.
 */

import { describe, expectTypeOf, it } from "vitest";

import type { ReducerSpec } from "@yoltra/core";

import { createYoltra } from "../../src/createYoltra";

type Doc = { id: string; title: string };

type EM = { app: { touch: null } };

const catalog: ReducerSpec<
  { byId: Map<string, Doc>; items: Doc[]; nested: { count: number } },
  EM
> = {
  state: { byId: new Map(), items: [], nested: { count: 0 } },
  when: { any: true },
  reducer: (state) => state,
};

/** A slice that IS a value — no key to address, so its only path is the empty one. */
const token: ReducerSpec<string | null, EM> = {
  state: null,
  when: { any: true },
  reducer: (state) => state,
};

const hits: ReducerSpec<number, EM> = {
  state: 0,
  when: { any: true },
  reducer: (state) => state,
};

const { useAtomicProp } = createYoltra({
  name: "Inference",
  reducer: { catalog, token, hits },
});

describe("useAtomicProp inference through an object slice", () => {
  // The fidelity guard. Every one of these resolved this way before `RootValue` existed and
  // must keep resolving this way: they are what an application already depends on.
  it("resolves a nested leaf", () => {
    expectTypeOf(useAtomicProp({ reducer: "catalog", property: "nested.count" })).toEqualTypeOf<
      number
    >();
  });

  it("resolves through an array index", () => {
    expectTypeOf(useAtomicProp({ reducer: "catalog", property: "items.0.title" })).toEqualTypeOf<
      string
    >();
  });

  it("resolves a whole array and a whole Map", () => {
    expectTypeOf(useAtomicProp({ reducer: "catalog", property: "items" })).toEqualTypeOf<Doc[]>();
    expectTypeOf(useAtomicProp({ reducer: "catalog", property: "byId" })).toEqualTypeOf<
      Map<string, Doc>
    >();
  });

  it("still accepts the accessor form and infers from it", () => {
    expectTypeOf(useAtomicProp("catalog", (p) => p.nested.count)).toEqualTypeOf<number>();
  });
});

describe("useAtomicProp inference through a root-value slice", () => {
  // The payoff. Both of these used to fall through to the `property: string` overload and come
  // back `unknown`, so a component read its own state untyped.
  it("types a nullable primitive slice as that primitive", () => {
    expectTypeOf(useAtomicProp({ reducer: "token", property: "" })).toEqualTypeOf<string | null>();
  });

  it("types a number slice as number", () => {
    expectTypeOf(useAtomicProp({ reducer: "hits", property: "" })).toEqualTypeOf<number>();
  });

  it("still maps through a projection", () => {
    expectTypeOf(
      useAtomicProp({ reducer: "hits", property: "" }, (n) => n > 0),
    ).toEqualTypeOf<boolean>();
  });
});
