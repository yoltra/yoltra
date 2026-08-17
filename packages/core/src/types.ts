/**
 * @module @yoltra/core
 */

import type { Rejection } from "./store/rejection";
import type { CallHandle, CallOptions } from "./store/call";

/**
 * A minimal "record of record" constraint for EventMaps.
 *
 * @example
 * ```ts
 * type EM = {
 *   ui: { toggle: boolean; setTheme: string };
 *   data: { loaded: { items: string[] } };
 * };
 * ```
 *
 * @public
 */
export type EventMapBase = {
  [C in string]: { [T in string]: unknown };
};

/**
 * Canonical routing concept: a readonly tuple `[channel, type]` that uniquely identifies an event.
 *
 * @typeParam EM - Event map.
 *
 * @remarks
 * - Used consistently across ReducerSpec, EffectSpec, and React hooks.
 * - Literal key lists narrow channel/type/payload in reducers and effects.
 * - Non-literal usage degrades safely to unions.
 *
 * @example
 * ```ts
 * type EM = {
 *   ui: { increment: number; decrement: number };
 *   data: { loaded: string[] };
 * };
 *
 * type K = EventKey<EM>;
 * // K = ['ui', 'increment'] | ['ui', 'decrement'] | ['data', 'loaded']
 *
 * const key: EventKey<EM> = ['ui', 'increment'];
 * ```
 *
 * @public
 */
export type EventKey<EM extends EventMapBase> = {
  [C in keyof EM & string]: [C, keyof EM[C] & string];
}[keyof EM & string];

/**
 * Opaque, optional envelope metadata carried alongside an {@link Event}.
 *
 * @remarks
 * The store never reads, validates or acts on this — it only carries it end to end, so
 * reducers, middleware, effects, event subscribers and instrumentation all observe the same
 * value. It is deliberately untyped at this level: consumers namespace their own keys (for
 * example a tracing integration keeping provenance under `meta.trace`) rather than
 * extending core with domain concepts.
 *
 * It is **not** part of the deduplication fingerprint, which is computed from
 * `(channel, type, payload)` only. Two events differing solely in `meta` still dedupe.
 *
 * @example
 * ```ts
 * await store.emit('orders', 'created', payload, {
 *   meta: { trace: { origin: 'checkout-service', hop: 1 } },
 * });
 * ```
 *
 * @public
 */
export type EventMeta = Readonly<Record<string, unknown>>;

/**
 * A single event object: `{ channel, type, payload, id }`, plus optional `meta`.
 *
 * @typeParam EM - Event map.
 * @typeParam C  - Channel key.
 * @typeParam T  - Type key within channel `C`.
 * @typeParam P  - Payload type (defaults to `EM[C][T]`).
 *
 * @remarks
 * - The `id` field is automatically added by the store to enable deduplication, unless the
 *   emitter supplies one via {@link EmitOptions.id}.
 * - Used for preventing duplicate event processing (e.g., React Strict Mode).
 * - `meta` is present only when {@link EmitOptions.meta} was supplied. See {@link EventMeta}.
 *
 * @example
 * ```ts
 * type EM = { ui: { toggle: boolean } };
 * type Evt = Event<EM, 'ui', 'toggle'>;
 * // { channel: 'ui'; type: 'toggle'; payload: boolean; id: string; meta?: EventMeta }
 * ```
 *
 * @public
 */
export interface Event<
  EM extends EventMapBase = EventMapBase,
  C extends keyof EM & string = keyof EM & string,
  T extends keyof EM[C] & string = keyof EM[C] & string,
  P = EM[C][T],
> {
  channel: C;
  type: T;
  payload: P;
  /** Unique identifier for deduplication and devtools tracking (automatically added by store) */
  id: string;
  /**
   * Optional caller-supplied metadata, carried through the pipeline untouched.
   * Absent entirely unless {@link EmitOptions.meta} was supplied. See {@link EventMeta}.
   */
  readonly meta?: EventMeta;
  /**
   * The `id` of the event whose handling caused this one, when there was one.
   *
   * @remarks
   * Absent on a **root** event — one emitted by application code rather than by a middleware,
   * subscriber or effect reacting to another event. Together with {@link Event.depth} this makes
   * a cascade legible after the fact: without it, a runaway chain is a pile of unrelated events
   * with no way to tell which caused which.
   */
  readonly parentId?: string;
  /**
   * How many events deep in a causal chain this one is. A root event is depth `0`; an event
   * emitted while handling it is `1`, and so on.
   *
   * @remarks
   * Absent on a root event rather than present as `0`, so an event emitted by application code
   * stays byte-identical to one built before causality tracking existed — the same treatment
   * {@link Event.meta} gets, and for the same reason: `Object.keys` and `toStrictEqual` are load
   * bearing in consumer tests.
   *
   * This is the value {@link StoreSpec.maxReduceDepth} bounds.
   */
  readonly depth?: number;
}

/**
 * Generic "old → new" wrapper for fine-grained change notifications.
 * Carries the dotted `path` that changed.
 *
 * @typeParam V - Value type at the changed path.
 *
 * @example
 * ```ts
 * const change: Change<string> = {
 *   oldValue: 'foo',
 *   newValue: 'bar',
 *   path: 'user.name'
 * };
 * ```
 *
 * @public
 */
export interface Change<V = any> {
  oldValue: V;
  newValue: V;
  /** Dotted path for fine-grained listeners; e.g., "data.items.0.title" */
  path?: string;
  /**
   * The `id` of the event that caused this change.
   *
   * @remarks
   * A change used to be anonymous, so a subscriber that needed to know *why* a value moved had
   * to mirror the cause into state and store it twice. Absent when the change did not come from
   * an event — a DevTools time-travel snapshot, for instance — which is itself the signal that
   * no event caused it.
   */
  eventId?: string;
  /** Channel of the causing event. Absent for the same reason as {@link Change.eventId}. */
  channel?: string;
  /** Type of the causing event. Absent for the same reason as {@link Change.eventId}. */
  type?: string;
}

/**
 * Emit function narrowed to the developer's EventMap.
 * Returns a Promise that resolves when the event has been fully processed.
 *
 * @typeParam EM - Event map.
 *
 * @example
 * ```ts
 * type EM = { ui: { increment: number } };
 * const emit: Emit<EM> = async (channel, type, payload) => { /* ... *\/ };
 * await emit('ui', 'increment', 1);
 * ```
 *
 * @public
 */
/**
 * What an `emit` resolves to once its effects have run.
 *
 * @remarks
 * `emit` used to resolve to `void`, so a caller could not tell "the reducer applied my write"
 * from "the reducer looked at my write and returned the state unchanged". On a single-writer
 * store that distinction is academic; on a contended one it is a lost update the API could not
 * report.
 *
 * Deliberately does **not** carry the changed paths. Building that list costs a string
 * concatenation per changed path on every emit, and almost no caller reads it — the same reason
 * change notifications are built lazily. Instrumentation already provides them to the observers
 * that do want them.
 *
 * @public
 */
export interface EmitResult {
  /**
   * The event was not vetoed by middleware.
   *
   * @remarks
   * Unchanged in meaning, and deliberately not narrowed to "state changed" — an event-only store
   * commits every event and writes nothing, by construction.
   */
  readonly committed: boolean;
  /** A reducer actually changed state. */
  readonly written: boolean;
  /** Present when a reducer refused the write. See {@link Rejection}. */
  readonly rejected?: Rejection;
}

/**
 * Options for {@link StoreInstance.connect}.
 *
 * @public
 */
export interface ConnectOptions {
  /**
   * Deliver the current value once, immediately, before any change arrives.
   *
   * @remarks
   * A subscription otherwise starts at "from now on", so a subscriber's first render has to read
   * the path separately — the same path, spelled twice, which is one place for them to drift.
   *
   * The synthetic change has `oldValue: undefined` and no `eventId`, `channel` or `type`: no
   * event caused it, and claiming one would be a lie a subscriber could act on.
   *
   * For a wildcard pattern the "current value" of a match set is not a thing, so the slice root
   * is delivered with `path: ""`. React's hooks do not need this at all — `useSyncExternalStore`
   * already reads a snapshot on mount — so it is aimed at imperative subscribers.
   */
  readonly immediate?: boolean;
}

/**
 * Per-emit options.
 *
 * @public
 */
export interface EmitOptions {
  /**
   * Opt this specific emit into **identity-based** deduplication: if another
   * event with the same `(channel, type, dedupKey)` was emitted within the dedup
   * window, this one is skipped. Unlike content-based dedup
   * ({@link StoreSpec.dedupWindowMs}), it never coalesces two *distinct* logical
   * emits that merely share a payload — only re-fires of the *same* keyed emit
   * (e.g. a React Strict Mode double-invoke). Works even when `dedupWindowMs`
   * is 0, using a short default window.
   */
  dedupKey?: string;

  /**
   * Use this exact id for the event instead of generating one.
   *
   * @remarks
   * Intended for **idempotent re-emission**: a caller replaying an event from elsewhere (a
   * peer store, a durable log) can preserve the original id so the same logical event keeps
   * one identity everywhere, which makes it traceable across systems and in DevTools.
   *
   * The store does **not** enforce uniqueness — supplying a duplicate id does not dedupe the
   * event. Deduplication is a separate, opt-in concern; see {@link EmitOptions.dedupKey}.
   */
  id?: string;

  /**
   * Metadata to attach to this event, carried through the pipeline untouched and visible to
   * reducers, middleware, effects, subscribers and instrumentation. See {@link EventMeta}.
   *
   * @remarks
   * Omitting this leaves `event.meta` genuinely absent rather than `undefined`, so event
   * objects are byte-identical to those produced before this option existed.
   */
  meta?: EventMeta;

  /**
   * Bypass deduplication for this emit entirely, even when the store was created with
   * {@link StoreSpec.dedupWindowMs} greater than 0.
   *
   * @remarks
   * Content-based dedup fingerprints `(channel, type, payload)`, so a store with a dedup
   * window silently collapses genuinely distinct events that happen to share a payload —
   * repeated ticks with an empty payload, or the same event legitimately arriving twice from
   * two different sources. Set this when the caller already guarantees distinctness by other
   * means and needs every emit to land.
   *
   * Takes precedence over both {@link EmitOptions.dedupKey} and the store-level window.
   */
  skipDedup?: boolean;
}

export type Emit<EM extends EventMapBase> = <
  C extends keyof EM & string,
  T extends keyof EM[C] & string,
>(
  channel: C,
  type: T,
  payload: EM[C][T],
  opts?: EmitOptions,
) => Promise<EmitResult>;

/**
 * Basic unsubscribe handle.
 *
 * @public
 */
export type Unsubscribe = () => void;

/**
 * A single observed event delivered to an {@link InstrumentationObserver}.
 *
 * @typeParam EM - Event map.
 *
 * @public
 */
export interface InstrumentedEvent<EM extends EventMapBase = EventMapBase> {
  /**
   * The processed event, including its `id` and any {@link EventMeta} the emitter attached.
   * `meta` is absent unless it was supplied.
   */
  event: { id: string; channel: string; type: string; payload: unknown; meta?: EventMeta };
  /** `true` if the event passed middleware and ran reducers; `false` if vetoed. */
  committed: boolean;
  /**
   * Dotted **leaf** paths that changed, prefixed with the slice name (e.g.
   * `"todos.items.0.title"`). Empty when nothing changed. These are the exact
   * paths the store computed while reducing — no re-diff required.
   */
  changedPaths: string[];
  /** Old value at each changed path, keyed by path. */
  prevValues: Record<string, unknown>;
  /** New value at each changed path, keyed by path. */
  nextValues: Record<string, unknown>;
  /** Wall-clock milliseconds spent in the synchronous reduce phase for this event. */
  reduceTimeMs: number;
  /**
   * Present when a reducer refused the write, carrying its reason.
   *
   * @remarks
   * Distinct from `committed: false`, which means middleware vetoed the event before any reducer
   * saw it. This is a reducer having considered the write and declined it — the two look
   * identical in state and are entirely different in cause.
   */
  rejected?: Rejection;
}

/**
 * Observer for {@link StoreInstance.instrument}. Called once per emitted event
 * (committed or vetoed), after the synchronous reduce phase.
 *
 * @typeParam EM - Event map.
 *
 * @public
 */
export type InstrumentationObserver<EM extends EventMapBase = EventMapBase> = (
  info: InstrumentedEvent<EM>,
) => void;

/**
 * Store spec - what you feed into the constructor / factory.
 *
 * @typeParam R  - Reducer name union (string literal union).
 * @typeParam S  - State record keyed by `R`.
 * @typeParam EM - Event map.
 *
 * @example
 * ```ts
 * type S = { counter: { value: number } };
 * type EM = { ui: { increment: number } };
 *
 * const spec: StoreSpec<'counter', S, EM> = {
 *   name: 'App',
 *   reducer: {
 *     counter: {
 *       state: { value: 0 },
 *       events: [['ui', 'increment']],
 *       reducer(s, evt) {
 *         if (evt.type === 'increment') return { value: s.value + evt.payload };
 *         return s;
 *       }
 *     }
 *   }
 * };
 * ```
 *
 * @public
 */
/**
 * Middleware input: accepts either a function (legacy) or a spec object (recommended).
 *
 * @typeParam S  - Store state (readonly).
 * @typeParam EM - Event map.
 *
 * @example Function form (legacy)
 * ```ts
 * const mw: MiddlewareInput<AppState, AppEM> = (state, event, emit) => {
 *   console.log(event.type);
 *   return true;
 * };
 * ```
 *
 * @example Spec form (recommended)
 * ```ts
 * const mw: MiddlewareInput<AppState, AppEM> = {
 *   when: { channel: 'admin' },
 *   middleware: (state, event, emit) => state.auth.isAdmin,
 *   meta: { type: 'middleware', name: 'authGuard' },
 * };
 * ```
 *
 * @public
 */
export type MiddlewareInput<S = any, EM extends EventMapBase = EventMapBase> =
  | MiddlewareFunction<S, EM>
  | MiddlewareSpec<S, EM>;

/**
 * Store configuration object passed to the {@link Store} constructor or {@link createStore}.
 *
 * @typeParam R  - Reducer name union (string literal union).
 * @typeParam S  - State record keyed by `R`.
 * @typeParam EM - Event map.
 *
 * @example
 * ```ts
 * type S = { counter: { value: number } };
 * type EM = { ui: { increment: number } };
 *
 * const spec: StoreSpec<'counter', S, EM> = {
 *   name: 'App',
 *   reducer: {
 *     counter: {
 *       state: { value: 0 },
 *       when: { keys: eventKeys<EM>()([['ui', 'increment']]) },
 *       reducer(s, evt) {
 *         if (evt.type === 'increment') return { value: s.value + evt.payload };
 *         return s;
 *       }
 *     }
 *   }
 * };
 * ```
 *
 * @public
 */
export type StoreSpec<R extends string, S extends Record<R, any>, EM extends EventMapBase> = {
  /**
   * Store name (used by DevTools to identify the instance).
   */
  name: string;

  /**
   * Map of slice name → reducer spec.
   * Each entry declares initial state, the reducer function, and the event targeting.
   */
  reducer: Record<R, ReducerSpec<S[R], EM>>;

  /**
   * Middleware chain executed before reducers/effects.
   * Accepts either functions (legacy) or MiddlewareSpec objects (recommended).
   * If any middleware returns false (or resolves to false), the event will not propagate.
   */
  middleware?: MiddlewareInput<DeepReadonly<S>, EM>[];

  /**
   * Optional side-effect handlers registered at construction time.
   * Runs after reducers for every propagated event.
   */
  effects?: Array<EffectSpec<DeepReadonly<S>, EM>>;

  /**
   * Time window in milliseconds for **content-based** event deduplication.
   * When greater than 0, events with identical fingerprints
   * (channel + type + serialized payload) within this window are treated as
   * duplicates and skipped.
   *
   * **Off by default.** Content-based dedup can silently drop legitimate
   * rapid-fire identical events (double-clicks, repeated `+1`, sliders emitting
   * the same value), so it is opt-in. To safely coalesce a *specific* re-fired
   * emit (e.g. React Strict Mode), prefer the per-emit {@link EmitOptions.dedupKey}.
   *
   * @default 0 (disabled)
   */
  dedupWindowMs?: number;

  /**
   * Generates the `id` for each emitted event. Defaults to `crypto.randomUUID()`.
   *
   * @remarks
   * Two reasons to override it. First, portability: `crypto.randomUUID` requires a **secure
   * context** in browsers and is absent on some runtimes (React Native / Hermes), where the
   * default would throw on every emit. Second, determinism: injecting a counter makes event
   * ids stable across runs, which is what allows byte-exact assertions in tests.
   *
   * The factory must return a string. Uniqueness is the caller's responsibility.
   *
   * @default () => crypto.randomUUID()
   *
   * @example
   * ```ts
   * let n = 0;
   * const store = createStore({ name: 'Test', reducer, idFactory: () => `evt-${++n}` });
   * ```
   */
  idFactory?: () => string;

  /**
   * DevTools configuration options.
   *
   * @remarks
   * These options control runtime DevTools capabilities such as event replay.
   */
  devtools?: {
    /**
     * Enable event replay via `__replayEvents()`.
     * When `false` (default), calling `__replayEvents()` throws.
     *
     * @default false
     */
    allowReplay?: boolean;
  };

  /**
   * Called when an effect throws or its returned promise rejects.
   *
   * @remarks
   * `await emit(...)` **never rejects** on effect failure: the reduce phase has
   * already committed synchronously, and effects run as independent per-event
   * tasks. Effect errors are logged to the console and delivered here (when
   * provided), so this is the single place to observe and route them — e.g.
   * report to a service or emit a failure event. Other effects still run.
   *
   * @param error - The thrown value or rejection reason.
   * @param event - The event whose effect failed.
   */
  onEffectError?: (error: unknown, event: EventUnion<EM>) => void;

  /**
   * Invoked when a reducer throws.
   *
   * @remarks
   * A reducer is meant to be pure and total, so a throw is a bug in application code — and it
   * used to be almost invisible. Keyed reducers ran through a bus that logged and moved on,
   * letting the event commit and its effects run; pattern reducers threw straight out of the
   * drain, aborting the commit and notifying nobody. Both paths now isolate the failing slice
   * and report here.
   *
   * The failing slice keeps its previous state; every other slice still reduces, and the event
   * still commits if anything else changed. `emit()` never rejects because of a reducer error,
   * so this hook is how a caller observes one.
   *
   * @param error - The thrown value.
   * @param event - The event being reduced when it threw.
   * @param slice - Name of the slice whose reducer threw.
   */
  onReducerError?: (error: unknown, event: EventUnion<EM>, slice: string) => void;

  /**
   * Maximum causal depth of an event chain before the store refuses to extend it.
   *
   * @remarks
   * An event emitted while handling another is one deeper than its cause. Two reducers wired to
   * each other, or an effect that emits the event its own reducer answers, climb this without
   * bound — and the reduce queue drains synchronously, so in a browser that is a frozen tab with
   * no error and no stack, and on a server a pinned core.
   *
   * **On by default**, because the whole point is that the failure mode does not require
   * configuration to avoid. The default is far past any legitimate chain: an event caused by an
   * event caused by an event is normal, sixty-four deep is a bug. Raise it if an application
   * genuinely nests deeper, or set `Infinity` to opt out entirely and own the consequences.
   *
   * Breaching does not throw — see {@link StoreSpec.onCascade}.
   *
   * @default 64
   */
  maxReduceDepth?: number;

  /**
   * Maximum number of events one synchronous drain will process before refusing more.
   *
   * @remarks
   * A drain processes one root event plus every event emitted *while it runs* — so this counts a
   * single causal burst, not application traffic. A plain loop is unaffected: `emit` drains to
   * completion before it returns, so `for (const row of rows) store.emit(…)` is a thousand drains
   * of one event each, never one drain of a thousand.
   *
   * **Off by default** because a wide burst is not by itself a bug. One `sync` event whose
   * subscriber fans out to five hundred `upsert`s is a legitimate shape, and a default low enough
   * to catch a runaway would refuse it. Depth is what separates a cascade from a fan-out — a
   * fan-out is wide and shallow, a cascade is narrow and deep — which is why
   * {@link StoreSpec.maxReduceDepth} carries the default and this does not.
   *
   * Set it when a store's bursts are known to be bounded and an unexpectedly wide one is itself
   * the symptom worth catching.
   *
   * @default undefined (no limit)
   */
  maxTransitionsPerDrain?: number;

  /**
   * Called when a ceiling is breached, instead of throwing.
   *
   * @remarks
   * The offending emit is refused and the chain stops there; everything already committed
   * stands. It does not throw, because the throw would surface in whichever frame happened to be
   * emitting — a subscriber, an effect, a middleware — which is the same species of
   * hard-to-attribute failure the ceiling exists to prevent. A cascade is a wiring bug, and this
   * is where the wiring gets named.
   *
   * @param info - Which ceiling, the event that would have extended the chain, and its causal
   * chain of ids, newest last.
   */
  onCascade?: (info: CascadeInfo<EM>) => void;

  /**
   * Called when a reducer refuses a write by returning {@link Rejected}.
   *
   * @remarks
   * The caller learns of its own refusal from the `emit` result; this is for everyone else —
   * logging, metrics, alerting on a rate of rejected writes. Shaped as a callback rather than a
   * subscription for the same reason {@link StoreSpec.onReducerError} is: it is a rare global
   * signal, not something several independent parties register and unregister for.
   *
   * A refusal is a normal outcome, not an error. It means a reducer considered the write and
   * declined it — a stale compare-and-swap, an unmet precondition — and the event is rejected
   * whole, so no slice writes.
   *
   * @param rejection - The refusal and its reason.
   * @param event - The event that was refused.
   * @param slice - Name of the slice whose reducer refused.
   */
  onRejected?: (rejection: Rejection, event: EventUnion<EM>, slice: string) => void;
};

/**
 * What {@link StoreSpec.onCascade} receives when a ceiling is breached.
 *
 * @typeParam EM - Event map.
 *
 * @public
 */
export interface CascadeInfo<EM extends EventMapBase = EventMapBase> {
  /** Which ceiling was hit. */
  readonly limit: "maxReduceDepth" | "maxTransitionsPerDrain";
  /** The configured value that was exceeded. */
  readonly limitValue: number;
  /** The event that was refused — the one that would have extended the chain. */
  readonly event: EventUnion<EM>;
  /** Causal depth the refused event would have had. */
  readonly depth: number;
  /**
   * Ids from the root of the chain to the refused event's parent, newest last.
   *
   * @remarks
   * Bounded to the most recent entries: a cascade is long by definition, and the useful part is
   * the cycle at the end rather than the thousand identical hops before it.
   */
  readonly chain: readonly string[];
}

/**
 * Public Store surface.
 *
 * @typeParam R  - Reducer name union.
 * @typeParam S  - State record (already readonly at the call site).
 * @typeParam EM - Event map.
 *
 * @remarks
 * The concrete Store implements this as `StoreInstance<R, DeepReadonly<S>, EM>`.
 *
 * @public
 */
export interface StoreInstance<
  R extends string = string,
  S extends Record<R, any> = Record<string, any>,
  EM extends EventMapBase = EventMapBase,
> {
  /**
   * Store name (used by DevTools to identify the instance).
   */
  name: string;

  /**
   * Read the full state (already readonly).
   */
  getState(): DeepReadonly<S>;

  /**
   * Emit a typed event `(channel, type, payload)`.
   * Returns a promise that resolves when the event has been processed.
   */
  emit: Emit<EM>;

  /**
   * Coarse subscription: runs after any state change (once per committed event).
   */
  subscribe(listener: () => void): Unsubscribe;

  /**
   * Fine-grained subscription: listen to a specific `reducer.property` path.
   * Accepts a dotted path string (e.g., "data.123.title").
   * Fires when that path (or its ancestors) actually changes.
   *
   * @param spec - `{ reducer, property }` where `property` is a single dotted path string.
   * @param handler - Handler receiving a {@link Change} with `{ oldValue, newValue, path }`.
   */
  connect(
    spec: { reducer: R; property: string },
    handler: (change: Change) => void,
    options?: ConnectOptions,
  ): Unsubscribe;

  /**
   * Sends a request and waits for the reply, correlating the two automatically.
   *
   * @remarks
   * Awaitable for the terminal reply, async-iterable for progress. See the implementation on
   * {@link Store.call} for the full contract — correlation, backpressure, timeouts, and why it
   * is a local primitive rather than something that federates.
   */
  call<C extends keyof EM & string, T extends keyof EM[C] & string>(
    channel: C,
    type: T,
    payload: EM[C][T],
    opts: CallOptions<EM>,
  ): CallHandle<EventUnion<EM>, EventUnion<EM>>;

  /**
   * Convenience helper to register an **effect** filtered by a single `(channel, type)` pair.
   *
   * @typeParam C - Channel key within `EM`.
   * @typeParam T - Event type key within channel `C`.
   * @param channel - Channel to filter.
   * @param type - Event type to filter.
   * @param handler - Effect handler `(payload, getState, emit, event)`.
   * 
   * @returns Unsubscribe/teardown function.
   */
  onEffect<
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
  ): Unsubscribe;

  /**
   * Register a post-reducer effect (sees final state). Returns an unsubscribe.
   */
  registerEffect(spec: EffectSpec<DeepReadonly<S>, EM>): Unsubscribe;

  /**
   * Dynamically add middleware, in either the function or the spec form.
   */
  registerMiddleware(mw: MiddlewareInput<DeepReadonly<S>, EM>): Unsubscribe;

  /**
   * Dynamically add/remove a namespaced reducer slice at runtime.
   */
  registerReducer(name: string, spec: ReducerSpec<any, EM>): Unsubscribe;

  /**
   * Cleanup resources (timers, etc.) when disposing the store.
   * Call this if you're dynamically creating/destroying stores.
   */
  dispose(): void;

  /**
   * Subscribe to events by channel and type.
   *
   * Event subscriptions are intended for the View layer (e.g., React components)
   * to react to events without affecting the event flow. They are fire-and-forget
   * and cannot cancel event propagation.
   *
   * **Phases:**
   * - `'committed'` (default): Events that passed middleware and reached reducers
   * - `'uncommitted'`: Events rejected by middleware
   * - `'all'`: Both committed and uncommitted events (handler receives phase parameter)
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
   */
  onEvent<C extends keyof EM & string, T extends keyof EM[C] & string>(
    channel: C,
    type: T,
    handler: NarrowedEventHandler<DeepReadonly<S>, EM, C, T>,
    phase?: EventPhase,
  ): Unsubscribe;

  /**
   * Replaces the entire middleware pipeline (HMR-friendly).
   *
   * @param next - New middleware array.
   */
  replaceMiddleware(next: MiddlewareFunction<DeepReadonly<S>, EM>[]): void;

  /**
   * Replaces all registered effects (HMR-friendly).
   *
   * @param next - New effects array (as EffectSpecs).
   */
  replaceEffects(next: Array<EffectSpec<DeepReadonly<S>, EM>>): void;

  /**
   * Replaces the entire reducer set (HMR-friendly).
   *
   * @param next - Map of slice specs keyed by slice name.
   * @param opts - `{ preserveState?: boolean }` (default `true`).
   */
  replaceReducers(
    next: Record<R, ReducerSpec<S[R], EM>>,
    opts?: { preserveState?: boolean },
  ): void;

  /**
   * Convenience API to replace any subset of store parts (HMR patterns).
   *
   * @param partial - Partial replacement set.
   */
  hotReplace(partial: {
    reducer?: Record<R, ReducerSpec<S[R], EM>>;
    middleware?: MiddlewareInput<DeepReadonly<S>, EM>[];
    effects?: Array<EffectSpec<DeepReadonly<S>, EM>>;
    preserveState?: boolean;
  }): void;

  /**
   * Replays a sequence of events from a snapshot through reducers and event
   * subscribers ONLY. Skips dedup, middleware, and effects.
   *
   * Gated by `createStore({ devtools: { allowReplay: true } })`.
   * Throws if replay is not enabled.
   *
   * @param snapshot - The state snapshot to restore before replaying.
   * @param events - Array of events to replay (in order).
   *
   * @internal
   */
  __replayEvents(
    snapshot: any,
    events: Array<{ channel: string; type: string; payload: any; id: string; meta?: EventMeta }>,
  ): void;

  /**
   * Returns a structured introspection snapshot for DevTools UIs.
   *
   * @returns Reducers, effects, middleware, event subscriptions, coarse
   * subscriber count, dedup hit count, and current queue depth.
   *
   * @internal
   */
  __devtoolsIntrospect(): {
    reducers: Array<{ name: string; when?: unknown }>;
    effects: Array<{ channel: string; type: string; name?: string; description?: string }>;
    middleware: Array<{ name?: string; description?: string; when?: unknown }>;
    atomic: Array<{ reducer: string; property: string }>;
    event: Array<{ channel: string; type: string; phase: string }>;
    coarse: number;
    dedupHits: number;
    queueDepth: number;
  };

  /**
   * Registers an instrumentation observer, called once per emitted event
   * (committed or vetoed) after the synchronous reduce phase, with the exact
   * changed paths, their old/new values, and reduce timing. This is the typed
   * seam DevTools agents consume — no `as any` bridging required.
   *
   * @param observer - Receives an {@link InstrumentedEvent} per emit.
   * @returns Unsubscribe function.
   */
  instrument(observer: InstrumentationObserver<EM>): Unsubscribe;

  /**
   * Applies an externally-provided whole-state snapshot (DevTools time-travel),
   * emitting fine-grained path changes and notifying coarse subscribers.
   *
   * @param next - Plain state object to apply.
   *
   * @internal
   */
  __applyExternalState(next: unknown): void;
}


/**
 * One reducer's definition blob (stateful event consumer).
 *
 * @typeParam S  - State managed by this reducer.
 * @typeParam EM - Event map.
 *
 * @remarks
 * Use `when` for event targeting (preferred). The `events` property is
 * kept for backward compatibility but `when` is recommended for new code.
 *
 * @example
 * Using `when` (recommended)
 * ```ts
 * const counterSpec: ReducerSpec<{ value: number }, MyEM> = {
 *   state: { value: 0 },
 *   when: { keys: eventKeys<MyEM>()([['ui', 'increment'], ['ui', 'decrement']]) },
 *   reducer(s, evt) {
 *     if (evt.type === 'increment') return { value: s.value + evt.payload };
 *     if (evt.type === 'decrement') return { value: s.value - evt.payload };
 *     return s;
 *   },
 *   meta: { type: 'reducer', name: 'counter' },
 * };
 * ```
 *
 * @public
 */
export interface ReducerSpec<S = any, EM extends EventMapBase = EventMapBase> {
  /**
   * Initial state for this reducer.
   */
  state: S;

  /**
   * Event targeting using the unified `When` matcher.
   */
  when?: When<EM>;

  /**
   * Pure reducer function: `(state, event) => nextState`.
   */
  reducer: ReducerFunction<S, EM>;

  /**
   * Optional metadata for debugging tools and DevTools integration.
   */
  meta?: EventConsumerMeta<"reducer">;
}

/**
 * Pure reducer function (stateful event consumer).
 *
 * @typeParam S  - State type.
 * @typeParam EM - Event map.
 *
 * @public
 */
export type ReducerFunction<S = any, EM extends EventMapBase = EventMapBase> = (
  state: S,
  event: EventUnion<EM>,
) => S | Rejection;

/**
 * Effect specification (stateless async event consumer).
 *
 * @typeParam S  - Store state type (readonly).
 * @typeParam EM - Event map.
 *
 * @remarks
 * - Effects run after reducers see the event.
 * - Effects are async-safe and do not own state.
 * - Effects are keyed by event for O(1) lookup (no scanning).
 * - Use `when` for event targeting (preferred over `events`).
 *
 * @example
 * Using `when` (recommended)
 * ```ts
 * const logEffect: EffectSpec<AppState, MyEM> = {
 *   when: { keys: eventKeys<MyEM>()([['ui', 'increment']]) },
 *   effect: async (evt, getState, emit) => {
 *     console.log('increment', evt.payload, getState().counter.value);
 *   },
 *   meta: { type: 'effect', name: 'logEffect', description: 'Logs increment events' },
 * };
 * ```
 *
 * @example Match all events in a channel
 * ```ts
 * const notificationEffect: EffectSpec<AppState, MyEM> = {
 *   when: { channel: 'notifications' },
 *   effect: (evt, getState, emit) => {
 *     if (evt.type === 'show') showToast(evt.payload.message);
 *   },
 * };
 * ```
 *
 * @public
 */
export interface EffectSpec<S = any, EM extends EventMapBase = EventMapBase> {
  /**
   * Event targeting using the unified `When` matcher.
   */
  when?: When<EM>;

  /**
   * Async effect handler: `(event, getState, emit) => void | Promise<void>`.
   */
  effect: EffectFunction<S, EM>;

  /**
   * Optional metadata for debugging tools and DevTools integration.
   */
  meta?: EventConsumerMeta<"effect">;
}

/**
 * Every legal `{ channel, type, payload, id }` as a *distinct* object type.
 *
 * @typeParam EM - Event map.
 *
 * @public
 */
export type EventUnion<EM extends EventMapBase> = {
  [C in keyof EM & string]: {
    [T in keyof EM[C] & string]: Event<EM, C, T>;
  }[keyof EM[C] & string];
}[keyof EM & string];

/**
 * Middleware function: log, guard, or veto an event **synchronously**.
 * Return `true` to continue, `false` to swallow / cancel propagation.
 *
 * @remarks
 * Middleware runs in the synchronous reduce phase (so `getState()` is correct
 * immediately after `emit()`), and therefore must be synchronous. Perform async
 * work in effects instead.
 *
 * @typeParam S  - Store state (readonly).
 * @typeParam EM - Event map.
 *
 * @public
 */
export type MiddlewareFunction<S = any, EM extends EventMapBase = EventMapBase> = (
  state: S,
  event: EventUnion<EM>,
  emit: Emit<EM>,
) => boolean;

/**
 * Middleware specification with optional event targeting and metadata.
 *
 * @typeParam S  - Store state (readonly).
 * @typeParam EM - Event map.
 *
 * @remarks
 * - If `when` is omitted, middleware receives ALL events.
 * - Use `when` to filter which events the middleware processes.
 * - Middleware runs BEFORE reducers and can cancel event propagation.
 *
 * @example Global logging middleware (all events)
 * ```ts
 * const loggingMiddleware: MiddlewareSpec<AppState, AppEM> = {
 *   middleware: (state, event, emit) => {
 *     console.log('Event:', event.channel, event.type);
 *     return true; // allow propagation
 *   },
 *   meta: { type: 'middleware', name: 'logger' },
 * };
 * ```
 *
 * @example Filtered middleware (specific events)
 * ```ts
 * const authMiddleware: MiddlewareSpec<AppState, AppEM> = {
 *   when: { channel: 'admin' },
 *   middleware: (state, event, emit) => {
 *     if (!state.auth.isAdmin) return false; // cancel
 *     return true;
 *   },
 *   meta: { type: 'middleware', name: 'authGuard', description: 'Guards admin events' },
 * };
 * ```
 *
 * @public
 */
export interface MiddlewareSpec<S = any, EM extends EventMapBase = EventMapBase> {
  /**
   * Event targeting (optional). If omitted, middleware receives ALL events.
   */
  when?: When<EM>;

  /**
   * Middleware function: `(state, event, emit) => boolean` (synchronous).
   * Return `false` to cancel event propagation.
   */
  middleware: MiddlewareFunction<S, EM>;

  /**
   * Optional metadata for debugging tools and DevTools integration.
   */
  meta?: EventConsumerMeta<"middleware">;
}

/**
 * Effect handler: runs AFTER reducers, sees the final state.
 *
 * @typeParam S  - Store state (readonly).
 * @typeParam EM - Event map.
 *
 * @public
 */
export type EffectFunction<S = any, EM extends EventMapBase = EventMapBase> = (
  event: EventUnion<EM>,
  getState: () => S,
  emit: Emit<EM>,
) => void | Promise<void>;

/**
 * Helper: extract state shape from a reducers map.
 *
 * @internal
 */
export type ReducersMapAny = Record<string, ReducerSpec<any, any>>;

/**
 * Helper: derive state type from a reducers map.
 *
 * @internal
 */
export type StateFromReducers<R> = {
  [K in keyof R]: R[K] extends ReducerSpec<infer S, any> ? S : never;
};

/**
 * Helper: turn a union into an intersection.
 *
 * @internal
 */
export type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;

/**
 * Helper: the event map of a single reducer spec.
 *
 * @internal
 */
export type EMOfSpec<Spec> = Spec extends ReducerSpec<any, infer EM> ? EM : never;

/**
 * Helper: derive the combined event map from a reducers map (strict).
 * Used by the createStore inference overload.
 *
 * Each slice contributes its own event map; those maps are **merged** (channels,
 * and each channel's `type → payload` entries, combined across slices) rather
 * than collapsed to a single slice's map. `EMOfSpec` distributes over the union
 * of specs to yield the union of per-slice event maps, and `UnionToIntersection`
 * merges them — so a store whose slices declare divergent event maps still types
 * `emit` against the union of every slice's channels/types.
 *
 * @internal
 */
export type EMFromReducersStrict<RM extends ReducersMapAny> = UnionToIntersection<
  EMOfSpec<RM[keyof RM]>
> extends infer Merged
  ? Merged extends EventMapBase
    ? Merged
    : EventMapBase
  : EventMapBase;

// ============================================
// Event Targeting (When Matcher)
// ============================================

/**
 * Matcher for event targeting across reducers, effects, middleware, and subscriptions.
 *
 * Supports four targeting modes:
 * - `{ any: true }` — match all events
 * - `{ keys: [...] }` — match specific `[channel, type]` pairs (correlated)
 * - `{ channel: 'x' }` — match all events in a channel
 * - `{ channels: ['x', 'y'] }` — match all events in multiple channels
 *
 * @typeParam EM - Event map.
 *
 * @example Match all events
 * ```ts
 * const mw: MiddlewareSpec<S, EM> = {
 *   when: { any: true },
 *   middleware: (state, event, emit) => true,
 * };
 * ```
 *
 * @example Match specific event keys
 * ```ts
 * const reducer: ReducerSpec<S, EM> = {
 *   state: { value: 0 },
 *   when: { keys: eventKeys<EM>()([['ui', 'increment'], ['ui', 'decrement']]) },
 *   reducer: (s, e) => { ... },
 * };
 * ```
 *
 * @example Match entire channel
 * ```ts
 * const effect: EffectSpec<S, EM> = {
 *   when: { channel: 'notifications' },
 *   effect: (e, getState, emit) => { ... },
 * };
 * ```
 *
 * @public
 */
export type When<EM extends EventMapBase> =
  | { any: true }
  | { keys: ReadonlyArray<EventKey<EM>> }
  | { channel: keyof EM & string }
  | { channels: ReadonlyArray<keyof EM & string> };

/**
 * Helper to create type-safe EventKey arrays without requiring `as const`.
 * Preserves literal tuple types for proper type correlation in handlers.
 *
 * @typeParam EM - Event map.
 *
 * @example
 * ```ts
 * type AppEM = {
 *   ui: { increment: number; decrement: number };
 *   data: { loaded: string[] };
 * };
 *
 * // Without helper (requires `as const`):
 * const keys = [['ui', 'increment'], ['ui', 'decrement']] as const;
 *
 * // With helper (no `as const` needed):
 * const keys = eventKeys<AppEM>()([
 *   ['ui', 'increment'],
 *   ['ui', 'decrement'],
 * ]);
 * // Type: readonly [['ui', 'increment'], ['ui', 'decrement']]
 * ```
 *
 * @public
 */
export const eventKeys =
  <EM extends EventMapBase>() =>
  <const K extends ReadonlyArray<EventKey<EM>>>(keys: K): K =>
    keys;

/**
 * Extracts the event union from a `When` matcher.
 * Used internally to narrow handler `event` parameter types based on the matcher.
 *
 * @typeParam EM - Event map.
 * @typeParam W  - When matcher type.
 *
 * @internal
 */
export type EventFromWhen<EM extends EventMapBase, W extends When<EM>> = W extends { any: true }
  ? EventUnion<EM>
  : W extends { keys: ReadonlyArray<infer K> }
    ? K extends readonly [infer C, infer T]
      ? C extends keyof EM & string
        ? T extends keyof EM[C] & string
          ? Event<EM, C, T>
          : never
        : never
      : never
    : W extends { channel: infer C }
      ? C extends keyof EM & string
        ? { [T in keyof EM[C] & string]: Event<EM, C, T> }[keyof EM[C] & string]
        : never
      : W extends { channels: ReadonlyArray<infer C> }
        ? C extends keyof EM & string
          ? { [T in keyof EM[C] & string]: Event<EM, C, T> }[keyof EM[C] & string]
          : never
        : never;

// ============================================
// Path Value Resolution
// ============================================

/**
 * Resolves the value type at a dotted path `P` inside object/array `T`.
 * Supports numeric segments for array indexing (e.g., `"items.0.title"`).
 *
 * @typeParam T - Root type to index into.
 * @typeParam P - Dotted path string.
 *
 * @example
 * ```ts
 * type S = { todos: Array<{ title: string; done: boolean }> };
 * type T1 = PathValue<S['todos'], '0.title'>; // string
 * type T2 = PathValue<S, 'todos.0'>;          // { title: string; done: boolean }
 * type T3 = PathValue<S, 'todos'>;            // Array<{ title: string; done: boolean }>
 * ```
 *
 * @remarks
 * The empty path resolves to `T` itself, matching what the code has always done: both the
 * store's internal path reader and the React one return the object unchanged for `""`. The type
 * used to say `never`, so a subscription to a root-value slice was typed as nothing at all.
 *
 * @public
 */
export type PathValue<T, P extends string> = P extends ""
  ? T
  : P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : K extends `${number}`
      ? T extends readonly (infer E)[]
        ? PathValue<E, Rest>
        : never
      : never
  : P extends keyof T
    ? T[P]
    : P extends `${number}`
      ? T extends readonly (infer E)[]
        ? E
        : never
      : never;

// ============================================
// Metadata for Debugging Tools
// ============================================

/**
 * Type discriminator for event consumers.
 *
 * @public
 */
export type EventConsumerType = "reducer" | "middleware" | "effect";

/**
 * Metadata for event consumers (reducers, effects, middleware).
 * Useful for debugging tools, DevTools integration, and introspection.
 *
 * @typeParam T - Consumer type discriminator.
 *
 * @example
 * ```ts
 * const counterReducer: ReducerSpec<CounterState, AppEM> = {
 *   state: { value: 0 },
 *   when: { keys: eventKeys<AppEM>()([['ui', 'increment']]) },
 *   reducer: (s, e) => ({ value: s.value + e.payload }),
 *   meta: {
 *     type: 'reducer',
 *     name: 'counterReducer',
 *     description: 'Handles counter increment/decrement events',
 *   },
 * };
 * ```
 *
 * @public
 */
export interface EventConsumerMeta<T extends EventConsumerType = EventConsumerType> {
  /** Consumer type discriminator */
  type: T;

  /** Unique identifier for this consumer */
  name: string;

  /** Brief one-liner description of what this consumer does */
  description?: string;
}

/**
 * Alias for DeepReadonly.
 *
 * @public
 */
export type DeepRO<T> = DeepReadonly<T>;

/**
 * Primitive types (terminal leaves in deep traversal).
 *
 * @public
 */
export type Primitive =
  | string
  | number
  | boolean
  | bigint
  | symbol
  | null
  | undefined
  | Date
  | RegExp;

/**
 * A value with **no addressable interior**: its changes are reported at the slice root rather
 * than at a path beneath it.
 *
 * @remarks
 * The distinction the path types were missing. `Map` and `Set` keep their contents outside own
 * enumerable keys, so walking them with `keyof` yields the names of their *methods* — which is
 * how `"byId.get"` and `"byId.size"` came to be offered as subscribable paths, and why a slice
 * holding a plain number autocompleted `"toFixed"`. Neither ever notified anything, because
 * `detectChangedProps` reports such a value at its own path and never descends into it.
 *
 * This is the type-level counterpart of that runtime rule: what the diff reports at the root,
 * the types address at the root, with the empty path.
 *
 * @public
 */
export type RootValue = Primitive | ReadonlyMap<unknown, unknown> | ReadonlySet<unknown>;

/**
 * Compute dotted paths of T, including nested objects and arrays.
 *
 * @typeParam T - Type to compute paths for.
 *
 * @public
 */
export type Path<T> = T extends RootValue
  ? never
  : T extends readonly (infer U)[]
  ? `${number}` | (Path<U> extends never ? never : `${number}.${Path<U>}`)
  : {
    [K in keyof T & string]: T[K] extends Primitive
    ? K
    : K | (Path<T[K]> extends never ? never : `${K}.${Path<T[K]>}`);
  }[keyof T & string];

/**
 * Allow wildcard patterns like "*" and "**" anywhere in the string.
 *
 * @typeParam T - Base string type.
 *
 * @public
 */
export type WithGlob<T extends string> = T | `${string}*${string}`;

/**
 * Dotted keys of a slice: top-level keys or any nested path.
 *
 * @typeParam Slice - Slice state type.
 *
 * @remarks
 * A slice that **is** one value — a primitive, a `Map`, a `Set`, a `Date` — has no key to
 * address, and its only subscribable path is the empty one. Saying so is what makes
 * `{ reducer, property: "" }` type-check where it can actually fire, instead of falling through
 * to the untyped `property: string` overload and returning `unknown`.
 *
 * The conditional distributes over unions, which is why a nullable object slice gets both:
 * `Dotted<{ a: number } | null>` is `"" | "a"`. That is exactly right — such a slice really does
 * change at its root when it becomes `null`, and at `"a"` otherwise.
 *
 * @public
 */
export type Dotted<Slice> = Slice extends RootValue
  ? ""
  : (keyof Slice & string) | Path<Slice>;

/**
 * Deep readonly type: recursively makes all properties readonly.
 *
 * @remarks
 * The built-in object types are handled before the general mapped-object case, because
 * mapping over one destroys it. `{ readonly [K in keyof Map<K, V>]: ... }` produces an object
 * carrying the *names* of a Map's methods with their signatures rewritten, so reading a Map
 * out of state and calling `.get()` on it was a type error even though the value at runtime
 * is an ordinary Map. The same applied to `Set`, `Date`, `RegExp` and any function stored in
 * state.
 *
 * Collections become their `Readonly*` counterparts, which is the same treatment arrays
 * already had. Functions are returned untouched: a function's properties are not state, and
 * mapping over them makes it uncallable.
 *
 * @typeParam T - Type to make readonly.
 *
 * @public
 */
export type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends (infer A)[]
  ? ReadonlyArray<DeepReadonly<A>>
  : T extends ReadonlyMap<infer K, infer V>
  ? ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>>
  : T extends ReadonlySet<infer V>
  ? ReadonlySet<DeepReadonly<V>>
  : T extends Date | RegExp | Promise<unknown> | Error
  ? T
  : T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

/**
 * Phase of event subscription notification.
 *
 * - `'committed'`: Events that passed middleware and reached reducers (default)
 * - `'uncommitted'`: Events rejected by middleware
 * - `'written'`: Events that actually changed state
 * - `'all'`: Both committed and uncommitted events
 *
 * @remarks
 * `'committed'` means **not vetoed**, and always has. It fires for an event that passed
 * middleware whether or not any reducer wrote anything — including every event in a store with
 * no reducers at all, which is the shape a notification or analytics bus takes. Toasts,
 * animations and tracking depend on that, so it is not narrowed.
 *
 * `'written'` is the stricter fact, added rather than substituted: state changed. It fires
 * **after** the commit, so a subscriber reading `getState()` from it sees the new value — which
 * is what people tend to assume `'committed'` does.
 *
 * `'all'` deliberately stays `committed | uncommitted`. Folding `'written'` into it would hand
 * every existing `'all'` subscriber a second notification per written event and quietly double
 * their counts.
 *
 * @public
 */
export type EventPhase = "committed" | "uncommitted" | "written" | "all";

/**
 * The phases a handler is actually *told about*.
 *
 * @remarks
 * `'all'` is a subscription selector, not an outcome — nothing is ever delivered "in the all
 * phase". Naming the difference keeps the two from being conflated in a handler signature, which
 * is where they were previously spelled out by hand and drifted: adding `'written'` to
 * {@link EventPhase} left three copies in `@yoltra/react` still claiming a handler could only
 * ever see two phases, and the build failed on the mismatch.
 *
 * @public
 */
export type NotifiedPhase = Exclude<EventPhase, "all">;

/**
 * Handler function for event subscriptions (receives full event union).
 *
 * Event subscriptions are intended for the View layer (e.g., React components)
 * to react to events without affecting the event flow. They are fire-and-forget
 * and cannot cancel event propagation.
 *
 * @typeParam S  - Store state type (readonly).
 * @typeParam EM - Event map.
 *
 * @param event - The event that was emitted
 * @param getState - Function to get current state
 * @param emit - Function to emit new events
 * @param phase - The phase ('committed' or 'uncommitted') indicating how the event was processed
 *
 * @example
 * ```ts
 * const handler: EventSubscriptionHandler<AppState, AppEM> = (event, getState, emit, phase) => {
 *   if (phase === 'committed') {
 *     console.log('Event committed:', event.type);
 *   } else {
 *     console.log('Event rejected:', event.type);
 *   }
 * };
 * ```
 *
 * @public
 */
export type EventSubscriptionHandler<S = any, EM extends EventMapBase = EventMapBase> = (
  event: EventUnion<EM>,
  getState: () => S,
  emit: Emit<EM>,
  phase: NotifiedPhase,
) => void | Promise<void>;

/**
 * Narrowed event subscription handler for specific `(channel, type)` pairs.
 * Provides better type inference when subscribing to a single event type.
 *
 * @typeParam S  - Store state type (readonly).
 * @typeParam EM - Event map.
 * @typeParam C  - Channel key within `EM`.
 * @typeParam T  - Event type key within channel `C`.
 *
 * @example
 * ```ts
 * const handler: NarrowedEventHandler<AppState, AppEM, 'ui', 'increment'> = (
 *   event, // Event<AppEM, 'ui', 'increment'> - narrowed!
 *   getState,
 *   emit,
 *   phase,
 * ) => {
 *   // event.payload is typed as number (from EM['ui']['increment'])
 *   console.log('Increment by:', event.payload);
 * };
 * ```
 *
 * @public
 */
export type NarrowedEventHandler<
  S,
  EM extends EventMapBase,
  C extends keyof EM & string,
  T extends keyof EM[C] & string,
> = (
  event: Event<EM, C, T>,
  getState: () => S,
  emit: Emit<EM>,
  phase: NotifiedPhase,
) => void | Promise<void>;