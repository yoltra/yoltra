/**
 * @module @yoltra/react
 */

import {
  createStore,
  type DeepReadonly,
  type EffectSpec,
  type EMAddOf,
  type EMFromReducersStrict,
  type EventMapBase,
  type EventUnion,
  type Merge,
  type MiddlewareFunction,
  type MiddlewareInput,
  type ReducersMapAny,
  type ReducerSpec,
  type SatisfiesSlices,
  type StateFromReducers,
  type StateOfSpec,
  type StoreInstance,
  type WidenNames,
  type WidenState,
} from "@yoltra/core";
import React, { createContext, type ReactNode } from "react";

import { createHooks, type YoltraHooks } from "./hooks/createHooks";

/**
 * The value returned by {@link createYoltra}: the created `store`, an optional
 * `StoreProvider` (plus its raw `StoreContext`), and the full set of typed hooks
 * from {@link YoltraHooks}.
 *
 * @typeParam R  - Reducer name union.
 * @typeParam S  - State record keyed by `R`.
 * @typeParam EM - Event map.
 *
 * @public
 */
export interface Yoltra<R extends string, S extends Record<R, any>, EM extends EventMapBase>
  extends YoltraHooks<R, S, EM>,
    YoltraDecoration<R, S, EM> {
  /** The store created by this call; the hooks default to it (no Provider needed). */
  store: StoreInstance<R, S, EM>;
  /** Raw context carrying the store — usually you only need `StoreProvider`. */
  StoreContext: React.Context<StoreInstance<R, S, EM> | null>;
  /** Optional provider to scope a different store instance to a subtree. */
  StoreProvider: React.FC<{ store?: StoreInstance<R, S, EM>; children: ReactNode }>;
}

/**
 * The chainable decoration surface on a {@link Yoltra}.
 *
 * @remarks
 * `Yoltra` extends this, so every hook set is chainable.
 *
 * Every method returns a **new hook set bound to the same context object**, re-typed. The
 * context is never recreated, so a `StoreProvider` from any view in the chain serves the
 * hooks of every other, and the Suspense cache is shared - it keys on store identity through
 * a `WeakMap`, and the widened store is the same object.
 *
 * Call these at **module scope, once, before first render**. `createHooks` allocates fresh
 * function objects per call, so decorating inside a component would hand React a different
 * hook set on every render.
 *
 * @public
 */
export interface YoltraDecoration<
  R extends string,
  S extends Record<R, any>,
  EM extends EventMapBase,
> {
  /** Mounts a slice and returns a widened `Yoltra`: the same store, a new hook set. */
  withSlice<N extends string, Spec extends ReducerSpec<any, any>>(
    name: N,
    spec: Spec,
    options?: { owner?: string },
  ): DecoratableYoltra<
    WidenNames<R, N>,
    SatisfiesSlices<WidenState<S, N, StateOfSpec<Spec>>, WidenNames<R, N>>,
    Merge<EM, EMAddOf<Spec>>
  >;

  /**
   * Registers middleware and returns a `Yoltra` widened by whatever event map it declares.
   *
   * Only the spec form can widen; a bare `MiddlewareFunction` contributes nothing, because
   * its event parameter is `EventUnion<EM>` and TypeScript cannot infer `EM` back out of it.
   */
  withMiddleware<M extends MiddlewareInput<any, any>>(
    mw: M,
  ): DecoratableYoltra<R, S, Merge<EM, EMAddOf<M>>>;

  /** Registers an effect and returns a `Yoltra` widened by whatever event map it declares. */
  withEffect<Spec extends EffectSpec<any, any>>(
    spec: Spec,
  ): DecoratableYoltra<R, S, Merge<EM, EMAddOf<Spec>>>;
}

/**
 * A {@link Yoltra} carrying the chainable decoration surface.
 *
 * @public
 */
export type DecoratableYoltra<
  R extends string,
  S extends Record<R, any>,
  EM extends EventMapBase,
> = Yoltra<R, S, EM>;

/**
 * One-call setup: create a store and its fully-typed React hooks together.
 *
 * @remarks
 * Collapses the `createStore` + context + `createHooks` boilerplate into a
 * single call. The returned hooks default to the created store, so wrapping your
 * tree in a `<StoreProvider>` is **optional** — use it only to scope a different
 * store instance to a subtree (e.g. a fresh store per test).
 *
 * **Client-only convenience.** The store created here is a module-level
 * singleton, and the Suspense hooks share a module-global cache. Do not reuse a
 * `createYoltra(...)` module across SSR requests — state and cache would bleed
 * between them. For SSR, create a store per request and scope it with
 * `StoreProvider`.
 *
 * **The Suspense hooks are part of this set.** Take `useSuspenseAtomicProp` and
 * `useSuspenseAtomicProps` from here, not from the `@yoltra/react` barrel: the
 * barrel's copies read the *package-level* context, which this function never
 * fills, so they would throw `useStore must be used inside <StoreProvider>` at
 * runtime with nothing in the types to warn you — the two are identical in
 * shape. The ones returned here are bound to this store's own context and need
 * no provider, like the rest of the set.
 *
 * @example Suspense alongside createYoltra
 * ```tsx
 * export const { store, useAtomicProp, useSuspenseAtomicProp } = createYoltra({ ... });
 *
 * // No <StoreProvider> anywhere: every hook above already knows this store.
 * createRoot(el).render(<App />);
 * ```
 *
 * @typeParam RM - Reducers map; state shape and event map are inferred from it.
 * @param cfg - The same configuration accepted by {@link createStore}.
 * @returns The `store`, an optional `StoreProvider`, the raw `StoreContext`, and
 * the full set of typed hooks (`useAtomicProp`, `useAtomicProps`, `useEmit`,
 * `useEvent`, `useSelector`, `useStore`, `useSuspenseAtomicProp`,
 * `useSuspenseAtomicProps`, `shallowEqual`).
 *
 * @example
 * ```tsx
 * export const { store, useAtomicProp, useEmit } = createYoltra({
 *   name: 'App',
 *   reducer: {
 *     counter: {
 *       state: { value: 0 },
 *       when: { keys: [['ui', 'increment']] },
 *       reducer: (s, e) => (e.type === 'increment' ? { value: s.value + e.payload } : s),
 *     },
 *   },
 * });
 *
 * function Counter() {
 *   const value = useAtomicProp({ reducer: 'counter', property: 'value' });
 *   const emit = useEmit();
 *   return <button onClick={() => emit('ui', 'increment', 1)}>{value}</button>;
 * }
 * ```
 *
 * @public
 */
export function createYoltra<RM extends ReducersMapAny>(cfg: {
  name: string;
  reducer: RM;
  middleware?: MiddlewareFunction<DeepReadonly<StateFromReducers<RM>>, EMFromReducersStrict<RM>>[];
  effects?: Array<EffectSpec<DeepReadonly<StateFromReducers<RM>>, EMFromReducersStrict<RM>>>;
  dedupWindowMs?: number;
  devtools?: { allowReplay?: boolean };
  onEffectError?: (error: unknown, event: EventUnion<EMFromReducersStrict<RM>>) => void;
}): Yoltra<keyof RM & string, StateFromReducers<RM>, EMFromReducersStrict<RM>> {
  type S = StateFromReducers<RM>;
  type EM = EMFromReducersStrict<RM>;
  type R = keyof RM & string;

  const store: StoreInstance<R, S, EM> = createStore(cfg);

  // Default the context value to the store so components work WITHOUT a Provider.
  const StoreContext = createContext<StoreInstance<R, S, EM> | null>(store);

  return buildYoltra<R, S, EM>(store, StoreContext);
}

/**
 * Assembles a `Yoltra` around a store and its context.
 *
 * @remarks
 * Shared by {@link createYoltra} and by every `with*` call, so a widened hook set is built
 * exactly the way the original was.
 *
 * The context object is **re-typed, never recreated**. That is what lets a `<StoreProvider>`
 * from any view in a chain serve the hooks of every other, and it is also why the Suspense
 * cache is shared: the cache keys on store identity through a `WeakMap`, and the widened
 * store is the same object.
 *
 * @internal
 */
function buildYoltra<R extends string, S extends Record<R, any>, EM extends EventMapBase>(
  store: StoreInstance<R, S, EM>,
  StoreContext: React.Context<StoreInstance<R, S, EM> | null>,
): Yoltra<R, S, EM> {
  const hooks = createHooks<R, S, EM>(StoreContext);

  /**
   * Optional provider — only needed to scope a different store instance to a
   * subtree; otherwise the hooks use the store created above.
   */
  const StoreProvider: React.FC<{ store?: StoreInstance<R, S, EM>; children: ReactNode }> = ({
    store: override,
    children,
  }) => <StoreContext.Provider value={override ?? store}>{children}</StoreContext.Provider>;

  // Each `with*` registers on the store, then rebuilds a hook set against the *same* context
  // object under a wider type. `createHooks` allocates fresh function objects, which is why
  // these must be called at module scope, once, and never during render.
  const widen = (): any => buildYoltra(store as any, StoreContext as any);

  return {
    store,
    StoreContext,
    StoreProvider,
    ...hooks,
    withSlice: (name: string, spec: any, options?: { owner?: string }) => {
      store.registerSlice(name, spec, options);
      return widen();
    },
    withMiddleware: (mw: any) => {
      store.registerMiddleware(mw);
      return widen();
    },
    withEffect: (spec: any) => {
      store.registerEffect(spec);
      return widen();
    },
  } as Yoltra<R, S, EM>;
}

/**
 * {@link YoltraDecoration.withSlice} as a free function.
 *
 * @remarks
 * For a library handed a `Yoltra` it did not create. Identical to the method.
 *
 * @public
 */
export function withSlice<
  R extends string,
  S extends Record<R, any>,
  EM extends EventMapBase,
  N extends string,
  Spec extends ReducerSpec<any, any>,
>(
  yoltra: Yoltra<R, S, EM>,
  name: N,
  spec: Spec,
  options?: { owner?: string },
): DecoratableYoltra<
  WidenNames<R, N>,
  SatisfiesSlices<WidenState<S, N, StateOfSpec<Spec>>, WidenNames<R, N>>,
  Merge<EM, EMAddOf<Spec>>
> {
  // Written out rather than `ReturnType<Yoltra<R,S,EM>["withSlice"]>`: resolving the return
  // of a generic method on a self-referential interface sent the compiler into unbounded
  // inference and overflowed its stack.
  return yoltra.withSlice(name, spec, options);
}

/**
 * {@link YoltraDecoration.withMiddleware} as a free function.
 *
 * @public
 */
export function withMiddleware<
  R extends string,
  S extends Record<R, any>,
  EM extends EventMapBase,
  M extends MiddlewareInput<any, any>,
>(yoltra: Yoltra<R, S, EM>, mw: M): DecoratableYoltra<R, S, Merge<EM, EMAddOf<M>>> {
  return yoltra.withMiddleware(mw);
}

/**
 * {@link YoltraDecoration.withEffect} as a free function.
 *
 * @public
 */
export function withEffect<
  R extends string,
  S extends Record<R, any>,
  EM extends EventMapBase,
  Spec extends EffectSpec<any, any>,
>(yoltra: Yoltra<R, S, EM>, spec: Spec): DecoratableYoltra<R, S, Merge<EM, EMAddOf<Spec>>> {
  return yoltra.withEffect(spec);
}
