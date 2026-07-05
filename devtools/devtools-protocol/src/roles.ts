/**
 * @module @yoltra/devtools-protocol
 */

/**
 * Roles that a WebSocket client can assume when connecting to the DevTools hub.
 *
 * @remarks
 * Every client that opens a WebSocket to the hub must declare exactly one role
 * during the {@link HandshakeRequest}. The hub uses this role to determine
 * message routing: store messages are forwarded to extensions and vice-versa.
 *
 * @example
 * ```ts
 * import { DevtoolsRole } from "@yoltra/devtools-protocol";
 *
 * const role = DevtoolsRole.STORE;
 * ```
 *
 * @public
 */
export enum DevtoolsRole {
  /** A Yoltra store instance reporting events and state. */
  STORE = "store",
  /** A DevTools UI (browser extension, VSCode panel, CLI) consuming store data. */
  EXTENSION = "extension",
  /** The Hub server */
  HUB = "hub",
}
