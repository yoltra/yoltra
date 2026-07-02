/**
 * WebSocket transport layer for the Node.js DevTools agent.
 *
 * @remarks
 * Provides a reconnecting WebSocket client that handles the DevTools protocol
 * handshake, message buffering during disconnects, and exponential backoff
 * with jitter. Built on the `ws` package for Node.js environments.
 *
 * @module @yoltra/devtools-node-agent
 */

import {
  DevtoolsRole,
  PROTOCOL_VERSION,
  type HandshakeRequest,
  type HandshakeResponse,
  type StoreCapabilities,
} from "@yoltra/devtools-protocol";
import { WebSocket } from "ws";

/**
 * Connection state for the devtools WS client.
 *
 * @remarks
 * Represents the finite-state-machine states the client cycles through:
 * `disconnected` -> `connecting` -> `connected`, or
 * `connected` -> `reconnecting` -> `connected`/`disconnected`.
 *
 * @internal
 */
export type ConnectionState = "disconnected" | "connecting" | "connected" | "reconnecting";

/**
 * WebSocket client with automatic reconnection for connecting a Yoltra store
 * to the DevTools hub in Node.js environments.
 *
 * @remarks
 * - Uses the `ws` package for WebSocket connectivity.
 * - Performs the DevTools protocol handshake on each connection.
 * - Buffers outgoing messages (up to 100) while disconnected.
 * - Employs exponential backoff with jitter for reconnection attempts.
 * - Tracks connection epochs to safely discard stale callbacks.
 * - Follows the same reconnection/buffering patterns as `@eraelco/yoltra-socket`.
 *
 * @internal
 */
export class DevtoolsWsClient {
  private ws: WebSocket | null = null;
  private state: ConnectionState = "disconnected";
  private url: string;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectEpoch = 0;
  private intentionallyClosed = false;
  private readonly buffer: string[] = [];
  private handshakeResolved = false;
  private onMessageHandler: ((data: string) => void) | null = null;
  private onConnectedHandler: (() => void) | null = null;
  private onDisconnectedHandler: (() => void) | null = null;

  constructor(
    private readonly storeId: string,
    private readonly storeName: string,
    private readonly capabilities: StoreCapabilities,
    private readonly config: {
      autoReconnect: boolean;
      maxReconnectAttempts: number;
      baseDelay: number;
      maxDelay: number;
    },
  ) {
    this.url = "";
  }

  /**
   * Register a handler for incoming messages (post-handshake).
   *
   * @param handler - Callback invoked with the raw message string for every
   *   message received after the handshake completes.
   */
  onMessage(handler: (data: string) => void): void {
    this.onMessageHandler = handler;
  }

  /**
   * Register a handler for successful connection (post-handshake).
   *
   * @param handler - Callback invoked once the handshake succeeds and the
   *   connection is fully established.
   */
  onConnected(handler: () => void): void {
    this.onConnectedHandler = handler;
  }

  /**
   * Register a handler for disconnection.
   *
   * @param handler - Callback invoked when the WebSocket connection is lost,
   *   whether intentionally or due to a network error.
   */
  onDisconnected(handler: () => void): void {
    this.onDisconnectedHandler = handler;
  }

  /**
   * Connect to the DevTools hub.
   *
   * @remarks
   * Resets reconnection state and initiates a fresh connection. If already
   * connected, call {@link disconnect} first.
   *
   * @param host - Hub hostname or IP address.
   * @param port - Hub port number.
   */
  connect(host: string, port: number): void {
    this.url = `ws://${host}:${port}`;
    this.intentionallyClosed = false;
    this.reconnectAttempts = 0;
    this.doConnect();
  }

  /**
   * Send a message to the hub, buffering if not yet connected.
   *
   * @remarks
   * Messages are buffered in a FIFO queue (max 100 entries) while the
   * connection is down. When the buffer overflows, the oldest message is
   * dropped. Buffered messages are flushed once the handshake succeeds.
   *
   * @param message - Serialised JSON string to send.
   */
  send(message: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.handshakeResolved) {
      this.ws.send(message);
    } else {
      this.buffer.push(message);
      if (this.buffer.length > 100) {
        this.buffer.shift(); // Drop oldest
      }
    }
  }

  /**
   * Disconnect from the hub and stop reconnection attempts.
   *
   * @remarks
   * Closes the underlying socket with code 1000, clears the message buffer,
   * and cancels any pending reconnection timer.
   */
  disconnect(): void {
    this.intentionallyClosed = true;
    this.connectEpoch++;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }
    this.state = "disconnected";
    this.buffer.length = 0;
  }

  /**
   * Current connection state.
   *
   * @returns The current {@link ConnectionState} of this client.
   */
  getState(): ConnectionState {
    return this.state;
  }

  private doConnect(): void {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    // Clean up stale socket
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws = null;
    }

    const epoch = ++this.connectEpoch;
    this.state = this.reconnectAttempts === 0 ? "connecting" : "reconnecting";
    this.handshakeResolved = false;

    try {
      this.ws = new WebSocket(this.url);
    } catch {
      this.handleConnectFailure(epoch);
      return;
    }

    this.ws.on("open", () => {
      if (epoch !== this.connectEpoch) return;
      this.performHandshake(epoch);
    });

    this.ws.on("message", (data: Buffer | ArrayBuffer | Buffer[]) => {
      if (epoch !== this.connectEpoch) return;
      const text = data.toString();

      if (!this.handshakeResolved) {
        this.handleHandshakeResponse(text, epoch);
        return;
      }

      this.onMessageHandler?.(text);
    });

    this.ws.on("close", () => {
      if (epoch !== this.connectEpoch) return;
      this.handleClose(epoch);
    });

    this.ws.on("error", () => {
      // Error is followed by close, handled there
    });
  }

  private performHandshake(epoch: number): void {
    if (epoch !== this.connectEpoch || !this.ws) return;

    const request: HandshakeRequest = {
      type: "HANDSHAKE_REQUEST",
      protocolVersion: PROTOCOL_VERSION,
      role: DevtoolsRole.STORE,
      store: {
        id: this.storeId,
        name: this.storeName,
        capabilities: this.capabilities,
      },
    };

    this.ws.send(JSON.stringify(request));
  }

  private handleHandshakeResponse(text: string, epoch: number): void {
    if (epoch !== this.connectEpoch) return;

    let response: HandshakeResponse;
    try {
      response = JSON.parse(text);
    } catch {
      return;
    }

    if (response.type !== "HANDSHAKE_RESPONSE") return;

    if (!response.success) {
      console.error("[Yoltra DevTools] Handshake failed:", response.error);
      this.ws?.close(1008, "Handshake failed");
      return;
    }

    this.handshakeResolved = true;
    this.state = "connected";
    this.reconnectAttempts = 0;
    this.onConnectedHandler?.();

    // Flush buffer
    while (this.buffer.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(this.buffer.shift()!);
    }
  }

  private handleClose(epoch: number): void {
    if (epoch !== this.connectEpoch) return;

    this.ws = null;
    this.handshakeResolved = false;
    this.onDisconnectedHandler?.();

    if (this.intentionallyClosed) {
      this.state = "disconnected";
      return;
    }

    if (this.config.autoReconnect) {
      this.attemptReconnect(epoch);
    } else {
      this.state = "disconnected";
    }
  }

  private handleConnectFailure(epoch: number): void {
    if (epoch !== this.connectEpoch) return;

    if (this.config.autoReconnect) {
      this.attemptReconnect(epoch);
    } else {
      this.state = "disconnected";
    }
  }

  private attemptReconnect(epoch: number): void {
    if (epoch !== this.connectEpoch || this.intentionallyClosed) return;

    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.state = "disconnected";
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++;
    this.state = "reconnecting";

    const delay = this.calculateBackoff();
    this.reconnectTimer = setTimeout(() => {
      if (epoch !== this.connectEpoch) return;
      this.doConnect();
    }, delay);
  }

  private calculateBackoff(): number {
    // Exponential backoff with jitter
    const base = this.config.baseDelay * Math.pow(2, this.reconnectAttempts - 1);
    const jitter = Math.random() * 0.1 * base; // 0-10% jitter
    const delay = Math.min(base + jitter, this.config.maxDelay);
    return Math.max(delay, 750); // 750ms floor
  }
}
