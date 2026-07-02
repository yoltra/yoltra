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
   * Persisted store identifier that survives reconnects.
   *
   * @remarks
   * If omitted a random UUID is generated via `crypto.randomUUID()`.
   * Providing a stable ID lets the hub correlate a store across restarts.
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
   * {@link @yoltra/core#StoreInstance.emit | store.emit()} on behalf of a
   * connected extension.
   *
   * @defaultValue `false`
   */
  allowEmit?: boolean;
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
   * Sampling configuration defined by the DevTools protocol.
   *
   * @remarks
   * Part of the protocol v1 design; actual enforcement is deferred.
   * See {@link @yoltra/devtools-protocol#SamplingConfig} for shape details.
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
