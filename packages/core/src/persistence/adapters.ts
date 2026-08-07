/**
 * Storage adapters for the environments core can reach without importing them.
 *
 * @remarks
 * Each is built by a factory that takes the storage object rather than reaching for a global,
 * so this module stays isomorphic: nothing here breaks a Worker, a server render or a test.
 *
 * @module @yoltra/core
 */

import type { PersistenceAdapter } from "./persist";

/** The slice of the Web Storage API used here. */
export interface WebStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Wraps a Web Storage object.
 *
 * @remarks
 * Pass `localStorage` or `sessionStorage` explicitly. Reading the global here would make this
 * module unusable anywhere one does not exist, which includes a server render — exactly where
 * hydration payloads are produced.
 *
 * @example
 * ```ts
 * const adapter = createWebStorageAdapter(localStorage);
 * ```
 *
 * @public
 */
export function createWebStorageAdapter(storage: WebStorageLike): PersistenceAdapter {
  return {
    read: (key) => storage.getItem(key),
    write: (key, value) => storage.setItem(key, value),
    remove: (key) => storage.removeItem(key),
  };
}

/**
 * Keeps state in memory.
 *
 * @remarks
 * For tests, and for a server render that wants the persistence path exercised without a
 * store behind it. It forgets on restart, which is the whole of what it claims.
 *
 * @public
 */
export function createMemoryAdapter(initial?: Record<string, string>): PersistenceAdapter {
  const store = new Map<string, string>(Object.entries(initial ?? {}));
  return {
    read: (key) => store.get(key) ?? null,
    write: (key, value) => {
      store.set(key, value);
    },
    remove: (key) => {
      store.delete(key);
    },
  };
}
