/**
 * Hook for accessing the DevTools hub connection from any component.
 *
 * @remarks
 * Thin wrapper around `useContext(HubContext)`. It is the primary entry-point
 * for all other DevTools UI hooks that need to send or subscribe to hub
 * messages. Must be rendered inside a {@link HubProvider}.
 *
 * @module @yoltra/devtools-ui
 */

import { useContext } from "react";
import { HubContext } from "../context/HubContext";
import type { HubContextValue } from "../types";

/**
 * Access the hub connection context.
 *
 * @remarks
 * Must be used within a {@link HubProvider}. If called outside a provider
 * the returned value contains safe no-op functions and a `"disconnected"`
 * status.
 *
 * @example
 * ```tsx
 * import { useHubConnection } from "@yoltra/devtools-ui";
 *
 * function ConnectionStatus() {
 *   const { status, reconnect } = useHubConnection();
 *   return (
 *     <div>
 *       <span>Status: {status}</span>
 *       <button onClick={reconnect}>Reconnect</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns The hub connection context value (see {@link HubContextValue}).
 *
 * @public
 */
export function useHubConnection(): HubContextValue {
  return useContext(HubContext);
}
