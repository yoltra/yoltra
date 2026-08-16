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
  EventMeta,
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
  EmitResult,
  ConnectOptions,
  InstrumentationObserver,
  CascadeInfo,
  InstrumentedEvent,
  EventPhase,
  EventSubscriptionHandler,
  NarrowedEventHandler,
  When,
} from "../types";
import { freezeState } from "../utils/immutability";
import { isRejected } from "./rejection";
import { CallQueue } from "./callQueue";
import { CallAbortedError, CallTimeoutError, isReplyTo, parseReply } from "./call";
import type { CallHandle, CallOptions } from "./call";
import type { Rejection } from "./rejection";
import type { AliasWatch } from "../utils/immutability";

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
/**
 * Copies a slice's initial state so the store owns it, naming the slice if it cannot.
 *
 * @remarks
 * `structuredClone` refuses functions and drops class prototypes, and its `DataCloneError`
 * says only that something was uncloneable — not which slice, and not which key. For a store
 * built from several slices at once that leaves the developer bisecting their own
 * configuration. The message here names the slice and points at the usual cause.
 *
 * @internal
 */
function cloneInitialState<T>(sliceName: unknown, state: T): T {
  try {
    return structuredClone(state);
  } catch (err) {
    throw new Error(
      `[yoltra] Initial state for slice "${String(sliceName)}" could not be copied: ` +
        `${err instanceof Error ? err.message : String(err)}. State must be structured-cloneable ` +
        `— functions, class instances and DOM nodes are not. Keep behaviour out of state and ` +
        `store plain data.`,
    );
  }
}

function freezeInDev<T>(value: T, alias?: AliasWatch): DeepReadonly<T> {
  return process.env.NODE_ENV === "production"
    ? (value as unknown as DeepReadonly<T>)
    : freezeState(value, new WeakSet<object>(), alias);
}

/**
 * Default window (ms) for identity-based dedup via {@link EmitOptions.dedupKey}
 * when content-based dedup (`dedupWindowMs`) is disabled. Large enough to absorb
 * a synchronous re-fire (e.g. React Strict Mode's mount → unmount → mount),
 * small enough not to swallow genuine user repeats.
 */
const DEFAULT_DEDUP_KEY_WINDOW_MS = 100;

/**
 * Causal depth at which the store stops extending an event chain.
 *
 * @remarks
 * Chosen to be uncontroversial rather than tight. An event caused by an event caused by an event
 * is ordinary application wiring; sixty-four deep is a cycle. The cost of being wrong in the
 * generous direction is a cascade that runs a few more hops before it is named; the cost of being
 * wrong in the strict direction is refusing correct code, which would teach people to raise the
 * limit reflexively and defeat it.
 */
const DEFAULT_MAX_REDUCE_DEPTH = 64;

/**
 * How many ancestor ids {@link CascadeInfo.chain} carries.
 *
 * @remarks
 * A cascade is long by definition. The diagnostic value is in the cycle at the end — which
 * handler emitted back into which — not in the several thousand identical hops that preceded it,
 * and retaining all of them would make the guard against runaway memory itself retain
 * unboundedly.
 */
const CASCADE_CHAIN_LIMIT = 16;

/** Idle time a {@link Store.call} tolerates before giving up. */
const DEFAULT_CALL_TIMEOUT_MS = 30_000;

/** Progress events a call buffers before pacing the producer. */
const DEFAULT_CALL_WATERMARK = 16;

/**
 * One slice's pending write: computed, frozen, and not yet visible to anybody.
 *
 * @remarks
 * `prev` is retained because change notifications report old and new, and by the time they are
 * built the slice has already been replaced in `this.state` — the whole point of staging.
 *
 * @internal
 */
const NOT_COMMITTED: EmitResult = Object.freeze({ committed: false, written: false });
const COMMITTED_UNWRITTEN: EmitResult = Object.freeze({ committed: true, written: false });
const WRITTEN: EmitResult = Object.freeze({ committed: true, written: true });

interface StagedSlice {
  readonly name: string;
  readonly prev: unknown;
  readonly frozen: unknown;
  readonly leafPaths: string[];
}

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
   * Used for effects with explicit `keys` targeting.
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
  /**
   * Subscribers to events that actually changed state, notified after the commit.
   *
   * @remarks
   * Separate from `committedEventSubscribers` rather than a filter over it, because the two
   * answer different questions and one of them is load bearing: `committed` means "not vetoed"
   * and fires for every event a store accepts, including every event in a store with no
   * reducers. Narrowing it would have silently stopped toasts and analytics firing.
   *
   * @internal
   */
  private readonly writtenEventSubscribers = new Map<
    string,
    Set<EventSubscriptionHandler<DeepReadonly<S>, EM>>
  >();

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
   * Produces the `id` for each emitted event. Defaults to `crypto.randomUUID()`; overridable
   * via {@link StoreSpec.idFactory} for runtimes lacking it or for deterministic tests.
   *
   * @internal
   */
  private readonly idFactory: () => string;

  /**
   * Optional hook invoked when an effect throws/rejects. See
   * {@link StoreSpec.onEffectError}. `await emit()` never rejects on effect
   * failure — this is how callers observe effect errors.
   */
  private readonly onEffectError?: (error: unknown, event: EventUnion<EM>) => void;

  /**
   * Optional hook invoked when a reducer throws. See {@link StoreSpec.onReducerError}. The
   * failing slice is isolated rather than the event being rolled back, so this is the only
   * signal that a reducer misbehaved.
   */
  private readonly onReducerError?: (
    error: unknown,
    event: EventUnion<EM>,
    slice: string,
  ) => void;

  /**
   * `slice:channel:type` combinations already warned about for payload aliasing.
   *
   * @remarks
   * Development-only diagnostics have to stay quiet enough to be read. One warning names the
   * pattern; repeating it once per event would bury it.
   */
  private readonly warnedPayloadAliases = new Set<string>();

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
    meta?: EventMeta;
    resolve: (result: EmitResult) => void;
    parentId?: string;
    depth?: number;
    /** Ancestor ids, for {@link CascadeInfo.chain}. Never surfaced on the event itself. */
    chain?: readonly string[];
  }> = [];

  /**
   * Re-entrancy guard for the synchronous reduce phase.
   *
   * @internal
   */
  private isReducing = false;

  /**
   * The event currently being reduced, or `null` outside the drain.
   *
   * @remarks
   * This is what makes causality exact rather than best-effort. The drain is synchronous — no
   * `await` can interleave — so any `emit` that arrives while it is set is, without ambiguity, a
   * consequence of this event. That catches the case a scoped `emit` closure cannot: a
   * middleware or subscriber that captured the store and calls `store.emit` directly instead of
   * using the injected one. Attribution should not depend on which reference a consumer reached
   * for.
   *
   * @internal
   */
  private currentEvent: { id: string; depth: number; chain: readonly string[] } | null = null;

  /**
   * Events processed by the drain currently in progress. Compared against
   * `maxTransitionsPerDrain`, which is off unless configured.
   *
   * @internal
   */
  private transitionsThisDrain = 0;

  /**
   * Ceilings that stop a cascade from becoming a hung process. See {@link StoreSpec.maxReduceDepth}.
   *
   * @internal
   */
  private readonly maxReduceDepth: number;
  private readonly maxTransitionsPerDrain: number;
  private readonly onCascade?: (info: CascadeInfo<EM>) => void;
  private readonly onRejected?: (
    rejection: Rejection,
    event: EventUnion<EM>,
    slice: string,
  ) => void;

  /**
   * Registered instrumentation observers (DevTools seam). See {@link instrument}.
   *
   * @internal
   */
  private readonly instrumentObservers = new Set<InstrumentationObserver<EM>>();

  /**
   * Scratch array collecting slice-prefixed changed leaf paths during an
   * instrumented reduce. Set by {@link drainReduce} while observers are active;
   * appended to by {@link commitStaged}. `null` when not instrumenting.
   *
   * @internal
   */
  private changedPathSink: string[] | null = null;

  /**
   * Where keyed reducers put their pending writes during a reduce, and the refusal one of them
   * returned.
   *
   * @remarks
   * Keyed reducers are invoked through `reducerBus`, which delivers to handlers and has no way
   * to hand a value back — the same reason `changedPathSink` exists. `null` outside a reduce.
   *
   * @internal
   */
  private stagingSink: StagedSlice[] | null = null;
  private stagedRejection: Rejection | null = null;
  private stagedRejectedBy = "";

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
    this.idFactory = spec.idFactory ?? (() => crypto.randomUUID());
    this.onEffectError = spec.onEffectError;
    this.onReducerError = spec.onReducerError;

    // Depth is bounded whether or not anybody asked. The queue drains synchronously, so an
    // unbounded cascade is a frozen tab or a pinned core with no error to point at — a failure
    // mode a library should not require configuration to avoid.
    //
    // Width stays opt-in, because wide and deep mean different things: a fan-out (one event whose
    // subscriber emits five hundred siblings) is legitimate and wide, while a cascade is narrow
    // and deep. Depth separates them; a count cannot. See StoreSpec.maxTransitionsPerDrain.
    this.maxReduceDepth = spec.maxReduceDepth ?? DEFAULT_MAX_REDUCE_DEPTH;
    this.maxTransitionsPerDrain = spec.maxTransitionsPerDrain ?? Infinity;
    this.onCascade = spec.onCascade;
    this.onRejected = spec.onRejected;

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

    // The once-per-slice-and-event latch for the payload-aliasing warning. Left populated, a
    // disposed-and-recreated store — per-route stores, HMR, a test suite building one per case —
    // inherits the suppression and stays quiet about aliasing in code that has never been warned
    // about. The latch exists to stop a hot path becoming a log, not to silence the next store.
    this.warnedPayloadAliases.clear();

    // Release every subscription and observer. Without this, the closures they
    // hold (React fibers, DevTools sockets, effect handlers) pin the store and
    // leak on per-route / SSR / test / HMR stores that create and dispose stores.
    this.listeners.clear();
    this.committedEventSubscribers.clear();
    this.uncommittedEventSubscribers.clear();
    this.writtenEventSubscribers.clear();
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
   * Reports a breached ceiling and refuses the emit.
   *
   * @remarks
   * Console *and* hook, matching how reducer and effect errors are reported: a cascade is a
   * wiring bug, and the console line is what a developer who has not registered a hook will
   * actually see. Without one, refusing the emit would look exactly like the event never having
   * been emitted at all — which is the invisibility this whole guard exists to end.
   *
   * @internal
   */
  private reportCascade(
    limit: "maxReduceDepth" | "maxTransitionsPerDrain",
    limitValue: number,
    event: EventUnion<EM>,
    depth: number,
    chain: readonly string[],
  ): void {
    console.error(
      `[yoltra] Cascade stopped: "${event.channel}/${event.type}" would exceed ${limit} ` +
        `(${limitValue}). This event was refused and the chain ends here. A chain this long is ` +
        `almost always two consumers emitting into each other — check what reacts to ` +
        `"${event.channel}/${event.type}" and what that emits in turn.` +
        (chain.length > 0 ? ` Recent causal chain: ${chain.join(" → ")} → (refused).` : ""),
    );

    try {
      this.onCascade?.({ limit, limitValue, event, depth, chain });
    } catch (err) {
      // A throwing diagnostic must not become the failure it was reporting.
      console.error("onCascade handler error:", err);
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
    // Effects resume in their own task, after the drain that produced this event has ended, so
    // `currentEvent` is null by the time they run and cannot speak for them. This closure is how
    // an effect's emits stay attached to the event that triggered them — which is what bounds a
    // cascade that crosses drains rather than staying inside one.
    const emit = this.scopedEmit(event);

    // 1. Call key-based effects (O(1) lookup)
    const key = `${String(event.channel)}::${String(event.type)}`;
    const effectSet = this.effects.get(key);

    if (effectSet && effectSet.size > 0) {
      for (const h of [...effectSet]) {
        try {
          await h(event, this.getState, emit);
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
          await effect(event, this.getState, emit);
        } catch (e) {
          console.error("Effect error:", e);
          this.onEffectError?.(e, event);
        }
      }
    }
  }

  /**
   * An `emit` that attributes whatever it sends to `cause`.
   *
   * @remarks
   * Built per event rather than per effect: every effect reacting to one event shares a cause,
   * and one closure is cheaper than one per handler on a path that runs for every committed
   * event.
   *
   * @internal
   */
  private scopedEmit(cause: EventUnion<EM>): Emit<EM> {
    const parent = {
      id: cause.id,
      depth: cause.depth ?? 0,
      chain: [...(this.currentEvent?.chain ?? []), cause.id].slice(-CASCADE_CHAIN_LIMIT),
    };
    return ((channel, type, payload, opts) =>
      this.emitCaused(parent, channel, type, payload, opts)) as Emit<EM>;
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
    phase: "committed" | "uncommitted" | "written",
  ): void {
    const key = `${String(event.channel)}::${String(event.type)}`;

    // Notify phase-specific subscribers
    const phaseMap =
      phase === "committed"
        ? this.committedEventSubscribers
        : phase === "written"
          ? this.writtenEventSubscribers
          : this.uncommittedEventSubscribers;
    const phaseSet = phaseMap.get(key);

    if (phaseSet?.size) {
      for (const handler of [...phaseSet]) this.invokeEventSubscriber(handler, event, phase);
    }

    // Notify 'all' subscribers.
    //
    // Deliberately not reached for `written`. An event that writes is also committed, so folding
    // it in would hand every existing 'all' subscriber a second notification for the same event
    // and quietly double their counts — a silent change to code that never asked for the new
    // phase. `all` means committed-or-uncommitted, as it always has.
    if (phase === "written") return;
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
    phase: "committed" | "uncommitted" | "written",
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
   * A slice whose state **is** a single value — a primitive, a `Map`/`Set`, a `Date` — has no
   * leaf below its root, and `detectChangedProps` reports its change as the empty path `""`.
   * That path is emitted as-is, so `connect({ reducer, property: "" })` (and any `**` pattern)
   * hears it. It has no ancestors to walk.
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
  /**
   * Reduces one slice and contains any error it raises.
   *
   * @returns `true` when the slice changed.
   *
   * @remarks
   * The single funnel both dispatch paths go through, which is the point. Keyed reducers run
   * through `reducerBus`, whose handler loop caught and logged; pattern reducers were called
   * straight from the drain, so their errors escaped to the caller instead. The same bug in the
   * same reducer therefore produced two different outcomes depending on how the slice happened
   * to be targeted — a keyed reducer's throw let the event commit and its effects run, while a
   * pattern reducer's throw aborted the commit and notified nobody, not even the uncommitted
   * subscribers a veto would have reached.
   *
   * The semantics are the same either way: **the failing slice is isolated.** Its state is
   * unchanged, every other slice still reduces, and the event still commits if anything else
   * changed.
   *
   * That is deliberately *not* what a {@link Rejected} refusal does, which discards the whole
   * event. A crash and a refusal are different acts: a reducer that throws has a bug and should
   * not be able to veto its neighbours' work, while a reducer that refuses has made a decision
   * and must be able to.
   *
   * This once argued that rolling back was untenable, because subscribers were notified as each
   * slice committed and a later revert would have told them about a value that no longer
   * existed. Staging removed that obstacle — nothing is notified until every slice is written —
   * which is what made refusal possible at all.
   *
   * @internal
   */
  private stageSliceGuarded<C extends keyof EM & string, T extends keyof EM[C] & string>(
    rName: R,
    event: Event<EM, C, T>,
    staged: StagedSlice[],
  ): Rejection | null {
    try {
      return this.stageSlice(rName, event, staged);
    } catch (err) {
      // Reported through a hook as well as the console: a reducer throwing is a bug in
      // application code, and until now the only trace of it was a console line in one case and
      // an exception surfacing somewhere unrelated in the other.
      console.error(`Reducer error in slice "${rName as string}":`, err);
      this.onReducerError?.(err, event as EventUnion<EM>, rName as string);
      return null;
    }
  }

  /**
   * Runs one slice's reducer and records what it *would* write. Writes nothing.
   *
   * @returns The reducer's {@link Rejection} if it refused, otherwise `null`.
   *
   * @remarks
   * The staging half of the write path. Nothing here touches `this.state` or notifies anybody,
   * which is what lets the event be refused after every reducer has had its say — a decision
   * that has to see the whole diff cannot be made one slice at a time.
   *
   * Freezing happens here rather than at commit because it is where the new value is built, and
   * the freeze is a no-op on anything already frozen; a staged slice that never commits is
   * discarded frozen, which costs nothing and keeps the committed path free of a second walk.
   *
   * @internal
   */
  private stageSlice<C extends keyof EM & string, T extends keyof EM[C] & string>(
    rName: R,
    event: Event<EM, C, T>,
    staged: StagedSlice[],
  ): Rejection | null {
    // @ts-expect-error R indexing on DeepReadonly<S> is valid at runtime
    const prev = this.state[rName] as S[R];
    const next = this.reducers[rName].reduce(prev, event as any);

    // A refusal, not a value. Checked before the identity comparison below, because a rejection
    // object is never the previous state and would otherwise be staged as one.
    if (isRejected(next)) return next;

    // if reducer returned same ref, definitely no change
    if (prev === next) return null;

    // Compute precise leaf paths that changed (relative to slice root).
    //
    // Not filtered for truthiness. `""` is how `detectChangedProps` reports a change at the
    // slice ROOT — a slice that *is* one value: a primitive, a `Map`/`Set`, a `Date`, or an
    // object replaced by something of a different shape. Discarding it as falsy made the
    // length check below read "nothing changed", so the write path returned before assigning
    // `this.state`: the reducer ran, its result was thrown away, and nothing said so. A store
    // holding `state: 0` could never leave `0`.
    const leafPaths = detectChangedProps(prev, next);

    // if nothing actually changed at the leaves, treat as a no-op
    if (leafPaths.length === 0) return null;

    // No deep clone: the reducer already returned a fresh `next` (purity contract), so
    // structural sharing is preserved and freezeInDev only touches new nodes.
    // In development the freeze walk also watches for the event payload appearing in the new
    // state by reference. That is the aliasing that makes a deep in-place freeze surprising:
    // the caller still holds the object, mutating it later throws from an unrelated stack, and
    // the same code works in production because the freeze is compiled out. Warned once per
    // slice and event so a hot path does not become a log.
    const payload = (event as { payload?: unknown }).payload;
    const alias: AliasWatch | undefined =
      process.env.NODE_ENV !== "production" && payload !== null && typeof payload === "object"
        ? {
            watch: payload,
            onFound: () => {
              const key = `${rName as string}:${event.channel}:${event.type}`;
              if (this.warnedPayloadAliases.has(key)) return;
              this.warnedPayloadAliases.add(key);
              console.warn(
                `[yoltra] Slice "${rName as string}" stored the payload of ` +
                  `"${event.channel}/${event.type}" by reference. It is now frozen along with ` +
                  `the rest of the state, so the emitter mutating it later will throw in ` +
                  `development and silently corrupt state in production. Copy the payload in ` +
                  `the reducer instead.`,
              );
            },
          }
        : undefined;

    staged.push({
      name: rName as string,
      prev,
      frozen: freezeInDev(next, alias),
      leafPaths,
    });

    return null;
  }

  /**
   * Writes every staged slice, then tells the world — in that order.
   *
   * @remarks
   * The commit half. Assigning all slices under a single new root before any notification goes
   * out is what closes the window this used to leave open: notifications fired per slice as each
   * committed, so a subscriber to slice A that read `getState()` could observe slice B of the
   * *same event* not yet applied. In React that window is real, because the atomic hooks use a
   * change as a bare signal and then re-read the whole store.
   *
   * It is also what makes refusal possible at all. The previous code documented rollback as
   * untenable precisely because "an event that reverted afterwards would have already told
   * components about a value that no longer exists" — true when notification and commit were the
   * same step, and no longer true now that they are not.
   *
   * @returns `true` if anything was written.
   *
   * @internal
   */
  private commitStaged(staged: StagedSlice[], event: EventUnion<EM>): boolean {
    if (staged.length === 0) return false;

    // One new root for the whole event, not one per slice.
    const nextState = { ...(this.state as object) } as Record<string, unknown>;
    for (const slice of staged) nextState[slice.name] = slice.frozen;
    this.state = nextState as DeepReadonly<S>;

    // Record slice-prefixed changed leaf paths for any active instrumentation
    // (lets DevTools agents build precise patches without re-diffing state).
    if (this.changedPathSink) {
      for (const slice of staged) {
        for (const p of slice.leafPaths) {
          this.changedPathSink.push(p ? `${slice.name}.${p}` : slice.name);
        }
      }
    }

    // Every notification happens after every write, so any handler reading `getState()` sees the
    // event applied in full.
    for (const slice of staged) {
      // emit deep + ancestor paths once each
      const toEmit = new Set<string>();
      for (const p of slice.leafPaths) {
        // The slice root has no ancestors to walk — `buildAncestorPaths("")` is `[]` by contract,
        // which is what callers holding a real path rely on — so it is added directly. Without
        // this a slice that is entirely one value changes and tells nobody, which is the
        // subscription half of the same bug the missing filter caused in the commit half.
        if (p === "") {
          toEmit.add("");
          continue;
        }
        for (const a of Store.buildAncestorPaths(p)) toEmit.add(a);
      }

      for (const prop of toEmit) {
        // Built only if a handler matched. Reading the old and new value walks the state tree
        // twice per path, and a slice nobody subscribes to used to pay that for every path it
        // changed — describing the change in detail to an audience of nobody.
        this.connectorBus.emitWith(slice.name as R, prop, () => ({
          oldValue: this.getAtPath(slice.prev, prop),
          newValue: this.getAtPath(slice.frozen, prop),
          path: prop,
          // Provenance, built inside the same lazy factory as the values: a subscriber that
          // needs to know why a value moved no longer has to mirror the cause into state and
          // keep it there twice.
          eventId: event.id,
          channel: event.channel as string,
          type: event.type as string,
        }));
      }
    }

    return true;
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
   * shallow spread. This ensures consistent immutability with {@link commitStaged}.
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
      // Throws, like `__replayEvents`. Both replace state wholesale on behalf of a devtools
      // client; one refusing loudly while the other returned quietly meant a disabled seam
      // looked like a working one that had simply found nothing to do.
      throw new Error(
        "[yoltra] External state apply (time-travel) is disabled. Enable it with createStore({ devtools: { allowReplay: true } })",
      );
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

      // Full dotted leaf paths relative to the slice. Unfiltered, for the reason given in
      // `stageSlice`: `""` is a genuine root-level change, not an absent one. Time travel
      // onto a primitive slice committed the state here but emitted nothing, so a component
      // subscribed through `connect` kept rendering the value it had before the jump.
      const leafPaths = detectChangedProps(prevSlice, nextSlice);
      if (leafPaths.length === 0) return;

      // emit every leaf AND its ancestors once
      const toEmit = new Set<string>();
      for (const p of leafPaths) {
        if (p === "") {
          toEmit.add("");
          continue;
        }
        for (const a of Store.buildAncestorPaths(p)) toEmit.add(a);
      }

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
    events: Array<{ channel: string; type: string; payload: any; id: string; meta?: EventMeta }>,
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

      // Staged and committed exactly as a live event is, so a replay reproduces the same state
      // by the same path — including a reducer that refuses, which must refuse identically or
      // the replayed history is not the history.
      const staged: StagedSlice[] = [];
      this.stagingSink = staged;
      let rejection: Rejection | null = null;

      try {
        // Run key-based reducers via reducerBus. The event travels alongside the payload so
        // keyed reducers observe the replayed event's real id, exactly like pattern reducers.
        this.reducerBus.emit(event.channel as any, event.type as any, event.payload, event as any);
        rejection = this.stagedRejection;

        // Run pattern-based reducers. Guarded like the live path: one bad event in a replayed log
        // should cost that event, not abandon the replay halfway through with the store left at
        // whatever state it happened to reach.
        for (const [sliceName, when] of this.patternReducers) {
          if (rejection !== null) break;
          if (this.matchesWhen(when, event)) {
            const refused = this.stageSliceGuarded(sliceName, event as any, staged);
            if (refused !== null) rejection = refused;
          }
        }
      } finally {
        this.stagingSink = null;
        this.stagedRejection = null;
        this.stagedRejectedBy = "";
      }

      const anySliceChanged = rejection === null && this.commitStaged(staged, event);

      // Notify committed event subscribers (sync, fire-and-forget)
      this.notifyEventSubscribers(event, "committed");

      // Notify coarse subscribers if state changed
      if (anySliceChanged) {
        this.notifyEventSubscribers(event, "written");
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
   * if any slice changed. Works because {@link commitStaged} creates a new state reference
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
  ): Promise<EmitResult> {
    return this.emitCaused(null, channel, type, payload, opts);
  }

  /**
   * The real emit, with an explicitly supplied cause.
   *
   * @remarks
   * Exists so the parent can be passed without a pseudo-private field on the public
   * {@link EmitOptions}. Two callers supply one: the public {@link emit} passes `null` and lets
   * `currentEvent` speak for the synchronous case, and the scoped `emit` handed to effects passes
   * the event that triggered them — effects resume after the drain has ended, so nothing else
   * could still know what caused them.
   *
   * @internal
   */
  private async emitCaused<C extends keyof EM & string, T extends keyof EM[C] & string>(
    scopedParent: { id: string; depth: number; chain: readonly string[] } | null,
    channel: C,
    type: T,
    payload: EM[C][T],
    opts?: EmitOptions,
  ): Promise<EmitResult> {
    // Deduplication is OPT-IN (see EmitOptions / StoreSpec.dedupWindowMs).
    // Content-based dedup runs only when `dedupWindowMs > 0`; identity-based
    // dedup runs when an explicit `dedupKey` is supplied. By default neither is
    // active, so legitimate rapid-fire identical events are never silently dropped.
    const dedupKey = opts?.dedupKey;
    const contentWindow = this.dedupConfig.windowMs;
    // `skipDedup` wins over both the per-emit key and the store-level window: callers that
    // already guarantee distinctness must not have events silently coalesced by payload.
    if (opts?.skipDedup !== true && (contentWindow > 0 || dedupKey !== undefined)) {
      const windowMs =
        dedupKey !== undefined && contentWindow <= 0 ? DEFAULT_DEDUP_KEY_WINDOW_MS : contentWindow;
      const fp =
        dedupKey !== undefined
          ? `${channel}::${type}::#${dedupKey}`
          : this.fingerprint(channel as string, type as string, payload);
      if (this.shouldDedupe(fp, windowMs)) {
        // A suppressed duplicate never reaches middleware or a reducer, so it is neither
        // committed nor written — the same answer a vetoed event gives, which is correct: in
        // both cases the caller's event had no effect.
        return NOT_COMMITTED;
      }
    }

    // Assign a unique id and a completion deferred, resolved after this event's
    // effects run. Reducers run synchronously (see drainReduce), so state is
    // already updated before emit() returns; the returned promise tracks the
    // async effect phase for `await emit(...)`.
    const id = opts?.id ?? this.idFactory();

    // Causality. `currentEvent` is set only inside the synchronous drain, so if it is set this
    // emit is a consequence of that event — no matter whether the caller used the injected
    // `emit` or reached for `store.emit` directly. Outside the drain, an explicitly scoped
    // parent (given to effects, which resume after the drain has ended) supplies it instead.
    const parent = this.currentEvent ?? scopedParent;
    const depth = parent === null ? 0 : parent.depth + 1;

    if (parent !== null && depth > this.maxReduceDepth) {
      // Refused, not thrown: the throw would land in whichever frame happened to be emitting.
      // Guarded on `parent` as well as depth — a root is depth 0 and can only breach a ceiling
      // set below zero, and refusing the caller's own emit is never the right answer.
      this.reportCascade(
        "maxReduceDepth",
        this.maxReduceDepth,
        {
          channel,
          type,
          payload,
          id,
          ...(opts?.meta !== undefined ? { meta: opts.meta } : {}),
          parentId: parent.id,
          depth,
        } as EventUnion<EM>,
        depth,
        parent.chain,
      );
      return NOT_COMMITTED;
    }

    let resolve!: (result: EmitResult) => void;
    const done = new Promise<EmitResult>((r) => {
      resolve = r;
    });

    this.reduceQueue.push({
      channel: channel as string,
      type: type as string,
      payload,
      id,
      meta: opts?.meta,
      resolve,
      // Only carried for caused events, so a root event's object stays byte-identical to one
      // built before causality existed — the same rule `meta` follows.
      ...(parent !== null ? { parentId: parent.id, depth, chain: parent.chain } : {}),
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
    this.transitionsThisDrain = 0;
    try {
      while (this.reduceQueue.length > 0) {
        const next = this.reduceQueue.shift()!;
        const { channel, type, payload, id, meta, resolve, parentId, depth, chain } = next;

        // Conditional spread, not `meta` unconditionally: when no metadata was supplied the
        // event object stays byte-identical to one built before `meta` existed, so
        // Object.keys / JSON.stringify / toStrictEqual behaviour is unchanged. `parentId` and
        // `depth` follow the same rule, and are absent on a root event.
        const event = {
          channel,
          type,
          payload,
          id,
          ...(meta !== undefined ? { meta } : {}),
          ...(parentId !== undefined ? { parentId, depth } : {}),
        } as EventUnion<EM>;

        // Width ceiling, checked as the event is dequeued rather than as it is emitted: a burst
        // is only excessive relative to the pass draining it, and at emit time there is no pass
        // yet. Off unless configured — see StoreSpec.maxTransitionsPerDrain.
        //
        // The root is never refused. It is the caller's own emit, not part of any burst, and a
        // ceiling that rejected it would turn "this store's cascades are bounded" into "this
        // store randomly drops the event you just sent". Only what the drain caused can be
        // excessive, which is also why `depth` and `chain` are known to be set here.
        if (parentId !== undefined && ++this.transitionsThisDrain > this.maxTransitionsPerDrain) {
          this.reportCascade(
            "maxTransitionsPerDrain",
            this.maxTransitionsPerDrain,
            event,
            depth as number,
            chain as readonly string[],
          );
          // Resolve rather than abandon: a caller awaiting this emit would otherwise hang, which
          // is the failure the ceiling exists to prevent, arriving by another door.
          resolve(NOT_COMMITTED);
          continue;
        }

        // Anything emitted from here until the end of this iteration is caused by this event.
        // The drain is synchronous, so this is exact rather than a heuristic — and it holds even
        // when a consumer calls `store.emit` directly instead of the injected `emit`.
        this.currentEvent = {
          id,
          depth: depth ?? 0,
          chain: [...(chain ?? []), id].slice(-CASCADE_CHAIN_LIMIT),
        };

        // Instrumentation: capture prev state, collect changed paths, and time
        // the synchronous reduce — all skipped entirely when no observers.
        const instrumenting = this.instrumentObservers.size > 0;
        const prevState = instrumenting ? this.state : undefined;
        const sink: string[] | undefined = instrumenting ? [] : undefined;
        if (sink !== undefined) this.changedPathSink = sink;
        const t0 = instrumenting ? now() : 0;

        let result: EmitResult = NOT_COMMITTED;
        try {
          result = this.applyEventSync(event);
        } catch (err) {
          console.error("Emit reduce error:", err);
        } finally {
          if (instrumenting) this.changedPathSink = null;
          // Cleared before effects are scheduled. Effects resume in a later task, when this
          // event is no longer what the drain is processing; they carry their cause explicitly
          // through the scoped emit instead.
          this.currentEvent = null;
        }

        if (instrumenting) {
          this.emitInstrumentation(
            event,
            result,
            sink ?? [],
            prevState as DeepReadonly<S>,
            now() - t0,
          );
        }

        // Run this event's effects as an independent task and resolve its
        // completion deferred when they finish. Independent per-event tasks
        // (rather than one shared serialized loop) let an effect `await` a
        // re-entrant emit without deadlocking.
        void this.runEventEffects(event, result, resolve);
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
  private applyEventSync(event: EventUnion<EM>): EmitResult {
    // Middleware (synchronous). Return false to veto; async work belongs in effects.
    for (const mwInput of this.middleware) {
      const when = this.getMiddlewareWhen(mwInput);
      if (!this.matchesWhen(when, event)) continue;
      const mw = this.getMiddlewareFunction(mwInput);
      let ok: boolean;
      try {
        ok = mw(this.state, event, this.emit);
        if (
          process.env.NODE_ENV !== "production" &&
          typeof (ok as unknown as { then?: unknown })?.then === "function"
        ) {
          // A Promise is truthy, so an async middleware silently allows everything: the event
          // commits while the middleware is still deciding, and the veto it was written to
          // perform can never fire. Caught here because the symptom — a rule that simply does
          // not apply — looks nothing like its cause.
          console.error(
            `[yoltra] Middleware for "${event.channel}/${event.type}" returned a Promise. ` +
              `Middleware is synchronous: a Promise is truthy, so this event was allowed ` +
              `without waiting and a "return false" inside it can never veto. Do the check ` +
              `synchronously, and put anything that must await in an effect.`,
          );
        }
      } catch (err) {
        console.error("Middleware error:", err);
        ok = false;
      }
      if (!ok) {
        // Rejected by middleware — notify uncommitted subscribers, do not commit.
        this.notifyEventSubscribers(event, "uncommitted");
        return NOT_COMMITTED;
      }
    }

    // Reduce every matching slice into a staging list. Nothing is written yet, so a refusal
    // arriving from the last reducer can still stop the first one's write.
    const staged: StagedSlice[] = [];
    this.stagingSink = staged;
    let rejection: Rejection | null = null;
    let rejectedBy = "";

    try {
      // Pass the event itself, not just the payload: keyed reducers are wired through
      // `reducerBus` in `mountSlice` and would otherwise have to invent an id.
      this.reducerBus.emit(
        event.channel as any,
        event.type as any,
        event.payload as any,
        event as any,
      );
      rejection = this.stagedRejection;
      rejectedBy = this.stagedRejectedBy;

      for (const [sliceName, when] of this.patternReducers) {
        if (rejection !== null) break;
        if (this.matchesWhen(when, event)) {
          const refused = this.stageSliceGuarded(sliceName, event as any, staged);
          if (refused !== null) {
            rejection = refused;
            rejectedBy = sliceName as string;
          }
        }
      }
    } finally {
      this.stagingSink = null;
      this.stagedRejection = null;
      this.stagedRejectedBy = "";
    }

    // A refusal discards every staged slice, not just the refusing one. Authorising a write to
    // one slice while a sibling records it as accepted is not authorisation — and a caller told
    // "rejected" must not find half of its event applied.
    if (rejection !== null) {
      this.onRejected?.(rejection, event, rejectedBy);
      this.notifyEventSubscribers(event, "committed");
      return { committed: true, written: false, rejected: rejection };
    }

    const written = this.commitStaged(staged, event);

    // Committed subscribers fire whether or not anything was written — `committed` means "not
    // vetoed", which is what a notification or analytics bus depends on. `written` is the
    // stricter fact, and fires after the commit so a handler reading getState() sees it.
    this.notifyEventSubscribers(event, "committed");
    if (written) {
      this.notifyEventSubscribers(event, "written");
      this.listeners.forEach((l) => l());
    }
    return written ? WRITTEN : COMMITTED_UNWRITTEN;
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
    result: EmitResult,
    resolve: (result: EmitResult) => void,
  ): Promise<void> {
    this.inFlightEffects++;
    try {
      if (result.committed) await this.notifyEffects(event);
    } catch (err) {
      console.error("Effect error:", err);
    } finally {
      this.inFlightEffects--;
      resolve(result);
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
   * by {@link commitStaged} during this reduce, so DevTools patches need no
   * re-diff.
   *
   * @internal
   */
  private emitInstrumentation(
    event: EventUnion<EM>,
    result: EmitResult,
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
        // Conditional, so an event without metadata produces an observer payload
        // byte-identical to the pre-`meta` shape.
        ...(event.meta !== undefined ? { meta: event.meta } : {}),
      },
      committed: result.committed,
      changedPaths,
      prevValues,
      nextValues,
      reduceTimeMs,
      // Present only when a reducer refused, so an observer can tell a refusal from a veto —
      // identical in state, entirely different in cause.
      ...(result.rejected !== undefined ? { rejected: result.rejected } : {}),
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
  public connect(
    spec: { reducer: R; property: string },
    h: (chg: Change) => void,
    options?: ConnectOptions,
  ): () => void {
    const off = this.connectorBus.on(spec.reducer, spec.property, h);

    if (options?.immediate === true) {
      // @ts-expect-error R indexing on DeepReadonly<S> is valid at runtime
      const slice = this.state[spec.reducer] as unknown;
      // A pattern matches a set of paths, and a set has no single current value — so the slice
      // root is delivered instead, at the path a whole-slice subscription would use.
      // Same test the bus uses to tell a pattern from an exact path.
      const path = spec.property.includes("*") ? "" : spec.property;

      // No `eventId`, `channel` or `type`: nothing caused this, and inventing a cause would be
      // a lie a subscriber could act on. `oldValue` is undefined for the same reason — there is
      // no previous value, only a first one.
      h({ oldValue: undefined, newValue: this.getAtPath(slice, path), path });
    }

    return off;
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
          : phase === "written"
            ? this.writtenEventSubscribers
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
   * @param mw - Middleware `(state, event, emit) => boolean`. Return `false` to cancel event
   *        propagation.
   * @returns Unsubscribe function that removes this middleware.
   *
   * @remarks
   * **Synchronous, and that is the contract.** The reduce phase completes before `emit()`
   * returns, so the commit decision has to be available in the same tick. An `async` middleware
   * returns a Promise, every Promise is truthy, and the veto would therefore never fire — the
   * event would commit while the middleware was still deciding. The type rejects it; this note
   * exists because the examples here used to teach it. Do authorization and validation here, and
   * anything that needs to await in an effect.
   *
   * @example Logging middleware
   * ```ts
   * const off = store.registerMiddleware((state, event) => {
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
  public registerMiddleware(mw: MiddlewareInput<DeepReadonly<S>, EM>): Unsubscribe {
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
   * @param spec - Reducer spec (state, when, reducer).
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
    // `hasOwnProperty`, not `in`: the registry is a plain object, so `in` also answers true for
    // everything on `Object.prototype`. A slice legitimately named `toString`, `constructor` or
    // `valueOf` was refused as already existing — with a message naming a reducer that does not
    // exist, which is the least useful place to send someone.
    if (Object.prototype.hasOwnProperty.call(this.reducers, name)) {
      throw new Error(`Reducer ${name} already exists`);
    }

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
   * @param spec - Effect specification with `when` targeting and `effect` (handler).
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
  /**
   * Sends a request and waits for the reply, correlating the two automatically.
   *
   * @typeParam C  - Request channel.
   * @typeParam T  - Request type within `C`.
   * @param channel - Channel to send on.
   * @param type - Event type to send.
   * @param payload - The **request** payload. This is what you are sending; what comes back is
   * described by {@link CallOptions.reply}, not by this.
   * @param opts - Which replies end the call, and how long to wait. See {@link CallOptions}.
   * @returns A {@link CallHandle}: `await` it for the terminal reply, or `for await` it for
   * progress events as they arrive.
   *
   * @remarks
   * Every consumer of an event bus eventually writes request/reply by hand — mint an id,
   * subscribe, match, time out, unsubscribe — and every one of them writes the same eighty lines
   * with the same two bugs: the subscription outlives the call, and a responder that forgets to
   * echo the id produces a timeout with nothing to point at. This is that, once.
   *
   * **Correlation is causal.** The store stamps `parentId` on anything emitted while an event is
   * being handled, so a responder that replies through the `emit` it was handed is already
   * correlated. There is no id to mint, echo, or forget:
   *
   * ```ts
   * store.registerEffect({
   *   when: { keys: [["rpc", "ask"]] },
   *   effect: async (event, _get, emit) => {
   *     await emit("rpc", "answer", await lookup(event.payload.q));
   *   },
   * });
   * ```
   *
   * **The reply carries its own discriminant.** A call resolves to the *event*, not the payload,
   * because a caller often cannot know which kind of reply it will get:
   *
   * ```ts
   * const res = await store.call("rpc", "ask", { q }, { reply: ["rpc", ["answer", "error"]] });
   * switch (res.type) {
   *   case "answer": return res.payload;
   *   case "error":  throw new Error(res.payload.reason);
   * }
   * ```
   *
   * **Progress streams, with backpressure.** Any correlated event that is not terminal is
   * progress, and iterating the call consumes it. The producer genuinely waits: `emit` resolves
   * only once its effects have run, and the collector is an effect that does not return until the
   * consumer has taken the item. A responder writing `await emit("rpc", "progress", chunk)` is
   * therefore paced by the reader, with nothing buffering without bound.
   *
   * ```ts
   * const call = store.call("job", "start", { id }, {
   *   reply: ["job", "done"],
   *   highWaterMark: 4,
   * });
   * for await (const step of call) await render(step.payload); // producer waits on this
   * const { payload } = await call;
   * ```
   *
   * Backpressure engages **once you begin iterating**. A call that is only awaited never pulls,
   * so blocking its producer would deadlock the call itself — progress nobody reads would stop
   * the terminal event from ever being sent. Un-iterated progress therefore buffers to
   * `highWaterMark` and is then counted on {@link CallHandle.dropped} rather than blocking.
   *
   * **This is a local primitive.** A reply cannot reach it from a federated peer: the federation
   * envelope carries neither `meta` nor `parentId`, and ingress namespaces the channel, so
   * neither correlation nor the reply route survives the hop. That is not an oversight to route
   * around — federation answers cross-node request/reply with typed peer *queries*, which are
   * gated by a responder policy that may concede or deny. A call that federated silently would
   * turn that access decision into an accident of which channel someone named. Ask a peer with a
   * query; use `call` within a process.
   *
   * @example Timeout is idle, not total
   * ```ts
   * // Survives a job that streams for minutes; fails a responder that goes quiet for 5s.
   * await store.call("job", "start", { id }, { reply: ["job", "done"], timeoutMs: 5_000 });
   * ```
   *
   * @example Cancelling
   * ```ts
   * const call = store.call("rpc", "ask", { q }, { reply: ["rpc", "answer"] });
   * useEffect(() => () => call.cancel("unmounted"), [call]);
   * ```
   *
   * @public
   */
  public call<C extends keyof EM & string, T extends keyof EM[C] & string>(
    channel: C,
    type: T,
    payload: EM[C][T],
    opts: CallOptions<EM>,
  ): CallHandle<EventUnion<EM>, EventUnion<EM>> {
    const { channel: replyChannel, isTerminal } = parseReply<EM>(opts.reply);
    const idleMs = opts.timeoutMs ?? DEFAULT_CALL_TIMEOUT_MS;
    const queue = new CallQueue<EventUnion<EM>>(opts.highWaterMark ?? DEFAULT_CALL_WATERMARK);

    // Minted here rather than left to `emit`, because the correlation has to be known before the
    // request goes out — a reply can arrive during the emit itself, synchronously.
    const requestId = this.idFactory();

    let settle!: (event: EventUnion<EM>) => void;
    let fail!: (error: Error) => void;
    let settled = false;
    const terminal = new Promise<EventUnion<EM>>((resolve, reject) => {
      settle = resolve;
      fail = reject;
    });
    // Attached immediately so a rejection that nobody has awaited yet is not reported as
    // unhandled; the caller's own await still sees it.
    terminal.catch(() => undefined);

    let timer: ReturnType<typeof setTimeout> | null = null;
    let unregister: (() => void) | null = null;

    /**
     * Settles the call once. `graceful` distinguishes a terminal reply — after which the
     * consumer is still owed whatever progress it has not read — from an abort, after which
     * nothing is owed to anyone.
     */
    const finish = (fn: () => void, graceful = false): void => {
      if (settled) return;
      settled = true;
      if (timer !== null) clearTimeout(timer);
      timer = null;
      unregister?.();
      unregister = null;
      if (graceful) queue.end();
      else queue.close();
      opts.signal?.removeEventListener("abort", onAbort);
      fn();
    };

    function onAbort(): void {
      finish(() => fail(new CallAbortedError(String(opts.signal?.reason ?? "signal aborted"))));
    }

    const arm = (): void => {
      if (timer !== null) clearTimeout(timer);
      // Idle: every correlated event pushes the deadline out, so a streaming responder is not
      // punished for having a lot to say.
      timer = setTimeout(() => {
        finish(() => fail(new CallTimeoutError(channel, type, idleMs)));
      }, idleMs);
      (timer as { unref?: () => void }).unref?.();
    };

    unregister = this.registerEffect({
      // A pattern effect on the reply channel: which types are terminal is known, which are
      // progress is not, so the filter cannot be a key list.
      when: { channel: replyChannel as keyof EM & string },
      effect: async (event) => {
        if (settled) return;
        if (!isReplyTo<EM>(event, requestId, opts.correlationId)) return;

        arm();

        if (isTerminal(String(event.type))) {
          finish(() => settle(event), true);
          return;
        }

        // The await is the backpressure. This runs inside the store's effect phase, so the
        // responder's own `await emit(...)` does not resolve until it returns.
        await queue.put(event);
      },
    });

    if (opts.signal !== undefined) {
      if (opts.signal.aborted) onAbort();
      else opts.signal.addEventListener("abort", onAbort, { once: true });
    }

    arm();

    void this.emit(channel, type, payload, {
      id: requestId,
      ...(opts.correlationId !== undefined
        ? { meta: { correlationId: opts.correlationId } }
        : {}),
    });

    const handle = {
      then: (onOk?: never, onErr?: never) => terminal.then(onOk, onErr),
      catch: (onErr?: never) => terminal.catch(onErr),
      finally: (onDone?: () => void) => terminal.finally(onDone),
      get dropped() {
        return queue.droppedCount;
      },
      cancel: (reason = "cancelled") => {
        finish(() => fail(new CallAbortedError(reason)));
      },
      [Symbol.asyncIterator]: (): AsyncIterator<EventUnion<EM>> => {
        queue.beginConsuming();
        return {
          next: () => queue.take(),
          // Called by `for await` on `break`, `return` or a throw. Without it, abandoning the
          // loop would leave the effect registered and the producer parked for good.
          return: async () => {
            queue.close();
            return { value: undefined, done: true };
          },
        };
      },
    } as CallHandle<EventUnion<EM>, EventUnion<EM>>;

    return handle;
  }

  public registerEffect(spec: EffectSpec<DeepReadonly<S>, EM>): () => void {
    const { effect, meta, when } = spec;
    const unsubs: Array<() => void> = [];

    // Record metadata in a store-owned map keyed by the effect function, rather
    // than mutating the caller's function (which would bleed across stores).
    if (meta) {
      this.effectMeta.set(effect, meta);
    }

    // Check if this is a pattern-based effect (any, channel, channels)
    // or a key-based effect (keys, or no targeting = all events)
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
    if (eventKeys.length === 0 && !when) {
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
      when: { keys: [[channel, type] as EventKey<EM>] },
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
  public replaceMiddleware(next: MiddlewareInput<DeepReadonly<S>, EM>[]): void {
    // Accepts either form. Taking only the bare function meant a hot reload silently discarded
    // the `when` targeting and `meta` of every spec-form middleware, so after an HMR pass a
    // middleware scoped to one channel began running on all of them.
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
    middleware?: MiddlewareInput<DeepReadonly<S>, EM>[];
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
   * @param rSpec - Reducer spec (state, when, reducer).
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
    const { reducer, state, when } = rSpec;

    // Install reducer instance (FIXED: only pass reducer function)
    this.reducers[name] = new Reducer(reducer);

    // Initialize state unless preserving an existing value
    if (!opts.preserveState || (this.state as any)[rName] === undefined) {
      // A NEW root, not a write into the existing one. Mounting a slice is a state change, and
      // anything keyed on root identity — `useSelector` bailing out on `Object.is`, a memo, a
      // devtools snapshot differ — could not see it when the root object stayed the same.
      // Clone the caller's initial state so the store owns an independent copy; freeze is
      // dev-only.
      this.state = {
        ...(this.state as object),
        [rName]: freezeInDev(cloneInitialState(rName, state)),
      } as DeepReadonly<S>;
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

    // Normalize event keys from `when: { keys }`
    const eventKeys = this.normalizeEventKeys(rSpec);

    // If no targeting at all, treat as "all events" (pattern-based)
    if (eventKeys.length === 0 && !when) {
      this.patternReducers.set(name, { any: true });
      this.sliceUnsubs.set(rName, []);
      return;
    }

    // Wire reducerBus listeners and save disposers for HMR
    const unsubs: Array<() => void> = [];
    for (const [ch, tp] of eventKeys) {
      const u = this.reducerBus.on(ch, tp, (payload, sourceEvent) => {
        // Prefer the source event so keyed reducers see the same `id` (and `meta`) as
        // pattern reducers, effects, event subscribers and instrumentation. The fallback
        // only applies when something emits on `reducerBus` without an event.
        const event = (sourceEvent ?? {
          channel: ch,
          type: tp,
          payload,
          id: this.idFactory(),
        }) as Event<EM, typeof ch, typeof tp>;
        // Staged, not committed. `reducerBus` delivers to handlers and has no return channel,
        // so a refusal is recorded on the store for `applyEventSync` to read — the same reason
        // `changedPathSink` exists. The sink is null outside a reduce, which is the only path
        // that can reach here.
        if (this.stagingSink === null) return;
        const refused = this.stageSliceGuarded(name, event as any, this.stagingSink);
        if (refused !== null && this.stagedRejection === null) {
          this.stagedRejection = refused;
          this.stagedRejectedBy = name as string;
        }
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
    if (opts.deleteState) {
      const { [rName]: _removed, ...rest } = this.state as Record<string, unknown>;
      this.state = rest as DeepReadonly<S>;
    }
  }

  /**
   * Normalizes event targeting from `when` to an array of EventKeys.
   *
   * @param spec - Object with an optional `when` matcher.
   * @returns Array of `[channel, type]` pairs.
   *
   * @internal
   */
  private normalizeEventKeys(spec: {
    when?: When<EM>;
    events?: ReadonlyArray<EventKey<EM>>;
  }): ReadonlyArray<EventKey<EM>> {

    if (spec.when) {
      const when = spec.when;

      // Only `keys` can reach this point: both callers intercept pattern-based matchers
      // (`any`, `channel`, `channels`) before normalizing, because those register against the
      // emit loop rather than against per-key handler maps.
      if ("keys" in when) {
        return when.keys;
      }
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
  middleware?: MiddlewareInput<DeepReadonly<S>, EM>[];
  effects?: Array<EffectSpec<DeepReadonly<S>, EM>>;
  dedupWindowMs?: number;
  idFactory?: () => string;
  devtools?: { allowReplay?: boolean };
  onEffectError?: (error: unknown, event: EventUnion<EM>) => void;
  onReducerError?: (error: unknown, event: EventUnion<EM>, slice: string) => void;
  maxReduceDepth?: number;
  maxTransitionsPerDrain?: number;
  onCascade?: (info: CascadeInfo<EM>) => void;
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
  middleware?: MiddlewareInput<
    DeepReadonly<StateFromReducers<RM>>,
    EMFromReducersStrict<RM>
  >[];
  effects?: Array<EffectSpec<DeepReadonly<StateFromReducers<RM>>, EMFromReducersStrict<RM>>>;
  dedupWindowMs?: number;
  idFactory?: () => string;
  devtools?: { allowReplay?: boolean };
  onEffectError?: (error: unknown, event: EventUnion<EMFromReducersStrict<RM>>) => void;
  onReducerError?: (
    error: unknown,
    event: EventUnion<EMFromReducersStrict<RM>>,
    slice: string,
  ) => void;
  maxReduceDepth?: number;
  maxTransitionsPerDrain?: number;
  onCascade?: (info: CascadeInfo<EMFromReducersStrict<RM>>) => void;
}): StoreInstance<keyof RM & string, StateFromReducers<RM>, EMFromReducersStrict<RM>>;

export function createStore(cfg: any) {
  type RM = typeof cfg.reducer;
  type S = StateFromReducers<RM>;
  type EM = EMFromReducersStrict<RM>;
  type RN = keyof RM & string;

  // Spread, then override the three fields that need a default. Copying the option list by hand
  // meant every option added to `StoreSpec` had to be added here too, and forgetting was silent:
  // the option type-checked at the call site, reached `createStore`, and was dropped on the
  // floor. `maxReduceDepth` was lost exactly that way. The Store constructor reads named fields,
  // so anything extra in `cfg` is ignored rather than harmful.
  return new Store<EM, RN, S>({
    ...cfg,
    reducer: (cfg.reducer ?? {}) as unknown as Record<RN, ReducerSpec<S[RN], EM>>,
    middleware: (cfg.middleware ?? []) as any,
    effects: (cfg.effects ?? []) as any,
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