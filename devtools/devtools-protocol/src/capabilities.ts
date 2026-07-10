/**
 * @module @yoltra/devtools-protocol
 */

/**
 * Sampling configuration for event throttling/filtering.
 *
 * @remarks
 * Protocol-level design for v1. Implementation deferred to post-v1.
 * Configured in the store wrapper and communicated via handshake.
 * Each rule targets events by composite key (`[channel, type]` tuples).
 *
 * @public
 */
export interface SamplingConfig {
  /** Throttle: at most 1 update per intervalMs for specified event keys. */
  throttle?: Array<{ keys: Array<[string, string]>; intervalMs: number }>;
  /** Skip-N: send every Nth event for specified keys. */
  skip?: Array<{ keys: Array<[string, string]>; every: number }>;
  /** Ignore: never send events matching these keys. */
  ignore?: Array<{ keys: Array<[string, string]> }>;
}

/**
 * Capabilities advertised by a store during handshake.
 *
 * @remarks
 * Included in the `store` field of a {@link HandshakeRequest}. Extensions
 * inspect these flags to determine which features they can offer for a
 * given store (e.g., disabling the time-travel UI when `replay` is `false`).
 *
 * @public
 */
export interface StoreCapabilities {
  /** Whether the store supports `__replayEvents`. */
  replay: boolean;
  /** Whether the store can provide full state snapshots on demand. */
  stateSnapshot: boolean;
  /** Extension shares Subscription metadata */
  subscriptionMeta: boolean;
  /** Extension offers metadata.
   *
   *  Metadata shared:
   *  - middleware
   *  - reducer
   *  - effects
   *  - event subs */
  pipelineMeta: boolean;
  /** Whether extensions can emit events to this store. */
  emit: boolean;
  /** Sampling configuration (protocol v1 design, implementation deferred). */
  sampling?: SamplingConfig;
}

/**
 * Capabilities advertised by an extension during handshake.
 *
 * @remarks
 * Included in the `extension` field of a {@link HandshakeRequest}. The hub
 * may use these flags to filter forwarded messages (e.g., skipping metrics
 * broadcasts to extensions that set `performanceMetrics: false`).
 *
 * @public
 */
export interface ExtensionCapabilities {
  /** Extension supports time-travel (state-only replay). */
  timeTravel: boolean;
  /** Extension supports event replay (reducer-only replay). */
  eventReplay: boolean;
  /** Extension has a state tree explorer. */
  stateExplorer: boolean;
  /** Extension can emit events to stores. */
  eventEmit: boolean;
  /** Extension can display performance metrics. */
  performanceMetrics: boolean;
}

/**
 * Capabilities advertised by the hub during handshake response.
 *
 * @remarks
 * Returned inside the {@link HandshakeResponse}. Extensions and stores can
 * use these values to adapt their behaviour (e.g., limiting local history
 * buffers to `maxHistorySize`).
 *
 * @public
 */
export interface HubCapabilities {
  /** Maximum number of events kept in the ring buffer. */
  maxHistorySize: number;
  /** Feature flags supported by this hub version. */
  supportedFeatures: string[];
}
