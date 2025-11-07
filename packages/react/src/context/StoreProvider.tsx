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
 *   or any higher-level hooks you expose (e.g., `useAtomicProp`, `useDispatch`).
 * - You may nest multiple `StoreProvider`s to scope different stores to different subtrees.
 * - In Next.js App Router, this component must be used in a **client** boundary.
 *
 * @example App wrapper
 * ```tsx
 * 'use client';
 * import { StoreProvider } from '@quojs/react';
 * import { createStore } from '@quojs/core';
 *
 * const store = createStore({
 *   name: 'App',
 *   reducer: {
 *     counter: {
 *       state: { value: 0 },
 *       actions: [['ui','increment']],
 *       reducer(s, a) { return a.event === 'increment' ? { value: s.value + a.payload } : s; }
 *     }
 *   }
 * });
 *
 * export function AppProviders({ children }: { children: React.ReactNode }) {
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
