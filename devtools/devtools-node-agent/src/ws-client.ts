/**
 * Node.js WebSocket transport for the DevTools agent.
 *
 * @remarks
 * Injects the `ws` package into the shared, transport-agnostic
 * {@link ReconnectingWsClient} from `@yoltra/devtools-protocol`. The `ws`
 * dependency lives here and only here — the browser agent never sees it.
 *
 * @module @yoltra/devtools-node-agent
 */

import {
  ReconnectingWsClient,
  type DevtoolsSocketFactory,
  type ReconnectingWsConfig,
  type StoreCapabilities,
} from "@yoltra/devtools-protocol";
import { WebSocket } from "ws";

export type { ConnectionState } from "@yoltra/devtools-protocol";

/** Opens a `ws` WebSocket and adapts it to the shared transport. */
const nodeSocketFactory: DevtoolsSocketFactory = (url, callbacks) => {
  const ws = new WebSocket(url);
  ws.on("open", () => callbacks.onOpen());
  ws.on("message", (data: Buffer | ArrayBuffer | Buffer[]) => callbacks.onMessage(data.toString()));
  ws.on("close", () => callbacks.onClose());
  ws.on("error", () => callbacks.onError());
  return {
    get readyState() {
      return ws.readyState;
    },
    send: (data) => ws.send(data),
    close: (code, reason) => ws.close(code, reason),
    dispose: () => ws.removeAllListeners(),
  };
};

/**
 * Node.js DevTools WebSocket client (`ws` package transport).
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
    super(storeId, storeName, capabilities, config, nodeSocketFactory);
  }
}
