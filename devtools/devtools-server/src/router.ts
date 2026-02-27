/**
 * Message routing layer for the DevTools hub.
 *
 * @module @yoltra/devtools-server
 */

import {
  DevtoolsRole,
  type StoreConnected,
  type StoreDisconnected,
  type StoreRegistry,
} from "@yoltra/devtools-protocol";
import type { WebSocket } from "ws";
import type { ConnectionInfo } from "./connection";

/**
 * Routes DevTools protocol messages between stores and extensions.
 *
 * @remarks
 * The router maintains two parallel maps -- one for store connections and
 * one for extension connections -- and exposes helpers that implement the
 * three core routing patterns of the DevTools protocol:
 *
 * - **Fan-out**: Store messages are forwarded to every connected extension.
 * - **Targeted delivery**: Extension commands are routed to a specific
 *   store identified by `storeId`.
 * - **Lifecycle broadcast**: `STORE_CONNECTED` / `STORE_DISCONNECTED`
 *   events are broadcast to all extensions whenever a store joins or
 *   leaves.
 *
 * @public
 */
export class Router {
  /** All store connections, keyed by store ID. */
  private readonly stores = new Map<string, ConnectionInfo>();
  /** All extension connections, keyed by extension ID. */
  private readonly extensions = new Map<string, ConnectionInfo>();

  /**
   * Register a newly handshaked connection.
   *
   * @param info - Connection info from the completed handshake.
   *
   * @public
   */
  register(info: ConnectionInfo): void {
    if (info.role === DevtoolsRole.STORE) {
      this.stores.set(info.id, info);
    } else {
      this.extensions.set(info.id, info);
    }
  }

  /**
   * Remove a connection by ID.
   *
   * @param id - Client ID to remove.
   * @param role - Client role (`STORE` or `EXTENSION`).
   *
   * @public
   */
  unregister(id: string, role: DevtoolsRole): void {
    if (role === DevtoolsRole.STORE) {
      this.stores.delete(id);
    } else {
      this.extensions.delete(id);
    }
  }

  /**
   * Get the WebSocket for a specific store.
   *
   * @param storeId - Store UUID.
   * @returns The store's WebSocket, or `undefined` if not connected.
   *
   * @public
   */
  getStoreSocket(storeId: string): WebSocket | undefined {
    return this.stores.get(storeId)?.ws;
  }

  /**
   * Route a message from a store to all extensions (fan-out).
   *
   * @remarks
   * Only sends to extensions whose WebSocket is in the `OPEN` ready-state;
   * connections in a closing or closed state are silently skipped.
   *
   * @param message - Serialized JSON message string.
   *
   * @public
   */
  fanOutToExtensions(message: string): void {
    for (const [, ext] of this.extensions) {
      if (ext.ws.readyState === ext.ws.OPEN) {
        ext.ws.send(message);
      }
    }
  }

  /**
   * Route a message from an extension to a specific store.
   *
   * @param storeId - Target store UUID.
   * @param message - Serialized JSON message string.
   * @returns `true` if the message was sent, `false` if the store was
   *          not found or its socket was not open.
   *
   * @public
   */
  sendToStore(storeId: string, message: string): boolean {
    const store = this.stores.get(storeId);
    if (!store || store.ws.readyState !== store.ws.OPEN) return false;
    store.ws.send(message);
    return true;
  }

  /**
   * Build a `STORE_CONNECTED` broadcast message.
   *
   * @param info - Store connection info (must have {@link ConnectionInfo.storeInfo}).
   * @returns Serialized {@link StoreConnected} JSON string.
   *
   * @public
   */
  buildStoreConnectedMessage(info: ConnectionInfo): string {
    const msg: StoreConnected = {
      type: "STORE_CONNECTED",
      timestamp: new Date().toISOString(),
      sourceId: "hub",
      sourceRole: DevtoolsRole.STORE,
      store: {
        id: info.id,
        name: info.storeInfo!.name,
        capabilities: info.storeInfo!.capabilities,
      },
    };
    return JSON.stringify(msg);
  }

  /**
   * Build a `STORE_DISCONNECTED` broadcast message.
   *
   * @param storeId - Disconnected store ID.
   * @param reason - Optional human-readable disconnect reason.
   * @returns Serialized {@link StoreDisconnected} JSON string.
   *
   * @public
   */
  buildStoreDisconnectedMessage(storeId: string, reason?: string): string {
    const msg: StoreDisconnected = {
      type: "STORE_DISCONNECTED",
      timestamp: new Date().toISOString(),
      sourceId: "hub",
      sourceRole: DevtoolsRole.STORE,
      storeId,
      reason,
    };
    return JSON.stringify(msg);
  }

  /**
   * Build a `STORE_REGISTRY` message listing all connected stores.
   *
   * @returns Serialized {@link StoreRegistry} JSON string.
   *
   * @public
   */
  buildRegistryMessage(): string {
    const msg: StoreRegistry = {
      type: "STORE_REGISTRY",
      timestamp: new Date().toISOString(),
      sourceId: "hub",
      sourceRole: DevtoolsRole.EXTENSION,
      stores: Array.from(this.stores.values()).map((s) => ({
        id: s.id,
        name: s.storeInfo!.name,
        status: "connected" as const,
        capabilities: s.storeInfo!.capabilities,
        connectedAt: s.connectedAt,
      })),
    };
    return JSON.stringify(msg);
  }

  /**
   * Number of connected stores.
   *
   * @returns Current store connection count.
   *
   * @public
   */
  get storeCount(): number {
    return this.stores.size;
  }

  /**
   * Number of connected extensions.
   *
   * @returns Current extension connection count.
   *
   * @public
   */
  get extensionCount(): number {
    return this.extensions.size;
  }
}
