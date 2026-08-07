/**
 * @module @yoltra/react
 */

import { useMemo, useRef, useSyncExternalStore } from "react";
import type { EventMapBase, StoreInstance, Dotted, WithGlob } from "@yoltra/core";

import { useStore } from "./hooks";
import { hasWildcard, normalizePath, getAtPath } from "../utils/path";

/**
 * The `useStore` a Suspense hook reads through.
 *
 * @remarks
 * Passed in rather than imported so the same implementation can serve both the package-level
 * hooks and the ones {@link createSuspenseHooks} binds to a caller's own context.
 *
 * @internal
 */
type UseStoreHook<
  R extends string,
  S extends Record<R, any>,
  EM extends EventMapBase = EventMapBase,
> = () => StoreInstance<R, S, EM>;

/** @internal */
type CacheKey = string;

/** @internal */
type CacheEntry<T> =
  | { status: "ready"; value: T; expiresAt: number | null }
  | { status: "pending"; promise: Promise<void>; expiresAt: number | null }
  | {
      status: "error";
      error: any;
      expiresAt: number | null;
      /**
       * Whether the error has been thrown to a boundary yet.
       *
       * @remarks
       * A failure must reach the boundary at least once, and time alone cannot express that.
       * The load rejects, the wrapper caches the error and *resolves*, React re-renders, and
       * only then does anybody read the entry. Expiring it by clock would drop it during that
       * gap, so the component would suspend again instead of surfacing the error — a silent
       * retry loop in place of a visible failure.
       */
      delivered?: boolean;
    };

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

/**
 * Expiry for a **failed** entry.
 *
 * @remarks
 * Cached errors used to be held until something invalidated them, which made a retry button
 * unable to retry: the boundary resets, the component renders, and the stored error is thrown
 * again without the loader ever running a second time. A network blip became permanent for
 * the life of the page.
 *
 * So an error is delivered and then discarded by default — the next read starts a fresh load.
 * A positive `errorTtlMs` puts a floor between attempts, and `null` restores the old behaviour
 * for a caller who genuinely wants a failure to stick until they clear it.
 *
 * Returns `0` rather than `Date.now()` for the default: an entry stamped with the current
 * millisecond would still be served for the rest of that millisecond, which is exactly the
 * window a re-render after a boundary reset falls into.
 *
 * @internal
 */
function computeErrorExpiry(errorTtlMs: number | null | undefined): number | null {
  if (errorTtlMs === null) return null;
  if (errorTtlMs === undefined || errorTtlMs <= 0) return 0;
  return Date.now() + errorTtlMs;
}

/**
 * Upper bound on cached entries.
 *
 * @remarks
 * Keys are built from the reducer and the subscribed path, so a component reading a dynamic path
 * — `byId.${userId}.name` and its like — mints a new one per value it has ever seen. Unbounded,
 * that grows for the lifetime of the process, and because the cache is module-scoped it does so
 * across server requests too. A few thousand entries is far past any real working set while
 * still being a bound.
 *
 * @internal
 */
const MAX_ENTRIES = 2000;

/** @internal */
class SuspenseCache {
  private store = new Map<CacheKey, CacheEntry<any>>();

  /**
   * Marks a key as most recently used, and evicts the coldest entries past the cap.
   *
   * @remarks
   * A `Map` iterates in insertion order, so deleting and re-inserting a key moves it to the end
   * and the first key is the least recently used. That is the whole LRU: no timestamps, no
   * second structure.
   *
   * @internal
   */
  private touch(key: CacheKey): void {
    if (this.store.has(key)) this.store.delete(key);
  }

  /** @internal */
  private evict(): void {
    while (this.store.size > MAX_ENTRIES) {
      const oldest = this.store.keys().next();
      if (oldest.done === true) return;
      // Never evict a load in flight: the promise is what a suspended component is waiting on,
      // and dropping it would leave that component suspended forever.
      const entry = this.store.get(oldest.value);
      if (entry?.status === "pending") {
        // Move it to the end and look at the next candidate instead.
        this.store.delete(oldest.value);
        this.store.set(oldest.value, entry);
        continue;
      }
      this.store.delete(oldest.value);
    }
  }

  /** Number of entries currently held. */
  get size(): number {
    return this.store.size;
  }

  read<T>(
    key: CacheKey,
    load: () => T | Promise<T>,
    staleTime: number | null,
    errorTtlMs: number | null | undefined,
  ): T {
    const now = Date.now();
    const entry = this.store.get(key);

    // A ready value is served until it time-expires (staleTime > 0) or is
    // invalidated. With staleTime 0/null it never time-expires (expiresAt null).
    if (entry && entry.status === "ready" && (entry.expiresAt == null || entry.expiresAt > now)) {
      // Re-inserting keeps this key young; without it the eviction order would reflect when a
      // value was first loaded rather than when it was last wanted.
      this.touch(key);
      this.store.set(key, entry);
      return entry.value as T;
    }
    // A load already in flight: always re-throw the SAME promise until it
    // settles. Pending entries are never time-expired — otherwise every render
    // during the load would spawn a fresh load (infinite suspend / request storm).
    if (entry && entry.status === "pending") {
      throw entry.promise;
    }
    // A cached error is re-thrown to the nearest error boundary while it is still held. Once
    // it expires — immediately, by default — it is dropped and the load below runs again, so
    // resetting the boundary genuinely retries instead of re-delivering the same failure.
    // Error caching is independent of staleTime, which governs successful values.
    if (entry && entry.status === "error") {
      // Always surface it once: the boundary has not seen it yet.
      if (entry.delivered !== true) {
        this.store.set(key, { ...entry, delivered: true });
        throw entry.error;
      }
      // Seen. Held only while a caller asked for it to be held; otherwise the read below
      // retries, which is what makes resetting a boundary retry rather than re-deliver.
      if (entry.expiresAt === null || entry.expiresAt > now) throw entry.error;
      this.store.delete(key);
    }

    const promise = Promise.resolve()
      .then(load)
      .then((value) => {
        this.store.set(key, { status: "ready", value, expiresAt: computeExpiry(staleTime) });
      })
      .catch((err) => {
        this.store.set(key, {
          status: "error",
          error: err,
          expiresAt: computeErrorExpiry(errorTtlMs),
        });
      });

    this.store.set(key, { status: "pending", promise, expiresAt: null });
    this.evict();
    throw promise;
  }

  invalidate(key: CacheKey) {
    this.store.delete(key);
  }

  /**
   * Drops the entry for one `reducer::path` in **every** store that has one.
   *
   * @remarks
   * Entry keys carry a store id, but {@link invalidateAtomicProp} names only a path — a caller
   * holding a path has no handle on the store instances that cached it. Matching on the part
   * after the id invalidates that path wherever it was loaded, which is what the un-scoped
   * public function has always meant.
   *
   * @internal
   */
  invalidatePathKey(pathKey: string) {
    for (const k of this.store.keys()) {
      if (stripStoreId(k) === pathKey) this.store.delete(k);
    }
  }

  /**
   * Drops every entry that reads from `reducer`, in any store.
   *
   * @remarks
   * A multi-path entry joins its parts with `||`, so the reducer can appear anywhere in the key
   * rather than only at the front — checking each part catches the composite entries that a
   * plain prefix match would leave stale.
   *
   * @internal
   */
  invalidateReducer(reducer: string) {
    const needle = `${reducer}::`;
    for (const k of this.store.keys()) {
      if (stripStoreId(k).split("||").some((part) => part.startsWith(needle))) this.store.delete(k);
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

/**
 * Stable per-store id, minted lazily.
 *
 * @remarks
 * Cache keys used to be `reducer::path`, which is not unique across stores: two stores with a
 * `fleet` reducer would share one entry, and whichever loaded first would serve the other. That
 * was reachable through `StoreProvider` scoping and is reachable now through
 * {@link createSuspenseHooks}, where a store's own Suspense hooks are the normal way to call
 * them. Prefixing the key with the store's identity keeps the entries apart.
 *
 * A `WeakMap` because the id must not keep a discarded store alive — a per-request store in SSR
 * is collected as soon as the request ends, and with it any reason to remember its id.
 *
 * @internal
 */
const storeIds = new WeakMap<object, string>();
/** @internal */
let nextStoreId = 0;

/** @internal */
function storeKey(store: object): string {
  let id = storeIds.get(store);
  if (id === undefined) {
    id = `s${++nextStoreId}`;
    storeIds.set(store, id);
  }
  return id;
}

/**
 * The part of an entry key that names the data, with the store id removed.
 * Ids are `s<n>` and contain no `::`, so the first separator ends the id.
 * @internal
 */
function stripStoreId(key: CacheKey): string {
  return key.slice(key.indexOf("::") + 2);
}

/**
 * The path half of an entry key: `reducer::path[::extraKey]`.
 * Combine with {@link storeKey} to address an actual entry.
 * @internal
 */
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
  /**
   * How long a **failed** load is remembered, in milliseconds.
   *
   * @remarks
   * `0` or omitted — the default — delivers the error to the nearest boundary and then forgets
   * it, so resetting that boundary retries the load. Held errors made a retry button unable to
   * retry, which turned a transient failure into a permanent one.
   *
   * A positive value puts a floor between attempts, for a loader that fails fast and would
   * otherwise be re-attempted on every reset. `null` holds the failure until something calls
   * `invalidate`, which is the old behaviour and is now something you ask for.
   */
  errorTtlMs?: number | null;
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
  return useSuspenseAtomicPropImpl<R, S, any, T>(
    useStore as UseStoreHook<R, S>,
    storeSpec as any,
    options,
  );
}

/** @internal */
function useSuspenseAtomicPropImpl<
  R extends string,
  S extends Record<R, any>,
  P extends Dotted<S[R]>,
  T,
  EM extends EventMapBase = EventMapBase,
>(
  useStoreHook: UseStoreHook<R, S, EM>,
  storeSpec: { reducer: R; property: P },
  options: SuspenseAtomicPropOptions<T, S>,
): T {
  const store = useStoreHook();
  const reducer = storeSpec.reducer;
  const path = normalizePath(storeSpec.property as string);
  const key = `${storeKey(store)}::${buildKey(reducer, path, options.key)}`;

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
      return suspenseCache.read<T>(key, () => opts.load(val, slice), opts.staleTime ?? 0, opts.errorTtlMs);
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
  /**
   * How long a **failed** load is remembered, in milliseconds.
   *
   * @remarks
   * `0` or omitted — the default — delivers the error to the nearest boundary and then forgets
   * it, so resetting that boundary retries the load. Held errors made a retry button unable to
   * retry, which turned a transient failure into a permanent one.
   *
   * A positive value puts a floor between attempts, for a loader that fails fast and would
   * otherwise be re-attempted on every reset. `null` holds the failure until something calls
   * `invalidate`, which is the old behaviour and is now something you ask for.
   */
  errorTtlMs?: number | null;
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
  return useSuspenseAtomicPropsImpl<R, S, T>(useStore as UseStoreHook<R, S>, specs as any, options);
}

/** @internal */
function useSuspenseAtomicPropsImpl<
  R extends string,
  S extends Record<R, any>,
  T,
  EM extends EventMapBase = EventMapBase,
>(
  useStoreHook: UseStoreHook<R, S, EM>,
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
  const store = useStoreHook();

  const normalized = useMemo(
    () =>
      specs.map((sp) => ({
        reducer: sp.reducer,
        property: Array.isArray(sp.property)
          ? (sp.property as readonly string[]).map((p) => normalizePath(p as string))
          : normalizePath(sp.property as string),
      })),
    // `specs` is a fresh reference each render; keying the memo on its JSON
    // signature is intentional and already covers `specs`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(specs)],
  );

  const key = useMemo(() => {
    const parts = normalized
      .map((sp) => buildKey(sp.reducer, sp.property))
      .sort()
      .join("||");
    return `${storeKey(store)}::${options.key ? `${parts}::${options.key}` : parts}`;
  }, [store, normalized, options.key]);

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
      return suspenseCache.read<T>(key, () => opts.load(state), opts.staleTime ?? 0, opts.errorTtlMs);
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
  suspenseCache.invalidatePathKey(buildKey(reducer, property, extraKey));
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
  suspenseCache.invalidateReducer(reducer);
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

/**
 * Call signature for the typed `useSuspenseAtomicProp` returned by `createHooks`.
 *
 * Identical in behaviour to the package-level {@link useSuspenseAtomicProp}; the reducer union
 * and state shape are fixed by the store the hooks were created for, so neither has to be
 * supplied at the call site.
 *
 * @typeParam R - Reducer name union.
 * @typeParam S - State record keyed by `R`.
 *
 * @public
 */
export type UseSuspenseAtomicProp<R extends string, S extends Record<R, any>> = {
  <R1 extends R, P extends Dotted<S[R1]>, T>(
    storeSpec: { reducer: R1; property: P },
    options: SuspenseAtomicPropOptions<T, S>,
  ): T;
  <R1 extends R, T>(
    storeSpec: { reducer: R1; property: string },
    options: SuspenseAtomicPropOptions<T, S>,
  ): T;
};

/**
 * Call signature for the typed `useSuspenseAtomicProps` returned by `createHooks`.
 *
 * @typeParam R - Reducer name union.
 * @typeParam S - State record keyed by `R`.
 *
 * @public
 */
export type UseSuspenseAtomicProps<R extends string, S extends Record<R, any>> = {
  <R1 extends R, T>(
    specs: Array<{
      reducer: R1;
      property: WithGlob<Dotted<S[R1]>> | ReadonlyArray<WithGlob<Dotted<S[R1]>>>;
    }>,
    options: SuspenseAtomicPropsOptions<T, S>,
  ): T;
  <R1 extends R, T>(
    specs: Array<{ reducer: R1; property: string | readonly string[] }>,
    options: SuspenseAtomicPropsOptions<T, S>,
  ): T;
};

/**
 * Builds the Suspense hooks against a caller-supplied `useStore`.
 *
 * @remarks
 * The package-level `useSuspenseAtomicProp`/`useSuspenseAtomicProps` read the package-level
 * `StoreContext`. `createHooks` is given a *different* context, so its hook set used to stop
 * short of Suspense: mixing the two families threw "useStore must be used inside
 * <StoreProvider>" at runtime, with nothing in the types to warn about it, because the store
 * was in the other context all along. Building them here from the same `useStore` the rest of
 * the set uses makes the set complete.
 *
 * @internal
 */
export function createSuspenseHooks<
  R extends string,
  S extends Record<R, any>,
  EM extends EventMapBase = EventMapBase,
>(
  useStoreHook: UseStoreHook<R, S, EM>,
): {
  useSuspenseAtomicProp: UseSuspenseAtomicProp<R, S>;
  useSuspenseAtomicProps: UseSuspenseAtomicProps<R, S>;
} {
  const useSuspenseAtomicPropBound = <T,>(
    storeSpec: { reducer: R; property: string },
    options: SuspenseAtomicPropOptions<T, S>,
  ): T => useSuspenseAtomicPropImpl<R, S, any, T, EM>(useStoreHook, storeSpec as any, options);

  const useSuspenseAtomicPropsBound = <T,>(
    specs: Array<{ reducer: R; property: string | readonly string[] }>,
    options: SuspenseAtomicPropsOptions<T, S>,
  ): T => useSuspenseAtomicPropsImpl<R, S, T, EM>(useStoreHook, specs as any, options);

  return {
    useSuspenseAtomicProp: useSuspenseAtomicPropBound as UseSuspenseAtomicProp<R, S>,
    useSuspenseAtomicProps: useSuspenseAtomicPropsBound as UseSuspenseAtomicProps<R, S>,
  };
}