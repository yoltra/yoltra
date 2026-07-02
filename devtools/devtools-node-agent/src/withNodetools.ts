/**
 * Node.js DevTools agent entry point -- the {@link withNodetools} wrapper function.
 *
 * @module @yoltra/devtools-node-agent
 */

import type { EventMapBase, InstrumentedEvent, StoreInstance } from "@yoltra/core";
import {
  DevtoolsRole,
  patchesFromChange,
  type BaseMessage,
  type StateSnapshot,
  type StoreCapabilities,
  type StoreEvent,
  type StoreMetrics,
} from "@yoltra/devtools-protocol";
import { MetricsCollector } from "./metrics-collector";
import type { DevtoolsWrapperConfig } from "./types";
import { DevtoolsWsClient } from "./ws-client";

/**
 * Wraps a Yoltra store with DevTools instrumentation for Node.js environments.
 *
 * @remarks
 * - Connects to the DevTools hub via WebSocket (using the `ws` package).
 * - Observes every event via the typed `store.instrument()` seam — no
 *   `as any` bridging, no re-diffing, no full-state clone per event.
 * - Builds precise RFC 6902 patches from the exact changed leaf paths the core
 *   reports, and sends a `STORE_EVENT` per event (committed or vetoed).
 * - Handles incoming commands: REQUEST_STATE, REQUEST_METRICS,
 *   REQUEST_SUBSCRIPTIONS, TIME_TRAVEL, EVENT_REPLAY, EMIT_TO_STORE.
 * - Returns the **same** store instance (transparent instrumentation).
 * - Auto-reconnects to the hub on disconnect.
 *
 * @typeParam R - Reducer name union.
 * @typeParam S - State record.
 * @typeParam EM - Event map.
 * @param store - The store to instrument.
 * @param config - DevTools wrapper configuration.
 * @returns The same store instance, now instrumented.
 *
 * @example
 * ```ts
 * import { createStore } from '@yoltra/core';
 * import { withNodetools } from '@yoltra/devtools-node-agent';
 *
 * const store = createStore({ name: 'App', reducer: { ... } });
 * withNodetools(store, { port: 9800 });
 * ```
 *
 * @public
 */
export function withNodetools<
  R extends string,
  S extends Record<R, any>,
  EM extends EventMapBase,
>(store: StoreInstance<R, S, EM>, config: DevtoolsWrapperConfig): StoreInstance<R, S, EM> {
  const storeId = config.storeId ?? store.name;
  const host = config.host ?? "localhost";
  const metrics = new MetricsCollector();
  let snapshotVersion = 0;

  // Counts ALL observed events including those vetoed by middleware.
  let totalAttemptedCount = 0;

  // ── Sampling state ────────────────────────────────────────────────────────
  const skipCounters = new Map<string, number>();
  const throttleLast = new Map<string, number>();

  // Build capabilities from config
  const capabilities: StoreCapabilities = {
    replay: config.allowReplay ?? false,
    stateSnapshot: true,
    subscriptionMeta: true,
    pipelineMeta: true,
    emit: config.allowEmit ?? false,
  };
  if (config.sampling) {
    capabilities.sampling = config.sampling;
  }

  // Create WS client
  const wsClient = new DevtoolsWsClient(storeId, store.name, capabilities, {
    autoReconnect: config.autoReconnect ?? true,
    maxReconnectAttempts: config.maxReconnectAttempts ?? Infinity,
    baseDelay: config.baseDelay ?? 1000,
    maxDelay: config.maxDelay ?? 30000,
  });

  // Build a BaseMessage with common fields
  const baseMsg = (): Pick<BaseMessage, "timestamp" | "sourceId" | "sourceRole"> => ({
    timestamp: new Date().toISOString(),
    sourceId: storeId,
    sourceRole: DevtoolsRole.STORE,
  });

  /**
   * Returns `true` when the event should be suppressed by the sampling config.
   * Priority order: ignore → throttle → skip.
   */
  const isSampledOut = (channel: string, type: string): boolean => {
    const sampling = capabilities.sampling;
    if (!sampling) return false;
    const eventKey = `${channel}::${type}`;
    const matches = (keys: Array<[string, string]>): boolean =>
      keys.some(([c, t]) => (c === "*" || c === channel) && (t === "*" || t === type));
    if (sampling.ignore?.some((r) => matches(r.keys))) return true;
    for (const rule of sampling.throttle ?? []) {
      if (!matches(rule.keys)) continue;
      const last = throttleLast.get(eventKey) ?? 0;
      const nowMs = Date.now();
      if (nowMs - last < rule.intervalMs) return true;
      throttleLast.set(eventKey, nowMs);
      return false;
    }
    for (const rule of sampling.skip ?? []) {
      if (!matches(rule.keys)) continue;
      const count = (skipCounters.get(eventKey) ?? 0) + 1;
      if (count < rule.every) {
        skipCounters.set(eventKey, count);
        return true;
      }
      skipCounters.set(eventKey, 0);
      return false;
    }
    return false;
  };

  // Handle incoming messages from hub
  wsClient.onMessage(async (data: string) => {
    let msg: any;
    try {
      msg = JSON.parse(data);
    } catch {
      return;
    }

    switch (msg.type) {
      case "REQUEST_STATE": {
        const state = store.getState();
        const response: StateSnapshot = {
          type: "STATE_SNAPSHOT",
          ...baseMsg(),
          storeId,
          state: JSON.parse(JSON.stringify(state)),
          version: snapshotVersion,
          reducerNames: Object.keys(state as object),
        };
        wsClient.send(JSON.stringify(response));
        break;
      }

      case "REQUEST_METRICS": {
        const introspection = store.__devtoolsIntrospect();
        const middlewareRejections = Math.max(0, totalAttemptedCount - metrics.getEventCount());
        const response: StoreMetrics = {
          type: "STORE_METRICS",
          ...baseMsg(),
          storeId,
          metrics: metrics.buildMetrics({
            reducerCount: introspection.reducers.length,
            effectCount: introspection.effects.length,
            middlewareCount: introspection.middleware.length,
            subscriberCount: introspection.event.length + introspection.coarse,
            connectorCount: introspection.atomic.length,
            dedupHits: introspection.dedupHits,
            queueDepth: introspection.queueDepth,
            middlewareRejections,
          }),
        };
        wsClient.send(JSON.stringify(response));
        break;
      }

      case "TIME_TRAVEL": {
        // Guard against malformed messages — a null state would corrupt the
        // store and cause "Cannot read property of undefined" in reducers.
        if (msg.state == null) break;

        store.__applyExternalState(msg.state);
        snapshotVersion = msg.snapshotVersion ?? snapshotVersion;

        // Notify the hub of the new state so all connected UIs re-render with
        // the time-traveled state.
        const traveledState = store.getState();
        const travelSnapshot: StateSnapshot = {
          type: "STATE_SNAPSHOT",
          ...baseMsg(),
          storeId,
          state: JSON.parse(JSON.stringify(traveledState)),
          version: snapshotVersion,
          reducerNames: Object.keys(traveledState as object),
        };
        wsClient.send(JSON.stringify(travelSnapshot));
        break;
      }

      case "EVENT_REPLAY": {
        if (capabilities.replay) {
          store.__replayEvents(msg.snapshot, msg.events);
        }
        break;
      }

      case "EMIT_TO_STORE": {
        if (capabilities.emit && msg.event) {
          await store.emit(msg.event.channel, msg.event.type, msg.event.payload);
        }
        break;
      }

      case "REQUEST_SUBSCRIPTIONS": {
        const introspection = store.__devtoolsIntrospect();
        const response = {
          type: "STORE_SUBSCRIPTIONS",
          ...baseMsg(),
          storeId,
          atomic: introspection.atomic,
          event: introspection.event,
          coarse: introspection.coarse,
          effects: introspection.effects,
          middleware: introspection.middleware,
          reducers: introspection.reducers,
        };
        wsClient.send(JSON.stringify(response));
        break;
      }
    }
  });

  // Observe every event through the typed instrumentation seam. This single
  // observer replaces the old interceptor effect + metrics middleware + manual
  // diff + full-state clone: the core hands us the exact changed leaf paths and
  // their old/new values (and the real reduce time), so we build precise patches
  // with no re-diff.
  store.instrument((info: InstrumentedEvent<EM>) => {
    totalAttemptedCount++;
    if (info.committed) {
      metrics.recordEvent(info.reduceTimeMs);
    }

    if (isSampledOut(info.event.channel, info.event.type)) return;

    snapshotVersion++;
    const storeEvent: StoreEvent = {
      type: "STORE_EVENT",
      ...baseMsg(),
      storeId,
      event: {
        id: info.event.id,
        channel: info.event.channel,
        type: info.event.type,
        payload: info.event.payload,
      },
      patches: info.committed
        ? patchesFromChange(info.changedPaths, info.prevValues, info.nextValues)
        : [],
      snapshotVersion,
      committed: info.committed,
    };
    wsClient.send(JSON.stringify(storeEvent));
  });

  // Connect to hub
  wsClient.connect(host, config.port);

  // Return the same store (transparent instrumentation)
  return store;
}
