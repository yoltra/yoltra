/**
 * @module @quojs/react
 */

import React, { type ReactNode } from "react";
import type { StoreInstance } from "@quojs/core";

import { StoreContext } from "./StoreContext";

/**
 * React provider that places a {@link StoreInstance} into {@link StoreContext}.
 *
 * @param props.store - The Quo.js store instance to expose to descendant components.
 * @param props.children - React subtree that will consume the store.
 *
 * @remarks
 * - Wrap your app (or a subtree) to make the store available via `useContext(StoreContext)`
 *   or any higher-level hooks you expose (e.g., `useAtomicProp`, `useEmit`).
 * - You may nest multiple `StoreProvider`s to scope different stores to different subtrees.
 * - In Next.js App Router, this component must be used in a **client** boundary.
 *
 * @example App wrapper with createQuoHooks (recommended)
 * ```tsx
 * // store.ts
 * import { createStore, eventKeys } from '@quojs/core';
 * import { createContext } from 'react';
 * import { createQuoHooks, StoreProvider } from '@quojs/react';
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
 * export const { useAtomicProp, useEmit } = createQuoHooks(AppStoreContext);
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
  /** Quo.js store instance placed into context. */
  store: StoreInstance<any, any, any>;
  /** Descendant subtree that can consume the store. */
  children: ReactNode;
}> = ({ store, children }) => (
  <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
);