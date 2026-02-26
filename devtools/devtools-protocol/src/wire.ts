/**
 * @module @yoltra/devtools-protocol
 */

import type { DevtoolsRole } from "./roles";

/**
 * Base structure shared by all DevTools protocol messages.
 *
 * @remarks
 * Every message sent over the DevTools WebSocket extends this interface.
 * The `type` field acts as a discriminant for the {@link DevtoolsMessage}
 * union, enabling exhaustive `switch` routing on the receiving side.
 *
 * @public
 */
export interface BaseMessage {
  /** Discriminant field identifying the message type. */
  type: string;
  /** ISO 8601 timestamp of when the message was created. */
  timestamp: string;
  /** UUID of the sender (store wrapper ID or extension ID). */
  sourceId: string;
  /** Role of the sender. */
  sourceRole: DevtoolsRole;
}
