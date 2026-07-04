/**
 * @module @yoltra/react
 */

import { useMemo, useRef, useSyncExternalStore } from "react";
import type { EventMapBase, StoreInstance, Dotted, WithGlob } from "@yoltra/core";

import { useStore } from "./hooks";
import { hasWildcard, normalizePath, getAtPath } from "../utils/path";

/** @internal */
type CacheKey = string;

/** @internal */
type CacheEntry<T> =
  | { status: "ready"; value: T; expiresAt: number | null }
  | { status: "pending"; promise: Promise<void>; expiresAt: number | null }
  | { status: "error"; error: any; expiresAt: number | null };

/**
 * Time-based expiry for a **settled** (`ready`) entry. A non-positive or `null`
 * `staleTime` means "no time expiry" — the entry is served until it is
 * invalidated (by a store change on the subscribed path, or an explicit
 * `invalidate`/`clear`). Only a positive `staleTime` adds a wall-clock bound.
 *
 * Critically, `staleTime: 0` (the default) must NOT map to `Date.now()` here:
 * an entry that expires on the same tick it was created would be re-loaded on
 * the very next render, throwing a fresh promise each time (infinite suspend).
 * @internal
 */
function computeExpiry(staleTime: number | null): number | null {
  return staleTime == null || staleTime <= 0 ? null : Date.now() + staleTime;
}

/** @internal */
class SuspenseCache {
  private store = new Map<CacheKey, CacheEntry<any>>();

  read<T>(key: CacheKey, load: () => T | Promise<T>, staleTime: number | null): T {
    const now = Date.now();
    const entry = this.store.get(key);

    // A ready value is served until it time-expires (staleTime > 0) or is
    // invalidated. With staleTime 0/null it never time-expires (expiresAt null).
    if (entry && entry.status === "ready" && (entry.expiresAt == null || entry.expiresAt > now)) {
      return entry.value as T;
    }
    // A load already in flight: always re-throw the SAME promise until it
    // settles. Pending entries are never time-expired — otherwise every render
    // during the load would spawn a fresh load (infinite suspend / request storm).
    if (entry && entry.status === "pending") {
      throw entry.promise;
    }
    // A cached error is re-thrown to the nearest error boundary until it is
    // invalidated (by a store change on the subscribed path, or an explicit
    // invalidate/clear). Error caching is independent of staleTime.
    if (entry && entry.status === "error") {
      throw entry.error;
    }

    const promise = Promise.resolve()
      .then(load)
      .then((value) => {
        this.store.set(key, { status: "ready", value, expiresAt: computeExpiry(staleTime) });
      })
      .catch((err) => {
        this.store.set(key, { status: "error", error: err, expiresAt: null });
      });

    this.store.set(key, { status: "pending", promise, expiresAt: null });
    throw promise;
  }

  invalidate(key: CacheKey) {
    this.store.delete(key);
  }
  invalidatePrefix(prefix: string) {
    for (const k of this.store.keys()) {
      if (k.startsWith(prefix)) this.store.delete(k);
    }
  }
  clear() {
    this.store.clear();
  }
}

/**
 * Default Suspense cache instance shared by all `useSuspense*` hooks.
 *
 * Use {@link invalidateAtomicProp}, {@link invalidateAtomicPropsByReducer},
 * or {@link clearSuspenseCache} to manage the cache from outside hooks.
 *
 * @public
 */
export const suspenseCache = new SuspenseCache();

/** @internal */
function buildKey(reducer: string, props: string[] | string, extraKey?: string): string {
  const p = Array.isArray(props) ? props.map(normalizePath).sort().join("|") : normalizePath(props);
  return extraKey ? `${reducer}::${p}::${extraKey}` : `${reducer}::${p}`;
}

/**
 * Options for {@link useSuspenseAtomicProp}.
 *
 * @typeParam T - The resolved value type after loading.
 * @typeParam S - Store state record.
 *
 * @example
 * ```ts
 * const options: SuspenseAtomicPropOptions<User, AppState> = {
 *   load: async (userId) => fetchUser(userId),
 *   staleTime: 30_000, // cache for 30 seconds
 *   key: 'user-detail',
 * };
 * ```
 *
 * @public
 */
export interface SuspenseAtomicPropOptions<T, S> {
  /** Async loader that receives the value at the path and the full slice. */
  load: (valueAtPath: any, slice: S[keyof S]) => Promise<T> | T;
  /**
   * Extra wall-clock TTL (ms) for a resolved value. `0` (the default) or omitted
   * means the cached value is served until the subscribed path changes or you
   * invalidate it explicitly; a positive value additionally expires it after that
   * many ms. Cached errors ignore this and are re-thrown until invalidated.
   */
  staleTime?: number;
  /** Optional extra key to differentiate cache entries for the same path. */
  key?: string;
}

/**
 * Suspense-compatible version of `useAtomicProp` that throws a promise while loading.
 *
 * Subscribes to a single dotted path and calls `options.load` to produce the
 * resolved value. While the promise is pending, React Suspense catches it and
 * renders the nearest `<Suspense>` fallback.
 *
 * @remarks
 * **Client-only loading.** During server rendering this hook does not suspend
 * (throwing a promise would crash `renderToString`): `getServerSnapshot` returns
 * the current value at the path **without** invoking `options.load`. Perform the
 * actual load on the client.
 *
 * @typeParam R - Reducer name union.
 * @typeParam S - State record keyed by `R`.
 * @typeParam P - Dotted path within `S[R]`.
 * @typeParam T - Resolved value type.
 *
 * @param storeSpec - `{ reducer, property }` identifying the path to subscribe to.
 * @param options - Loading options (see {@link SuspenseAtomicPropOptions}).
 * @returns The resolved value of type `T`.
 *
 * @throws A `Promise` while loading (caught by React Suspense).
 * @throws If called outside a `<StoreProvider>`.
 *
 * @example
 * ```tsx
 * function UserName({ userId }: { userId: string }) {
 *   const name = useSuspenseAtomicProp(
 *     { reducer: 'users', property: `byId.${userId}.name` },
 *     { load: async (name) => name ?? (await fetchUser(userId)).name },
 *   );
 *   return <span>{name}</span>;
 * }
 *
 * // Wrap with Suspense
 * <Suspense fallback={<Spinner />}>
 *   <UserName userId="123" />
 * </Suspense>
 * ```
 *
 * @public
 */
export function useSuspenseAtomicProp<
  R extends string,
  S extends Record<R, any>,
  P extends Dotted<S[R]>,
  T,
>(storeSpec: { reducer: R; property: P }, options: SuspenseAtomicPropOptions<T, S>): T;
export function useSuspenseAtomicProp<R extends string, S extends Record<R, any>, T>(
  storeSpec: { reducer: R; property: string },
  options: SuspenseAtomicPropOptions<T, S>,
): T;
export function useSuspenseAtomicProp<R extends string, S extends Record<R, any>, T>(
  storeSpec: { reducer: R; property: string },
  options: SuspenseAtomicPropOptions<T, S>,
): T {
  return _useSuspenseAtomicPropImpl<R, S, any, T>(storeSpec as any, options);
}

/** @internal */
function _useSuspenseAtomicPropImpl<
  R extends string,
  S extends Record<R, any>,
  P extends Dotted<S[R]>,
  T,
>(storeSpec: { reducer: R; property: P }, options: SuspenseAtomicPropOptions<T, S>): T {
  const store = useStore<EventMapBase, R, S>() as StoreInstance<R, S, EventMapBase>;
  const reducer = storeSpec.reducer;
  const path = normalizePath(storeSpec.property as string);
  const key = buildKey(reducer, path, options.key);

  const subscribe = useMemo(() => {
    return (notify: () => void) =>
      store.connect({ reducer, property: path }, () => {
        suspenseCache.invalidate(key);
        notify();
      });
  }, [store, reducer, path, key]);

  // Keep the latest options in a ref so an inline `options` object doesn't
  // rebuild getSnapshot every render (RX-5).
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const getSnapshot = useMemo(() => {
    const isGlob = hasWildcard(path);
    return () => {
      const state = store.getState() as S;
      const slice = state[reducer];
      const val = isGlob ? slice : getAtPath(slice, path);
      const opts = optionsRef.current;
      return suspenseCache.read<T>(key, () => opts.load(val, slice), opts.staleTime ?? 0);
    };
  }, [store, reducer, path, key]);

  // Server render must NOT suspend — throwing a promise from getServerSnapshot
  // crashes renderToString. Return the current value at the path without loading
  // (client-only Suspense loading; see the hook's SSR note).
  const getServerSnapshot = useMemo(() => {
    const isGlob = hasWildcard(path);
    return () => {
      const state = store.getState() as S;
      const slice = state[reducer];
      return (isGlob ? slice : getAtPath(slice, path)) as T;
    };
  }, [store, reducer, path]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Options for {@link useSuspenseAtomicProps}.
 *
 * @typeParam T - The resolved value type after loading.
 * @typeParam S - Store state record.
 *
 * @public
 */
export interface SuspenseAtomicPropsOptions<T, S> {
  /** Async loader that receives the full store state. */
  load: (state: S) => Promise<T> | T;
  /**
   * Extra wall-clock TTL (ms) for a resolved value. `0` (the default) or omitted
   * means the cached value is served until the subscribed path changes or you
   * invalidate it explicitly; a positive value additionally expires it after that
   * many ms. Cached errors ignore this and are re-thrown until invalidated.
   */
  staleTime?: number;
  /** Optional extra key to differentiate cache entries. */
  key?: string;
}

/**
 * Suspense-compatible version of `useAtomicProps` that throws a promise while loading.
 *
 * Subscribes to multiple dotted paths and calls `options.load` with the full state
 * to produce the resolved value. While the promise is pending, React Suspense
 * renders the nearest `<Suspense>` fallback.
 *
 * @remarks
 * **Client-only loading.** During server rendering this hook does not suspend
 * (throwing a promise would crash `renderToString`): `getServerSnapshot` uses a
 * synchronous `options.load` result if one is available, otherwise `undefined`.
 * Perform the actual load on the client.
 *
 * @typeParam R - Reducer name union.
 * @typeParam S - State record keyed by `R`.
 * @typeParam T - Resolved value type.
 *
 * @param specs - Array of `{ reducer, property }` paths to subscribe to.
 * @param options - Loading options (see {@link SuspenseAtomicPropsOptions}).
 * @returns The resolved value of type `T`.
 *
 * @throws A `Promise` while loading (caught by React Suspense).
 * @throws If called outside a `<StoreProvider>`.
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const stats = useSuspenseAtomicProps(
 *     [
 *       { reducer: 'orders', property: 'items.**' },
 *       { reducer: 'users', property: 'active' },
 *     ],
 *     { load: async (state) => computeDashboardStats(state) },
 *   );
 *   return <StatsGrid data={stats} />;
 * }
 * ```
 *
 * @public
 */
export function useSuspenseAtomicProps<R extends string, S extends Record<R, any>, T>(
  specs: Array<{
    reducer: R;
    property: Dotted<S[R]> | WithGlob<Dotted<S[R]>> | ReadonlyArray<WithGlob<Dotted<S[R]>>>;
  }>,
  options: SuspenseAtomicPropsOptions<T, S>,
): T;
export function useSuspenseAtomicProps<R extends string, S extends Record<R, any>, T>(
  specs: Array<{ reducer: R; property: string | readonly string[] }>,
  options: SuspenseAtomicPropsOptions<T, S>,
): T;
export function useSuspenseAtomicProps<R extends string, S extends Record<R, any>, T>(
  specs: Array<{
    reducer: R;
    property:
      | string
      | readonly string[]
      | Dotted<S[R]>
      | WithGlob<Dotted<S[R]>>
      | ReadonlyArray<WithGlob<Dotted<S[R]>>>;
  }>,
  options: SuspenseAtomicPropsOptions<T, S>,
): T {
  return _useSuspenseAtomicPropsImpl<R, S, T>(specs as any, options);
}

/** @internal */
function _useSuspenseAtomicPropsImpl<R extends string, S extends Record<R, any>, T>(
  specs: Array<{
    reducer: R;
    property:
      | string
      | readonly string[]
      | Dotted<S[R]>
      | WithGlob<Dotted<S[R]>>
      | ReadonlyArray<WithGlob<Dotted<S[R]>>>;
  }>,
  options: SuspenseAtomicPropsOptions<T, S>,
): T {
  const store = useStore<EventMapBase, R, S>() as StoreInstance<R, S, EventMapBase>;

  const normalized = useMemo(
    () =>
      specs.map((sp) => ({
        reducer: sp.reducer,
        property: Array.isArray(sp.property)
          ? (sp.property as readonly string[]).map((p) => normalizePath(p as string))
          : normalizePath(sp.property as string),
      })),
    [JSON.stringify(specs)],
  );

  const key = useMemo(() => {
    const parts = normalized
      .map((sp) => buildKey(sp.reducer, sp.property))
      .sort()
      .join("||");
    return options.key ? `${parts}::${options.key}` : parts;
  }, [normalized, options.key]);

  const subscribe = useMemo(() => {
    return (notify: () => void) => {
      const wrapped = () => {
        suspenseCache.invalidate(key);
        notify();
      };
      const unsubs = normalized.map((sp) => store.connect(sp as any, wrapped));
      return () => {
        for (const u of unsubs) u();
      };
    };
  }, [store, normalized, key]);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const getSnapshot = useMemo(() => {
    return () => {
      const state = store.getState() as S;
      const opts = optionsRef.current;
      return suspenseCache.read<T>(key, () => opts.load(state), opts.staleTime ?? 0);
    };
  }, [store, key]);

  // Server render must NOT suspend. Use a synchronous load result if one is
  // available; otherwise render `undefined` rather than throwing a promise.
  const getServerSnapshot = () => {
    const result = optionsRef.current.load(store.getState() as S);
    return (result instanceof Promise ? undefined : result) as T;
  };

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Invalidates the Suspense cache entry for a specific `reducer.property` path.
 *
 * @param reducer - Reducer (slice) name.
 * @param property - Dotted property path.
 * @param extraKey - Optional extra key if the hook was created with `options.key`.
 *
 * @example
 * ```ts
 * invalidateAtomicProp('users', 'byId.123.name');
 * ```
 *
 * @public
 */
export function invalidateAtomicProp(reducer: string, property: string, extraKey?: string) {
  suspenseCache.invalidate(buildKey(reducer, property, extraKey));
}

/**
 * Invalidates all Suspense cache entries for a given reducer (slice).
 *
 * @param reducer - Reducer (slice) name whose cache entries should be cleared.
 *
 * @example
 * ```ts
 * invalidateAtomicPropsByReducer('users');
 * ```
 *
 * @public
 */
export function invalidateAtomicPropsByReducer(reducer: string) {
  suspenseCache.invalidatePrefix(`${reducer}::`);
}

/**
 * Clears the entire Suspense cache, forcing all `useSuspense*` hooks to re-load.
 *
 * @example
 * ```ts
 * // After a logout, clear all cached data
 * clearSuspenseCache();
 * ```
 *
 * @public
 */
export function clearSuspenseCache() {
  suspenseCache.clear();
}