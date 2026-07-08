/**
 * @module @yoltra/core
 */

import { Reducer } from "../reducer/Reducer";
import { detectChangedProps } from "../utils/detectChangedProps";
import { EventBus } from "../eventBus/EventBus";
import { LooseEventBus } from "../eventBus/LooseEventBus";
import type {
  Event,
  EventMapBase,
  EventKey,
  EventUnion,
  Change,
  DeepReadonly,
  EffectFunction,
  EffectSpec,
  EventConsumerMeta,
  MiddlewareFunction,
  MiddlewareInput,
  MiddlewareSpec,
  ReducersMapAny,
  ReducerSpec,
  StateFromReducers,
  StoreInstance,
  StoreSpec,
  Unsubscribe,
  EMFromReducersStrict,
  Emit,
  EmitOptions,
  InstrumentationObserver,
  InstrumentedEvent,
  EventPhase,
  EventSubscriptionHandler,
  NarrowedEventHandler,
  When,
} from "../types";
import { freezeState } from "../utils/immutability";

/**
 * Deep-freezes a value **in development only**, returning it untouched in
 * production.
 *
 * @remarks
 * Deep-freezing is a dev-time guard against accidental state mutation; in
 * production it is pure overhead. Because {@link freezeState} freezes in place
 * and early-exits on already-frozen nodes, freezing a structurally-shared value
 * touches only the **newly-created** nodes — O(change), not O(state size). This
 * is why the write path does **not** deep-clone before freezing.
 *
 * @internal
 */
function freezeInDev<T>(value: T): DeepReadonly<T> {
  return process.env.NODE_ENV === "production"
    ? (value as unknown as DeepReadonly<T>)
    : freezeState(value);
}

/**
 * Default window (ms) for identity-based dedup via {@link EmitOptions.dedupKey}
 * when content-based dedup (`dedupWindowMs`) is disabled. Large enough to absorb
 * a synchronous re-fire (e.g. React Strict Mode's mount → unmount → mount),
 * small enough not to swallow genuine user repeats.
 */
const DEFAULT_DEDUP_KEY_WINDOW_MS = 100;

/**
 * High-resolution monotonic clock in milliseconds for instrumentation timing;
 * falls back to `Date.now()` where `performance` is unavailable.
 */
const now = (): number =>
  typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();

export class Store<EM extends EventMapBase, R extends string, S extends Record<R, any>>
  implements StoreInstance<R, S, EM> {
  /**
   * Store name (used by DevTools & diagnostics).
   *
   * @public
   */
  name: string;

  /**
   * Registered middleware pipeline (run **before** reducers).
   * Stores either raw functions (legacy) or MiddlewareSpec objects.
   * Return `false` from the middleware function to stop propagation.
   *
   * @internal
   */
  private readonly middleware: MiddlewareInput<DeepReadonly<S>, EM>[];

  /**
   * Installed slice reducers keyed by slice name.
   *
   * @internal
   */
  private readonly reducers: Record<R, Reducer<S[R], EM>>;

  /**
   * Current immutable snapshot of the store state.
   * This reference changes whenever any slice changes (shallow immutability).
   *
   * @internal
   */
  private state: DeepReadonly<S>;

  /**
   * Bus for reducer wiring (emit by `(channel, type)`).
   *
   * @internal
   */
  private readonly reducerBus: EventBus<EM>;

  /**
   * Bus for **granular** connector events (emit by **dotted path** inside a slice).
   *
   * @internal
   */
  private readonly connectorBus: LooseEventBus<R, string, Change>;

  /**
   * Coarse-grained listeners (called once per committed event, only if state changed).
   *
   * @internal
   */
  private readonly listeners: Set<() => void> = new Set();

  /**
   * Registered effect handlers keyed by `"channel::type"` for O(1) lookup.
   * Used for effects with explicit `keys` or legacy `events` targeting.
   *
   * @internal
   */
  private readonly effects = new Map<string, Set<EffectFunction<DeepReadonly<S>, EM>>>();

  /**
   * Pattern-based effects that need runtime matching.
   * Used for effects with `when: { any }`, `{ channel }`, or `{ channels }`.
   * Stores tuples of [effect function, when matcher].
   *
   * @internal
   */
  private readonly patternEffects = new Set<{
    effect: EffectFunction<DeepReadonly<S>, EM>;
    when: When<EM>;
  }>();

  /**
   * Committed event subscribers keyed by `"channel::type"` for O(1) lookup.
   * Notified after reducers, before effects, for events that passed middleware.
   *
   * @internal
   */
  private readonly committedEventSubscribers = new Map<
    string,
    Set<EventSubscriptionHandler<DeepReadonly<S>, EM>>
  >();

  /**
   * Uncommitted event subscribers keyed by `"channel::type"` for O(1) lookup.
   * Notified when middleware rejects an event.
   *
   * @internal
   */
  private readonly uncommittedEventSubscribers = new Map<
    string,
    Set<EventSubscriptionHandler<DeepReadonly<S>, EM>>
  >();

  /**
   * All-events subscribers keyed by `"channel::type"` for O(1) lookup.
   * Notified for both committed and uncommitted events with phase parameter.
   *
   * @internal
   */
  private readonly allEventSubscribers = new Map<
    string,
    Set<EventSubscriptionHandler<DeepReadonly<S>, EM>>
  >();

  /**
   * Track reducerBus unsubs per slice for HMR/register/unregister.
   *
   * @internal
   */
  private readonly sliceUnsubs = new Map<string, Array<() => void>>();

  /**
   * Pattern-based reducers that need runtime matching.
   * Used for reducers with `when: { any }`, `{ channel }`, or `{ channels }`.
   * Maps slice name to the `when` matcher.
   *
   * @internal
   */
  private readonly patternReducers = new Map<R, When<EM>>();

  /**
   * Whether `__replayEvents()` is allowed.
   * Set from `spec.devtools.allowReplay`.
   *
   * @internal
   */
  private readonly replayEnabled: boolean;

  /**
   * Optional hook invoked when an effect throws/rejects. See
   * {@link StoreSpec.onEffectError}. `await emit()` never rejects on effect
   * failure — this is how callers observe effect errors.
   */
  private readonly onEffectError?: (error: unknown, event: EventUnion<EM>) => void;

  /**
   * Pending events awaiting the **synchronous** reduce phase (middleware +
   * reducers + subscribers + coarse listeners). Drained by {@link drainReduce}.
   *
   * @internal
   */
  private readonly reduceQueue: Array<{
    channel: string;
    type: string;
    payload: any;
    id: string;
    resolve: () => void;
  }> = [];

  /**
   * Re-entrancy guard for the synchronous reduce phase.
   *
   * @internal
   */
  private isReducing = false;

  /**
   * Registered instrumentation observers (DevTools seam). See {@link instrument}.
   *
   * @internal
   */
  private readonly instrumentObservers = new Set<InstrumentationObserver<EM>>();

  /**
   * Scratch array collecting slice-prefixed changed leaf paths during an
   * instrumented reduce. Set by {@link drainReduce} while observers are active;
   * appended to by {@link forwardEvent}. `null` when not instrumenting.
   *
   * @internal
   */
  private changedPathSink: string[] | null = null;

  /**
   * Count of effect tasks currently in flight; surfaced as queue depth by
   * {@link __devtoolsIntrospect}.
   *
   * @internal
   */
  private inFlightEffects = 0;

  /**
   * Tracks processed events by fingerprint with timestamps for TTL-based deduplication.
   *
   * **Deduplication Behavior:**
   * - Events are fingerprinted using `channel::type::JSON(payload)`
   * - If an identical fingerprint is seen within the dedup window, it's skipped
   * - The window is 50ms in development, 100ms in production
   *
   * **Limitations:**
   * - Non-serializable payloads (functions, symbols, circular refs) get unique
   *   fingerprints and won't be deduplicated
   * - Legitimate rapid-fire identical events may be incorrectly deduplicated
   * - The cache is bounded to 1000 entries with lazy pruning
   *
   * @internal
   */
  private readonly processedEvents = new Map<string, number>();

  /**
   * Lifetime count of events suppressed by the deduplication cache.
   * Exposed via {@link __devtoolsIntrospect} so the DevTools agent can
   * surface it in the STORE_METRICS response without further core changes.
   *
   * @internal
   */
  private dedupCount = 0;

  /**
   * Store-owned metadata for registered effects, keyed by the effect function.
   * Kept **off** the caller's function object: mutating a user-owned function
   * (the old `fn.__quoMeta`) bled metadata across stores that share a handler
   * and left it attached after unregister. Cleared on {@link dispose}.
   *
   * @internal
   */
  private effectMeta = new WeakMap<object, EventConsumerMeta<"effect">>();

  /**
   * Configuration for event deduplication.
   * @internal
   */
  private readonly dedupConfig: {
    /** Time window in ms for considering events as duplicates */
    windowMs: number;
    /** Maximum cache size to prevent unbounded growth */
    maxCacheSize: number;
  };

  /**
   * Timer for periodic cleanup of processed events.
   *
   * @internal
   */
  private eventCleanupTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * Creates a store from a {@link StoreSpec}.
   *
   * @param spec - Store configuration (name, reducers, middleware, optional effects).
   *
   * @public
   */
  constructor(spec: StoreSpec<R, S, EM>) {
    this.name = spec.name ?? "yoltra Store";
    this.reducerBus = new EventBus<EM>();
    this.connectorBus = new LooseEventBus();
    this.middleware = [...(spec.middleware ?? [])];
    this.reducers = {} as Record<R, Reducer<S[R], EM>>;
    this.state = {} as any;
    this.replayEnabled = spec.devtools?.allowReplay ?? false;
    this.onEffectError = spec.onEffectError;

    // Deduplication is OPT-IN. Content-based dedup is OFF by default because it
    // can silently drop legitimate rapid-fire identical events; enable it with
    // `dedupWindowMs > 0`, or use per-emit `dedupKey` for identity-based dedup.
    this.dedupConfig = {
      windowMs: spec.dedupWindowMs ?? 0,
      maxCacheSize: 1000,
    };

    /**
     * Reducer wiring
     */
    Object.entries(spec.reducer).forEach(([name, rSpec]) => {
      this.mountSlice(name as R, rSpec as ReducerSpec<S[R], EM>, { preserveState: false });
    });

    /**
     * Effects from spec (optional)
     */
    if (spec.effects?.length) {
      for (const effSpec of spec.effects) {
        this.registerEffect(effSpec);
      }
    }

    // Event dedup cleanup runs on a lazily-started interval: it begins the first
    // time an entry is cached (content dedup OR identity `dedupKey`) and stops
    // when the cache empties (see ensureCleanupTimer / pruneProcessedEvents).
    // When no dedup is used the cache stays empty, so no timer is ever started
    // and the store never keeps the event loop alive unnecessarily.

    /**
     * Method bindings
     */
    this.dispose = this.dispose.bind(this);
    this.notifyEffects = this.notifyEffects.bind(this);

    // private API
    this.forwardEvent = this.forwardEvent.bind(this);
    this.__applyExternalState = this.__applyExternalState.bind(this);
    this.__replayEvents = this.__replayEvents.bind(this);
    this.__devtoolsIntrospect = this.__devtoolsIntrospect.bind(this);
    this.mountSlice = this.mountSlice.bind(this);
    this.unmountSlice = this.unmountSlice.bind(this);
    this.getAtPath = this.getAtPath.bind(this);

    // public API
    this.emit = this.emit.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.connect = this.connect.bind(this);
    this.onEffect = this.onEffect.bind(this);
    this.onEvent = this.onEvent.bind(this);
    this.getState = this.getState.bind(this);
    this.registerEffect = this.registerEffect.bind(this);
    this.registerMiddleware = this.registerMiddleware.bind(this);
    this.registerReducer = this.registerReducer.bind(this);
    this.replaceMiddleware = this.replaceMiddleware.bind(this);
    this.replaceEffects = this.replaceEffects.bind(this);
    this.replaceReducers = this.replaceReducers.bind(this);
    this.hotReplace = this.hotReplace.bind(this);
  }

  /**
   * Cleanup resources (timers, etc.) when disposing the store.
   * Call this if you're dynamically creating/destroying stores.
   *
   * @example
   * ```ts
   * const store = createStore({ ... });
   * // later
   * store.dispose();
   * ```
   *
   * @public
   */
  public dispose(): void {
    if (this.eventCleanupTimer) {
      clearInterval(this.eventCleanupTimer);
      this.eventCleanupTimer = null;
    }

    this.processedEvents.clear();
    this.effects.clear();
    this.patternEffects.clear();
    this.effectMeta = new WeakMap();

    // Release every subscription and observer. Without this, the closures they
    // hold (React fibers, DevTools sockets, effect handlers) pin the store and
    // leak on per-route / SSR / test / HMR stores that create and dispose stores.
    this.listeners.clear();
    this.committedEventSubscribers.clear();
    this.uncommittedEventSubscribers.clear();
    this.allEventSubscribers.clear();
    this.instrumentObservers.clear();
    this.connectorBus.clear();
    this.reducerBus.clear();
    this.patternReducers.clear();
    this.sliceUnsubs.clear();
    this.changedPathSink = null;
  }

  /**
   * Generates a fingerprint for an event for deduplication purposes.
   * Falls back gracefully for non-serializable payloads.
   *
   * @param channel - Event channel.
   * @param type - Event type.
   * @param payload - Event payload.
   * @returns A string fingerprint for the event.
   *
   * @internal
   */
  private fingerprint(channel: string, type: string, payload: unknown): string {
    const base = `${channel}::${type}`;

    try {
      // Fast path for primitives
      if (payload === null || payload === undefined) {
        return `${base}::null`;
      }
      if (typeof payload !== "object") {
        return `${base}::${String(payload)}`;
      }

      // Attempt JSON serialization (handles most cases)
      const json = JSON.stringify(payload);
      return `${base}::${json}`;
    } catch {
      // Non-serializable payload - use timestamp to avoid false positives
      // This means non-serializable payloads won't be deduplicated
      return `${base}::${Date.now()}::${Math.random()}`;
    }
  }

  /**
   * Checks if an event should be deduplicated.
   * Returns true if this is a duplicate that should be skipped.
   *
   * @param fp - Event fingerprint.
   * @returns `true` if duplicate (should skip), `false` otherwise.
   *
   * @internal
   */
  private shouldDedupe(fp: string, windowMs: number): boolean {
    const now = Date.now();
    const existing = this.processedEvents.get(fp);

    if (existing !== undefined) {
      // Check if within dedup window
      if (now - existing < windowMs) {
        this.dedupCount++;
        return true; // Duplicate, skip
      }
    }

    // Record this event and make sure the periodic prune is running (it may not
    // be — e.g. identity `dedupKey` dedup at windowMs 0 never started it at
    // construction). The timer stops itself once the cache drains.
    this.processedEvents.set(fp, now);
    this.ensureCleanupTimer();

    // Lazy cleanup if cache is getting large
    if (this.processedEvents.size > this.dedupConfig.maxCacheSize) {
      this.pruneProcessedEvents(now);
    }

    return false; // Not a duplicate
  }

  /**
   * Starts the periodic prune interval if it isn't already running. Called when
   * the first entry is cached so the timer's lifetime tracks actual dedup use
   * (content window or identity `dedupKey`), independent of `dedupWindowMs`.
   *
   * @internal
   */
  private ensureCleanupTimer(): void {
    if (this.eventCleanupTimer !== null) return;
    this.eventCleanupTimer = setInterval(() => {
      this.pruneProcessedEvents(Date.now());
    }, 5000);
    // Never let the cleanup interval by itself keep a Node process alive.
    (this.eventCleanupTimer as { unref?: () => void }).unref?.();
  }

  /**
   * Removes expired entries from the processed events cache.
   *
   * @param now - Current timestamp.
   *
   * @internal
   */
  private pruneProcessedEvents(now: number): void {
    // Keep 2x the largest window in play (content window or the keyed-dedup
    // default) so entries aren't evicted before their dedup window elapses.
    const effectiveWindow = Math.max(this.dedupConfig.windowMs, DEFAULT_DEDUP_KEY_WINDOW_MS);
    const cutoff = now - effectiveWindow * 2;

    for (const [key, timestamp] of this.processedEvents) {
      if (timestamp < cutoff) {
        this.processedEvents.delete(key);
      }
    }

    // Once the cache has drained, stop the interval so an idle store doesn't
    // hold a repeating timer. It restarts on the next cached event.
    if (this.processedEvents.size === 0 && this.eventCleanupTimer !== null) {
      clearInterval(this.eventCleanupTimer);
      this.eventCleanupTimer = null;
    }
  }

  /**
   * Checks if an event matches a `When` matcher.
   *
   * @param when - The When matcher (or undefined for "all events").
   * @param event - The event to check.
   * @returns `true` if the event matches, `false` otherwise.
   *
   * @remarks
   * - `undefined` or missing `when` matches ALL events.
   * - `{ any: true }` matches ALL events.
   * - `{ keys: [...] }` matches if event's `[channel, type]` is in the array.
   * - `{ channel: 'x' }` matches if event's channel equals 'x'.
   * - `{ channels: ['x', 'y'] }` matches if event's channel is in the array.
   *
   * @internal
   */
  private matchesWhen(when: When<EM> | undefined, event: EventUnion<EM>): boolean {
    // No targeting = match all events
    if (!when) return true;

    // Match all events
    if ("any" in when && when.any === true) {
      return true;
    }

    // Match specific event keys
    if ("keys" in when) {
      return when.keys.some(
        ([channel, type]) => event.channel === channel && event.type === type,
      );
    }

    // Match single channel (all types within that channel)
    if ("channel" in when) {
      return event.channel === when.channel;
    }

    // Match multiple channels
    if ("channels" in when) {
      return when.channels.includes(event.channel as keyof EM & string);
    }

    return false;
  }

  /**
   * Extracts the middleware function from a MiddlewareInput.
   * Handles both raw functions (legacy) and MiddlewareSpec objects.
   *
   * @param input - MiddlewareInput (function or spec).
   * @returns The middleware function.
   *
   * @internal
   */
  private getMiddlewareFunction(
    input: MiddlewareInput<DeepReadonly<S>, EM>,
  ): MiddlewareFunction<DeepReadonly<S>, EM> {
    if (typeof input === "function") {
      return input;
    }
    return input.middleware;
  }

  /**
   * Gets the `when` matcher from a MiddlewareInput.
   *
   * @param input - MiddlewareInput (function or spec).
   * @returns The `when` matcher, or `undefined` for raw functions (match all).
   *
   * @internal
   */
  private getMiddlewareWhen(
    input: MiddlewareInput<DeepReadonly<S>, EM>,
  ): When<EM> | undefined {
    if (typeof input === "function") {
      // Raw functions match all events
      return undefined;
    }
    return input.when;
  }

  /**
   * Invokes all registered **effects** for a given event.
   * Handles both key-based effects (O(1) lookup) and pattern-based effects (runtime matching).
   * Errors are caught and logged.
   *
   * @param event - The event that was reduced.
   * @internal
   */
  private async notifyEffects(event: EventUnion<EM>) {
    // 1. Call key-based effects (O(1) lookup)
    const key = `${String(event.channel)}::${String(event.type)}`;
    const effectSet = this.effects.get(key);

    if (effectSet && effectSet.size > 0) {
      for (const h of [...effectSet]) {
        try {
          await h(event, this.getState, this.emit);
        } catch (e) {
          console.error("Effect error:", e);
          this.onEffectError?.(e, event);
        }
      }
    }

    // 2. Call pattern-based effects (runtime matching)
    for (const { effect, when } of this.patternEffects) {
      if (this.matchesWhen(when, event)) {
        try {
          await effect(event, this.getState, this.emit);
        } catch (e) {
          console.error("Effect error:", e);
          this.onEffectError?.(e, event);
        }
      }
    }
  }

  /**
   * Notifies event subscribers for a specific phase.
   *
   * Calls both phase-specific subscribers and 'all' subscribers.
   * Errors are caught and logged, allowing other subscribers to continue.
   *
   * @param event - The event to notify about.
   * @param phase - The phase ('committed' or 'uncommitted').
   * @internal
   */
  private notifyEventSubscribers(
    event: EventUnion<EM>,
    phase: "committed" | "uncommitted",
  ): void {
    const key = `${String(event.channel)}::${String(event.type)}`;

    // Notify phase-specific subscribers
    const phaseMap =
      phase === "committed"
        ? this.committedEventSubscribers
        : this.uncommittedEventSubscribers;
    const phaseSet = phaseMap.get(key);

    if (phaseSet?.size) {
      for (const handler of [...phaseSet]) this.invokeEventSubscriber(handler, event, phase);
    }

    // Notify 'all' subscribers
    const allSet = this.allEventSubscribers.get(key);
    if (allSet?.size) {
      for (const handler of [...allSet]) this.invokeEventSubscriber(handler, event, phase);
    }
  }

  /**
   * Invokes a single event-subscription handler **fire-and-forget**: synchronous
   * throws and async rejections are logged but never block the emit pipeline.
   * Event subscribers are notifications, not part of the committed reduce result.
   *
   * @internal
   */
  private invokeEventSubscriber(
    handler: EventSubscriptionHandler<DeepReadonly<S>, EM>,
    event: EventUnion<EM>,
    phase: "committed" | "uncommitted",
  ): void {
    try {
      const result = handler(event, this.getState, this.emit, phase) as unknown;
      if (result && typeof (result as Promise<unknown>).then === "function") {
        (result as Promise<unknown>).catch((e) => console.error("Event subscription error:", e));
      }
    } catch (e) {
      console.error("Event subscription error:", e);
    }
  }

  /**
   * Applies a reduced event to a slice and emits **precise** connector events.
   *
   * For each changed **leaf path** (via {@link detectChangedProps}), emits that leaf and
   * all of its **ancestors** once (e.g., `"data"`, `"data.123"`, `"data.123.title"`).
   *
   * **State Immutability**: When a slice changes, a new state object is created via
   * shallow spread: `{ ...this.state, [sliceName]: newSlice }`. This ensures that
   * `this.state` reference changes, enabling efficient change detection via `===`.
   *
   * @param rName - Slice name being updated.
   * @param event - Reduced event with typed payload.
   * @returns `true` if the slice actually changed, `false` otherwise.
   *
   * @internal
   */
  private forwardEvent<C extends keyof EM & string, T extends keyof EM[C] & string>(
    rName: R,
    event: Event<EM, C, T>,
  ): boolean {
    // @ts-expect-error R indexing on DeepReadonly<S> is valid at runtime
    const prev = this.state[rName] as S[R];
    const next = this.reducers[rName].reduce(prev, event as any);

    // if reducer returned same ref, definitely no change
    if (prev === next) return false;

    // compute precise leaf paths that changed (relative to slice root)
    const leafPaths = detectChangedProps(prev, next).filter(Boolean);

    // if nothing actually changed at the leaves, treat as a no-op
    if (leafPaths.length === 0) return false;

    // Commit the new slice under a NEW top-level state reference (shallow spread).
    // No deep clone: the reducer already returned a fresh `next` (purity contract),
    // so structural sharing is preserved and freezeInDev only touches new nodes.
    const frozen = freezeInDev(next) as DeepReadonly<S[R]>;
    this.state = { ...this.state, [rName]: frozen } as DeepReadonly<S>;

    // Record slice-prefixed changed leaf paths for any active instrumentation
    // (lets DevTools agents build precise patches without re-diffing state).
    if (this.changedPathSink) {
      for (const p of leafPaths) {
        this.changedPathSink.push(p ? `${rName as string}.${p}` : (rName as string));
      }
    }

    // emit deep + ancestor paths once each
    const toEmit = new Set<string>();
    for (const p of leafPaths) {
      for (const a of Store.buildAncestorPaths(p)) toEmit.add(a);
    }

    for (const prop of toEmit) {
      const oldValue = this.getAtPath(prev, prop);
      const newValue = this.getAtPath(frozen, prop);

      this.connectorBus.emit(rName, prop, { oldValue, newValue, path: prop });
    }

    return true; // slice changed
  }

  /**
   * Returns a structured introspection snapshot for DevTools UIs.
   *
   * @remarks
   * Reads the internal middleware, effects, reducers, and subscriber
   * registries and returns a plain-object summary matching the
   * `STORE_SUBSCRIPTIONS` protocol message shape.
   *
   * @public
   */
  public __devtoolsIntrospect() {
    // Reducers
    const reducers = (Object.keys(this.reducers) as Array<R>).map((name) => {
      const when = this.patternReducers.get(name);
      return { name: name as string, when };
    });

    // Effects (keyed) — metadata looked up from the store-owned effectMeta map
    const effects: Array<{ channel: string; type: string; name?: string; description?: string }> = [];
    for (const [key, set] of this.effects) {
      if (set.size === 0) continue;
      const [channel, type] = key.split("::");
      for (const fn of set) {
        const meta = this.effectMeta.get(fn);
        effects.push({ channel, type, name: meta?.name, description: meta?.description });
      }
    }
    // Effects (pattern-based) — entry is { effect, when }; metadata in effectMeta
    for (const entry of this.patternEffects) {
      const meta = this.effectMeta.get(entry.effect);
      effects.push({
        channel: "*",
        type: "*",
        name: meta?.name,
        description: meta?.description,
      });
    }

    // Middleware
    const middleware: Array<{ name?: string; description?: string; when?: unknown }> = [];
    for (const mwInput of this.middleware) {
      if (typeof mwInput === "function") {
        middleware.push({ name: mwInput.name || undefined });
      } else {
        middleware.push({
          name: (mwInput as any).meta?.name,
          description: (mwInput as any).meta?.description,
          when: (mwInput as any).when,
        });
      }
    }

    // Atomic (connect) subscriptions — enumerate from the connectorBus
    const atomic: Array<{ reducer: string; property: string }> = [];
    for (const entry of this.connectorBus.__introspect()) {
      for (let i = 0; i < entry.count; i++) {
        atomic.push({ reducer: entry.channel, property: entry.type });
      }
    }

    // Event subscriptions
    const event: Array<{ channel: string; type: string; phase: string }> = [];
    for (const [key, set] of this.committedEventSubscribers) {
      if (set.size === 0) continue;
      const [channel, type] = key.split("::");
      for (let i = 0; i < set.size; i++) {
        event.push({ channel, type, phase: "committed" });
      }
    }
    for (const [key, set] of this.uncommittedEventSubscribers) {
      if (set.size === 0) continue;
      const [channel, type] = key.split("::");
      for (let i = 0; i < set.size; i++) {
        event.push({ channel, type, phase: "uncommitted" });
      }
    }
    for (const [key, set] of this.allEventSubscribers) {
      if (set.size === 0) continue;
      const [channel, type] = key.split("::");
      for (let i = 0; i < set.size; i++) {
        event.push({ channel, type, phase: "all" });
      }
    }

    // Coarse subscribers count
    const coarse = this.listeners.size;

    return {
      reducers,
      effects,
      middleware,
      atomic,
      event,
      coarse,
      dedupHits: this.dedupCount,
      queueDepth: this.reduceQueue.length + this.inFlightEffects,
    };
  }

  /**
   * Applies an externally provided **whole-state** (e.g., DevTools time travel) and emits
   * fine-grained path changes for each slice.
   *
   * **State Immutability**: If any slices change, a new state object is created via
   * shallow spread. This ensures consistent immutability with {@link forwardEvent}.
   *
   * **Missing slices**: the snapshot should contain every slice. A slice absent
   * from `nextPlain` is **retained at its current value** (not blanked to
   * `undefined`, which would make `getState().<slice>` throw on next access).
   *
   * @param nextPlain - Plain JS object to become the new state.
   *
   * @internal
   */
  public __applyExternalState(nextPlain: any) {
    // Gate on the same runtime flag as __replayEvents: time-travel replaces the
    // whole state tree, so it must stay off unless the app opted in via
    // createStore({ devtools: { allowReplay: true } }). Enforced here at the
    // seam so a devtools agent (or a client driving it) cannot bypass it.
    if (!this.replayEnabled) {
      console.warn(
        "[yoltra] External state apply (time-travel) is disabled. Enable it with createStore({ devtools: { allowReplay: true } })",
      );
      return;
    }

    const prev = this.state as any;
    const next = nextPlain;

    const newState = { ...this.state } as any;
    let anyChanged = false;

    (Object.keys(this.reducers) as Array<R>).forEach((rName) => {
      const prevSlice = prev?.[rName];
      const nextSlice = next?.[rName];

      // A snapshot missing this slice must not blank it out — retain the current
      // slice (storing `undefined` would make getState().<slice>.x throw later).
      if (nextSlice === undefined) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `[yoltra] External state is missing slice "${String(
              rName,
            )}"; retaining its current value. Time-travel snapshots should contain all slices.`,
          );
        }
        return;
      }

      // if reference equal, nothing to emit
      if (prevSlice === nextSlice) return;

      // freeze the incoming slice before storing (dev-only; no deep clone — the
      // external snapshot is freshly deserialized and owned by the store)
      const frozenNextSlice = freezeInDev(nextSlice) as DeepReadonly<S[typeof rName]>;
      newState[rName] = frozenNextSlice;
      anyChanged = true;

      // full dotted leaf paths relative to the slice
      const leafPaths = detectChangedProps(prevSlice, nextSlice).filter(Boolean);
      if (leafPaths.length === 0) return;

      // emit every leaf AND its ancestors once
      const toEmit = new Set<string>();
      for (const p of leafPaths) for (const a of Store.buildAncestorPaths(p)) toEmit.add(a);

      for (const path of toEmit) {
        const oldValue = this.getAtPath(prevSlice, path);
        const newValue = this.getAtPath(frozenNextSlice, path);
        this.connectorBus.emit(rName, path as any, { oldValue, newValue, path });
      }
    });

    // commit new state if any slices changed
    if (anyChanged) {
      this.state = newState as DeepReadonly<S>;
    }

    // coerse subscribers after all fine-grained emits (only if changed)
    if (anyChanged) {
      this.listeners.forEach((l) => l());
    }
  }

  /**
   * Replays a sequence of events from a snapshot through reducers and event
   * subscribers ONLY. Skips dedup, middleware, and effects.
   *
   * This method is gated by the `devtools.allowReplay` runtime config.
   * If replay is not enabled, this method throws.
   *
   * @param snapshot - The state snapshot to restore before replaying.
   * @param events - Array of events to replay (in order).
   *
   * @internal
   */
  public __replayEvents(
    snapshot: any,
    events: Array<{ channel: string; type: string; payload: any; id: string }>,
  ): void {
    if (!this.replayEnabled) {
      throw new Error(
        "[yoltra] Event replay is disabled. Enable it with createStore({ devtools: { allowReplay: true } })",
      );
    }

    // 1. Apply snapshot (restores base state)
    this.__applyExternalState(snapshot);

    // 2. Replay each event through reducers + event subscribers only
    for (const evt of events) {
      const event = evt as EventUnion<EM>;

      // Track state before reducers
      const stateBefore = this.state;

      // Run key-based reducers via reducerBus
      this.reducerBus.emit(event.channel as any, event.type as any, event.payload);

      // Run pattern-based reducers
      for (const [sliceName, when] of this.patternReducers) {
        if (this.matchesWhen(when, event)) {
          this.forwardEvent(sliceName, event as any);
        }
      }

      const stateAfter = this.state;
      const anySliceChanged = stateBefore !== stateAfter;

      // Notify committed event subscribers (sync, fire-and-forget)
      this.notifyEventSubscribers(event, "committed");

      // Notify coarse subscribers if state changed
      if (anySliceChanged) {
        this.listeners.forEach((l) => l());
      }

      // NOTE: No middleware, no effects, no dedup, no DevTools logging
    }
  }

  /**
   * Emits a typed event `(channel, type, payload)`.
   * Events are queued and processed **sequentially** (FIFO).
   *
   * **Pipeline per event:** the *reduce phase* (steps 1-4) runs **synchronously**,
   * so `getState()` reflects the change as soon as `emit()` returns; the *effect
   * phase* (step 5) runs afterwards, asynchronously.
   * 1. **Deduplication** (opt-in) - Skip when content-dedup is enabled (`dedupWindowMs > 0`) or a matching `dedupKey` recurs; off by default
   * 2. **Middleware** (sync) - Pre-reducer hooks; may cancel by returning `false`
   * 3. **Reducers** (sync) - state updates + fine-grained path notifications
   * 4. **Subscribers + coarse** (sync) - event subscribers (fire-and-forget) then coarse listeners (only if state changed)
   * 5. **Effects** (async) - side-effects keyed by `(channel, type)`; the returned promise resolves once they complete
   *
   * **Change Detection**: Uses reference equality (`===`) on `this.state` to determine
   * if any slice changed. Works because {@link forwardEvent} creates a new state reference
   * via shallow spread when any slice changes.
   *
   * @typeParam C - Channel key in `EM`.
   * @typeParam T - Type key within channel `C`.
   * @param channel - Channel name.
   * @param type - Event type name.
   * @param payload - Payload typed as `EM[C][T]`.
   * @param opts - Optional per-emit options (e.g. `dedupKey` for identity-based dedup).
   * @returns A promise that resolves once this event's effects have finished.
   * State is already updated synchronously before `emit()` returns.
   *
   * @example Basic usage
   * ```ts
   * await store.emit('ui', 'increment', 1);
   * ```
   *
   * @example With middleware cancellation
   * ```ts
   * store.registerMiddleware((state, event) => {
   *   if (event.type === 'dangerous') return false; // cancel
   *   return true; // allow
   * });
   *
   * await store.emit('ui', 'dangerous', null); // cancelled, no state change
   * ```
   *
   * @public
   */
  public async emit<C extends keyof EM & string, T extends keyof EM[C] & string>(
    channel: C,
    type: T,
    payload: EM[C][T],
    opts?: EmitOptions,
  ): Promise<void> {
    // Deduplication is OPT-IN (see EmitOptions / StoreSpec.dedupWindowMs).
    // Content-based dedup runs only when `dedupWindowMs > 0`; identity-based
    // dedup runs when an explicit `dedupKey` is supplied. By default neither is
    // active, so legitimate rapid-fire identical events are never silently dropped.
    const dedupKey = opts?.dedupKey;
    const contentWindow = this.dedupConfig.windowMs;
    if (contentWindow > 0 || dedupKey !== undefined) {
      const windowMs =
        dedupKey !== undefined && contentWindow <= 0 ? DEFAULT_DEDUP_KEY_WINDOW_MS : contentWindow;
      const fp =
        dedupKey !== undefined
          ? `${channel}::${type}::#${dedupKey}`
          : this.fingerprint(channel as string, type as string, payload);
      if (this.shouldDedupe(fp, windowMs)) {
        return; // Skip duplicate
      }
    }

    // Assign a unique id and a completion deferred, resolved after this event's
    // effects run. Reducers run synchronously (see drainReduce), so state is
    // already updated before emit() returns; the returned promise tracks the
    // async effect phase for `await emit(...)`.
    const id = crypto.randomUUID();
    let resolve!: () => void;
    const done = new Promise<void>((r) => {
      resolve = r;
    });

    this.reduceQueue.push({
      channel: channel as string,
      type: type as string,
      payload,
      id,
      resolve,
    });

    // Synchronous reduce phase (drains re-entrant emits too), then async effects.
    this.drainReduce();

    return done;
  }

  /**
   * Drains the reduce queue **synchronously**. For each event it runs middleware,
   * reducers, event subscribers, and coarse listeners in the same tick, so
   * `getState()` reflects the change the moment {@link emit} returns. Re-entrant
   * emits (from middleware or subscribers) are appended and drained in the same
   * pass — preserving FIFO order without interleaving reducers. Each committed
   * event's effects then run in an independent task (see {@link runEventEffects}).
   *
   * @internal
   */
  private drainReduce(): void {
    if (this.isReducing) return;
    this.isReducing = true;
    try {
      while (this.reduceQueue.length > 0) {
        const { channel, type, payload, id, resolve } = this.reduceQueue.shift()!;
        const event = { channel, type, payload, id } as EventUnion<EM>;

        // Instrumentation: capture prev state, collect changed paths, and time
        // the synchronous reduce — all skipped entirely when no observers.
        const instrumenting = this.instrumentObservers.size > 0;
        const prevState = instrumenting ? this.state : undefined;
        const sink: string[] = [];
        if (instrumenting) this.changedPathSink = sink;
        const t0 = instrumenting ? now() : 0;

        let committed = false;
        try {
          committed = this.applyEventSync(event);
        } catch (err) {
          console.error("Emit reduce error:", err);
        } finally {
          if (instrumenting) this.changedPathSink = null;
        }

        if (instrumenting) {
          this.emitInstrumentation(
            event,
            committed,
            sink,
            prevState as DeepReadonly<S>,
            now() - t0,
          );
        }

        // Run this event's effects as an independent task and resolve its
        // completion deferred when they finish. Independent per-event tasks
        // (rather than one shared serialized loop) let an effect `await` a
        // re-entrant emit without deadlocking.
        void this.runEventEffects(event, committed, resolve);
      }
    } finally {
      this.isReducing = false;
    }
  }

  /**
   * Runs the **synchronous** part of the pipeline for a single event: middleware
   * (may veto), key- and pattern-based reducers, committed/uncommitted event
   * subscribers (fire-and-forget), and coarse listeners.
   *
   * @returns `true` if the event was committed (passed middleware), `false` if a
   * middleware vetoed it.
   *
   * @internal
   */
  private applyEventSync(event: EventUnion<EM>): boolean {
    // Middleware (synchronous). Return false to veto; async work belongs in effects.
    for (const mwInput of this.middleware) {
      const when = this.getMiddlewareWhen(mwInput);
      if (!this.matchesWhen(when, event)) continue;
      const mw = this.getMiddlewareFunction(mwInput);
      let ok: boolean;
      try {
        ok = mw(this.state, event, this.emit);
      } catch (err) {
        console.error("Middleware error:", err);
        ok = false;
      }
      if (!ok) {
        // Rejected by middleware — notify uncommitted subscribers, do not commit.
        this.notifyEventSubscribers(event, "uncommitted");
        return false;
      }
    }

    // Reducers — track whether any slice changed via reference equality.
    const stateBefore = this.state;
    this.reducerBus.emit(event.channel as any, event.type as any, event.payload as any);
    for (const [sliceName, when] of this.patternReducers) {
      if (this.matchesWhen(when, event)) {
        this.forwardEvent(sliceName, event as any);
      }
    }
    const changed = stateBefore !== this.state;

    // Committed event subscribers (fire-and-forget), then coarse listeners.
    this.notifyEventSubscribers(event, "committed");
    if (changed) {
      this.listeners.forEach((l) => l());
    }
    return true;
  }

  /**
   * Runs a single committed event's effects as an **independent async task**,
   * then resolves that event's completion deferred so `await emit(...)` settles
   * once its effects finish. Per-event tasks (rather than one shared serialized
   * loop) let an effect `await` a re-entrant emit without deadlocking.
   *
   * @internal
   */
  private async runEventEffects(
    event: EventUnion<EM>,
    committed: boolean,
    resolve: () => void,
  ): Promise<void> {
    this.inFlightEffects++;
    try {
      if (committed) await this.notifyEffects(event);
    } catch (err) {
      console.error("Effect error:", err);
    } finally {
      this.inFlightEffects--;
      resolve();
    }
  }

  /**
   * Registers an instrumentation observer. See {@link StoreInstance.instrument}.
   *
   * @public
   */
  public instrument(observer: InstrumentationObserver<EM>): Unsubscribe {
    this.instrumentObservers.add(observer);
    return () => {
      this.instrumentObservers.delete(observer);
    };
  }

  /**
   * Builds an {@link InstrumentedEvent} from the reduce result and notifies
   * observers. `changedPaths` are the exact slice-prefixed leaf paths recorded
   * by {@link forwardEvent} during this reduce, so DevTools patches need no
   * re-diff.
   *
   * @internal
   */
  private emitInstrumentation(
    event: EventUnion<EM>,
    committed: boolean,
    changedPaths: string[],
    prevState: DeepReadonly<S>,
    reduceTimeMs: number,
  ): void {
    const prevValues: Record<string, unknown> = {};
    const nextValues: Record<string, unknown> = {};
    for (const path of changedPaths) {
      prevValues[path] = this.getAtPath(prevState, path);
      nextValues[path] = this.getAtPath(this.state, path);
    }
    const info: InstrumentedEvent<EM> = {
      event: {
        id: event.id,
        channel: event.channel as string,
        type: event.type as string,
        payload: event.payload,
      },
      committed,
      changedPaths,
      prevValues,
      nextValues,
      reduceTimeMs,
    };
    for (const observer of [...this.instrumentObservers]) {
      try {
        observer(info);
      } catch (e) {
        console.error("Instrumentation observer error:", e);
      }
    }
  }

  /**
   * Connects a **fine-grained** listener to a dotted path under a slice.
   *
   * @param spec - `{ reducer, property }` where `property` is a dotted path (e.g., `"items.0.title"`).
   *        Supports wildcards: `*` (one segment) and `**` (zero or more segments).
   * @param h - Handler receiving a {@link Change} with `{ oldValue, newValue, path }`.
   * @returns Unsubscribe function.
   *
   * @example Exact path
   * ```ts
   * const off = store.connect(
   *   { reducer: 'todos', property: 'items.0.title' },
   *   (chg) => console.log('title changed:', chg.newValue)
   * );
   * off();
   * ```
   *
   * @example Wildcard pattern
   * ```ts
   * // Listen to any item title change
   * const off = store.connect(
   *   { reducer: 'todos', property: 'items.*.title' },
   *   (chg) => console.log('some title changed')
   * );
   * ```
   *
   * @public
   */
  public connect(spec: { reducer: R; property: string }, h: (chg: Change) => void): () => void {
    return this.connectorBus.on(spec.reducer, spec.property, h);
  }

  /**
   * Subscribe to events by channel and type.
   *
   * Event subscriptions are intended for the View layer (e.g., React components)
   * to react to events without affecting the event flow. They are fire-and-forget
   * and cannot cancel event propagation.
   *
   * **Phases:**
   * - `'committed'` (default): Events that passed middleware and reached reducers.
   *   Notified after reducers, before effects.
   * - `'uncommitted'`: Events rejected by middleware. Notified immediately after rejection.
   * - `'all'`: Both committed and uncommitted events. Handler receives the phase parameter
   *   to distinguish between the two.
   *
   * @typeParam C - Channel key within `EM`.
   * @typeParam T - Event type key within channel `C`.
   * @param channel - Channel to subscribe to.
   * @param type - Event type to subscribe to.
   * @param handler - Handler function `(event, getState, emit, phase)`.
   * @param phase - Event phase to subscribe to (default: `'committed'`).
   * @returns Unsubscribe function.
   *
   * @example Committed events (default)
   * ```ts
   * const off = store.onEvent('ui', 'save', (event, getState, emit, phase) => {
   *   console.log('Save committed:', event.payload);
   * });
   * off();
   * ```
   *
   * @example Uncommitted (rejected) events
   * ```ts
   * store.onEvent('ui', 'delete', (event, getState, emit, phase) => {
   *   console.log('Delete was rejected by middleware');
   * }, 'uncommitted');
   * ```
   *
   * @example All events
   * ```ts
   * store.onEvent('ui', 'action', (event, getState, emit, phase) => {
   *   console.log('Action:', phase); // 'committed' or 'uncommitted'
   * }, 'all');
   * ```
   *
   * @public
   */
  public onEvent<C extends keyof EM & string, T extends keyof EM[C] & string>(
    channel: C,
    type: T,
    handler: NarrowedEventHandler<DeepReadonly<S>, EM, C, T>,
    phase: EventPhase = "committed",
  ): Unsubscribe {
    const key = `${channel}::${String(type)}`;

    const targetMap =
      phase === "committed"
        ? this.committedEventSubscribers
        : phase === "uncommitted"
          ? this.uncommittedEventSubscribers
          : this.allEventSubscribers;

    if (!targetMap.has(key)) {
      targetMap.set(key, new Set());
    }
    // Store handler with type cast since internal storage uses the broad type
    targetMap.get(key)!.add(handler as EventSubscriptionHandler<DeepReadonly<S>, EM>);

    return () => {
      const set = targetMap.get(key);
      if (set) {
        set.delete(handler as EventSubscriptionHandler<DeepReadonly<S>, EM>);
        if (set.size === 0) targetMap.delete(key);
      }
    };
  }

  /**
   * Subscribes to **coarse-grained** commits (called once per successful event, only if state changed).
   *
   * **Use Case**: React's `useSyncExternalStore` or similar external store integrations.
   *
   * @param fn - Listener invoked after reducers/effects have run and state has changed.
   * @returns Unsubscribe function.
   *
   * @example
   * ```ts
   * const off = store.subscribe(() => console.log('state committed'));
   * // Later:
   * off();
   * ```
   *
   * @public
   */
  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /**
   * Returns the current immutable state snapshot.
   *
   * @returns Deep-readonly state object.
   *
   * @example
   * ```ts
   * const state = store.getState();
   * console.log(state.counter.value);
   * ```
   *
   * @public
   */
  public getState(): DeepReadonly<S> {
    return this.state;
  }

  /**
   * Registers a middleware (runs **before** reducers).
   *
   * @param mw - Middleware `(state, event, emit) => boolean|Promise<boolean>`.
   *        Return `false` to cancel event propagation.
   * @returns Unsubscribe function that removes this middleware.
   *
   * @example Logging middleware
   * ```ts
   * const off = store.registerMiddleware(async (state, event) => {
   *   console.log('Event:', event.channel, event.type, event.payload);
   *   return true; // allow
   * });
   * off();
   * ```
   *
   * @example Cancellation middleware
   * ```ts
   * store.registerMiddleware((state, event) => {
   *   if (event.type === 'forbidden') return false; // cancel
   *   return true;
   * });
   * ```
   *
   * @public
   */
  public registerMiddleware(mw: MiddlewareFunction<DeepReadonly<S>, EM>): Unsubscribe {
    this.middleware.push(mw as any);
    return () => {
      const i = this.middleware.indexOf(mw as any);
      if (i !== -1) this.middleware.splice(i, 1);
    };
  }

  /**
   * Dynamically **adds** a named slice reducer at runtime.
   *
   * @param name - New slice name (must not already exist).
   * @param spec - Reducer spec (state, events, reducer).
   * @returns Disposer function that **removes** the slice (and its state).
   *
   * @example
   * ```ts
   * const dispose = store.registerReducer('filters', {
   *   state: { q: '' },
   *   events: [['ui', 'setQuery']],
   *   reducer(s, evt) {
   *     return evt.type === 'setQuery' ? { q: evt.payload } : s;
   *   }
   * });
   * // Later:
   * dispose();
   * ```
   *
   * @public
   */
  public registerReducer(name: string, spec: ReducerSpec<any, EM>): () => void {
    if (name in this.reducers) throw new Error(`Reducer ${name} already exists`);

    this.mountSlice(name as R, spec as ReducerSpec<S[R], EM>, {
      preserveState: false,
    });

    this.listeners.forEach((l) => l()); // broadcast new slice

    return () => {
      // disposer
      this.unmountSlice(name as R, { deleteState: true });
      this.listeners.forEach((l) => l());
    };
  }

  /**
   * Registers an **effect** (stateless async event consumer) that runs after reducers.
   *
   * Effects are **keyed** by `(channel, type)` for O(1) lookup (no scanning all effects).
   *
   * @param spec - Effect specification with `events` (EventKeys) and `effect` (handler).
   * @returns Unsubscribe function.
   *
   * @example Logging effect
   * ```ts
   * const off = store.registerEffect({
   *   events: [['ui', 'increment']],
   *   effect: async (evt, getState, emit) => {
   *     console.log('increment', evt.payload, getState().counter.value);
   *   }
   * });
   * off();
   * ```
   *
   * @example Multi-event effect
   * ```ts
   * store.registerEffect({
   *   events: [['ui', 'increment'], ['ui', 'decrement']],
   *   effect: async (evt, getState, emit) => {
   *     // Runs for both increment and decrement
   *     await saveToServer(getState());
   *   }
   * });
   * ```
   *
   * @public
   */
  public registerEffect(spec: EffectSpec<DeepReadonly<S>, EM>): () => void {
    const { effect, meta, when } = spec;
    const unsubs: Array<() => void> = [];

    // Record metadata in a store-owned map keyed by the effect function, rather
    // than mutating the caller's function (which would bleed across stores).
    if (meta) {
      this.effectMeta.set(effect, meta);
    }

    // Check if this is a pattern-based effect (any, channel, channels)
    // or a key-based effect (keys, legacy events, or no targeting = all events)
    const isPatternBased =
      when &&
      (("any" in when && when.any === true) ||
        "channel" in when ||
        "channels" in when);

    if (isPatternBased) {
      // Store as pattern-based effect for runtime matching
      const entry = { effect, when: when! };
      this.patternEffects.add(entry);

      return () => {
        this.patternEffects.delete(entry);
      };
    }

    // Key-based effect: normalize to event keys
    const eventKeys = this.normalizeEventKeys(spec);

    // If no keys (no targeting at all), this effect matches ALL events
    // We treat it as a pattern-based effect with `any: true`
    if (eventKeys.length === 0 && !when && !spec.events) {
      const entry = { effect, when: { any: true } as When<EM> };
      this.patternEffects.add(entry);

      return () => {
        this.patternEffects.delete(entry);
      };
    }

    // Register for specific event keys
    for (const [channel, type] of eventKeys) {
      const key = `${String(channel)}::${String(type)}`;
      if (!this.effects.has(key)) {
        this.effects.set(key, new Set());
      }
      this.effects.get(key)!.add(effect);

      // Create disposer
      unsubs.push(() => {
        const set = this.effects.get(key);
        if (set) {
          set.delete(effect);
          if (set.size === 0) this.effects.delete(key);
        }
      });
    }

    return () => {
      for (const u of unsubs) u();
    };
  }



  /**
   * Convenience helper to register an **effect** filtered by a single `(channel, type)` pair.
   *
   * @typeParam C - Channel key within `EM`.
   * @typeParam T - Event type key within channel `C`.
   * @param channel - Channel to filter.
   * @param type - Event type to filter.
   * @param handler - Effect handler `(payload, getState, emit, event)`.
   * @returns Unsubscribe/teardown function.
   *
   * @example
   * ```ts
   * const off = store.onEffect('ui', 'increment', async (n, get, emit) => {
   *   if (n > 10) await emit('ui', 'increment', -10);
   * });
   * // later
   * off();
   * ```
   *
   * @public
   */
  public onEffect<
    C extends keyof EM & string,
    T extends keyof EM[C] & string
  >(
    channel: C,
    type: T,
    handler: (
      payload: EM[C][T],
      getState: () => DeepReadonly<S>,
      emit: Emit<EM>,
      event: Event<EM, C, T>,
    ) => void | Promise<void>,
  ): () => void {
    const effect: EffectFunction<DeepReadonly<S>, EM> = async (evt, getState, emit) => {
      if (evt.channel !== channel || evt.type !== type) return;

      const typed = evt as Event<EM, C, T>;
      return handler(typed.payload, getState, emit, typed);
    };

    return this.registerEffect({
      events: [[channel, type] as EventKey<EM>],
      effect,
    });
  }

  /**
   * Replaces the **entire** middleware pipeline (HMR-friendly).
   *
   * @param next - New middleware array.
   *
   * @example Hot module replacement
   * ```ts
   * if (import.meta.hot) {
   *   import.meta.hot.accept('./middleware', (newModule) => {
   *     store.replaceMiddleware(newModule.middleware);
   *   });
   * }
   * ```
   *
   * @public
   */
  public replaceMiddleware(next: MiddlewareFunction<DeepReadonly<S>, EM>[]): void {
    (this.middleware as any).length = 0;
    for (const mw of next) this.middleware.push(mw as any);
  }

  /**
   * Replaces all registered **effects** (HMR-friendly).
   *
   * @param next - New effects array (as EffectSpecs).
   *
   * @example Hot module replacement
   * ```ts
   * if (import.meta.hot) {
   *   import.meta.hot.accept('./effects', (newModule) => {
   *     store.replaceEffects(newModule.effects);
   *   });
   * }
   * ```
   *
   * @public
   */
  public replaceEffects(next: Array<EffectSpec<DeepReadonly<S>, EM>>): void {
    this.effects.clear();
    this.patternEffects.clear();
    for (const spec of next) {
      this.registerEffect(spec);
    }
  }

  /**
   * Replaces the entire **reducer set** (HMR-friendly).
   *
   * @param next - Map of slice specs keyed by slice name.
   * @param opts - `{ preserveState?: boolean }` (default `true`).
   *
   * @example Hot module replacement
   * ```ts
   * if (import.meta.hot) {
   *   import.meta.hot.accept('./reducers', (newModule) => {
   *     store.replaceReducers(newModule.reducers, { preserveState: true });
   *   });
   * }
   * ```
   *
   * @public
   */
  public replaceReducers(
    next: Record<R, ReducerSpec<S[R], EM>>,
    opts: { preserveState?: boolean } = {},
  ): void {
    const preserveState = opts.preserveState !== false; // default true

    const currentKeys = new Set(Object.keys(this.reducers as any));
    const nextEntries = Object.entries(next);
    const nextKeys = new Set(nextEntries.map(([k]) => k));

    // Remove slices that no longer exist
    for (const k of currentKeys) {
      if (!nextKeys.has(k)) this.unmountSlice(k as R, { deleteState: true });
    }

    // Add or update slices
    for (const [k, rSpec] of nextEntries) {
      if (currentKeys.has(k)) {
        // Update reducer impl + event wiring; preserve current state
        this.unmountSlice(k as R, { deleteState: false });
        this.mountSlice(k as R, rSpec as any, { preserveState });
      } else {
        // New slice
        this.mountSlice(k as R, rSpec as any, { preserveState: false });
      }
    }

  }

  /**
   * Convenience API to replace **any subset** of store parts (HMR patterns).
   *
   * @param partial - Partial replacement set.
   *
   * @example Replace everything
   * ```ts
   * store.hotReplace({
   *   reducer: newReducers,
   *   middleware: newMiddleware,
   *   effects: newEffects,
   *   preserveState: true
   * });
   * ```
   *
   * @public
   */
  public hotReplace(partial: {
    reducer?: Record<R, ReducerSpec<S[R], EM>>;
    middleware?: MiddlewareFunction<DeepReadonly<S>, EM>[];
    effects?: Array<EffectSpec<DeepReadonly<S>, EM>>;
    preserveState?: boolean;
  }): void {
    if (partial.middleware) this.replaceMiddleware(partial.middleware);
    if (partial.effects) this.replaceEffects(partial.effects);
    if (partial.reducer)
      this.replaceReducers(partial.reducer, { preserveState: partial.preserveState });
  }

  /**
   * Mounts a slice: installs reducer, initializes state (unless preserved),
   * and wires `(channel, type)` listeners on the reducer bus.
   *
   * @param name - Slice name.
   * @param rSpec - Reducer spec (state, events, reducer).
   * @param opts - `{ preserveState: boolean }` whether to keep existing state.
   *
   * @internal
   */
  private mountSlice(
    name: R,
    rSpec: ReducerSpec<S[R], EM>,
    opts: { preserveState: boolean },
  ): void {
    const rName = name as unknown as string;
    const { events, reducer, state, when } = rSpec;

    // Install reducer instance (FIXED: only pass reducer function)
    this.reducers[name] = new Reducer(reducer);

    // Initialize state unless preserving an existing value
    if (!opts.preserveState || (this.state as any)[rName] === undefined) {
      // Clone the user-provided initial state once so the store owns an
      // independent copy; freeze is dev-only.
      (this.state as any)[rName] = freezeInDev(structuredClone(state));
    }

    // Check if this is a pattern-based reducer (any, channel, channels)
    const isPatternBased =
      when &&
      (("any" in when && when.any === true) ||
        "channel" in when ||
        "channels" in when);

    if (isPatternBased) {
      // Store as pattern-based reducer for runtime matching
      this.patternReducers.set(name, when);
      // No unsubs needed for pattern reducers - they're called from emit loop
      this.sliceUnsubs.set(rName, []);
      return;
    }

    // Normalize event keys from `when: { keys }` or legacy `events`
    const eventKeys = this.normalizeEventKeys(rSpec);

    // If no targeting at all, treat as "all events" (pattern-based)
    if (eventKeys.length === 0 && !when && !events) {
      this.patternReducers.set(name, { any: true });
      this.sliceUnsubs.set(rName, []);
      return;
    }

    // Wire reducerBus listeners and save disposers for HMR
    const unsubs: Array<() => void> = [];
    for (const [ch, tp] of eventKeys) {
      const u = this.reducerBus.on(ch, tp, (payload) => {
        const event = { channel: ch, type: tp, payload, id: crypto.randomUUID() } as Event<
          EM,
          typeof ch,
          typeof tp
        >;
        this.forwardEvent(name, event as any);
      });

      unsubs.push(u);
    }

    this.sliceUnsubs.set(rName, unsubs);
  }

  /**
   * Unmounts a slice: disposes reducer-bus listeners, removes reducer,
   * and optionally deletes the slice state.
   *
   * @param name - Slice name.
   * @param opts - `{ deleteState: boolean }`.
   *
   * @internal
   */
  private unmountSlice(name: R, opts: { deleteState: boolean }): void {
    const rName = name as unknown as string;

    // Remove from pattern reducers if present
    this.patternReducers.delete(name);

    // Dispose reducerBus listeners
    const unsubs = this.sliceUnsubs.get(rName);
    if (unsubs) {
      for (const u of unsubs)
        try {
          u();
        } catch (e) {
          console.error(`[Store error]: ${e}`);
        }

      this.sliceUnsubs.delete(rName);
    }

    // Remove reducer instance
    delete this.reducers[name];

    // Optionally drop state
    if (opts.deleteState) delete (this.state as any)[rName];
  }

  /**
   * Normalizes event targeting from `when` or legacy `events` to an array of EventKeys.
   *
   * @param spec - Object with optional `when` and/or `events` properties.
   * @returns Array of `[channel, type]` pairs.
   *
   * @internal
   */
  private normalizeEventKeys(spec: {
    when?: When<EM>;
    events?: ReadonlyArray<EventKey<EM>>;
  }): ReadonlyArray<EventKey<EM>> {
    // Prefer `when` over legacy `events`
    if (spec.when) {
      const when = spec.when;

      if ("any" in when && when.any === true) {
        // Match all events - return all possible keys from EM
        // This requires runtime knowledge; we'll handle this specially in callers
        // For now, return empty and let caller handle "any" case
        return [];
      }

      if ("keys" in when) {
        return when.keys;
      }

      if ("channel" in when) {
        // Single channel - caller needs to handle dynamically
        // Return empty; this will be handled by special registration
        return [];
      }

      if ("channels" in when) {
        // Multiple channels - caller needs to handle dynamically
        return [];
      }
    }

    // Fall back to legacy `events` array
    if (spec.events) {
      return spec.events;
    }

    // No targeting specified
    return [];
  }

  /**
   * Reads a dotted path from an object (supports numeric array indices via string keys).
   *
   * @param obj - Root object (slice or value).
   * @param path - Dotted path; leading dot is ignored.
   * @returns The value at the path, or `undefined`.
   *
   * @internal
   */
  private getAtPath(obj: any, path: string): any {
    if (!path) return obj;

    // Normalize any accidental leading dots
    const clean = path[0] === "." ? path.slice(1) : path;
    const parts = clean.split(".");

    let cur = obj;
    for (const seg of parts) {
      if (cur == null) return undefined;
      cur = cur[seg as any];
    }
    return cur;
  }

  /**
   * Builds ancestor paths for a dotted path.
   *
   * For `"a.b.c"`, returns `["a", "a.b", "a.b.c"]`. Leading dots are trimmed.
   *
   * @param path - Dotted path string.
   * @returns Array of ancestor paths.
   *
   * @example
   * ```ts
   * Store.buildAncestorPaths('x.y.z'); // ['x','x.y','x.y.z']
   * ```
   *
   * @public
   */
  static buildAncestorPaths(path: string): string[] {
    if (!path) return [];

    const clean = path[0] === "." ? path.slice(1) : path;
    const parts = clean.split(".");
    const out: string[] = [];

    for (let i = 0; i < parts.length; i++) {
      out.push(parts.slice(0, i + 1).join("."));
    }

    return out;
  }
}

/**
 * Creates a store with explicit State and EventMap types.
 *
 * Use this overload for:
 * - **Event-only stores** (no reducers, just middleware/effects)
 * - When TypeScript inference from reducers isn't sufficient
 * - When you want to define the EventMap independently of reducers
 *
 * @typeParam S  - State record type (can be empty `{}` for event-only stores).
 * @typeParam EM - Event map type defining all `channel → type → payload` combinations.
 * @param cfg - Configuration with `name`, optional `reducer`, optional `middleware`, optional `effects`.
 * @returns A typed {@link StoreInstance}.
 *
 * @example Event-only store
 * ```ts
 * type AppEM = {
 *   notifications: { show: { message: string }; hide: void };
 * };
 *
 * const store = createStore<{}, AppEM>({
 *   name: 'NotificationBus',
 *   effects: [{
 *     when: { channel: 'notifications' },
 *     effect: (evt) => {
 *       if (evt.type === 'show') showToast(evt.payload.message);
 *     },
 *   }],
 * });
 * ```
 *
 * @example Explicit generics with reducers
 * ```ts
 * const store = createStore<AppState, AppEM>({
 *   name: 'App',
 *   reducer: { counter: counterSpec },
 *   middleware: [loggingMiddleware],
 * });
 * ```
 *
 * @public
 */
export function createStore<
  S extends Record<string, any>,
  EM extends EventMapBase,
>(cfg: {
  name: string;
  reducer?: { [K in keyof S]?: ReducerSpec<S[K], EM> };
  middleware?: MiddlewareFunction<DeepReadonly<S>, EM>[];
  effects?: Array<EffectSpec<DeepReadonly<S>, EM>>;
  dedupWindowMs?: number;
  devtools?: { allowReplay?: boolean };
  onEffectError?: (error: unknown, event: EventUnion<EM>) => void;
}): StoreInstance<keyof S & string, S, EM>;

/**
 * Creates a store with types inferred from the reducers map.
 *
 * This is the primary overload for most use cases where reducers define
 * both the state shape and the event map.
 *
 * @typeParam RM - Reducers map object with each slice's `ReducerSpec`.
 * @param cfg - Configuration with `name`, `reducer`, optional `middleware`, optional `effects`.
 * @returns A typed {@link StoreInstance}.
 *
 * @example
 * ```ts
 * const store = createStore({
 *   name: 'App',
 *   reducer: {
 *     counter: {
 *       state: { value: 0 },
 *       when: { keys: eventKeys<MyEM>()([['ui', 'increment']]) },
 *       reducer: (s, evt) => evt.type === 'increment' ? { value: s.value + evt.payload } : s
 *     }
 *   },
 *   middleware: [],
 *   effects: []
 * });
 * ```
 *
 * @public
 */
export function createStore<RM extends ReducersMapAny>(cfg: {
  name: string;
  reducer: RM;
  middleware?: MiddlewareFunction<DeepReadonly<StateFromReducers<RM>>, EMFromReducersStrict<RM>>[];
  effects?: Array<EffectSpec<DeepReadonly<StateFromReducers<RM>>, EMFromReducersStrict<RM>>>;
  dedupWindowMs?: number;
  devtools?: { allowReplay?: boolean };
  onEffectError?: (error: unknown, event: EventUnion<EMFromReducersStrict<RM>>) => void;
}): StoreInstance<keyof RM & string, StateFromReducers<RM>, EMFromReducersStrict<RM>>;

export function createStore(cfg: any) {
  type RM = typeof cfg.reducer;
  type S = StateFromReducers<RM>;
  type EM = EMFromReducersStrict<RM>;
  type RN = keyof RM & string;

  return new Store<EM, RN, S>({
    name: cfg.name,
    reducer: (cfg.reducer ?? {}) as unknown as Record<RN, ReducerSpec<S[RN], EM>>,
    middleware: (cfg.middleware ?? []) as any,
    effects: (cfg.effects ?? []) as any,
    dedupWindowMs: cfg.dedupWindowMs,
    devtools: cfg.devtools,
    onEffectError: cfg.onEffectError,
  });
}

/**
 * Utility to define **typed** `(channel, events[])` definitions for reducer specs.
 *
 * @typeParam EM - Event map for the store.
 * @param _ - Internal marker parameter (usually `events` array placeholder). Not used at runtime.
 * @returns A helper that, given a `channel` and a readonly `events` array, returns typed event keys.
 *
 * @example
 * ```ts
 * // In a ReducerSpec:
 * const events = typedEvents<EM>([])('ui', ['increment', 'decrement'] as const);
 * // events: ReadonlyArray<EventKey<EM>>
 * ```
 *
 * @public
 */
export const typedEvents = <EM extends EventMapBase>(_: string[][]) =>
  <C extends keyof EM & string, Evt extends readonly (keyof EM[C] & string)[]>(
    channel: C,
    events: Evt,
  ): ReadonlyArray<EventKey<EM>> => events.map((e) => [channel, e] as const);