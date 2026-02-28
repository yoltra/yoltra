/**
 * React context that exposes the DevTools hub connection to the component tree.
 *
 * @remarks
 * This module defines {@link HubContext}, which holds the current
 * {@link HubContextValue}. It is populated by {@link HubProvider} and
 * consumed via the {@link useHubConnection} hook. Accessing the context
 * without a provider returns a safe no-op default.
 *
 * @module @yoltra/devtools-ui
 */

import { createContext } from "react";
import type { HubContextValue } from "../types";

const noop = () => {};

/**
 * React context for the DevTools hub connection.
 *
 * @remarks
 * The context ships with an inert default value so that components rendered
 * outside of a {@link HubProvider} do not throw. Consumers should always
 * wrap their tree in a provider before relying on the context value.
 *
 * @example
 * ```tsx
 * import { useContext } from "react";
 * import { HubContext } from "@yoltra/devtools-ui";
 *
 * function StatusBadge() {
 *   const { status } = useContext(HubContext);
 *   return <span>{status}</span>;
 * }
 * ```
 *
 * @public
 */
export const HubContext = createContext<HubContextValue>({
  status: "disconnected",
  send: noop,
  subscribe: () => noop,
  disconnect: noop,
  reconnect: noop,
});
