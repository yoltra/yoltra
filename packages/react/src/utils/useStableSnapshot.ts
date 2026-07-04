/**
 * @module @yoltra/react
 */

import { useCallback, useMemo, useRef, type DependencyList } from "react";

/**
 * Builds a **stable** `getSnapshot` for `useSyncExternalStore` that survives
 * inline `read`/`isEqual` functions — the `useSyncExternalStoreWithSelector`
 * pattern.
 *
 * The latest `read` and `isEqual` closures are kept in refs, so passing them
 * inline (the common case) does **not** rebuild the snapshot on every render and
 * discard its memoized value. The derived value is cached until `isEqual`
 * reports a change; presence is tracked with a separate boolean so a value of
 * `undefined` still hits the cache instead of recomputing forever. The cache is
 * reset only when `structuralDeps` change (e.g. the subscribed path/spec), which
 * is also when the returned function's identity changes.
 *
 * @typeParam T - Derived snapshot value type.
 * @param read - Reads the current derived value from the store.
 * @param isEqual - Equality comparator for the derived value.
 * @param structuralDeps - Deps identifying the subscription target; a change
 *   resets the value cache and returns a new snapshot function.
 * @returns A `getSnapshot` function stable across renders that don't change
 *   `structuralDeps`.
 *
 * @internal
 */
export function useStableSnapshot<T>(
  read: () => T,
  isEqual: (a: T, b: T) => boolean,
  structuralDeps: DependencyList,
): () => T {
  const readRef = useRef(read);
  readRef.current = read;
  const isEqualRef = useRef(isEqual);
  isEqualRef.current = isEqual;

  // A fresh cache object whenever the subscription target changes.
  const cache = useMemo<{ has: boolean; value: T }>(
    () => ({ has: false, value: undefined as T }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    structuralDeps,
  );

  return useCallback(() => {
    const next = readRef.current();
    if (!cache.has || !isEqualRef.current(cache.value, next)) {
      cache.has = true;
      cache.value = next;
    }
    return cache.value;
  }, [cache]);
}
