/**
 * `postMessage` transport, for attaching without a hub.
 *
 * @remarks
 * Attaching the panel used to mean running a hub process, editing the application to add
 * `withDevtools()`, and setting `allowReplay` — three steps at the exact moment somebody is
 * deciding whether the tool is worth it, against Redux DevTools' one. The hub earns its keep for
 * Node processes and remote debugging, where a socket is the only way in. For a page being
 * inspected by an extension running in the same browser, it is a server standing between two
 * things already able to talk.
 *
 * This transport is the page half. It frames the same protocol into `window.postMessage`, where
 * a content script can relay it to the panel. Nothing here knows about extensions: it posts to
 * its own window and listens on it, which keeps the module testable and lets any relay — a
 * content script, an iframe host, a test — sit on the other side.
 *
 * @module @yoltra/devtools-browser-agent
 */

import type {
  DevtoolsSocketCallbacks,
  DevtoolsSocketFactory,
  DevtoolsSocketHandle,
} from "@yoltra/devtools-protocol";

/** Marks a message as belonging to this bridge, so unrelated `postMessage` traffic is ignored. */
export const BRIDGE_CHANNEL = "yoltra-devtools-bridge" as const;

/** Direction of a bridged frame. */
export type BridgeDirection = "to-panel" | "to-page";

/** One protocol frame travelling over `window.postMessage`. */
export interface BridgeMessage {
  readonly channel: typeof BRIDGE_CHANNEL;
  readonly direction: BridgeDirection;
  /** A serialized DevTools protocol message. */
  readonly data: string;
}

/** `true` when `value` is a bridge frame travelling in `direction`. */
export function isBridgeMessage(value: unknown, direction: BridgeDirection): value is BridgeMessage {
  if (value === null || typeof value !== "object") return false;
  const msg = value as Record<string, unknown>;
  return (
    msg.channel === BRIDGE_CHANNEL && msg.direction === direction && typeof msg.data === "string"
  );
}

/** The window-like surface this transport needs, so a test can supply its own. */
export interface BridgeWindow {
  postMessage(message: unknown, targetOrigin: string): void;
  addEventListener(type: "message", listener: (event: MessageEvent) => void): void;
  removeEventListener(type: "message", listener: (event: MessageEvent) => void): void;
}

const CONNECTING = 0;
const OPEN = 1;
const CLOSED = 3;

/**
 * Builds a socket factory that carries the protocol over `window.postMessage`.
 *
 * @param target - Window to post to and listen on. Defaults to the global `window`.
 * @returns A factory for `withDevtools({ socketFactory })`.
 *
 * @remarks
 * The socket reports itself open immediately, because `postMessage` has no connection to
 * establish. That is not a claim that anybody is listening — if no relay is present the protocol
 * handshake simply goes unanswered, the client never resolves it, and messages buffer exactly as
 * they do against a hub that is not running. Failure to attach therefore looks the same whether
 * the panel is absent or the hub is down, which is one behaviour to explain rather than two.
 *
 * Messages are posted with a `"*"` target origin and filtered by channel on receipt. The page is
 * posting to *itself* for a content script in the same frame to observe; there is no
 * cross-origin recipient to restrict to, and the content script is the trust boundary.
 *
 * @example
 * ```ts
 * withDevtools(store, { socketFactory: createPostMessageSocketFactory() });
 * ```
 *
 * @public
 */
export function createPostMessageSocketFactory(target?: BridgeWindow): DevtoolsSocketFactory {
  return (_url: string, callbacks: DevtoolsSocketCallbacks): DevtoolsSocketHandle => {
    const win = target ?? (globalThis as unknown as { window?: BridgeWindow }).window;
    if (win === undefined) {
      // No window to post into: report a closed socket rather than throwing into whatever
      // called us. The client treats it as a failed connection and backs off.
      return {
        readyState: CLOSED,
        send: () => undefined,
        close: () => undefined,
        dispose: () => undefined,
      };
    }

    let readyState: number = CONNECTING;

    const onMessage = (event: MessageEvent): void => {
      // Only frames addressed to the page, on our channel. Everything else on this window —
      // application traffic, other tools — is none of our business.
      if (!isBridgeMessage(event.data, "to-page")) return;
      callbacks.onMessage(event.data.data);
    };

    win.addEventListener("message", onMessage);

    // Opened on a microtask rather than synchronously, so a caller can finish wiring its
    // handlers before the first callback arrives.
    queueMicrotask(() => {
      if (readyState !== CONNECTING) return;
      readyState = OPEN;
      callbacks.onOpen();
    });

    const detach = (): void => {
      win.removeEventListener("message", onMessage);
    };

    return {
      get readyState() {
        return readyState;
      },
      send: (data: string) => {
        if (readyState !== OPEN) return;
        const message: BridgeMessage = { channel: BRIDGE_CHANNEL, direction: "to-panel", data };
        win.postMessage(message, "*");
      },
      close: () => {
        if (readyState === CLOSED) return;
        readyState = CLOSED;
        detach();
        callbacks.onClose();
      },
      dispose: detach,
    };
  };
}
