/**
 * @module @quojs/react
 */

import { useMemo, useSyncExternalStore } from "react";
import type { EventMapBase, StoreInstance, Dotted, WithGlob } from "@quojs/core";

import { useStore } from "./hooks";
import { hasWildcard, normalizePath, getAtPath } from "../utils/path";

/** @internal */
type CacheKey = string;

/** @internal */
type CacheEntry<T> =
  | { status: "ready"; value: T; expiresAt: number | null }
  | { status: "pending"; promise: Promise<void>; expiresAt: number | null }
  | { status: "error"; error: any; expiresAt: number | null };

/** @internal */
class SuspenseCache {
  private store = new Map<CacheKey, CacheEntry<any>>();

  read<T>(key: CacheKey, load: () => T | Promise<T>, staleTime: number | null): T {
    const now = Date.now();
    const entry = this.store.get(key);

    if (entry && entry.status === "ready" && (entry.expiresAt == null || entry.expiresAt > now)) {
      return entry.value as T;
    }
    if (
      entry &&
      entry.status === "pending" &&
      (entry.expiresAt == null || entry.expiresAt > now)
    ) {
      throw entry.promise;
    }
    if (entry && entry.status === "error" && (entry.expiresAt == null || entry.expiresAt > now)) {
      throw entry.error;
    }

    const promise = Promise.resolve()
      .then(load)
      .then((value) => {
        this.store.set(key, {
          status: "ready",
          value,
          expiresAt: staleTime == null ? null : Date.now() + staleTime,
        });
      })
      .catch((err) => {
        this.store.set(key, {
          status: "error",
          error: err,
          expiresAt: staleTime == null ? null : Date.now() + staleTime,
        });
      });

    this.store.set(key, {
      status: "pending",
      promise,
      expiresAt: staleTime == null ? null : Date.now() + staleTime,
    });
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
 * Default Suspense cache instance.
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
 * @public
 */
export interface SuspenseAtomicPropOptions<T, S> {
  load: (valueAtPath: any, slice: S[keyof S]) => Promise<T> | T;
  staleTime?: number;
  key?: string;
}

/**
 * Suspense version of a single-path selector.
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
 * Options for {@link useSuspenseAtomicProps}.
 * @public
 */
export interface SuspenseAtomicPropsOptions<T, S> {
  load: (state: S) => Promise<T> | T;
  staleTime?: number;
  key?: string;
}

/**
 * Suspense version of a multi-path selector.
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

  const getSnapshot = useMemo(() => {
    return () => {
      const state = store.getState() as S;
      return suspenseCache.read<T>(key, () => options.load(state), options.staleTime ?? 0);
    };
  }, [store, key, options]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Invalidates cache for a specific property.
 * @public
 */
export function invalidateAtomicProp(reducer: string, property: string, extraKey?: string) {
  suspenseCache.invalidate(buildKey(reducer, property, extraKey));
}

/**
 * Invalidates all cache entries for a reducer.
 * @public
 */
export function invalidateAtomicPropsByReducer(reducer: string) {
  suspenseCache.invalidatePrefix(`${reducer}::`);
}

/**
 * Clears the entire Suspense cache.
 * @public
 */
export function clearSuspenseCache() {
  suspenseCache.clear();
}