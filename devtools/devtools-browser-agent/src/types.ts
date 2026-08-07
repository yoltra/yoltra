/**
 * Configuration types for the browser DevTools agent.
 *
 * @module @yoltra/devtools-browser-agent
 */

import type { DevtoolsSocketFactory, SamplingConfig } from "@yoltra/devtools-protocol";

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
   * withDevtools(store, { port: 9800, sanitize });
   * ```
   *
   * Omitted, nothing is redacted — fine for a laptop loop, not fine for an embedded panel in
   * production or on a shared machine.
   */
  sanitize?: (path: string, value: unknown) => unknown;

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

  /**
   * Custom socket factory (advanced). By default the agent opens a native
   * browser `WebSocket`. Inject a different transport — e.g. an in-memory
   * loopback for an embedded panel or a test — to connect the agent without a
   * real network socket.
   * @defaultValue the native browser WebSocket factory
   */
  socketFactory?: DevtoolsSocketFactory;

  /**
   * How the agent reaches the panel.
   *
   * @remarks
   * - `"auto"` (the default) uses the `postMessage` bridge when an extension has announced
   *   itself on the page, and a WebSocket to the hub otherwise. This is what makes attaching a
   *   browser panel a single step — install the extension — instead of three.
   * - `"bridge"` forces `postMessage`, for a relay that installs after the store is created.
   * - `"websocket"` forces the hub, which is what a Node process or a remote session needs.
   *
   * Ignored when `socketFactory` is supplied: an explicit transport is always honoured.
   *
   * @defaultValue `"auto"`
   */
  transport?: "auto" | "bridge" | "websocket";
}
