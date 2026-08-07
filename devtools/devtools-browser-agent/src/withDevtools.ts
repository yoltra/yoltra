/**
 * Browser DevTools agent entry point -- the {@link withDevtools} wrapper function.
 *
 * @module @yoltra/devtools-browser-agent
 */

import type { EventMapBase, InstrumentedEvent, StoreInstance } from "@yoltra/core";
import {
  DevtoolsRole,
  patchesFromChange,
  type BaseMessage,
  type DevtoolsSocketFactory,
  type StateSnapshot,
  type StoreCapabilities,
  type StoreEvent,
  type StoreMetrics,
} from "@yoltra/devtools-protocol";
import { encodeState, encodeStateBounded, decodeState } from "@yoltra/core";
import { createPostMessageSocketFactory } from "./postMessage-client";

/**
 * Global an extension's content script sets to announce that it is relaying this page.
 *
 * @remarks
 * The content script runs before application code, so by the time a store is created the mark is
 * already there. When it is absent the agent falls back to the hub, which is the right answer
 * for a page nobody is inspecting from an extension.
 */
const BRIDGE_MARK = "__YOLTRA_DEVTOOLS_BRIDGE__";

/**
 * Byte budget for a state snapshot, under the hub's 8 MiB frame cap.
 *
 * @remarks
 * Deliberately below it rather than equal to it: the snapshot travels inside an envelope with a
 * store id, a version and the reducer names, and a frame that overshoots by those few hundred
 * bytes is refused exactly as one that overshoots by a megabyte.
 */
const DEFAULT_MAX_SNAPSHOT_BYTES = 6 * 1024 * 1024;

/** Chooses the transport, honouring an explicit one above all. */
function resolveSocketFactory(
  config: DevtoolsWrapperConfig,
): DevtoolsSocketFactory | undefined {
  if (config.socketFactory !== undefined) return config.socketFactory;

  const mode = config.transport ?? "auto";
  if (mode === "websocket") return undefined; // the client's own default
  if (mode === "bridge") return createPostMessageSocketFactory();

  const relaying =
    typeof globalThis === "object" &&
    (globalThis as Record<string, unknown>)[BRIDGE_MARK] === true;
  return relaying ? createPostMessageSocketFactory() : undefined;
}
import type { DevtoolsWrapperConfig } from "./types";
import { DevtoolsWsClient } from "./ws-client";

/**
 * Wraps a Yoltra store with DevTools instrumentation for browser environments.
 *
 * @remarks
 * - Connects to the DevTools hub via native `WebSocket`.
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
  let committedEventCount = 0;
  // Counts ALL observed events including those vetoed by middleware.
  let totalAttemptedCount = 0;
  // Timestamps (epoch ms) of recent committed events; pruned to last 60 s.
  const eventTimestamps: number[] = [];
  // Rolling sum of the core-reported reduce time (ms) over committed events.
  let reduceTimeSumMs = 0;

  // ── Sampling state ─────────────────────────────────────────────────────────
  // Tracks per-event-key counters and timestamps to enforce the three sampling
  // rule types declared in `capabilities.sampling`:
  //   ignore   — never forward matching events.
  //   skip     — forward every Nth matching event (0-based counter).
  //   throttle — forward at most once per intervalMs per key.
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
      const nowMs = Date.now();
      if (nowMs - last < rule.intervalMs) return true; // within throttle window
      throttleLast.set(eventKey, nowMs);
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
    subscriptionMeta: true,
    pipelineMeta: true,
    emit: config.allowEmit ?? false,
  };
  if (config.sampling) {
    capabilities.sampling = config.sampling;
  }

  // Create browser WS client
  const maxSnapshotBytes = config.maxSnapshotBytes ?? DEFAULT_MAX_SNAPSHOT_BYTES;
  // One options object for every encode below: the redaction contract is that NOTHING the
  // agent forwards — snapshot, travel snapshot, payload, patch — skips the hook.
  const sanitize = config.sanitize;
  const encodeOptions = sanitize === undefined ? {} : { sanitize };
  // Patch values need their own wrapper: the codec's paths are relative to what it encodes,
  // and a leaf patch encodes a bare scalar whose root path is "" — so the hook would never
  // see `/vault/token`. Prefixing the op's own path restores the address a key-name recipe
  // matches on, for the leaf and for anything nested under a subtree replacement alike.
  const patchEncodeOptions = (opPath: string) =>
    sanitize === undefined
      ? {}
      : { sanitize: (path: string, value: unknown) => sanitize(`${opPath}${path}`, value) };

  const wsClient = new DevtoolsWsClient(
    storeId,
    store.name,
    capabilities,
    {
      autoReconnect: config.autoReconnect ?? true,
      maxReconnectAttempts: config.maxReconnectAttempts ?? Infinity,
      baseDelay: config.baseDelay ?? 1000,
      maxDelay: config.maxDelay ?? 30000,
      ...(config.authToken !== undefined ? { authToken: config.authToken } : {}),
    },
    resolveSocketFactory(config),
  );

  // Surface backpressure: warn (throttled) instead of dropping events silently
  // when the hub is unreachable and the send buffer overflows.
  let lastBackpressureWarn = 0;
  wsClient.onBackpressure((dropped) => {
    const nowMs = Date.now();
    if (nowMs - lastBackpressureWarn > 5_000) {
      lastBackpressureWarn = nowMs;
      console.warn(
        `[Yoltra DevTools] Backpressure: dropped ${dropped} event(s) while the hub was unreachable.`,
      );
    }
  });

  const baseMsg = (): Pick<BaseMessage, "timestamp" | "sourceId" | "sourceRole"> => ({
    timestamp: new Date().toISOString(),
    sourceId: storeId,
    sourceRole: DevtoolsRole.STORE,
  });

  // Handle incoming messages from hub
  wsClient.onMessage(async (data: string) => {
    let msg: any;
    try {
      msg = JSON.parse(data);
    } catch {
      return;
    }

    // Ingress validation (DEV-3): require a well-formed message with a string
    // `type` discriminant before acting on it (EMIT_TO_STORE forwards straight
    // into store.emit, so a malformed payload must not reach it).
    if (msg === null || typeof msg !== "object" || typeof msg.type !== "string") return;

    try {
      switch (msg.type) {
        case "REQUEST_STATE": {
          const state = store.getState();
          // Bounded before it is sent. A frame over the hub's cap is rejected and the
          // connection with it, so an oversized snapshot did not fail loudly — it dropped the
          // socket, the client reconnected, asked again, and the panel waited through the loop
          // with nothing on screen to explain it.
          const bounded = encodeStateBounded(state, maxSnapshotBytes, encodeOptions);
          const response: StateSnapshot = {
            type: "STATE_SNAPSHOT",
            ...baseMsg(),
            storeId,
            state: bounded.value,
            version: snapshotVersion,
            reducerNames: Object.keys(state as object),
            ...(bounded.truncated
              ? { truncated: true, ...(bounded.note !== undefined ? { truncationNote: bounded.note } : {}) }
              : {}),
          };
          wsClient.send(JSON.stringify(response));
          break;
        }

        case "REQUEST_METRICS": {
          const introspection = store.__devtoolsIntrospect();
          // Events committed in the last 1 second (sliding window).
          const cutoffMs = Date.now() - 1_000;
          const eventsPerSecond = eventTimestamps.filter((t) => t >= cutoffMs).length;
          // Middleware rejections = attempted − committed (floor at 0).
          const middlewareRejections = Math.max(0, totalAttemptedCount - committedEventCount);
          // Real reduce-phase timing, averaged over committed events.
          const avgProcessingTimeMs =
            committedEventCount > 0 ? reduceTimeSumMs / committedEventCount : 0;
          const response: StoreMetrics = {
            type: "STORE_METRICS",
            ...baseMsg(),
            storeId,
            metrics: {
              eventCount: committedEventCount,
              eventsPerSecond,
              avgProcessingTimeMs,
              dedupHits: introspection.dedupHits,
              queueDepth: introspection.queueDepth,
              reducerCount: introspection.reducers.length,
              effectCount: introspection.effects.length,
              middlewareCount: introspection.middleware.length,
              subscriberCount: introspection.event.length + introspection.coarse,
              connectorCount: introspection.atomic.length,
              middlewareRejections,
            },
          };
          wsClient.send(JSON.stringify(response));
          break;
        }

        case "TIME_TRAVEL": {
          // Time-travel replaces the entire state tree — gate on the store's
          // replay capability (default off), same as EVENT_REPLAY. The core seam
          // enforces this too (defense in depth).
          if (!capabilities.replay) break;

          // Guard against malformed messages — a null state would corrupt the
          // store and cause "Cannot read property of undefined" in reducers.
          if (msg.state == null) break;

          store.__applyExternalState(decodeState(msg.state) as never);
          snapshotVersion = msg.snapshotVersion ?? snapshotVersion;

          // Notify the extension of the new state so all UI panels re-render with
          // the time-traveled state.
          const traveledState = store.getState();
          const travelBounded = encodeStateBounded(traveledState, maxSnapshotBytes, encodeOptions);
          const travelSnapshot: StateSnapshot = {
            type: "STATE_SNAPSHOT",
            ...baseMsg(),
            storeId,
            state: travelBounded.value,
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

        default: {
          // Exhaustiveness fallback (DEV-3): an unhandled command type is protocol
          // drift (a bug), not routine traffic — surface it instead of dropping it.
          console.warn(`[Yoltra DevTools] Ignoring unknown message type: ${String(msg.type)}`);
          break;
        }
      }
    } catch (err) {
      // A command handler that throws must not become an unhandled rejection: this
      // callback is async and nothing awaits it, so the failure would surface far from
      // here — or nowhere at all — and the panel would sit waiting for a reply that
      // never comes. Report it and keep the connection usable.
      console.error(
        `[Yoltra DevTools] Command "${String(msg.type)}" failed:`,
        err,
      );
    }
  });

  // If this store was already wrapped (HMR / remount / a double call), tear down
  // the previous devtools attachment first so we don't leak the instrument
  // observer + reconnecting socket or double-send every event (DEV-2).
  const existingDispose = (store as unknown as { __yoltraDevtoolsDispose?: () => void })
    .__yoltraDevtoolsDispose;
  if (existingDispose) existingDispose();

  // Observe every event through the typed instrumentation seam. This single
  // observer replaces the old interceptor effect + metrics middleware + manual
  // diff + full-state clone: the core hands us the exact changed leaf paths and
  // their old/new values, so we build precise patches with no re-diff.
  const instrumentUnsub = store.instrument((info: InstrumentedEvent<EM>) => {
    totalAttemptedCount++;
    if (info.committed) {
      committedEventCount++;
      reduceTimeSumMs += info.reduceTimeMs;
      const nowMs = Date.now();
      eventTimestamps.push(nowMs);
      // Prune timestamps older than 60 s to bound memory usage.
      while (eventTimestamps.length > 0 && nowMs - eventTimestamps[0]! > 60_000) {
        eventTimestamps.shift();
      }
    }

    if (isSampledOut(info.event.channel, info.event.type)) return;

    // Only a committed event advances the state version — it carries patches. A
    // vetoed event is logged with committed:false and no bump, so time-travel
    // reconstruction stays correlated (DEV-7). Wire ordering is preserved by the
    // event log's array insertion order, not by this version.
    if (info.committed) snapshotVersion++;
    const storeEvent: StoreEvent = {
      type: "STORE_EVENT",
      ...baseMsg(),
      storeId,
      event: {
        id: info.event.id,
        channel: info.event.channel,
        type: info.event.type,
        // Encoded like state: a payload is arbitrary application data, so it can hold the same
        // Map, BigInt or cycle that made a bare stringify throw or quietly destroy it.
        payload: encodeState(info.event.payload, encodeOptions).value,
      },
      patches: info.committed
        ? patchesFromChange(info.changedPaths, info.prevValues, info.nextValues).map((op) =>
            "value" in op
              ? { ...op, value: encodeState(op.value, patchEncodeOptions(op.path)).value }
              : op,
          )
        : [],
      snapshotVersion,
      committed: info.committed,
    };
    wsClient.send(JSON.stringify(storeEvent));
  });

  // Connect to hub
  wsClient.connect(host, config.port);

  // Devtools teardown (DEV-2): detach the instrument observer and disconnect the
  // socket. Stored on the store so a later re-wrap tears down this attachment,
  // and folded into store.dispose() so disposing the store also detaches devtools.
  const disposeDevtools = () => {
    instrumentUnsub();
    wsClient.disconnect();
    (store as unknown as { __yoltraDevtoolsDispose?: () => void }).__yoltraDevtoolsDispose =
      undefined;
  };
  (store as unknown as { __yoltraDevtoolsDispose?: () => void }).__yoltraDevtoolsDispose =
    disposeDevtools;

  const prevDispose = store.dispose.bind(store);
  store.dispose = () => {
    disposeDevtools();
    prevDispose();
  };

  return store;
}
