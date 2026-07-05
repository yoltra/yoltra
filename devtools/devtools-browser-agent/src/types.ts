/**
 * Configuration types for the browser DevTools agent.
 *
 * @module @yoltra/devtools-browser-agent
 */

import type { SamplingConfig } from "@yoltra/devtools-protocol";

/**
 * Configuration for the browser DevTools store wrapper ({@link withDevtools}).
 *
 * @remarks
 * Controls how the browser agent connects to the DevTools hub, which
 * capabilities it advertises (replay, emit), and reconnection behaviour.
 * All fields except {@link port} are optional and have sensible defaults.
 *
 * @example
 * ```ts
 * const config: DevtoolsWrapperConfig = {
 *   port: 9800,
 *   host: 'localhost',
 *   allowReplay: true,
 *   autoReconnect: true,
 * };
 * ```
 *
 * @public
 */
export interface DevtoolsWrapperConfig {
  /**
   * Hub server host.
   * @defaultValue `"localhost"`
   */
  host?: string;

  /**
   * Hub server port. Required.
   */
  port: number;

  /**
   * Persisted store identifier that survives reconnects.
   *
   * @remarks
   * When omitted a random UUID is generated via `crypto.randomUUID()`.
   * Provide an explicit value to correlate store sessions across page reloads.
   */
  storeId?: string;

  /**
   * Enable event replay capability.
   *
   * @remarks
   * When `true`, the hub may send `EVENT_REPLAY` commands to this store.
   * The store must also support replay internally.
   *
   * @defaultValue `false`
   */
  allowReplay?: boolean;

  /**
   * Allow DevTools extensions to emit events to this store.
   *
   * @remarks
   * When `true`, the hub may send `EMIT_TO_STORE` commands containing
   * arbitrary events that will be dispatched via `store.emit()`.
   *
   * @defaultValue `false`
   */
  allowEmit?: boolean;

  /**
   * Throttle interval for DevTools updates (ms). `0` disables throttling.
   * @defaultValue `0`
   */
  throttleMs?: number;

  /**
   * Sampling configuration (protocol v1 design, implementation deferred).
   *
   * @remarks
   * When provided, advertised to the hub as part of the store's capabilities.
   */
  sampling?: SamplingConfig;

  /**
   * Automatically reconnect to the hub on disconnect.
   * @defaultValue `true`
   */
  autoReconnect?: boolean;

  /**
   * Maximum number of reconnection attempts before giving up.
   * @defaultValue `Infinity`
   */
  maxReconnectAttempts?: number;

  /**
   * Base delay for exponential reconnection backoff (ms).
   * @defaultValue `1000`
   */
  baseDelay?: number;

  /**
   * Maximum delay cap for reconnection backoff (ms).
   * @defaultValue `30000`
   */
  maxDelay?: number;
}
