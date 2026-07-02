/**
 * Browser WebSocket transport for the DevTools agent.
 *
 * @remarks
 * Injects the native browser `WebSocket` into the shared, transport-agnostic
 * {@link ReconnectingWsClient} from `@yoltra/devtools-protocol`. There is **no**
 * `ws` dependency here — that is what keeps this package installable in the
 * browser without pulling in a Node-only transport.
 *
 * @module @yoltra/devtools-browser-agent
 */

import {
  ReconnectingWsClient,
  type DevtoolsSocketFactory,
  type ReconnectingWsConfig,
  type StoreCapabilities,
} from "@yoltra/devtools-protocol";

export type { ConnectionState } from "@yoltra/devtools-protocol";

/** Opens a native browser WebSocket and adapts it to the shared transport. */
const browserSocketFactory: DevtoolsSocketFactory = (url, callbacks) => {
  const ws = new WebSocket(url);
  ws.onopen = () => callbacks.onOpen();
  ws.onmessage = (ev: MessageEvent) =>
    callbacks.onMessage(typeof ev.data === "string" ? ev.data : String(ev.data));
  ws.onclose = () => callbacks.onClose();
  ws.onerror = () => callbacks.onError();
  return {
    get readyState() {
      return ws.readyState;
    },
    send: (data) => ws.send(data),
    close: (code, reason) => ws.close(code, reason),
    dispose: () => {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onclose = null;
      ws.onerror = null;
    },
  };
};

/**
 * Browser DevTools WebSocket client (native `WebSocket` transport).
 *
 * @internal
 */
export class DevtoolsWsClient extends ReconnectingWsClient {
  constructor(
    storeId: string,
    storeName: string,
    capabilities: StoreCapabilities,
    config: ReconnectingWsConfig,
  ) {
    super(storeId, storeName, capabilities, config, browserSocketFactory);
  }
}
