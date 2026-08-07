/**
 * Type-level tests.
 *
 * @remarks
 * These assert things no runtime test can. A store whose state holds a `Map` behaves
 * perfectly at runtime while being impossible to read from TypeScript, and a configuration
 * form the documentation calls "recommended" can fail to compile without a single test going
 * red. Both happened; both are pinned here.
 */

import { describe, expectTypeOf, it } from "vitest";

import { createStore } from "../../src/store/Store";
import type { DeepReadonly, MiddlewareSpec, ReducerSpec } from "../../src/types";

type Doc = { id: string; title: string };

type CatalogState = {
  byId: Map<string, Doc>;
  tags: Set<string>;
  updatedAt: Date;
  format: (doc: Doc) => string;
  items: Doc[];
  nested: { count: number };
};

type EM = { catalog: { touched: null } };

describe("DeepReadonly preserves the built-in object types", () => {
  it("keeps a Map readable", () => {
    // The failure this pins: mapping over `keyof Map` produced an object carrying the names
    // of a Map's methods with their signatures rewritten, so `.get()` was not callable.
    type Read = DeepReadonly<CatalogState>;
    expectTypeOf<Read["byId"]>().toEqualTypeOf<ReadonlyMap<string, DeepReadonly<Doc>>>();
    expectTypeOf<Read["byId"]["get"]>().toBeFunction();
  });

  it("keeps a Set readable", () => {
    expectTypeOf<DeepReadonly<CatalogState>["tags"]>().toEqualTypeOf<ReadonlySet<string>>();
  });

  it("leaves a Date alone", () => {
    expectTypeOf<DeepReadonly<CatalogState>["updatedAt"]>().toEqualTypeOf<Date>();
  });

  it("leaves a function callable", () => {
    expectTypeOf<DeepReadonly<CatalogState>["format"]>().toBeCallableWith({
      id: "a",
      title: "A",
    });
  });

  it("still deep-freezes arrays and plain objects", () => {
    type Read = DeepReadonly<CatalogState>;
    expectTypeOf<Read["items"]>().toEqualTypeOf<ReadonlyArray<DeepReadonly<Doc>>>();
    expectTypeOf<Read["nested"]>().toEqualTypeOf<{ readonly count: number }>();
  });
});

describe("createStore accepts both middleware forms", () => {
  const catalog: ReducerSpec<{ count: number }, EM> = {
    state: { count: 0 },
    when: { any: true },
    reducer: (state) => state,
  };

  it("accepts the spec form the documentation recommends", () => {
    // Previously a compile error: the config was typed as bare functions only, while the
    // field behind it, the pipeline that reads it, and the docs all took either form.
    const store = createStore({
      name: "Catalog",
      reducer: { catalog },
      middleware: [
        {
          when: { channel: "catalog" },
          middleware: () => true,
          meta: { type: "middleware", name: "guard" },
        },
      ],
    });

    expectTypeOf(store.emit).toBeFunction();
  });

  it("still accepts the bare function form", () => {
    const store = createStore({
      name: "Catalog",
      reducer: { catalog },
      middleware: [() => true],
    });

    expectTypeOf(store.emit).toBeFunction();
  });

  it("accepts either form at registerMiddleware", () => {
    const store = createStore({ name: "Catalog", reducer: { catalog } });
    const spec: MiddlewareSpec<DeepReadonly<{ catalog: { count: number } }>, EM> = {
      when: { any: true },
      middleware: () => true,
    };

    // Plain calls, not `toBeCallableWith`: the matcher accepts an argument the parameter type
    // rejects, so it passed against the narrower signature this is meant to pin.
    store.registerMiddleware(() => true);
    store.registerMiddleware(spec);

    expectTypeOf(store.registerMiddleware).toBeFunction();
  });
});
