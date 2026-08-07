/**
 * @module @yoltra/devtools-browser-agent
 *
 * Browser store wrapper for Yoltra DevTools.
 * Connects a Yoltra store to the DevTools panel — over a `postMessage` bridge when an extension
 * is relaying, or over a WebSocket to a hub.
 */

export type { DevtoolsWrapperConfig } from "./types";
export { withDevtools } from "./withDevtools";

/** `postMessage` transport, for attaching without a hub process. */
export {
  createPostMessageSocketFactory,
  isBridgeMessage,
  BRIDGE_CHANNEL,
} from "./postMessage-client";
export type { BridgeDirection, BridgeMessage, BridgeWindow } from "./postMessage-client";
