/**
 * Browser DevTools agent entry point -- the {@link withDevtools} wrapper function.
 *
 * @module @yoltra/devtools-browser-agent
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
import type { DevtoolsWrapperConfig } from "./types";
import { DevtoolsWsClient } from "./ws-client";

/**
 * Wraps a Yoltra store with DevTools instrumentation for browser environments.
 *
 * @remarks
 * - Connects to the DevTools hub via native `WebSocket`.
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
 * import { withDevtools } from '@yoltra/devtools-browser-agent';
 *
 * const store = createStore({ name: 'App', reducer: { ... } });
 * withDevtools(store, { port: 9800 });
 * ```
 *
 * @public
 */
export function withDevtools<
  R extends string,
  S extends Record<R, any>,
  EM extends EventMapBase,
>(store: StoreInstance<R, S, EM>, config: DevtoolsWrapperConfig): StoreInstance<R, S, EM> {
  const storeId = config.storeId ?? store.name;
  const host = config.host ?? "localhost";
  let snapshotVersion = 0;

  // ── Metrics tracking ──────────────────────────────────────────────────────
  // Counts committed events (events that pass middleware and run reducers).
  // Incremented in the interceptor effect below.
  let committedEventCount = 0;
  // Timestamps (epoch ms) of recent committed events; pruned to last 60 s.
  const eventTimestamps: number[] = [];
  // Counts ALL attempted events including those rejected by middleware.
  // Incremented by the __devtools_metrics_counter middleware registered below.
  let totalAttemptedCount = 0;

  // Deep clone state for diff tracking
  let prevState: any = JSON.parse(JSON.stringify(store.getState()));

  // ── Sampling state ─────────────────────────────────────────────────────────
  // Tracks per-event-key counters and timestamps to enforce the three sampling
  // rule types declared in `capabilities.sampling`:
  //   ignore   — never forward matching events.
  //   skip     — forward every Nth matching event (0-based counter).
  //   throttle — forward at most once per intervalMs per key.
  //
  // Each map is keyed by the canonical event key string `"channel::type"`.
  const skipCounters = new Map<string, number>(); // current invocation count per key
  const throttleLast = new Map<string, number>(); // last-forwarded epoch ms per key

  /**
   * Returns `true` when the event should be suppressed by the sampling config.
   * All three rule types are checked in priority order: ignore → throttle → skip.
   */
  const isSampledOut = (channel: string, type: string): boolean => {
    const sampling = capabilities.sampling;
    if (!sampling) return false;

    const eventKey = `${channel}::${type}`;

    // Helper: check if any rule's keys array matches this event.
    const matches = (keys: Array<[string, string]>): boolean =>
      keys.some(([c, t]) => (c === "*" || c === channel) && (t === "*" || t === type));

    // 1. Ignore — never forward.
    if (sampling.ignore?.some((r) => matches(r.keys))) return true;

    // 2. Throttle — forward only if intervalMs has elapsed since the last send.
    for (const rule of sampling.throttle ?? []) {
      if (!matches(rule.keys)) continue;
      const last = throttleLast.get(eventKey) ?? 0;
      const now = Date.now();
      if (now - last < rule.intervalMs) return true; // within throttle window
      throttleLast.set(eventKey, now);
      return false; // passed throttle; no further rules apply for this event
    }

    // 3. Skip — forward every Nth event (counter resets to 0 after firing).
    for (const rule of sampling.skip ?? []) {
      if (!matches(rule.keys)) continue;
      const count = (skipCounters.get(eventKey) ?? 0) + 1;
      if (count < rule.every) {
        skipCounters.set(eventKey, count);
        return true; // suppress until we reach the Nth event
      }
      skipCounters.set(eventKey, 0); // fire — reset counter
      return false;
    }

    return false;
  };

  // Build capabilities from config
  const capabilities: StoreCapabilities = {
    replay: config.allowReplay ?? false,
    stateSnapshot: true,
    // withDevtools sends STORE_SUBSCRIPTIONS responses for REQUEST_SUBSCRIPTIONS.
    subscriptionMeta: true,
    pipelineMeta: true,
    emit: config.allowEmit ?? false,
  };
  if (config.sampling) {
    capabilities.sampling = config.sampling;
  }

  // Create browser WS client
  const wsClient = new DevtoolsWsClient(storeId, store.name, capabilities, {
    autoReconnect: config.autoReconnect ?? true,
    maxReconnectAttempts: config.maxReconnectAttempts ?? Infinity,
    baseDelay: config.baseDelay ?? 1000,
    maxDelay: config.maxDelay ?? 30000,
  });

  const baseMsg = (): Pick<BaseMessage, "timestamp" | "sourceId" | "sourceRole"> => ({
    timestamp: new Date().toISOString(),
    sourceId: storeId,
    sourceRole: DevtoolsRole.STORE,
  });

  /*
   * Register a pass-through counting middleware.
   *
   * This always returns `true` (never rejects) and fires before any
   * user-registered middleware so it counts EVERY attempted dispatch.
   * The difference between `totalAttemptedCount` and `committedEventCount`
   * gives the number of middleware rejections.
   *
   * Uses optional-chaining in case `registerMiddleware` is not exposed on
   * the current store build (graceful degradation — metrics will show 0).
   */
  (store as any).registerMiddleware?.({
    when: { any: true },
    middleware: () => {
      totalAttemptedCount++;
      return true;
    },
    meta: {
      type: "middleware",
      name: "__devtools_metrics_counter",
      description: "DevTools metrics counter (auto-registered by withDevtools)",
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
        // Events committed in the last 1 second (sliding window).
        const cutoffMs = Date.now() - 1_000;
        const eventsPerSecond = eventTimestamps.filter((t) => t >= cutoffMs).length;
        // Middleware rejections = attempted − committed (floor at 0).
        const middlewareRejections = Math.max(
          0,
          totalAttemptedCount - committedEventCount,
        );
        const response: StoreMetrics = {
          type: "STORE_METRICS",
          ...baseMsg(),
          storeId,
          metrics: {
            eventCount: committedEventCount,
            eventsPerSecond,
            // avgProcessingTimeMs requires wrapping the queue drain loop inside
            // the core — cannot be measured accurately from outside the store.
            avgProcessingTimeMs: 0,
            // dedupHits is now tracked by the core; filled in B2.
            dedupHits: introspection.dedupHits ?? 0,
            // eventQueue is a private field but accessible via `as any`.
            queueDepth: (store as any).eventQueue?.length ?? 0,
            reducerCount: introspection.reducers.length,
            effectCount: introspection.effects.filter(
              (e: any) => e.name !== "__devtools_interceptor",
            ).length,
            // Filter the devtools counter out of the user-visible count.
            middlewareCount: introspection.middleware.filter(
              (m: any) => m.name !== "__devtools_metrics_counter",
            ).length,
            subscriberCount: introspection.event.length + introspection.coarse,
            connectorCount: introspection.atomic.length,
            middlewareRejections,
          },
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

        // Notify the extension of the new state so all UI panels (State
        // Explorer, Treemap, etc.) re-render with the time-traveled state.
        // useStoreState reacts to STATE_SNAPSHOT by resetting its local
        // state and version, then applying any subsequent patches normally.
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
        // Filter out internal devtools registrations from both lists.
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

  // Simple shallow diff fallback (used if detectChangedProps is not available)
  const shallowDiff = (a: any, b: any): string[] => {
    if (a === b) return [];
    const paths: string[] = [];
    const keys = new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})]);
    for (const k of keys) {
      if (a?.[k] !== b?.[k]) paths.push(k);
    }
    return paths;
  };

  // Register effect to intercept ALL events
  store.registerEffect({
    when: { any: true },
    effect: (event: { channel: string; type: string; payload: any }, getState: () => any) => {
      const nextState = getState() as any;

      // Compute changed paths per slice
      const changedPaths: string[] = [];
      const stateKeys = Object.keys(nextState);
      for (const sliceKey of stateKeys) {
        const slicePaths = shallowDiff(prevState[sliceKey], nextState[sliceKey]);
        for (const p of slicePaths) {
          changedPaths.push(p ? `${sliceKey}.${p}` : sliceKey);
        }
      }

      const patches = computePatches(prevState, nextState, changedPaths);
      snapshotVersion++;

      // Track committed event metrics.
      committedEventCount++;
      const nowMs = Date.now();
      eventTimestamps.push(nowMs);
      // Prune timestamps older than 60 s to bound memory usage.
      while (eventTimestamps.length > 0 && nowMs - eventTimestamps[0]! > 60_000) {
        eventTimestamps.shift();
      }

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
    },
    meta: {
      type: "effect",
      name: "__devtools_interceptor",
      description: "DevTools event interceptor (auto-registered by withDevtools)",
    },
  } as any);

  // Connect to hub
  wsClient.connect(host, config.port);

  return store;
}
