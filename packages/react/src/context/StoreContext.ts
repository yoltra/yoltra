/**
 * @module @yoltra/react
 */

import { createContext } from "react";
import type { StoreInstance } from "@yoltra/core";

/**
 * React Context carrying a {@link StoreInstance} for yoltra React bindings.
 *
 * @remarks
 * - The default value is `null`. Consumers should either:
 *   1) Be wrapped with {@link StoreProvider}, or
 *   2) Use a helper hook that throws a friendly error when the context is `null`.
 * - You can scope multiple independent stores by nesting multiple providers.
 *
 * @example Basic usage
 * ```tsx
 * import { useContext } from "react";
 * import { StoreContext } from "@yoltra/react";
 *
 * export function Counter() {
 *   const store = useContext(StoreContext);
 *   if (!store) throw new Error("StoreProvider is missing");
 *   const state = store.getState();
 *   return <span>{state.counter.value}</span>;
 * }
 * ```
 *
 * @public
 */
export const StoreContext = createContext<StoreInstance<any, any, any> | null>(null);