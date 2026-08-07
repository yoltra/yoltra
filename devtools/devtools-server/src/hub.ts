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
  /**
   * Extra WebSocket `Origin` values to accept, beyond the always-allowed set
   * (no Origin, browser-extension origins, and loopback origins). Use this only
   * for a non-loopback local dev host (e.g. a custom `.local` domain). Adding a
   * remote origin re-opens the cross-site hijack surface — don't.
   */
  allowedOrigins?: string[];
  /**
   * Shared secret every client must present in its handshake.
   *
   * @remarks
   * The hub binds to loopback, which keeps the network out — but loopback is not an
   * authentication boundary. Every other process on the machine can reach it, so without a token
   * anything running locally can connect as a panel and read the application's entire state,
   * inject events, and overwrite state through time-travel. That includes a package's install
   * script, and anything else sharing a CI runner or a container.
   *
   * Unset by default, because requiring one would break the zero-configuration local flow that
   * makes the tool worth using. When unset the hub says so once at startup rather than leaving
   * the exposure unmentioned.
   */
  authToken?: string;
  /**
   * Extension ids allowed to connect, e.g. `["abcdefghijklmnopabcdefghijklmnop"]`.
   *
   * @remarks
   * Extension origins all share one scheme, so permitting the scheme permits every extension the
   * user has installed — any of which could open this socket from a devtools page of its own.
   * Naming ids narrows that to the panel meant to connect.
   *
   * Empty by default, which keeps every extension origin allowed: an unpacked build and a store
   * install have different ids, so assuming one would lock out a developer running the extension
   * they just built. Set it alongside {@link DevtoolsHubOptions.authToken} on any machine where
   * other extensions are not automatically trusted.
   */
  allowedExtensionIds?: string[];
  /**
   * Most messages one client may send per second before the excess is dropped.
   *
   * @remarks
   * A command like `REQUEST_STATE` costs the *store* a full serialization of its state and the
   * hub a fan-out, so a client that loops on it turns one cheap socket write into repeated work
   * across every connected process. This bounds that without affecting a panel behaving
   * normally, which sends a handful of commands per interaction.
   *
   * @defaultValue 200
   */
  maxMessagesPerSecond?: number;
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
 * Maximum accepted WebSocket frame size (bytes). Frames fan out to every
 * extension and buffer into history, so an unbounded size is a local
 * DoS / memory-amplification vector. 8 MiB comfortably covers real state
 * snapshots while rejecting hostile oversized frames.
 */
const MAX_WS_PAYLOAD_BYTES = 8 * 1024 * 1024;

/**
 * Compares two secrets without leaking their contents through timing.
 *
 * @remarks
 * `===` on a secret returns as soon as two characters differ, which is a usable oracle for
 * recovering it one character at a time from a process that can retry freely — and anything on
 * this machine can.
 *
 * @internal
 */
function tokensMatch(expected: string, offered: unknown): boolean {
  if (typeof offered !== "string" || offered.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= expected.charCodeAt(i) ^ offered.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Whether a WebSocket `Origin` may connect to the hub.
 *
 * @remarks
 * The hub binds to loopback, but that does not stop a page you visit from
 * opening `ws://127.0.0.1:<port>` — WebSockets are exempt from same-origin/CORS,
 * so a remote page could otherwise exfiltrate state and drive the store. We
 * allow only: no Origin (node agent, CLI, some extension contexts), browser
 * extension origins (narrowed to specific ids when
 * {@link DevtoolsHubOptions.allowedExtensionIds} names any), loopback origins
 * (the local dev app running the agent, or a local storeview), and any
 * explicitly configured origins. A remote origin (e.g. `https://evil.com`) is
 * rejected.
 *
 * An origin check is not authentication: it constrains which *page* may open the
 * socket, and says nothing about which *process* did. That is what
 * {@link DevtoolsHubOptions.authToken} is for, and the two are meant to be used
 * together.
 *
 * @internal
 */
function isOriginAllowed(
  origin: string | undefined,
  allowed: readonly string[],
  allowedExtensionIds: readonly string[],
): boolean {
  if (!origin) return true; // non-browser client; not reachable from a web page
  if (allowed.includes(origin)) return true;
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  if (
    url.protocol === "chrome-extension:" ||
    url.protocol === "moz-extension:" ||
    url.protocol === "safari-web-extension:"
  ) {
    // Every extension shares one origin scheme, so allowing the scheme allows all of them: any
    // extension the user has installed, with a devtools page of its own, could open this socket
    // and read whatever the connected stores hold. The extension id is the host part, so an
    // allow-list narrows it to the panel actually meant to connect.
    //
    // Unset by default because there is no id to assume: an unpacked build and a store install
    // have different ones, so a hardcoded default would reject the developer running the
    // extension they just built.
    if (allowedExtensionIds.length === 0) return true;
    return allowedExtensionIds.includes(url.hostname);
  }
  return isLoopbackHost(url.hostname);
}

/**
 * `true` when a buffered frame belongs to a store that is still connected.
 *
 * @remarks
 * Parses only enough to read `storeId`. A frame that cannot be parsed is kept rather than
 * dropped: it went into the buffer as valid traffic, and silently discarding it here would be a
 * worse failure than replaying one frame too many.
 *
 * @internal
 */
function belongsToLiveStore(raw: string, live: ReadonlySet<string>): boolean {
  try {
    const parsed = JSON.parse(raw) as { storeId?: unknown };
    return typeof parsed.storeId === "string" ? live.has(parsed.storeId) : true;
  } catch {
    return true;
  }
}

/** Loopback host check: `localhost`, the 127.0.0.0/8 block, and IPv6 `::1`. @internal */
function isLoopbackHost(hostname: string): boolean {
  const h = hostname.replace(/^\[|\]$/g, ""); // strip IPv6 brackets
  return (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h === "127.0.0.1" ||
    h.startsWith("127.") ||
    h === "::1" ||
    h === "0:0:0:0:0:0:0:1"
  );
}

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
  private readonly allowedOrigins: readonly string[];
  /** Shared secret required from every client, or `undefined` when the hub is open. */
  private readonly authToken: string | undefined;
  /** Extension ids permitted to connect; empty means every extension origin. */
  private readonly allowedExtensionIds: readonly string[];
  /** Per-second message allowance for one client. */
  private readonly maxMessagesPerSecond: number;
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
    this.allowedOrigins = opts.allowedOrigins ?? [];
    this.authToken = opts.authToken;
    this.allowedExtensionIds = opts.allowedExtensionIds ?? [];
    this.maxMessagesPerSecond = opts.maxMessagesPerSecond ?? 200;
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
      this.wss = new WebSocketServer({
        port: this.port,
        host: this.host,
        // Bound the frame size (DEV-1): oversized frames fan out to every
        // extension and buffer into history, so an unbounded cap is a local
        // DoS / memory-amplification vector.
        maxPayload: MAX_WS_PAYLOAD_BYTES,
        // Reject cross-site WebSocket hijacking: the loopback bind alone does
        // not stop a page you visit from opening ws://127.0.0.1:<port>.
        verifyClient: (info: { origin?: string }) => {
          if (isOriginAllowed(info.origin, this.allowedOrigins, this.allowedExtensionIds))
            return true;
          console.warn(
            `[yoltra devtools] Rejected WebSocket connection from disallowed origin: ${info.origin}`,
          );
          return false;
        },
      });

      this.wss.on("listening", () => {
        if (this.authToken === undefined) {
          // Said once, at the only moment it can still be acted on. Binding to loopback keeps
          // the network out but not the machine: every other local process — a package install
          // script, another tenant on a shared runner — can connect as a panel and read the
          // application's whole state. Silence here would present that as a secure default.
          console.warn(
            "[yoltra devtools] Hub is running without an auth token: any process on this " +
              "machine can read and drive the connected stores. Pass { authToken } (and the " +
              "same value to each agent) on a shared or containerised host.",
          );
        }
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
    // A fixed window rather than a token bucket: the point is to stop a runaway loop, not to
    // shape traffic, and a counter reset on a timestamp comparison costs nothing per frame.
    let windowStart = Date.now();
    let inWindow = 0;

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

      // Ingress validation (DEV-3): every protocol message is a plain object
      // with a string `type` discriminant. Reject anything else (null, arrays,
      // primitives, missing type) before it reaches handshake/routing.
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return;
      if (typeof parsed.type !== "string") return;

      const now = Date.now();
      if (now - windowStart >= 1000) {
        windowStart = now;
        inWindow = 0;
      }
      inWindow += 1;
      if (inWindow > this.maxMessagesPerSecond) {
        // Dropped rather than answered. Closing the socket would punish a burst the same as a
        // flood, and a panel that briefly exceeds the allowance recovers on the next window.
        if (inWindow === this.maxMessagesPerSecond + 1) {
          console.warn(
            `[yoltra devtools] A ${connectionInfo?.role ?? "handshaking"} client exceeded ` +
              `${this.maxMessagesPerSecond} messages/second; the excess is being dropped.`,
          );
        }
        return;
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
    // Checked before anything is registered or replayed, so an unauthenticated client never
    // reaches the history buffer or the store registry.
    if (this.authToken !== undefined && !tokensMatch(this.authToken, req.authToken)) {
      const response: HandshakeResponse = {
        type: "HANDSHAKE_RESPONSE",
        success: false,
        negotiatedVersion: PROTOCOL_VERSION,
        hubCapabilities: {
          maxHistorySize: this.history.capacity,
          supportedFeatures: [],
        },
        error: "Invalid or missing auth token",
      };
      ws.send(JSON.stringify(response));
      console.warn(
        `[yoltra devtools] Rejected a ${req.role} handshake: wrong or missing auth token`,
      );
      return null;
    }

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

    // A STORE handshake must carry `store`, an EXTENSION handshake `extension`.
    // Guard the role/payload match instead of dereferencing a missing field.
    const id = req.role === DevtoolsRole.STORE ? req.store?.id : req.extension?.id;
    if (!id) {
      console.warn(
        `[yoltra devtools] Rejected handshake: role ${req.role} without a matching id payload`,
      );
      return null;
    }

    // Build connection info
    const info: ConnectionInfo = {
      ws,
      role: req.role,
      id,
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
      if (connectMsg) this.router.fanOutToExtensions(connectMsg);
    } else if (req.role === DevtoolsRole.EXTENSION) {
      // Send current store registry to the new extension
      ws.send(this.router.buildRegistryMessage());

      // Replay only what the panel can still act on. The buffer holds events from every store
      // that has ever connected, so a long-lived hub greets each new panel with a burst of
      // history for stores that are gone and cannot be selected — pure noise, sent one frame at
      // a time, before anything useful arrives.
      const live = new Set(this.router.storeIds());
      for (const msg of this.history.toArray()) {
        if (!belongsToLiveStore(msg, live)) continue;
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
      // Metrics go only to panels that said they display them. The other capability flags
      // describe what an extension can render rather than what traffic it wants, so they are
      // not filters — the documentation used to imply all of them were, and none were.
      if (msg.type === "STORE_METRICS") {
        this.router.fanOutToExtensions(raw, (caps) => caps?.performanceMetrics !== false);
      } else {
        this.router.fanOutToExtensions(raw);
      }

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
