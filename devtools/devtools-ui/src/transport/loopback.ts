/**
 * @module @yoltra/devtools-ui
 *
 * In-memory loopback transport: run the store agent, the hub, and the panel all
 * in one process (a browser tab or a test) with **no network socket**. This is
 * what powers the embeddable, zero-install DevTools demo — and it exercises the
 * exact same protocol the real WebSocket hub does, only over an in-page channel.
 */

import {
  DevtoolsRole,
  PROTOCOL_VERSION,
  type DevtoolsSocketCallbacks,
  type DevtoolsSocketFactory,
  type DevtoolsSocketHandle,
} from "@yoltra/devtools-protocol";

// Standard WebSocket readyState values.
const CONNECTING = 0;
const OPEN = 1;
const CLOSING = 2;
const CLOSED = 3;

/** A party connected to the in-memory broker (agent or extension). */
interface Peer {
  role: DevtoolsRole | null; // resolved at handshake
  id: string | null;
  storeInfo?: { name: string; capabilities: unknown };
  deliver: (raw: string) => void; // push a message TO this peer's socket
  closed: boolean;
}

/** Hub-authored envelope fields (mirrors the real hub's `baseMsg`). */
function hubMeta() {
  return {
    timestamp: new Date().toISOString(),
    sourceId: "loopback-hub",
    sourceRole: DevtoolsRole.HUB,
  };
}

function majorOf(version: string): string {
  return version.split(".")[0] ?? "0";
}

/**
 * A tiny in-process hub that speaks the DevTools protocol without any socket.
 * Stores fan their messages out to every extension; extension commands route to
 * the target store by `storeId`. Same routing contract as the real hub, minus
 * the WebSocket server (and its history buffer / origin checks, which are moot
 * in a single trusted process).
 */
class LoopbackBroker {
  private readonly peers = new Set<Peer>();

  add(deliver: (raw: string) => void): Peer {
    const peer: Peer = { role: null, id: null, deliver, closed: false };
    this.peers.add(peer);
    return peer;
  }

  remove(peer: Peer): void {
    if (!this.peers.delete(peer)) return;
    peer.closed = true;
    if (peer.role === DevtoolsRole.STORE && peer.id) {
      const msg = JSON.stringify({
        type: "STORE_DISCONNECTED",
        storeId: peer.id,
        reason: "disconnected",
        ...hubMeta(),
      });
      this.eachExtension((p) => p.deliver(msg));
    }
  }

  receive(peer: Peer, raw: string): void {
    if (peer.closed) return;
    let msg: Record<string, unknown> | null;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    if (msg === null || typeof msg !== "object" || typeof msg.type !== "string") return;

    if (peer.role === null) {
      this.handshake(peer, msg);
      return;
    }

    if (peer.role === DevtoolsRole.STORE) {
      // A store's messages fan out to every connected extension.
      this.eachExtension((p) => p.deliver(raw));
    } else if (typeof msg.storeId === "string") {
      // An extension's commands route to the target store.
      for (const p of this.peers) {
        if (p.role === DevtoolsRole.STORE && p.id === msg.storeId) p.deliver(raw);
      }
    }
  }

  private handshake(peer: Peer, msg: Record<string, any>): void {
    if (msg.type !== "HANDSHAKE_REQUEST") return;

    const role = msg.role as DevtoolsRole;
    const id =
      role === DevtoolsRole.STORE
        ? msg.store?.id
        : role === DevtoolsRole.EXTENSION
          ? msg.extension?.id
          : undefined;
    const compatible = majorOf(String(msg.protocolVersion ?? "")) === majorOf(PROTOCOL_VERSION);
    const success = compatible && typeof id === "string";

    peer.deliver(
      JSON.stringify({
        type: "HANDSHAKE_RESPONSE",
        success,
        protocolVersion: PROTOCOL_VERSION,
        ...hubMeta(),
        ...(success ? {} : { error: "Loopback handshake rejected (version or id mismatch)" }),
      }),
    );
    if (!success) return;

    peer.role = role;
    peer.id = id as string;

    if (role === DevtoolsRole.STORE) {
      peer.storeInfo = { name: msg.store?.name ?? id, capabilities: msg.store?.capabilities };
      const connected = JSON.stringify({
        type: "STORE_CONNECTED",
        store: { id, name: peer.storeInfo.name, capabilities: peer.storeInfo.capabilities },
        ...hubMeta(),
      });
      this.eachExtension((p) => p.deliver(connected));
    } else {
      const stores = [...this.peers]
        .filter((p) => p.role === DevtoolsRole.STORE && p.storeInfo)
        .map((p) => ({
          id: p.id,
          name: p.storeInfo!.name,
          status: "connected" as const,
          capabilities: p.storeInfo!.capabilities,
          connectedAt: new Date().toISOString(),
        }));
      peer.deliver(JSON.stringify({ type: "STORE_REGISTRY", stores, ...hubMeta() }));
    }
  }

  private eachExtension(fn: (p: Peer) => void): void {
    for (const p of this.peers) if (p.role === DevtoolsRole.EXTENSION) fn(p);
  }
}

/**
 * A loopback hub instance. Wire the agent and the panel to the *same* instance.
 *
 * @public
 */
export interface LoopbackHub {
  /** Inject into the browser agent: `withDevtools(store, { socketFactory })`. */
  agentSocketFactory: DevtoolsSocketFactory;
  /** Pass to the DevTools UI as `config.WebSocket` (e.g. `<DevtoolsApp>`). */
  WebSocket: { new (url: string): WebSocket };
}

/**
 * Creates a self-contained in-memory DevTools hub plus the two client transports
 * that connect to it — a `socketFactory` for the store agent and a
 * `WebSocket`-compatible class for the panel UI. No ports, no server, no
 * extension: everything runs in the current process.
 *
 * @example
 * ```ts
 * const hub = createLoopbackHub();
 * withDevtools(store, { port: 0, socketFactory: hub.agentSocketFactory });
 * // <DevtoolsApp config={{ port: 0, WebSocket: hub.WebSocket }} />
 * ```
 *
 * @public
 */
export function createLoopbackHub(): LoopbackHub {
  const broker = new LoopbackBroker();

  const agentSocketFactory: DevtoolsSocketFactory = (
    _url: string,
    callbacks: DevtoolsSocketCallbacks,
  ): DevtoolsSocketHandle => {
    let readyState = CONNECTING;
    const peer = broker.add((raw) => callbacks.onMessage(raw));
    queueMicrotask(() => {
      readyState = OPEN;
      callbacks.onOpen();
    });
    return {
      get readyState() {
        return readyState;
      },
      send: (data) => broker.receive(peer, data),
      close: () => {
        if (readyState === CLOSED) return;
        readyState = CLOSED;
        broker.remove(peer);
        callbacks.onClose();
      },
      dispose: () => {
        peer.closed = true;
      },
    };
  };

  class LoopbackWebSocket {
    static readonly CONNECTING = CONNECTING;
    static readonly OPEN = OPEN;
    static readonly CLOSING = CLOSING;
    static readonly CLOSED = CLOSED;

    onopen: (() => void) | null = null;
    onmessage: ((ev: { data: string }) => void) | null = null;
    onclose: (() => void) | null = null;
    onerror: (() => void) | null = null;
    readyState = CONNECTING;

    private readonly peer: Peer;

    constructor(_url: string) {
      this.peer = broker.add((raw) => this.onmessage?.({ data: raw }));
      queueMicrotask(() => {
        this.readyState = OPEN;
        this.onopen?.();
      });
    }

    send(data: string): void {
      broker.receive(this.peer, data);
    }

    close(): void {
      if (this.readyState === CLOSED) return;
      this.readyState = CLOSED;
      broker.remove(this.peer);
      this.onclose?.();
    }
  }

  return {
    agentSocketFactory,
    WebSocket: LoopbackWebSocket as unknown as { new (url: string): WebSocket },
  };
}
