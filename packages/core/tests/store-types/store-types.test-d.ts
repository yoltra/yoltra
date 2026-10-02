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
import { defineSlice, eventKeys } from "../../src/types";
import type {
  Clock,
  EffectContext,
  EffectFunction,
  DeepReadonly,
  DiagnosticSink,
  Dotted,
  EffectSpec,
  EMFromReducersStrict,
  Event,
  EventFromWhen,
  EventUnion,
  ExactWhen,
  MiddlewareSpec,
  PathValue,
  ReducerReplacement,
  ReducerSpec,
  Scheduler,
  StateFromReducers,
  When,
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

describe("Reducers and effects take exact matchers only", () => {
  type EM = { plan: { go: null } };

  it("refuses channelPattern on a reducer or an effect spec, and keeps it on middleware", () => {
    const reducer: ReducerSpec<number, EM> = {
      state: 0,
      // @ts-expect-error channelPattern is middleware-only
      when: { channelPattern: "*plan" },
      reducer: (s) => s,
    };
    const effect: EffectSpec<unknown, EM> = {
      // @ts-expect-error channelPattern is middleware-only
      when: { channelPattern: "*plan" },
      effect: () => {},
    };
    const middleware: MiddlewareSpec<unknown, EM> = {
      when: { channelPattern: "*plan" },
      middleware: () => true,
    };
    void [reducer, effect, middleware];
  });

  it("is When without its pattern form", () => {
    expectTypeOf<ExactWhen<EM>>().toEqualTypeOf<Exclude<When<EM>, { channelPattern: string }>>();
    expectTypeOf<{ channel: "plan" }>().toMatchTypeOf<ExactWhen<EM>>();
    expectTypeOf<{ channelPattern: string }>().not.toMatchTypeOf<ExactWhen<EM>>();
  });
});

describe("replaceReducers and hotReplace type each slice on its own", () => {
  /**
   * The argument was `Record<R, ReducerSpec<S[R], EM>>`: every slice required, each typed with the
   * union of all slice states. An annotated reducer failed on any store with two slices, a reducer
   * for one slice could return another's state, and on a decorated store the only call that
   * typechecked named the runtime slice, which the runtime then refuses.
   */
  type EM = { a: { inc: number }; b: { set: string } };
  const store = createStore<{ a: number; b: string }, EM>({
    name: "ReplaceTyping",
    reducer: {
      a: { state: 0, when: { keys: [["a", "inc"]] }, reducer: (s) => s },
      b: { state: "", when: { keys: [["b", "set"]] }, reducer: (s) => s },
    },
  });

  it("types each entry with its own slice's state", () => {
    store.replaceReducers({
      a: { state: 0, when: { keys: [["a", "inc"]] }, reducer: (s: number) => s + 1 },
      b: { state: "", when: { keys: [["b", "set"]] }, reducer: (s: string) => s },
    });
    store.replaceReducers({
      // @ts-expect-error a reducer for `a` cannot return `b`'s state
      a: { state: 0, when: { keys: [["a", "inc"]] }, reducer: () => "not a number" },
    });
  });

  it("lets every key be omitted, which the runtime handles", () => {
    store.replaceReducers({ a: { state: 0, when: { keys: [["a", "inc"]] }, reducer: (s) => s } });
    store.hotReplace({ reducer: {} });
  });

  it("lets a decorated store omit the slice a library mounted", () => {
    type LibEM = { lib: { ping: null } };
    const lib = defineSlice<LibEM>()({
      state: { n: 0 },
      when: { keys: [["lib", "ping"]] },
      reducer: (s) => s,
    });
    const decorated = store.withSlice("lib", lib);
    decorated.replaceReducers({
      a: { state: 0, when: { keys: [["a", "inc"]] }, reducer: (s) => s },
      b: { state: "", when: { keys: [["b", "set"]] }, reducer: (s) => s },
    });
    decorated.hotReplace({
      reducer: { a: { state: 0, when: { keys: [["a", "inc"]] }, reducer: (s) => s } },
    });
  });

  it("is the mapped optional form", () => {
    expectTypeOf<ReducerReplacement<"a" | "b", { a: number; b: string }, EM>>().toEqualTypeOf<{
      a?: ReducerSpec<number, EM>;
      b?: ReducerSpec<string, EM>;
    }>();
  });
});

describe("EventFromWhen covers every form", () => {
  type EM = { plan: { go: null }; other: { stop: number } };

  it("resolves a pattern to the whole union a middleware receives, not never", () => {
    expectTypeOf<EventFromWhen<EM, { channelPattern: string }>>().toEqualTypeOf<EventUnion<EM>>();
    expectTypeOf<EventFromWhen<EM, { channelPattern: string }>>().not.toBeNever();
  });

  it("still narrows the exact forms", () => {
    expectTypeOf<EventFromWhen<EM, { channel: "other" }>["payload"]>().toEqualTypeOf<number>();
  });

  it("narrows keys built with eventKeys, as its documented example does", () => {
    type AppEM = { ui: { increment: number; reset: null; rename: string } };
    const when = { keys: eventKeys<AppEM>()([["ui", "increment"], ["ui", "reset"]]) };
    expectTypeOf<EventFromWhen<AppEM, typeof when>>().toEqualTypeOf<
      Event<AppEM, "ui", "increment"> | Event<AppEM, "ui", "reset">
    >();
  });
});

describe("StateFromReducers and EMFromReducersStrict name an inferred store", () => {
  type A = { a: { inc: number } };
  type B = { b: { set: string } };
  const reducer = {
    counter: { state: 0, when: { keys: [["a", "inc"]] }, reducer: (s: number) => s } as ReducerSpec<number, A>,
    label: { state: "", when: { keys: [["b", "set"]] }, reducer: (s: string) => s } as ReducerSpec<string, B>,
  };

  it("maps each slice to its state", () => {
    expectTypeOf<StateFromReducers<typeof reducer>>().toEqualTypeOf<{ counter: number; label: string }>();
  });

  it("merges the slices' event maps", () => {
    expectTypeOf<EMFromReducersStrict<typeof reducer>>().toEqualTypeOf<A & B>();
  });
});

describe("Clock and Scheduler accept the port shapes other libraries already use", () => {
  it("accepts a clock with more members than now()", () => {
    type RicherClock = { now(): number; isoNow(): string };
    expectTypeOf<RicherClock>().toMatchTypeOf<Clock>();
  });

  it("accepts a scheduler with its own handle type, and is accepted where one is expected", () => {
    type OwnHandle = { readonly __timer: unique symbol } | number | object;
    type OwnScheduler = {
      setTimeout(callback: () => void, delayMs: number): OwnHandle;
      clearTimeout(handle: OwnHandle): void;
    };
    expectTypeOf<OwnScheduler>().toMatchTypeOf<Scheduler>();
    expectTypeOf<Scheduler>().toMatchTypeOf<OwnScheduler>();
  });

  it("is accepted by createStore", () => {
    const clock: Clock = { now: () => 0 };
    const scheduler: Scheduler = { setTimeout: () => 0, clearTimeout: () => undefined };
    createStore({ name: "Ports", reducer: {}, clock, scheduler });
  });
});

describe("DiagnosticSink accepts the sink shapes other libraries already use", () => {
  it("accepts a sink that takes more levels and any code", () => {
    type WiderSink = (diagnostic: {
      readonly level: "debug" | "info" | "warn" | "error";
      readonly code: string;
      readonly message: string;
      readonly detail?: Readonly<Record<string, unknown>>;
    }) => void;
    expectTypeOf<WiderSink>().toMatchTypeOf<DiagnosticSink>();
  });

  it("is accepted by createStore", () => {
    const sink: DiagnosticSink = () => undefined;
    const store = createStore({ name: "Diag", reducer: {}, diagnostics: sink });
    expectTypeOf(store.onDiagnostic).parameter(0).toEqualTypeOf<DiagnosticSink>();
  });
});

describe("EffectFunction gained a context without breaking older effects", () => {
  type EM = { ui: { go: number } };

  it("still accepts an effect written with three parameters", () => {
    const old = (_event: unknown, _getState: () => unknown, _emit: unknown): void => undefined;
    expectTypeOf(old).toMatchTypeOf<EffectFunction<unknown, EM>>();
  });

  it("types the fourth parameter as the effect's context", () => {
    expectTypeOf<Parameters<EffectFunction<unknown, EM>>[3]>().toEqualTypeOf<EffectContext>();
    expectTypeOf<EffectContext["signal"]>().toEqualTypeOf<AbortSignal>();
  });
});

describe("CallOptions.cancel accepts only events that can carry a cancellation", () => {
  type CEM = {
    rpc: { ask: null; answer: null; cancel: { requestId: string; reason: "cancelled" | "aborted" | "timeout"; detail?: string }; count: number };
  };

  it("accepts a matching event and refuses one whose payload cannot hold it", () => {
    const store = createStore<Record<string, never>, CEM>({ name: "CancelTypes" });
    void store.call("rpc", "ask", null, { reply: ["rpc", "answer"], cancel: ["rpc", "cancel"] }).catch(() => undefined);
    // @ts-expect-error a number payload cannot carry a CallCancellation
    void store.call("rpc", "ask", null, { reply: ["rpc", "answer"], cancel: ["rpc", "count"] }).catch(() => undefined);
  });
});
