/**
 * @module @yoltra/devtools-protocol
 */

import type { StoreCapabilities } from "./capabilities";
import type { HandshakeRequest, HandshakeResponse } from "./handshake";
import type { JsonPatch } from "./json-patch";
import type { BaseMessage } from "./wire";

// ─── Store → Hub → Extensions ────────────────────────────────────────

/**
 * Broadcast when a store connects to the hub.
 *
 * @remarks
 * Sent by the hub to all connected extensions after a store completes
 * its handshake. Extensions should add the store to their local registry
 * and may immediately follow up with a {@link RequestState}.
 *
 * @public
 */
export interface StoreConnected extends BaseMessage {
  type: "STORE_CONNECTED";
  store: {
    id: string;
    name: string;
    capabilities: StoreCapabilities;
  };
}

/**
 * Broadcast when a store disconnects from the hub.
 *
 * @remarks
 * The hub sends this to all extensions when a store's WebSocket closes
 * (gracefully or due to error). The optional `reason` field carries
 * a human-readable explanation when available.
 *
 * @public
 */
export interface StoreDisconnected extends BaseMessage {
  type: "STORE_DISCONNECTED";
  storeId: string;
  reason?: string;
}

/**
 * An event emitted by a store, forwarded to extensions.
 *
 * @remarks
 * This is the primary data-flow message. Each `StoreEvent` carries the
 * original event payload plus an array of {@link JsonPatch} operations
 * describing the resulting state delta. Extensions can apply the patches
 * incrementally or request a full {@link StateSnapshot} when needed.
 *
 * @public
 */
export interface StoreEvent extends BaseMessage {
  type: "STORE_EVENT";
  storeId: string;
  event: {
    id: string;
    channel: string;
    type: string;
    payload: unknown;
  };
  /** RFC 6902 JSON Patch operations describing state changes. */
  patches: JsonPatch[];
  /** Monotonically increasing snapshot version counter. */
  snapshotVersion: number;
  /** `true` if the event passed middleware; `false` if bounced. */
  committed: boolean;
}

/**
 * Full state snapshot, sent in response to {@link RequestState}.
 *
 * @remarks
 * Contains the complete serialized state tree at a specific version.
 * Extensions use this to hydrate their local state representation or
 * to re-sync after reconnection. The `reducerNames` array lists all
 * registered reducer slices for UI display.
 *
 * @public
 */
export interface StateSnapshot extends BaseMessage {
  type: "STATE_SNAPSHOT";
  storeId: string;
  /** Full serialized state tree. */
  state: unknown;
  /** Snapshot version matching the latest event's `snapshotVersion`. */
  version: number;
  /** List of reducer slice names. */
  reducerNames: string[];
}

/**
 * Store performance metrics.
 *
 * @remarks
 * Sent by a store in response to {@link RequestMetrics}. The counters
 * cover the lifetime of the store instance and reset on reload.
 * Extensions with `performanceMetrics: true` can poll these periodically
 * to render real-time dashboards.
 *
 * @public
 */
export interface StoreMetrics extends BaseMessage {
  type: "STORE_METRICS";
  storeId: string;
  metrics: {
    eventCount: number;
    eventsPerSecond: number;
    avgProcessingTimeMs: number;
    reducerCount: number;
    effectCount: number;
    middlewareCount: number;
    subscriberCount: number;
    connectorCount: number;
    dedupHits: number;
    middlewareRejections: number;
    queueDepth: number;
  };
}

/**
 * Store subscription and consumer info.
 *
 * @remarks
 * Sent by a store in response to {@link RequestSubscriptions}. Provides a
 * complete inventory of all registered reducers, effects, middleware, and
 * active subscriptions (atomic, event, and coarse). Extensions use this
 * data to render dependency graphs and subscription explorers.
 *
 * @public
 */
export interface StoreSubscriptions extends BaseMessage {
  type: "STORE_SUBSCRIPTIONS";
  storeId: string;
  /** Fine-grained (connect) subscriptions. */
  atomic: Array<{
    reducer: string;
    property: string;
  }>;
  /** Event subscriptions (onEvent). */
  event: Array<{
    channel: string;
    type: string;
    phase: string;
  }>;
  /** Count of coarse subscribers. */
  coarse: number;
  /** Registered effects. */
  effects: Array<{
    channel: string;
    type: string;
    name?: string;
    description?: string;
  }>;
  /** Registered middleware. */
  middleware: Array<{
    name?: string;
    description?: string;
    when?: unknown;
  }>;
  /** Registered reducers. */
  reducers: Array<{
    name: string;
    when?: unknown;
    meta?: unknown;
  }>;
}

// ─── Extension → Hub → Store ─────────────────────────────────────────

/**
 * Request a full state snapshot from a store.
 *
 * @remarks
 * Sent by an extension to the hub, which forwards it to the targeted
 * store. The store responds with a {@link StateSnapshot}. An optional
 * `version` field can request a specific historical snapshot when
 * the store supports it.
 *
 * @public
 */
export interface RequestState extends BaseMessage {
  type: "REQUEST_STATE";
  storeId: string;
  /** Optional: request a specific snapshot version. */
  version?: number;
}

/**
 * Request subscription and consumer info from a store.
 *
 * @public
 */
export interface RequestSubscriptions extends BaseMessage {
  type: "REQUEST_SUBSCRIPTIONS";
  storeId: string;
}

/**
 * Request performance metrics from a store.
 *
 * @public
 */
export interface RequestMetrics extends BaseMessage {
  type: "REQUEST_METRICS";
  storeId: string;
}

/**
 * Time travel: jump a store to a specific state.
 *
 * @remarks
 * Sent by an extension to restore a store to a previously captured state.
 * The store calls its internal `__applyExternalState` method, which replaces
 * the entire state tree and notifies all subscribers. This requires
 * {@link StoreCapabilities.replay | replay} capability on the store and
 * {@link ExtensionCapabilities.timeTravel | timeTravel} on the extension.
 *
 * @public
 */
export interface TimeTravel extends BaseMessage {
  type: "TIME_TRAVEL";
  storeId: string;
  /** Full state to apply via `__applyExternalState`. */
  state: unknown;
  /** Snapshot version being jumped to. */
  snapshotVersion: number;
}

/**
 * Replay events from a snapshot through reducers only.
 *
 * @remarks
 * Unlike {@link TimeTravel}, this re-processes events through the
 * store's reducers without triggering effects or middleware. Useful
 * for debugging reducer logic in isolation. Requires
 * {@link StoreCapabilities.replay | replay} on the store and
 * {@link ExtensionCapabilities.eventReplay | eventReplay} on the extension.
 *
 * @public
 */
export interface EventReplay extends BaseMessage {
  type: "EVENT_REPLAY";
  storeId: string;
  /** Starting state to apply before replaying. */
  snapshot: unknown;
  /** Events to replay in order. */
  events: Array<{
    id: string;
    channel: string;
    type: string;
    payload: unknown;
  }>;
}

/**
 * Emit an event to a store from an extension.
 *
 * @remarks
 * Allows extensions to inject synthetic events into a store's pipeline.
 * The event goes through the full middleware and reducer chain.
 * Requires {@link StoreCapabilities.emit | emit} on the target store
 * and {@link ExtensionCapabilities.eventEmit | eventEmit} on the extension.
 *
 * @public
 */
export interface EmitToStore extends BaseMessage {
  type: "EMIT_TO_STORE";
  storeId: string;
  event: {
    channel: string;
    type: string;
    payload: unknown;
  };
}

// ─── Hub → Extensions (broadcast) ────────────────────────────────────

/**
 * Registry of all connected stores, sent to extensions on connect
 * and whenever the registry changes.
 *
 * @remarks
 * This is a full replacement snapshot -- not a diff. Extensions should
 * replace their local store list entirely when they receive this message.
 * Each entry includes connection status and capabilities for UI rendering.
 *
 * @public
 */
export interface StoreRegistry extends BaseMessage {
  type: "STORE_REGISTRY";
  stores: Array<{
    id: string;
    name: string;
    status: "connected" | "connecting" | "disconnected";
    capabilities: StoreCapabilities;
    connectedAt: string;
  }>;
}

// ─── Discriminated union ─────────────────────────────────────────────

/**
 * Union of all DevTools protocol messages.
 * Discriminated on the `type` field for type-safe routing.
 *
 * @remarks
 * Use a `switch` statement on the `type` field for exhaustive handling:
 *
 * @example
 * ```ts
 * import type { DevtoolsMessage } from "@yoltra/devtools-protocol";
 *
 * function handle(msg: DevtoolsMessage) {
 *   switch (msg.type) {
 *     case "STORE_EVENT":
 *       console.log(msg.patches);
 *       break;
 *     case "STATE_SNAPSHOT":
 *       console.log(msg.state);
 *       break;
 *     // ... remaining cases
 *   }
 * }
 * ```
 *
 * @public
 */
export type DevtoolsMessage =
  | HandshakeRequest
  | HandshakeResponse
  | StoreConnected
  | StoreDisconnected
  | StoreEvent
  | StateSnapshot
  | StoreMetrics
  | StoreSubscriptions
  | RequestState
  | RequestSubscriptions
  | RequestMetrics
  | TimeTravel
  | EventReplay
  | EmitToStore
  | StoreRegistry;
