/**
 * Transport-agnostic reconnecting WebSocket client for DevTools agents.
 *
 * @remarks
 * Owns the shared reconnection state machine, protocol handshake, message
 * buffering, and exponential backoff. The actual WebSocket implementation is
 * **injected** via a {@link DevtoolsSocketFactory}, so this module depends on
 * neither the browser `WebSocket` global nor the Node `ws` package — each agent
 * supplies its own. That is what lets the browser and node agents stay separate
 * packages without either pulling in a transport that cannot run in its
 * environment.
 *
 * Note for maintainers: do **not** reference the `WebSocket` global here. Sockets
 * arrive only through the injected {@link DevtoolsSocketFactory}.
 *
 * @module @yoltra/devtools-protocol
 */

import type { StoreCapabilities } from "./capabilities";
import type { HandshakeRequest, HandshakeResponse } from "./handshake";
import { DevtoolsRole } from "./roles";
import { PROTOCOL_VERSION } from "./version";

/** WebSocket `readyState` for a connecting socket (per the WebSocket standard). */
export const WS_CONNECTING = 0;
/** WebSocket `readyState` for an open socket (per the WebSocket standard). */
export const WS_OPEN = 1;

/**
 * Connection state for the devtools WS client.
 *
 * @remarks
 * `disconnected` -> `connecting` -> `connected`, or
 * `connected` -> `reconnecting` -> `connected`/`disconnected`.
 *
 * @public
 */
export type ConnectionState = "disconnected" | "connecting" | "connected" | "reconnecting";

/** Lifecycle callbacks the transport wires to the underlying socket. */
export interface DevtoolsSocketCallbacks {
  onOpen(): void;
  onMessage(data: string): void;
  onClose(): void;
  onError(): void;
}

/** Minimal socket handle the shared client operates on. */
export interface DevtoolsSocketHandle {
  /** Standard WebSocket readyState (0=connecting, 1=open, 2=closing, 3=closed). */
  readonly readyState: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
  /** Detach every listener from the underlying socket. */
  dispose(): void;
}

/**
 * Opens a socket to `url`, wiring the given callbacks, and returns a handle.
 * Each agent supplies one (native `WebSocket` for browsers, the `ws` package for
 * Node), so the shared client never imports a specific transport.
 *
 * @public
 */
export type DevtoolsSocketFactory = (
  url: string,
  callbacks: DevtoolsSocketCallbacks,
) => DevtoolsSocketHandle;

/** Reconnection/buffering configuration. */
export interface ReconnectingWsConfig {
  autoReconnect: boolean;
  maxReconnectAttempts: number;
  baseDelay: number;
  maxDelay: number;
  /** Max buffered messages while disconnected before dropping the oldest. Default 100. */
  maxBufferSize?: number;
}

/**
 * Reconnecting WebSocket client that connects a Yoltra store to the DevTools hub.
 *
 * @remarks
 * - Performs the DevTools protocol handshake on each connection.
 * - Buffers outgoing messages (up to 100) while disconnected, dropping the oldest.
 * - Uses exponential backoff with jitter for reconnection attempts.
 * - Tracks connection epochs to safely discard stale callbacks.
 * - Transport-agnostic: the socket is created by the injected factory.
 *
 * @public
 */
export class ReconnectingWsClient {
  private socket: DevtoolsSocketHandle | null = null;
  private state: ConnectionState = "disconnected";
  private url = "";
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectEpoch = 0;
  private intentionallyClosed = false;
  private readonly buffer: string[] = [];
  private handshakeResolved = false;
  private onMessageHandler: ((data: string) => void) | null = null;
  private onConnectedHandler: (() => void) | null = null;
  private onDisconnectedHandler: (() => void) | null = null;
  private onBackpressureHandler: ((droppedTotal: number) => void) | null = null;
  private droppedCount = 0;

  constructor(
    private readonly storeId: string,
    private readonly storeName: string,
    private readonly capabilities: StoreCapabilities,
    private readonly config: ReconnectingWsConfig,
    private readonly createSocket: DevtoolsSocketFactory,
  ) {}

  /** Register a handler for incoming messages (post-handshake). */
  onMessage(handler: (data: string) => void): void {
    this.onMessageHandler = handler;
  }

  /** Register a handler for successful connection (post-handshake). */
  onConnected(handler: () => void): void {
    this.onConnectedHandler = handler;
  }

  /** Register a handler for disconnection. */
  onDisconnected(handler: () => void): void {
    this.onDisconnectedHandler = handler;
  }

  /**
   * Register a handler fired when a buffered message is dropped because the send
   * buffer overflowed while disconnected (backpressure). Receives the running
   * total of dropped messages so the loss is never silent.
   */
  onBackpressure(handler: (droppedTotal: number) => void): void {
    this.onBackpressureHandler = handler;
  }

  /** Connect to the DevTools hub at `host:port`. */
  connect(host: string, port: number): void {
    this.url = `ws://${host}:${port}`;
    this.intentionallyClosed = false;
    this.reconnectAttempts = 0;
    this.doConnect();
  }

  /** Send a message, buffering (FIFO) while disconnected; drops oldest on overflow. */
  send(message: string): void {
    if (this.socket && this.socket.readyState === WS_OPEN && this.handshakeResolved) {
      this.socket.send(message);
      return;
    }
    this.buffer.push(message);
    const max = this.config.maxBufferSize ?? 100;
    if (this.buffer.length > max) {
      this.buffer.shift(); // Drop oldest — surface backpressure so the loss is not silent.
      this.droppedCount++;
      this.onBackpressureHandler?.(this.droppedCount);
    }
  }

  /** Disconnect and stop reconnection attempts. */
  disconnect(): void {
    this.intentionallyClosed = true;
    this.connectEpoch++;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.dispose();
      this.socket.close(1000, "Client disconnect");
      this.socket = null;
    }
    this.state = "disconnected";
    this.buffer.length = 0;
  }

  /** Current connection state. */
  getState(): ConnectionState {
    return this.state;
  }

  /** Total messages dropped due to buffer overflow while disconnected. */
  getDroppedCount(): number {
    return this.droppedCount;
  }

  private doConnect(): void {
    if (
      this.socket &&
      (this.socket.readyState === WS_OPEN || this.socket.readyState === WS_CONNECTING)
    ) {
      return;
    }

    // Clean up any stale socket.
    if (this.socket) {
      this.socket.dispose();
      this.socket = null;
    }

    const epoch = ++this.connectEpoch;
    this.state = this.reconnectAttempts === 0 ? "connecting" : "reconnecting";
    this.handshakeResolved = false;

    try {
      this.socket = this.createSocket(this.url, {
        onOpen: () => {
          if (epoch !== this.connectEpoch) return;
          this.performHandshake(epoch);
        },
        onMessage: (text) => {
          if (epoch !== this.connectEpoch) return;
          if (!this.handshakeResolved) {
            this.handleHandshakeResponse(text, epoch);
            return;
          }
          this.onMessageHandler?.(text);
        },
        onClose: () => {
          if (epoch !== this.connectEpoch) return;
          this.handleClose(epoch);
        },
        onError: () => {
          // Error is followed by close, handled there.
        },
      });
    } catch {
      this.handleConnectFailure(epoch);
    }
  }

  private performHandshake(epoch: number): void {
    if (epoch !== this.connectEpoch || !this.socket) return;

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

    this.socket.send(JSON.stringify(request));
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
      this.socket?.close(1008, "Handshake failed");
      return;
    }

    this.handshakeResolved = true;
    this.state = "connected";
    this.reconnectAttempts = 0;
    this.onConnectedHandler?.();

    // Flush buffered messages.
    while (this.buffer.length > 0 && this.socket?.readyState === WS_OPEN) {
      this.socket.send(this.buffer.shift()!);
    }
  }

  private handleClose(epoch: number): void {
    if (epoch !== this.connectEpoch) return;

    this.socket = null;
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
    // Exponential backoff with 0-10% jitter and a 750ms floor.
    const base = this.config.baseDelay * Math.pow(2, this.reconnectAttempts - 1);
    const jitter = Math.random() * 0.1 * base;
    const delay = Math.min(base + jitter, this.config.maxDelay);
    return Math.max(delay, 750);
  }
}
