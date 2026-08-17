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
import type {
  DeepReadonly,
  Dotted,
  MiddlewareSpec,
  PathValue,
  ReducerSpec,
} from "../../src/types";

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

/**
 * Every `StoreSpec` option must be reachable through `createStore`.
 *
 * @remarks
 * `createStore`'s two overloads declare their config inline rather than deriving it from
 * `StoreSpec`, so an option added to the spec is not automatically accepted by the factory. That
 * has now bitten twice: `maxReduceDepth` was silently discarded at runtime, and `onRejected` was
 * unreachable for a typed caller for an entire release — masked in its own test by an `as never`.
 *
 * This fails to compile the moment a new option is added to `StoreSpec` and not to the overloads,
 * which is cheaper than finding out from a consumer.
 */
describe("createStore accepts every documented option", () => {
  it("compiles with all of them at once", () => {
    const store = createStore({
      name: "Everything",
      reducer: { catalog: { state: { count: 0 }, when: { any: true }, reducer: (s) => s } },
      middleware: [() => true],
      effects: [],
      dedupWindowMs: 50,
      idFactory: () => "id",
      devtools: { allowReplay: true },
      onEffectError: () => undefined,
      onReducerError: () => undefined,
      onRejected: () => undefined,
      onCascade: () => undefined,
      maxReduceDepth: 32,
      maxTransitionsPerDrain: 500,
    });

    expectTypeOf(store.emit).toBeFunction();
    expectTypeOf(store.call).toBeFunction();
  });
});

/**
 * `Dotted` is what an editor offers when you type `property:`, so these assertions ARE the
 * autocompletion contract. They are written as membership checks rather than one comparison
 * against the whole union, because the failure that matters is a single path appearing or
 * vanishing, and a union mismatch reports neither.
 */
type Has<U, M extends string> = M extends U ? true : false;

describe("Dotted addresses only what a subscription can actually reach", () => {
  it("offers every real path of an object slice", () => {
    // The autocompletion fidelity guard. None of these may ever change.
    expectTypeOf<Has<Dotted<CatalogState>, "byId">>().toEqualTypeOf<true>();
    expectTypeOf<Has<Dotted<CatalogState>, "tags">>().toEqualTypeOf<true>();
    expectTypeOf<Has<Dotted<CatalogState>, "updatedAt">>().toEqualTypeOf<true>();
    expectTypeOf<Has<Dotted<CatalogState>, "items">>().toEqualTypeOf<true>();
    expectTypeOf<Has<Dotted<CatalogState>, "nested">>().toEqualTypeOf<true>();
    expectTypeOf<Has<Dotted<CatalogState>, "nested.count">>().toEqualTypeOf<true>();
    expectTypeOf<Has<Dotted<CatalogState>, "items.0">>().toEqualTypeOf<true>();
    expectTypeOf<Has<Dotted<CatalogState>, "items.0.title">>().toEqualTypeOf<true>();
  });

  it("no longer offers the methods of a Map or Set as paths", () => {
    // `byId.get` was a subscribable path that could never fire: the diff reports a Map at its
    // own path and never descends, so nothing beneath one ever changes. Walking `keyof Map`
    // produced the method names, and the editor offered them.
    expectTypeOf<Has<Dotted<CatalogState>, "byId.get">>().toEqualTypeOf<false>();
    expectTypeOf<Has<Dotted<CatalogState>, "byId.size">>().toEqualTypeOf<false>();
    expectTypeOf<Has<Dotted<CatalogState>, "tags.has">>().toEqualTypeOf<false>();
    // Date was already excluded — it is in `Primitive`. Pinned so it stays that way.
    expectTypeOf<Has<Dotted<CatalogState>, "updatedAt.getTime">>().toEqualTypeOf<false>();
  });

  it("addresses a root-value slice at the empty path, and nowhere else", () => {
    expectTypeOf<Dotted<number>>().toEqualTypeOf<"">();
    expectTypeOf<Dotted<string>>().toEqualTypeOf<"">();
    expectTypeOf<Dotted<Date>>().toEqualTypeOf<"">();
    expectTypeOf<Dotted<Map<string, Doc>>>().toEqualTypeOf<"">();
    expectTypeOf<Dotted<Set<string>>>().toEqualTypeOf<"">();
    // The wart this replaces: a slice holding a number autocompleted Number's methods.
    expectTypeOf<Has<Dotted<number>, "toFixed">>().toEqualTypeOf<false>();
  });

  it("gives a nullable object slice both, because both can fire", () => {
    // The conditional distributes over the union. This is not an accident to be simplified
    // away: such a slice changes at its root when it becomes `null`, and at `a` otherwise.
    expectTypeOf<Dotted<{ a: number } | null>>().toEqualTypeOf<"" | "a">();
  });

  it("does not offer the empty path for a plain object slice", () => {
    // An object slice reports its changes at its leaves, so `""` would never fire for one.
    expectTypeOf<Has<Dotted<CatalogState>, "">>().toEqualTypeOf<false>();
  });
});

describe("PathValue agrees with the code that reads the path", () => {
  it("resolves nested, indexed and built-in values unchanged", () => {
    expectTypeOf<PathValue<CatalogState, "nested.count">>().toEqualTypeOf<number>();
    expectTypeOf<PathValue<CatalogState, "items.0.title">>().toEqualTypeOf<string>();
    expectTypeOf<PathValue<CatalogState, "items">>().toEqualTypeOf<Doc[]>();
    expectTypeOf<PathValue<CatalogState, "byId">>().toEqualTypeOf<Map<string, Doc>>();
    expectTypeOf<PathValue<CatalogState, "updatedAt">>().toEqualTypeOf<Date>();
  });

  it("resolves the empty path to the whole value", () => {
    // Both path readers return the object itself for `""`; the type said `never`, so a
    // subscription to a root-value slice was typed as nothing at all.
    expectTypeOf<PathValue<number, "">>().toEqualTypeOf<number>();
    expectTypeOf<PathValue<CatalogState, "">>().toEqualTypeOf<CatalogState>();
  });
});
