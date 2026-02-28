/**
 * Shared type definitions for the DevTools UI package.
 *
 * @remarks
 * This module contains every public interface and type alias consumed by the
 * DevTools UI hooks and context providers. All types are re-exported from the
 * package entry-point so downstream consumers can import them directly.
 *
 * @module @yoltra/devtools-ui
 */

import type { DevtoolsMessage, StoreCapabilities, StoreEvent } from "@yoltra/devtools-protocol";

/**
 * Connection configuration for the DevTools hub.
 *
 * @remarks
 * Pass this to {@link HubProvider} to control how the extension connects to
 * the hub server. The only required field is `port`; all other fields have
 * sensible defaults.
 *
 * @example
 * ```tsx
 * const config: HubConnectionConfig = {
 *   port: 8900,
 *   extensionName: "My Panel",
 *   autoReconnect: true,
 * };
 *
 * <HubProvider config={config}>
 *   <App />
 * </HubProvider>
 * ```
 *
 * @public
 */
export interface HubConnectionConfig {
  /** Hub server host. @defaultValue `"localhost"` */
  host?: string;
  /** Hub server port. */
  port: number;
  /** Display name for this extension instance. */
  extensionName?: string;
  /** Auto-reconnect on disconnect. @defaultValue `true` */
  autoReconnect?: boolean;
  /** Maximum reconnect attempts. @defaultValue `Infinity` */
  maxReconnectAttempts?: number;
  /**
   * Custom WebSocket constructor for Node.js environments.
   *
   * @remarks
   * In Node.js 18, the global `WebSocket` is not available. Pass the `WebSocket`
   * class from the `ws` package to enable connectivity:
   *
   * ```ts
   * import WebSocket from "ws";
   * config.WebSocket = WebSocket as any;
   * ```
   *
   * In browsers or Node.js 21+, this is not needed — the native `WebSocket` is
   * used automatically.
   */
  WebSocket?: { new (url: string): WebSocket };
}

/**
 * Connection status for the hub WebSocket.
 *
 * @remarks
 * - `"disconnected"` -- no active connection.
 * - `"connecting"` -- WebSocket handshake in progress.
 * - `"connected"` -- handshake complete, messages can be sent and received.
 *
 * @public
 */
export type HubConnectionStatus = "disconnected" | "connecting" | "connected";

/**
 * Registered store entry tracked by the store registry.
 *
 * @remarks
 * Populated automatically by the {@link useStoreRegistry} hook in response to
 * `STORE_REGISTRY`, `STORE_CONNECTED`, and `STORE_DISCONNECTED` hub messages.
 *
 * @public
 */
export interface RegisteredStore {
  /** Unique store identifier assigned by the hub. */
  id: string;
  /** Human-readable store name. */
  name: string;
  /** Current connectivity status of the store. */
  status: "connected" | "connecting" | "disconnected";
  /** Capabilities advertised by the store during handshake. */
  capabilities: StoreCapabilities;
  /** ISO-8601 timestamp of when the store first connected. */
  connectedAt: string;
}

/**
 * A logged event entry in the event log.
 *
 * @remarks
 * Each entry captures a single `STORE_EVENT` message received from the hub,
 * including the event descriptor, resulting patches, and the snapshot version
 * after the event was applied. The {@link useEventLog} hook collects these
 * entries in chronological order.
 *
 * @public
 */
export interface EventLogEntry {
  /** The event descriptor (channel, type, payload). */
  event: StoreEvent["event"];
  /** Identifier of the store that emitted the event. */
  storeId: string;
  /** JSON Patch operations produced by the event. */
  patches: StoreEvent["patches"];
  /** Store snapshot version after this event was applied. */
  snapshotVersion: number;
  /** Whether the event was committed to the store. */
  committed: boolean;
  /** ISO-8601 timestamp of the event. */
  timestamp: string;
}

/**
 * Hub connection context value provided to consumers.
 *
 * @remarks
 * This is the shape of the value exposed by {@link HubContext} and consumed
 * via {@link useHubConnection}. It contains methods for sending messages,
 * subscribing to incoming messages, and controlling the connection lifecycle.
 *
 * @public
 */
export interface HubContextValue {
  /** Current connection status. */
  status: HubConnectionStatus;
  /** Send a protocol message to the hub. */
  send: (message: DevtoolsMessage) => void;
  /**
   * Subscribe to incoming hub messages.
   *
   * @param handler - Callback invoked for every incoming message.
   * @returns An unsubscribe function.
   */
  subscribe: (handler: (message: DevtoolsMessage) => void) => () => void;
  /** Manually disconnect from the hub and cancel auto-reconnect. */
  disconnect: () => void;
  /** Reset reconnect attempts and establish a fresh connection. */
  reconnect: () => void;
}
