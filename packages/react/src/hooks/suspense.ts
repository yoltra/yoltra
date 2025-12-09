import { useMemo, useSyncExternalStore } from "react";
import type { ActionMapBase, StoreInstance, Dotted, WithGlob } from "@quojs/core";
import { useStore } from "./hooks";
import { warnOnce } from "../utils/warnOnce";

/** @internal */
function hasWildcard(p: string): boolean { return p.includes("*"); }
/** @internal */
function normalizePath(p: string): string { return p.replace(/^\./, ""); }
/** @internal */
function splitPath(p: string): string[] { return normalizePath(p).split(".").filter(Boolean); }
/**
 * Reads a dotted path from an object; returns `undefined` when a segment is missing.
 * @internal
 */
function getAtPath(obj: any, path: string): any {
  if (!path) return obj;
  let cur = obj;
  for (const seg of splitPath(path)) {
    if (cur == null) return undefined;
    cur = cur[seg as any];
  }
  return cur;
}

/** @internal */
type CacheKey = string;

/**
 * Discriminated union representing a Suspense cache entry.
 * @typeParam T - Stored value type.
 * @internal
 */
type CacheEntry<T> =
  | { status: "ready"; value: T; expiresAt: number | null }
  | { status: "pending"; promise: Promise<void>; expiresAt: number | null }
  | { status: "error"; error: any; expiresAt: number | null };

/**
 * Minimal in-memory cache to back React Suspense data flows.
 *
 * - Entries can be **ready**, **pending** (holding a promise), or **error**.
 * - Each entry can have an optional absolute `expiresAt` for time-based staleness.
 * - Callers typically use {@link suspenseCache} (a singleton) instead of creating new instances.
 *
 * @internal
 */
class SuspenseCache {
  private store = new Map<CacheKey, CacheEntry<any>>();

  /**
   * Read-through getter. Returns cached value, or:
   * - throws a **promise** (to trigger Suspense) while loading,
   * - throws an **error** if the last load failed and is still fresh.
   *
   * @typeParam T - Value type to return.
   * @param key - Cache key (stable across renders).
   * @param load - Lazy loader `( ) => T | Promise<T>`.
   * @param staleTime - Milliseconds until the entry expires; `null` means **no expiry**.
   * @returns The ready value `T`, or throws to integrate with Suspense.
   *
   * @remarks
   * - Passing `staleTime = 0` means the entry **expires immediately** (no time-based caching).
   *   Use `null` for “cache until invalidated”.
   * - Callers are responsible for invalidating keys on relevant state changes.
   *
   * @internal
   */
  read<T>(key: CacheKey, load: () => T | Promise<T>, staleTime: number | null): T {
    const now = Date.now();
    const entry = this.store.get(key);

    if (entry && entry.status === "ready" && (entry.expiresAt == null || entry.expiresAt > now)) {
      return entry.value as T;
    }
    if (entry && entry.status === "pending" && (entry.expiresAt == null || entry.expiresAt > now)) {
      throw entry.promise;
    }
    if (entry && entry.status === "error" && (entry.expiresAt == null || entry.expiresAt > now)) {
      throw entry.error;
    }

    const promise = Promise.resolve()
      .then(load)
      .then((value) => {
        this.store.set(key, { status: "ready", value, expiresAt: staleTime == null ? null : Date.now() + staleTime });
      })
      .catch((err) => {
        this.store.set(key, { status: "error", error: err, expiresAt: staleTime == null ? null : Date.now() + staleTime });
      });

    this.store.set(key, { status: "pending", promise, expiresAt: staleTime == null ? null : Date.now() + staleTime });
    throw promise;
  }

  /** Removes a single cache entry. */
  invalidate(key: CacheKey) { this.store.delete(key); }
  /** Removes all entries whose keys start with `prefix`. */
  invalidatePrefix(prefix: string) { for (const k of this.store.keys()) { if (k.startsWith(prefix)) this.store.delete(k); } }
  /** Clears the entire cache. */
  clear() { this.store.clear(); }
}

/**
 * Default Suspense cache instance used by the hooks in this module.
 *
 * @example Manual invalidation
 * ```ts
 * import { suspenseCache } from '@quojs/react';
 * suspenseCache.clear();
 * ```
 *
 * @internal
 */
export const suspenseCache = new SuspenseCache();

/** @internal: builds a canonical cache key from reducer + property (+ optional extra key). */
function buildKey(reducer: string, props: string[] | string, extraKey?: string): string {
  const p = Array.isArray(props) ? props.map(normalizePath).sort().join("|") : normalizePath(props);
  return extraKey ? `${reducer}::${p}::${extraKey}` : `${reducer}::${p}`;
}

/**
 * Options for {@link useSuspenseAtomicProp}.
 *
 * @typeParam T - The value produced by `load`.
 * @typeParam S - The store state record keyed by reducer names.
 *
 * @public
 */
export interface SuspenseSlicePropOptions<T, S> {
  /**
   * Loader that can be sync or async.
   * Called with the **value at the path** (or the whole reducer for glob paths) and the **reducer state** itself.
   */
  load: (valueAtPath: any, slice: S[keyof S]) => Promise<T> | T;

  /**
   * Optional cache **stale time** in milliseconds.
   *
   * - `null` → **no expiry** (cache until invalidated by path changes).
   * - `0`    → expires **immediately** (effectively no time-based caching).
   * - `>0`   → entry is fresh until `now + staleTime`.
   */
  staleTime?: number;

  /**
   * Optional extra key to distinguish different usages over the same path.
   * Useful when the same path has different `load` behaviors or parameters.
   */
  key?: string;
}

/** Alias with the new naming for ergonomics. */
export type SuspenseAtomicPropOptions<T, S> = SuspenseSlicePropOptions<T, S>;

/**
 * Suspense version of a single-path selector (atomic subscription).
 *
 * Subscribes to an **exact** `reducer.property` path, invalidates the cache on changes,
 * and reads through a Suspense cache—**throwing a promise** while the `load` function resolves.
 *
 * @typeParam R - Reducer name union.
 * @typeParam S - State record keyed by `R`.
 * @typeParam P - Dotted path type inside `S[R]` (exact path).
 * @typeParam T - Value type returned by `options.load`.
 *
 * @param storeSpec - `{ reducer, property }` pointing at a single path.
 * @param options   - Loader/staleTime/key options.
 * @returns The loaded value `T`. Will **suspend** while loading and rethrow errors in the error boundary.
 *
 * @public
 */
// Light first overload to avoid deep Dotted<> at callsites
export function useSuspenseAtomicProp<R extends string, S extends Record<R, any>, T>(
  storeSpec: { reducer: R; property: string },
  options: SuspenseSlicePropOptions<T, S>
): T;
// Precise overload (kept)
export function useSuspenseAtomicProp<R extends string, S extends Record<R, any>, P extends Dotted<S[R]>, T>(
  storeSpec: { reducer: R; property: P },
  options: SuspenseSlicePropOptions<T, S>
): T;
// Implementation uses the widest param; precise typing is provided by overloads
export function useSuspenseAtomicProp<R extends string, S extends Record<R, any>, T>(
  storeSpec: { reducer: R; property: string },
  options: SuspenseSlicePropOptions<T, S>
): T {
  return _useSuspenseSlicePropImpl<R, S, any, T>(storeSpec as any, options);
}

/** @internal (original impl shared by both names) */
function _useSuspenseSlicePropImpl<R extends string, S extends Record<R, any>, P extends Dotted<S[R]>, T>(
  storeSpec: { reducer: R; property: P },
  options: SuspenseSlicePropOptions<T, S>
): T {
  const store = useStore<ActionMapBase, R, S>() as StoreInstance<R, S, ActionMapBase>;
  const reducer = storeSpec.reducer;
  const path = normalizePath(storeSpec.property as string);
  const key = buildKey(reducer, path, options.key);

  const subscribe = useMemo(() => {
    return (notify: () => void) =>
      store.connect({ reducer, property: path } as any, () => {
        suspenseCache.invalidate(key);
        notify();
      });
  }, [store, reducer, path, key]);

  const getSnapshot = useMemo(() => {
    const isGlob = hasWildcard(path);
    return () => {
      const state = store.getState() as S;
      const slice = state[reducer];
      const val = isGlob ? slice : getAtPath(slice, path);
      return suspenseCache.read<T>(key, () => options.load(val, slice), options.staleTime ?? 0);
    };
  }, [store, reducer, path, key, options]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * @deprecated Use {@link useSuspenseAtomicProp} instead. Will be removed in `0.5.0`.
 * Suspense version of a single-path selector (legacy name).
 */
export function useSuspenseSliceProp<R extends string, S extends Record<R, any>, P extends Dotted<S[R]>, T>(
  storeSpec: { reducer: R; property: P },
  options: SuspenseSlicePropOptions<T, S>
): T {
  warnOnce(
    "quo:suspense:useSuspenseSliceProp",
    "[@quojs/react] `useSuspenseSliceProp()` is deprecated and will be removed in 0.5.0. Use `useSuspenseAtomicProp()`."
  );
  return _useSuspenseSlicePropImpl<R, S, P, T>(storeSpec, options);
}

/**
 * Options for {@link useSuspenseAtomicProps}.
 *
 * @typeParam T - Value produced by `load`.
 * @typeParam S - State record keyed by reducer names.
 *
 * @public
 */
export interface SuspenseSlicePropsOptions<T, S> {
  /** Loader given the **full state** to produce `T` (may be async). */
  load: (state: S) => Promise<T> | T;
  /** Stale time in ms (see {@link SuspenseSlicePropOptions.staleTime}). */
  staleTime?: number;
  /** Extra cache key segment to distinguish different derived computations. */
  key?: string;
}

/** Alias with the new naming for ergonomics. */
export type SuspenseAtomicPropsOptions<T, S> = SuspenseSlicePropsOptions<T, S>;

/**
 * Suspense version of a multi-path selector (atomic subscriptions).
 *
 * Subscribes to **multiple** `reducer.property` paths (supports globs),
 * invalidates the cache when **any** subscribed path changes, and returns a value
 * loaded through the Suspense cache.
 *
 * @typeParam R - Reducer name union.
 * @typeParam S - State record keyed by `R`.
 * @typeParam T - Value type returned by `options.load`.
 *
 * @public
 */
// Light first overload
export function useSuspenseAtomicProps<R extends string, S extends Record<R, any>, T>(
  specs: Array<{ reducer: R; property: string | readonly string[] }>,
  options: SuspenseSlicePropsOptions<T, S>
): T;
// Precise overload (kept)
export function useSuspenseAtomicProps<R extends string, S extends Record<R, any>, T>(
  specs: Array<{ reducer: R; property: Dotted<S[R]> | WithGlob<Dotted<S[R]>> | ReadonlyArray<WithGlob<Dotted<S[R]>>> }>,
  options: SuspenseSlicePropsOptions<T, S>
): T;
// Implementation widened to be compatible with both overloads
export function useSuspenseAtomicProps<R extends string, S extends Record<R, any>, T>(
  specs: Array<{ reducer: R; property:
    | string
    | readonly string[]
    | Dotted<S[R]>
    | WithGlob<Dotted<S[R]>>
    | ReadonlyArray<WithGlob<Dotted<S[R]>>> }>,
  options: SuspenseSlicePropsOptions<T, S>
): T {
  return _useSuspenseSlicePropsImpl<R, S, T>(specs as any, options);
}

/** @internal (original impl shared by both names) */
function _useSuspenseSlicePropsImpl<R extends string, S extends Record<R, any>, T>(
  specs: Array<{ reducer: R; property:
    | string
    | readonly string[]
    | Dotted<S[R]>
    | WithGlob<Dotted<S[R]>>
    | ReadonlyArray<WithGlob<Dotted<S[R]>>> }>,
  options: SuspenseSlicePropsOptions<T, S>
): T {
  const store = useStore<ActionMapBase, R, S>() as StoreInstance<R, S, ActionMapBase>;

  const normalized = useMemo(
    () => specs.map((sp) => ({
      reducer: sp.reducer,
      property: Array.isArray(sp.property)
        ? (sp.property as readonly string[]).map((p) => normalizePath(p as string))
        : normalizePath(sp.property as string),
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(specs)]
  );

  const key = useMemo(() => {
    const parts = normalized.map((sp) => buildKey(sp.reducer, sp.property)).sort().join("||");
    return options.key ? `${parts}::${options.key}` : parts;
  }, [normalized, options.key]);

  const subscribe = useMemo(() => {
    return (notify: () => void) => {
      const wrapped = () => { suspenseCache.invalidate(key); notify(); };
      const unsubs = normalized.map((sp) => store.connect(sp as any, wrapped));
      return () => { for (const u of unsubs) u(); };
    };
  }, [store, normalized, key]);

  const getSnapshot = useMemo(() => {
    return () => {
      const state = store.getState() as S;
      return suspenseCache.read<T>(key, () => options.load(state), options.staleTime ?? 0);
    };
  }, [store, key, options]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * @deprecated Use {@link useSuspenseAtomicProps} instead. Will be removed in `0.5.0`.
 * Suspense version of a multi-path selector (legacy name).
 */
export function useSuspenseSliceProps<R extends string, S extends Record<R, any>, T>(
  specs: Array<{ reducer: R; property: Dotted<S[R]> | WithGlob<Dotted<S[R]>> | ReadonlyArray<WithGlob<Dotted<S[R]>>> }>,
  options: SuspenseSlicePropsOptions<T, S>
): T {
  warnOnce(
    "quo:suspense:useSuspenseSliceProps",
    "[@quojs/react] `useSuspenseSliceProps()` is deprecated and will be removed in 0.5.0. Use `useSuspenseAtomicProps()`."
  );
  return _useSuspenseSlicePropsImpl<R, S, T>(specs, options);
}

/**
 * Invalidates the cache entry for a particular `(reducer, property)` key.
 *
 * @param reducer  - Reducer name.
 * @param property - Dotted path (or glob) string.
 * @param extraKey - Optional extra key used when loading.
 *
 * @example
 * ```ts
 * invalidateAtomicProp('todos', 'items.**'); // force refetch for that key
 * ```
 *
 * @public
 */
export function invalidateAtomicProp(reducer: string, property: string, extraKey?: string) {
  suspenseCache.invalidate(buildKey(reducer, property, extraKey));
}

/**
 * @deprecated Use {@link invalidateAtomicProp} instead. Will be removed in `0.5.0`.
 */
export function invalidateSliceProp(reducer: string, property: string, extraKey?: string) {
  warnOnce(
    "quo:suspense:invalidateSliceProp",
    "[@quojs/react] `invalidateSliceProp()` is deprecated and will be removed in 0.5.0. Use `invalidateAtomicProp()`."
  );
  return invalidateAtomicProp(reducer, property, extraKey);
}

/**
 * Invalidates **all** cache entries under a given reducer.
 *
 * @example
 * ```ts
 * invalidateAtomicPropsByReducer('todos');
 * ```
 *
 * @public
 */
export function invalidateAtomicPropsByReducer(reducer: string) {
  suspenseCache.invalidatePrefix(`${reducer}::`);
}

/**
 * @deprecated Use {@link invalidateAtomicPropsByReducer} instead. Will be removed in `0.5.0`.
 */
export function invalidateSlicePropsByReducer(reducer: string) {
  warnOnce(
    "quo:suspense:invalidateSlicePropsByReducer",
    "[@quojs/react] `invalidateSlicePropsByReducer()` is deprecated and will be removed in 0.5.0. Use `invalidateAtomicPropsByReducer()`."
  );
  return invalidateAtomicPropsByReducer(reducer);
}

/**
 * Clears the entire Suspense cache.
 *
 * @example
 * ```ts
 * clearSuspenseCache();
 * ```
 *
 * @public
 */
export function clearSuspenseCache() { suspenseCache.clear(); }
