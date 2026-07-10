/**
 * Connection metadata tracked per WebSocket client.
 *
 * @module @yoltra/devtools-server
 */

import type {
  DevtoolsRole,
  ExtensionCapabilities,
  StoreCapabilities,
} from "@yoltra/devtools-protocol";
import type { WebSocket } from "ws";

/**
 * Information tracked for each connected WebSocket client.
 *
 * @remarks
 * A `ConnectionInfo` record is created during the handshake phase and
 * persists for the lifetime of the WebSocket connection. The {@link Router}
 * indexes these records by {@link ConnectionInfo.id | id} to enable
 * targeted message routing and lifecycle broadcasts.
 *
 * @public
 */
export interface ConnectionInfo {
  /** The raw WebSocket instance used for sending and receiving frames. */
  ws: WebSocket;
  /** Role assigned during the handshake (`STORE` or `EXTENSION`). */
  role: DevtoolsRole;
  /** Unique client ID (store wrapper UUID or extension UUID). */
  id: string;
  /** ISO 8601 timestamp recording when the client connected. */
  connectedAt: string;
  /**
   * Store-specific metadata, present only when {@link role} is
   * {@link DevtoolsRole.STORE}.
   */
  storeInfo?: {
    /** Human-readable store name. */
    name: string;
    /** Feature capabilities reported by the store. */
    capabilities: StoreCapabilities;
  };
  /**
   * Extension-specific metadata, present only when {@link role} is
   * {@link DevtoolsRole.EXTENSION}.
   */
  extensionInfo?: {
    /** Human-readable extension name. */
    name: string;
    /** Feature capabilities reported by the extension. */
    capabilities: ExtensionCapabilities;
  };
}
