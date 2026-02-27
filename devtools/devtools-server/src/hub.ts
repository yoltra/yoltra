/**
 * Central WebSocket hub that brokers DevTools protocol traffic.
 *
 * @module @yoltra/devtools-server
 */

import {
  DevtoolsRole,
  PROTOCOL_VERSION,
  type HandshakeRequest,
  type HandshakeResponse,
} from "@yoltra/devtools-protocol";
import { WebSocket, WebSocketServer } from "ws";
import type { ConnectionInfo } from "./connection";
import { RingBuffer } from "./ring-buffer";
import { Router } from "./router";

/**
 * Configuration for the DevTools hub server.
 *
 * @remarks
 * All fields are optional; sensible defaults are applied when omitted.
 *
 * @public
 */
export interface DevtoolsHubOptions {
  /** Port to bind on. @default 9800 */
  port?: number;
  /** Host to bind on. @default "127.0.0.1" (localhost only for v1 security) */
  host?: string;
  /** Maximum events retained in the ring buffer for late-connecting extensions. @default 1000 */
  historySize?: number;
}

/**
 * Timeout for receiving a handshake request after a WebSocket connection
 * is established, in milliseconds.
 *
 * @remarks
 * If the client does not send a valid `HANDSHAKE_REQUEST` within this
 * window the connection is closed with code `1008` (Policy Violation).
 *
 * @internal
 */
const HANDSHAKE_TIMEOUT_MS = 5_000;

/**
 * Central WebSocket hub that brokers messages between Yoltra stores and DevTools extensions.
 *
 * @remarks
 * - Accepts WS connections, validates protocol handshakes, and routes messages.
 * - Store events are fan-out to all extension clients.
 * - Extension commands are routed to the target store by `storeId`.
 * - Maintains a ring buffer of recent events for late-connecting extensions.
 * - Binds to localhost only (v1 security).
 *
 * @example Embeddable usage
 * ```ts
 * import { DevtoolsHub } from '@yoltra/devtools-server';
 *
 * const hub = new DevtoolsHub({ port: 9800 });
 * await hub.start();
 * // ... later
 * await hub.stop();
 * ```
 *
 * @public
 */
export class DevtoolsHub {
  private readonly port: number;
  private readonly host: string;
  private readonly router = new Router();
  private readonly history: RingBuffer<string>;
  private wss: WebSocketServer | null = null;

  /**
   * Create a new DevTools hub instance.
   *
   * @param opts - Hub configuration. All fields are optional.
   *
   * @public
   */
  constructor(opts: DevtoolsHubOptions = {}) {
    this.port = opts.port ?? 9800;
    this.host = opts.host ?? "127.0.0.1";
    this.history = new RingBuffer<string>(opts.historySize ?? 1000);
  }

  /**
   * Start the WebSocket server and begin accepting connections.
   *
   * @returns Resolves once the server is bound and listening.
   * @throws If the underlying `WebSocketServer` emits an error during
   *         startup (e.g. port already in use).
   *
   * @public
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.wss = new WebSocketServer({ port: this.port, host: this.host });

      this.wss.on("listening", () => {
        resolve();
      });

      this.wss.on("error", (err) => {
        reject(err);
      });

      this.wss.on("connection", (ws) => {
        this.handleConnection(ws);
      });
    });
  }

  /**
   * Stop the server and close all connections.
   *
   * @remarks
   * Existing client sockets are closed with code `1001` ("Going Away")
   * before the server socket is torn down.
   *
   * @returns Resolves once the server has fully shut down.
   *
   * @public
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.wss) {
        resolve();
        return;
      }
      this.wss.close(() => {
        this.wss = null;
        resolve();
      });
      // Close all existing connections
      for (const client of this.wss.clients) {
        client.close(1001, "Hub shutting down");
      }
    });
  }

  /**
   * Check if a DevTools hub is already running on the given port.
   *
   * @param port - Port to probe.
   * @returns `true` if a hub is listening and responds to handshake.
   *
   * @public
   */
  static async probe(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}`);
      const timeout = setTimeout(() => {
        ws.close();
        resolve(false);
      }, 2_000);

      ws.on("open", () => {
        clearTimeout(timeout);
        ws.close();
        resolve(true);
      });

      ws.on("error", () => {
        clearTimeout(timeout);
        resolve(false);
      });
    });
  }

  /**
   * Handle a new WebSocket connection: wait for handshake, then route messages.
   *
   * @remarks
   * Starts a handshake timeout timer. If the first valid message is a
   * `HANDSHAKE_REQUEST` the connection is promoted to a routed client;
   * otherwise it is closed after {@link HANDSHAKE_TIMEOUT_MS}.
   *
   * @param ws - Newly accepted WebSocket.
   */
  private handleConnection(ws: WebSocket): void {
    let connectionInfo: ConnectionInfo | null = null;

    // Handshake timeout: close if no handshake within 5s
    const handshakeTimer = setTimeout(() => {
      if (!connectionInfo) {
        ws.close(1008, "Handshake timeout");
      }
    }, HANDSHAKE_TIMEOUT_MS);

    ws.on("message", (data) => {
      let parsed: any;
      try {
        parsed = JSON.parse(data.toString());
      } catch {
        return; // Ignore malformed messages
      }

      // Handle handshake
      if (!connectionInfo) {
        if (parsed.type === "HANDSHAKE_REQUEST") {
          clearTimeout(handshakeTimer);
          connectionInfo = this.handleHandshake(ws, parsed as HandshakeRequest);
          if (!connectionInfo) {
            ws.close(1008, "Handshake failed");
          }
        }
        return;
      }

      // Route messages based on role
      this.routeMessage(connectionInfo, parsed);
    });

    ws.on("close", () => {
      clearTimeout(handshakeTimer);
      if (connectionInfo) {
        this.handleDisconnect(connectionInfo);
      }
    });

    ws.on("error", () => {
      // Error is followed by close event, handled there
    });
  }

  /**
   * Process a handshake request: validate, register, and respond.
   *
   * @remarks
   * Performs a major-version compatibility check against
   * {@link PROTOCOL_VERSION}. On success the connection is registered with
   * the {@link Router} and post-handshake side-effects are triggered
   * (store-connected broadcast or registry + history replay).
   *
   * @param ws  - The client WebSocket.
   * @param req - Parsed handshake request payload.
   * @returns The new {@link ConnectionInfo} on success, or `null` if the
   *          handshake was rejected.
   */
  private handleHandshake(ws: WebSocket, req: HandshakeRequest): ConnectionInfo | null {
    // Basic protocol version check (accept same major version)
    const reqMajor = parseInt(req.protocolVersion?.split(".")[0] ?? "0");
    const ourMajor = parseInt(PROTOCOL_VERSION.split(".")[0]);
    if (reqMajor !== ourMajor) {
      const response: HandshakeResponse = {
        type: "HANDSHAKE_RESPONSE",
        success: false,
        negotiatedVersion: PROTOCOL_VERSION,
        hubCapabilities: {
          maxHistorySize: this.history.capacity,
          supportedFeatures: [],
        },
        error: `Incompatible protocol version: ${req.protocolVersion} (hub: ${PROTOCOL_VERSION})`,
      };
      ws.send(JSON.stringify(response));
      return null;
    }

    // Build connection info
    const info: ConnectionInfo = {
      ws,
      role: req.role,
      id: req.role === DevtoolsRole.STORE ? req.store!.id : req.extension!.id,
      connectedAt: new Date().toISOString(),
    };

    if (req.role === DevtoolsRole.STORE && req.store) {
      info.storeInfo = {
        name: req.store.name,
        capabilities: req.store.capabilities,
      };
    } else if (req.role === DevtoolsRole.EXTENSION && req.extension) {
      info.extensionInfo = {
        name: req.extension.name,
        capabilities: req.extension.capabilities,
      };
    }

    // Register in router
    this.router.register(info);

    // Send handshake response
    const response: HandshakeResponse = {
      type: "HANDSHAKE_RESPONSE",
      success: true,
      negotiatedVersion: PROTOCOL_VERSION,
      hubCapabilities: {
        maxHistorySize: this.history.capacity,
        supportedFeatures: [],
      },
    };
    ws.send(JSON.stringify(response));

    // Post-handshake actions
    if (req.role === DevtoolsRole.STORE) {
      // Broadcast STORE_CONNECTED to all extensions
      const connectMsg = this.router.buildStoreConnectedMessage(info);
      this.router.fanOutToExtensions(connectMsg);
    } else if (req.role === DevtoolsRole.EXTENSION) {
      // Send current store registry to the new extension
      ws.send(this.router.buildRegistryMessage());
      // Send buffered event history
      for (const msg of this.history.toArray()) {
        ws.send(msg);
      }
    }

    return info;
  }

  /**
   * Route a post-handshake message based on the sender's role.
   *
   * @remarks
   * Store messages are fanned-out to all extensions and, if the message
   * type is `STORE_EVENT`, buffered in the ring buffer for replay.
   * Extension messages are forwarded to the store identified by
   * `msg.storeId`.
   *
   * @param sender - Connection info of the sending client.
   * @param msg    - Parsed message payload (untyped; serialized internally).
   */
  private routeMessage(sender: ConnectionInfo, msg: any): void {
    const raw = JSON.stringify(msg);

    if (sender.role === DevtoolsRole.STORE) {
      // Store messages → fan-out to all extensions
      this.router.fanOutToExtensions(raw);

      // Buffer STORE_EVENT messages in the ring buffer
      if (msg.type === "STORE_EVENT") {
        this.history.push(raw);
      }
    } else {
      // Extension commands → route to target store
      const storeId = msg.storeId as string | undefined;
      if (storeId) {
        this.router.sendToStore(storeId, raw);
      }
    }
  }

  /**
   * Handle a client disconnection.
   *
   * @remarks
   * Unregisters the client from the {@link Router}. If the client was a
   * store, a `STORE_DISCONNECTED` event is broadcast to all extensions.
   *
   * @param info - Connection info of the disconnected client.
   */
  private handleDisconnect(info: ConnectionInfo): void {
    this.router.unregister(info.id, info.role);

    if (info.role === DevtoolsRole.STORE) {
      // Broadcast STORE_DISCONNECTED to all extensions
      const disconnectMsg = this.router.buildStoreDisconnectedMessage(info.id, "disconnected");
      this.router.fanOutToExtensions(disconnectMsg);
    }
  }

  /**
   * Current number of connected stores.
   *
   * @public
   */
  get storeCount(): number {
    return this.router.storeCount;
  }

  /**
   * Current number of connected extensions.
   *
   * @public
   */
  get extensionCount(): number {
    return this.router.extensionCount;
  }

  /**
   * Number of events in the history ring buffer.
   *
   * @public
   */
  get historySize(): number {
    return this.history.size;
  }
}
