/**
 * @module @yoltra/devtools-node-agent
 */

import type { SamplingConfig } from "@yoltra/devtools-protocol";

/**
 * Configuration for the Node.js DevTools store wrapper.
 *
 * @remarks
 * Passed to {@link withNodetools} to control how the store connects to the
 * DevTools hub. The only required field is {@link DevtoolsWrapperConfig.port | port};
 * everything else has sensible defaults.
 *
 * @example
 * ```ts
 * import { withNodetools } from '@yoltra/devtools-node-agent';
 *
 * withNodetools(store, {
 *   port: 9800,
 *   host: 'localhost',
 *   allowReplay: true,
 *   throttleMs: 100,
 * });
 * ```
 *
 * @public
 */
export interface DevtoolsWrapperConfig {
  /** Hub server hostname or IP address. @defaultValue `"localhost"` */
  host?: string;
  /** Hub server port number. Required -- there is no default. */
  port: number;
  /**
   * Store identifier presented to the hub, kept across reconnects.
   *
   * @remarks
   * Defaults to the store's `name`, so it is stable across restarts without configuration.
   *
   * The hub accepts one connection per id. A store presenting an id that is already connected is
   * refused with a handshake error naming the id, and keeps retrying until the first store
   * disconnects. Two stores with the same `name` therefore need distinct `storeId` values to be
   * inspected side by side.
   */
  storeId?: string;
  /**
   * Enable event replay capability.
   *
   * @remarks
   * Both the store and the DevTools hub must agree on replay support.
   * When `true`, the hub may send `EVENT_REPLAY` commands to this store.
   *
   * @defaultValue `false`
   */
  allowReplay?: boolean;
  /**
   * Allow DevTools extensions to emit events into this store.
   *
   * @remarks
   * When `true`, the hub may send `EMIT_TO_STORE` commands which call
   * {@link @yoltra/core!StoreInstance.emit | store.emit()} on behalf of a
   * connected extension.
   *
   * @defaultValue `false`
   */
  allowEmit?: boolean;

  /**
   * Shared secret required by a hub that was started with one.
   *
   * @remarks
   * A hub running without a token accepts any local connection, so on a shared or containerised
   * host it should be started with one and every agent given the same value. Omit on a
   * developer machine, where the hub warns at startup that it is open.
   */
  authToken?: string;

  /**
   * Byte budget for a state snapshot before parts of it are omitted.
   *
   * @remarks
   * The hub refuses a frame over its cap and drops the connection, so an oversized snapshot did
   * not surface as an error — the socket closed, the client reconnected and asked again, and the
   * panel waited through the loop. Snapshots are bounded here instead, and a shortened one says
   * so rather than presenting a partial tree as the state.
   *
   * @defaultValue 6291456 (6 MiB, under the hub's 8 MiB frame cap)
   */
  maxSnapshotBytes?: number;

  /**
   * Byte cap for a single event payload or patch value.
   *
   * @remarks
   * Separate from, and far below, {@link maxSnapshotBytes}: events are frequent and a
   * snapshot is not. An oversized frame is answered by the hub closing the socket, not by
   * dropping the message, so one large emit used to end the session.
   *
   * @defaultValue 524288 (512 KiB)
   */
  maxEventBytes?: number;
  /**
   * Redacts a value before it leaves the process.
   *
   * @remarks
   * Store state and event payloads frequently hold tokens, session material and personal
   * data, and everything the agent forwards crosses a socket to another process. The hook is
   * applied to **every value the agent encodes** — state snapshots, time-travel snapshots,
   * event payloads and state patches — so nothing crosses unredacted. Return the replacement
   * value, or the value itself to keep it.
   *
   * The `path` is the location within the structure being encoded (for a snapshot, from the
   * state root; for a payload, from the payload root), so a recipe that matches key names
   * covers all of them:
   *
   * ```ts
   * const sanitize = (path: string, value: unknown) =>
   *   /token|secret|password|authorization/i.test(path) ? "[redacted]" : value;
   * withNodetools(store, { port: 9800, sanitize });
   * ```
   *
   * Omitted, nothing is redacted — fine for a laptop loop, not fine for a service whose
   * state a hub on another machine can ask for.
   */
  sanitize?: (path: string, value: unknown) => unknown;
  /**
   * Throttle interval for DevTools updates (milliseconds).
   *
   * @remarks
   * `0` disables throttling (every event is forwarded immediately).
   * A positive value batches updates within the given window.
   *
   * @defaultValue `0`
   */
  throttleMs?: number;
  /**
   * Which events the agent forwards to the hub.
   *
   * @remarks
   * Applied by the agent before an event is sent, in this order: `ignore` drops every matching
   * event; the first matching `throttle` rule forwards at most one event per `intervalMs` for each
   * event key; the first matching `skip` rule forwards every `every`th one. `"*"` in a key matches
   * any channel or any type. The store itself still processes every event; only what the hub sees
   * changes, so its timeline, and any state it rebuilds from events, misses the ones dropped. Also
   * advertised to the hub as part of the store's capabilities. See
   * {@link @yoltra/devtools-protocol!SamplingConfig} for the shape.
   */
  sampling?: SamplingConfig;
  /** Whether to automatically reconnect after an unexpected disconnect. @defaultValue `true` */
  autoReconnect?: boolean;
  /** Maximum number of reconnection attempts before giving up. @defaultValue `Infinity` */
  maxReconnectAttempts?: number;
  /** Base delay (ms) for exponential backoff between reconnection attempts. @defaultValue `1000` */
  baseDelay?: number;
  /** Maximum delay cap (ms) for exponential backoff. @defaultValue `30000` */
  maxDelay?: number;
}
