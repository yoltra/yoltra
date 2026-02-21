/**
 * @module @yoltra/react
 */

import type { StoreInstance } from "@yoltra/core";
import React, { type ReactNode } from "react";

import { StoreContext } from "./StoreContext";

/**
 * React provider that places a {@link StoreInstance} into {@link StoreContext}.
 *
 * @param props.store - The yoltra store instance to expose to descendant components.
 * @param props.children - React subtree that will consume the store.
 *
 * @remarks
 * - Wrap your app (or a subtree) to make the store available via `useContext(StoreContext)`
 *   or any higher-level hooks you expose (e.g., `useAtomicProp`, `useEmit`).
 * - You may nest multiple `StoreProvider`s to scope different stores to different subtrees.
 * - In Next.js App Router, this component must be used in a **client** boundary.
 *
 * @example App wrapper with createHooks (recommended)
 * ```tsx
 * // store.ts
 * import { createStore, eventKeys } from '@yoltra/core';
 * import { createContext } from 'react';
 * import { createHooks, StoreProvider } from '@yoltra/react';
 *
 * type AppEM = { ui: { increment: number } };
 * type AppState = { counter: { value: number } };
 *
 * export const store = createStore<AppState, AppEM>({
 *   name: 'App',
 *   reducer: {
 *     counter: {
 *       state: { value: 0 },
 *       when: { keys: eventKeys<AppEM>()([['ui', 'increment']]) },
 *       reducer: (s, evt) => evt.type === 'increment'
 *         ? { value: s.value + evt.payload }
 *         : s,
 *     },
 *   },
 * });
 *
 * const AppStoreContext = createContext<typeof store | null>(null);
 * export const { useAtomicProp, useEmit } = createHooks(AppStoreContext);
 *
 * // App.tsx
 * export function App({ children }: { children: React.ReactNode }) {
 *   return <StoreProvider store={store}>{children}</StoreProvider>;
 * }
 * ```
 *
 * @public
 */
export const StoreProvider: React.FC<{
  /** yoltra store instance placed into context. */
  store: StoreInstance<any, any, any>;
  /** Descendant subtree that can consume the store. */
  children: ReactNode;
}> = ({ store, children }) => (
  <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
);
