/**
 * @module @yoltra/devtools-protocol
 *
 * Protocol types, message definitions, and utilities for the Yoltra DevTools suite.
 * This package defines the shared vocabulary used by hub, store wrappers, and extensions.
 */

// Version
export { PROTOCOL_VERSION } from "./version";

// Roles
export { DevtoolsRole } from "./roles";

// Capabilities
export type {
    ExtensionCapabilities,
    HubCapabilities,
    SamplingConfig,
    StoreCapabilities
} from "./capabilities";

// Handshake
export type { HandshakeRequest, HandshakeResponse } from "./handshake";

// JSON Patch (RFC 6902)
export type { JsonPatch, JsonPatchOp } from "./json-patch";

// Messages
export type {
    DevtoolsMessage,
    EmitToStore,
    EventReplay,
    RequestMetrics,
    RequestState,
    RequestSubscriptions,
    StateSnapshot,
    StoreConnected,
    StoreDisconnected,
    StoreEvent,
    StoreMetrics,
    StoreRegistry,
    StoreSubscriptions,
    TimeTravel
} from "./messages";

// Wire
export type { BaseMessage } from "./wire";

// Utilities
export { computePatches, patchesFromChange, getAtPath } from "./patch-utils";

// The state codec moved to `@yoltra/core`. It serializes store state, which is a core
// concept, and persistence needs the same one — a serialization format with two
// implementations is one that will eventually disagree with itself. Re-exporting it from
// here would mean this package depending on core, and it is deliberately a leaf with no
// dependencies at all.

// Transport (reconnecting client with an injected socket — each agent supplies
// its own WebSocket implementation, so this stays free of `ws` / browser globals)
export { ReconnectingWsClient, WS_OPEN, WS_CONNECTING } from "./ws-transport";
export type {
  ConnectionState,
  DevtoolsSocketCallbacks,
  DevtoolsSocketHandle,
  DevtoolsSocketFactory,
  ReconnectingWsConfig,
} from "./ws-transport";
