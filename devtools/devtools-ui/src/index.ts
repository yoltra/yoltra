/**
 * @module @yoltra/devtools-ui
 *
 * Shared React hooks and business logic for Yoltra DevTools UIs.
 * Used by both `@yoltra/devtools-storeview` (React DOM) and `@yoltra/devtools-cli` (Ink).
 * This package contains no UI components — only logic.
 */

// Context
export { HubContext } from "./context/HubContext";
export { HubProvider } from "./context/HubProvider";

// Hooks
export { useEventEmitter } from "./hooks/useEventEmitter";
export { useEventLog } from "./hooks/useEventLog";
export { useEventReplay } from "./hooks/useEventReplay";
export { useHubConnection } from "./hooks/useHubConnection";
export { useStoreMetrics } from "./hooks/useStoreMetrics";
export { useStoreRegistry } from "./hooks/useStoreRegistry";
export { useStoreState } from "./hooks/useStoreState";
export { useStoreSubscriptions } from "./hooks/useStoreSubscriptions";
export { useTimeTravel } from "./hooks/useTimeTravel";

// Utilities
export { applyPatches } from "./utils/apply-patch";

// In-memory loopback transport (embed the agent + hub + panel in one process)
export { createLoopbackHub } from "./transport/loopback";
export type { LoopbackHub } from "./transport/loopback";

// Types
export type {
  EventLogEntry,
  HubConnectionConfig,
  HubConnectionStatus,
  HubContextValue,
  RegisteredStore,
} from "./types";

export type { UseEventLogOptions } from "./hooks/useEventLog";
export type { UseStoreMetricsOptions } from "./hooks/useStoreMetrics";
