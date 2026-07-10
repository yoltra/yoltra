/**
 * @module @yoltra/devtools-node-agent
 *
 * Node.js store wrapper for Yoltra DevTools.
 * Connects a Yoltra store to the DevTools hub via WebSocket (ws package).
 */

export type { DevtoolsWrapperConfig } from "./types";
export { withNodetools } from "./withNodetools";
