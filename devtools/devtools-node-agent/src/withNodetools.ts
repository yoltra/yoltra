/**
 * Node.js DevTools agent entry point -- the {@link withNodetools} wrapper function.
 *
 * @module @yoltra/devtools-node-agent
 */

import type { EventMapBase, StoreInstance } from "@yoltra/core";
import {
  DevtoolsRole,
  computePatches,
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
 * - Intercepts ALL events via a `when: { any: true }` effect.
 * - Computes JSON Patch diffs and sends `STORE_EVENT` messages to the hub.
 * - Handles incoming commands: REQUEST_STATE, TIME_TRAVEL, EVENT_REPLAY, EMIT_TO_STORE.
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

  // Counts ALL attempted events including those rejected by middleware.
  let totalAttemptedCount = 0;

  // Deep clone state for diff tracking (JSON round-trip handles frozen objects)
  let prevState: any = JSON.parse(JSON.stringify(store.getState()));

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
      const now = Date.now();
      if (now - last < rule.intervalMs) return true;
      throttleLast.set(eventKey, now);
      return false;
    }
    for (const rule of sampling.skip ?? []) {
      if (!matches(rule.keys)) continue;
      const count = (skipCounters.get(eventKey) ?? 0) + 1;
      if (count < rule.every) { skipCounters.set(eventKey, count); return true; }
      skipCounters.set(eventKey, 0);
      return false;
    }
    return false;
  };

  // Simple shallow diff — avoids ESM-incompatible require() calls into @yoltra/core.
  const shallowDiff = (a: any, b: any): string[] => {
    if (a === b) return [];
    const paths: string[] = [];
    const keys = new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})]);
    for (const k of keys) {
      if (a?.[k] !== b?.[k]) paths.push(k);
    }
    return paths;
  };

  /*
   * Pass-through counting middleware.
   * Always returns true (never rejects) but increments totalAttemptedCount
   * for every dispatched event, enabling accurate middlewareRejections tracking.
   */
  (store as any).registerMiddleware?.({
    when: { any: true },
    middleware: () => { totalAttemptedCount++; return true; },
    meta: {
      type: "middleware",
      name: "__devtools_metrics_counter",
      description: "DevTools metrics counter (auto-registered by withNodetools)",
    },
  });

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
          reducerNames: Object.keys(state),
        };
        wsClient.send(JSON.stringify(response));
        break;
      }

      case "REQUEST_METRICS": {
        const introspection = (store as any).__devtoolsIntrospect();
        const middlewareRejections = Math.max(0, totalAttemptedCount - metrics.getEventCount());
        const response: StoreMetrics = {
          type: "STORE_METRICS",
          ...baseMsg(),
          storeId,
          metrics: metrics.buildMetrics({
            reducerCount: introspection.reducers.length,
            effectCount: introspection.effects.filter(
              (e: any) => e.name !== "__devtools_interceptor",
            ).length,
            middlewareCount: introspection.middleware.filter(
              (m: any) => m.name !== "__devtools_metrics_counter",
            ).length,
            subscriberCount: introspection.event.length + introspection.coarse,
            connectorCount: introspection.atomic.length,
            dedupHits: introspection.dedupHits ?? 0,
            queueDepth: (store as any).eventQueue?.length ?? 0,
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

        (store as any).__applyExternalState(msg.state);
        prevState = JSON.parse(JSON.stringify(store.getState()));
        snapshotVersion = msg.snapshotVersion ?? snapshotVersion;

        // Notify the hub of the new state so all connected UIs re-render
        // with the time-traveled state.
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
          (store as any).__replayEvents(msg.snapshot, msg.events);
          prevState = JSON.parse(JSON.stringify(store.getState()));
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
        const introspection = (store as any).__devtoolsIntrospect();
        const effects = introspection.effects.filter(
          (e: any) => e.name !== "__devtools_interceptor",
        );
        const middleware = introspection.middleware.filter(
          (m: any) => m.name !== "__devtools_metrics_counter",
        );
        const response = {
          type: "STORE_SUBSCRIPTIONS",
          ...baseMsg(),
          storeId,
          atomic: introspection.atomic,
          event: introspection.event,
          coarse: introspection.coarse,
          effects,
          middleware,
          reducers: introspection.reducers,
        };
        wsClient.send(JSON.stringify(response));
        break;
      }
    }
  });

  // Register effect to intercept ALL events
  store.registerEffect({
    when: { any: true },
    effect: (event: { channel: string; type: string; payload: any }, getState: () => any) => {
      const startTime = Date.now();
      const nextState = getState() as any;

      // Compute patches from changed paths
      const changedPaths: string[] = [];
      for (const sliceKey of Object.keys(nextState)) {
        const slicePaths = shallowDiff(prevState[sliceKey], nextState[sliceKey]);
        for (const p of slicePaths) {
          changedPaths.push(p ? `${sliceKey}.${p}` : sliceKey);
        }
      }

      const patches = computePatches(prevState, nextState, changedPaths);
      snapshotVersion++;

      const storeEvent: StoreEvent = {
        type: "STORE_EVENT",
        ...baseMsg(),
        storeId,
        event: {
          id: (event as any).id,
          channel: event.channel as string,
          type: event.type as string,
          payload: event.payload,
        },
        patches,
        snapshotVersion,
        committed: true,
      };

      if (!isSampledOut(event.channel as string, event.type as string)) {
        wsClient.send(JSON.stringify(storeEvent));
      }

      prevState = JSON.parse(JSON.stringify(nextState));
      metrics.recordEvent(Date.now() - startTime);
    },
    meta: {
      type: "effect",
      name: "__devtools_interceptor",
      description: "DevTools event interceptor (auto-registered by withNodetools)",
    },
  } as any);

  // Connect to hub
  wsClient.connect(host, config.port);

  // Return the same store (transparent instrumentation)
  return store;
}
