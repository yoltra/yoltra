/**
 * @module @yoltra/react
 */

import {
  createStore,
  type DeepReadonly,
  type EffectSpec,
  type EMFromReducersStrict,
  type EventMapBase,
  type EventUnion,
  type MiddlewareFunction,
  type ReducersMapAny,
  type StateFromReducers,
  type StoreInstance,
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
  extends YoltraHooks<R, S, EM> {
  /** The store created by this call; the hooks default to it (no Provider needed). */
  store: StoreInstance<R, S, EM>;
  /** Raw context carrying the store — usually you only need `StoreProvider`. */
  StoreContext: React.Context<StoreInstance<R, S, EM> | null>;
  /** Optional provider to scope a different store instance to a subtree. */
  StoreProvider: React.FC<{ store?: StoreInstance<R, S, EM>; children: ReactNode }>;
}

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

  const hooks = createHooks<R, S, EM>(StoreContext);

  /**
   * Optional provider — only needed to scope a different store instance to a
   * subtree; otherwise the hooks use the store created above.
   */
  const StoreProvider: React.FC<{ store?: StoreInstance<R, S, EM>; children: ReactNode }> = ({
    store: override,
    children,
  }) => <StoreContext.Provider value={override ?? store}>{children}</StoreContext.Provider>;

  return { store, StoreContext, StoreProvider, ...hooks };
}
