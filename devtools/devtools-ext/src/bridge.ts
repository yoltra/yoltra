/**
 * The panel half of the bridge: joins an inspected page to an in-panel broker.
 *
 * @remarks
 * Kept apart from `panel.ts`, which mounts the UI and talks to `chrome.devtools` on load, so the
 * path a page's frames take into the broker is testable on its own.
 *
 * @module @yoltra/devtools-ext
 */

import type { DevtoolsSocketHandle } from "@yoltra/devtools-protocol";
import type { LoopbackHub } from "@yoltra/devtools-ui";

/** Channel both halves of the bridge tag their frames with. */
export const CHANNEL = "yoltra-devtools-bridge";

/** The part of `chrome.runtime.Port` the bridge uses, so a test can supply its own. */
export interface BridgePort {
  postMessage(message: unknown): void;
  onMessage: { addListener(listener: (message: unknown) => void): void };
  onDisconnect: { addListener(listener: () => void): void };
}

/** Frames from an agent that predates connection ids all share this one. */
const UNNAMED = "";

const ignore = (): void => undefined;

/**
 * Attaches the page behind `port` to `hub`, one broker connection per page socket.
 *
 * @remarks
 * Every store on a page posts into the same window, and the content script carries all of it
 * over one port. Joined to the broker as a single peer, a page with two stores registered only
 * the first: the second store's handshake arrived on a peer already registered, and the commands
 * meant for one store reached both. Each frame now names the page socket it belongs to, and the
 * bridge gives each its own connection to the broker, as a hub gives each store its own socket.
 * The broker therefore applies the hub's rules unchanged: one registration per store id, and
 * commands delivered to the store they name.
 *
 * The bridge reads only the envelope (which connection, and whether it closed). The frames
 * themselves pass through unread, so the protocol has one implementation, in the broker.
 *
 * @param hub - The broker the panel's UI connects to.
 * @param port - The runtime port the service worker pairs with the page's content script.
 */
export function bridgePage(hub: LoopbackHub, port: BridgePort): void {
  const connections = new Map<string, DevtoolsSocketHandle>();

  const connectionFor = (id: string): DevtoolsSocketHandle => {
    const existing = connections.get(id);
    if (existing !== undefined) return existing;
    const socket = hub.agentSocketFactory(`bridge://page/${id}`, {
      onOpen: ignore,
      onClose: ignore,
      onError: ignore,
      onMessage: (raw: string) => {
        try {
          const envelope = id === UNNAMED ? {} : { connection: id };
          port.postMessage({ channel: CHANNEL, data: raw, ...envelope });
        } catch {
          // The tab went away; its content script reconnects on reload.
        }
      },
    });
    connections.set(id, socket);
    return socket;
  };

  const end = (id: string): void => {
    const socket = connections.get(id);
    if (socket === undefined) return;
    connections.delete(id);
    socket.close();
  };

  port.onMessage.addListener((message: unknown) => {
    if (message === null || typeof message !== "object") return;
    const msg = message as Record<string, unknown>;
    if (msg.channel !== CHANNEL || typeof msg.data !== "string") return;
    const id = typeof msg.connection === "string" ? msg.connection : UNNAMED;
    if (msg.closed === true) {
      end(id);
      return;
    }
    connectionFor(id).send(msg.data);
  });

  // The page went away (a reload, a closed tab): every store on it has gone with it.
  port.onDisconnect.addListener(() => {
    for (const id of [...connections.keys()]) end(id);
  });
}
