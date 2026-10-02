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
  /**
   * Why the event did not commit. Absent when it did.
   *
   * @remarks
   * `committed: false` used to arrive from three unrelated causes through one shared frozen
   * object, so a caller could not tell a guard refusing an action from a double-click being
   * deduplicated - which want opposite responses. A submit button should show the refusal and
   * say nothing about the duplicate.
   *
   * See {@link EmitResult.vetoedBy} for which middleware refused it.
   */
  readonly reason?: NotCommittedReason;
  /**
   * The name of the middleware that vetoed, when it declared one through `meta.name`.
   *
   * @remarks
   * A reducer refusal has always named its slice, through `rejectedBy` and `onRejected`. A
   * middleware veto named nobody, so "the event vanished" had no attribution at all. A bare
   * middleware function contributes its own function name; an anonymous one leaves this
   * absent.
   */
  readonly vetoedBy?: string;
}

/**
 * Why an event did not commit.
 *
 * @remarks
 * - `vetoed` - middleware returned `false`, or threw.
 * - `deduped` - an identical event was seen inside the dedup window.
 * - `cascade` - the event exceeded `maxReduceDepth` or the per-drain transition ceiling, so
 *   the store refused it rather than letting a cycle run away.
 *
 * @public
 */
export type NotCommittedReason = "vetoed" | "deduped" | "cascade";

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
   * Intended for **idempotent re-emission**: a caller replaying an event from elsewhere (another
   * store, a durable log) can preserve the original id so the same logical event keeps
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

/**
 * Emits an event.
 *
 * @remarks
 * **Channel and type are joined into one key, `"channel::type"`,** and dispatch, deduplication and
 * introspection all key on it. So two different pairs can collapse together: `("a::b", "c")` and
 * `("a", "b::c")` both become `"a::b::c"`, and a subscriber registered for one is invoked for the
 * other, while a dedup window lets one drop the other.
 *
 * A `::` in a channel is fine on its own (it is how a peer's channel is namespaced), so
 * development builds warn on the **collision**, naming both pairs, rather than on the
 * separator. Nothing throws.
 *
 * @public
 */
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
   * The processed event, including its `id`, any {@link EventMeta} the emitter attached, and its
   * place in a causal chain. `meta`, `parentId` and `depth` are absent unless the event has them,
   * as on {@link Event}.
   */
  event: {
    id: string;
    channel: string;
    type: string;
    payload: unknown;
    meta?: EventMeta;
    /** {@link Event.parentId}: the event whose handling caused this one. Absent on a root event. */
    parentId?: string;
    /** {@link Event.depth}: how deep in a causal chain this event is. Absent on a root event. */
    depth?: number;
  };
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
  /**
   * Milliseconds spent in the synchronous reduce phase for this event.
   *
   * @remarks
   * A duration, measured with `performance.now()` (falling back to `Date.now()` where it is
   * missing), so it is unaffected by changes to the system clock. It is not a time of day.
   */
  reduceTimeMs: number;
  /**
   * When the store processed the event, in epoch milliseconds from {@link StoreSpec.clock}.
   *
   * @remarks
   * Read once per event, after its reducers ran, and only while an observer is registered. It is
   * the timestamp an observer that records or exports events needs; for how long reducing took,
   * read {@link InstrumentedEvent.reduceTimeMs}.
   */
  at: number;
  /**
   * Present when a reducer refused the write, carrying its reason.
   *
   * @remarks
   * Distinct from `committed: false`, which means middleware vetoed the event before any reducer
   * saw it. This is a reducer having considered the write and declined it — the two look
   * identical in state and are entirely different in cause.
   */
  rejected?: Rejection;
  /**
   * Why the event did not commit. Absent when it did.
   *
   * @remarks
   * The same value {@link EmitResult.reason} carries, so an observer can tell a guard refusing an
   * action from a double-click being deduplicated — a distinction `committed: false` alone cannot
   * make, and the one an observer needs most, because instrumentation is the only seam that sees
   * uncommitted events without participating in the pipeline.
   *
   * **In practice this reads `"vetoed"` or nothing.** A deduplicated event is dropped at `emit`
   * before it is ever queued, and a cascade refusal returns before the drain reaches
   * instrumentation, so neither is visible here at all. The type admits the other values because
   * it is shared with `EmitResult`, not because they are currently reachable.
   */
  reason?: NotCommittedReason;
  /**
   * Which middleware vetoed, when one did and it had a name.
   *
   * @remarks
   * The same value {@link EmitResult.vetoedBy} carries: a spec's `meta.name`, or a plain
   * function's `name`. Absent for an anonymous function, and absent whenever the event committed.
   * A middleware that throws is attributed too — a throw is treated as a veto.
   */
  vetoedBy?: string;
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
 * A store's current load, from {@link StoreInstance.metrics}.
 *
 * @public
 */
export interface StoreMetrics {
  /** Events emitted and waiting to be reduced. Non-zero only during a synchronous drain. */
  readonly queueDepth: number;
  /** Events whose effects are still running. */
  readonly inFlightEffects: number;
  /** Emits dropped as duplicates since the store was created. */
  readonly dedupHits: number;
  /** Fingerprints held for deduplication, which is the cache's memory in entries. */
  readonly dedupEntries: number;
}

/**
 * One effect's part in {@link InstrumentedEffects}.
 *
 * @public
 */
export interface InstrumentedEffect {
  /** `EffectSpec.meta.name`, else the function's own name, when it has one. */
  readonly name?: string;
  /**
   * How the effect was registered. `internal` is the store's own machinery, such as the reply
   * listener behind `store.call()`.
   */
  readonly origin: Origin;
  /** From its start to its settlement, measured with `performance.now()`. */
  readonly durationMs: number;
  /** Whether it threw or rejected. The error itself reaches the diagnostics seam as `effect-error`. */
  readonly failed: boolean;
}

/**
 * What {@link StoreInstance.instrumentEffects} reports once every effect for an event has settled.
 *
 * @typeParam EM - Event map.
 *
 * @public
 */
export interface InstrumentedEffects<EM extends EventMapBase = EventMapBase> {
  /** The event, as {@link InstrumentedEvent.event} describes it. */
  readonly event: InstrumentedEvent<EM>["event"];
  /** Clock time ({@link StoreSpec.clock}) when the last effect settled. */
  readonly at: number;
  /** The whole effect phase, from the first effect's start to the last one's settlement. */
  readonly durationMs: number;
  /** One entry per effect, in the order they ran. */
  readonly effects: readonly InstrumentedEffect[];
}

/**
 * Receives an {@link InstrumentedEffects} per event whose effects ran.
 *
 * @public
 */
export type EffectsObserver<EM extends EventMapBase = EventMapBase> = (
  info: InstrumentedEffects<EM>,
) => void;

/**
 * Options for {@link StoreInstance.instrument}.
 *
 * @public
 */
export interface InstrumentOptions {
  /**
   * Also receive events on {@link StoreSpec.ephemeral} channels.
   *
   * @remarks
   * Off by default, so an observer that records history (a devtools timeline, an audit trail)
   * never pays for traffic. Turn it on for an observer that must see every state change whatever
   * caused it, such as persistence.
   *
   * @default false
   */
  readonly ephemeral?: boolean;
}

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
 * A cancellable timer handle, as `setTimeout` returns it: a number in browsers, an object in Node.
 *
 * @public
 */
export type TimerHandle = number | object;

/**
 * Where a store reads the time.
 *
 * @remarks
 * Called as a method, so a class instance keeps its `this`. Only `now()` is read, so a clock with
 * more members is accepted as it is.
 *
 * @public
 */
export interface Clock {
  /** Milliseconds since the epoch. */
  now(): number;
}

/**
 * Where a store arms its timers.
 *
 * @remarks
 * Called as methods, so a class instance keeps its `this`. `clearTimeout` receives exactly what
 * `setTimeout` returned.
 *
 * @public
 */
export interface Scheduler {
  /** Runs `callback` once, after `delayMs` milliseconds. */
  setTimeout(callback: () => void, delayMs: number): TimerHandle;
  /** Cancels a timer that has not fired yet. */
  clearTimeout(handle: TimerHandle): void;
}

/**
 * The stable identifier of a {@link Diagnostic}, for routing and filtering.
 *
 * @remarks
 * Failures the store contained:
 * - `effect-error`, `reducer-error`, `subscriber-error` (an `onEvent` handler), `connect-error`
 *   (a `connect` handler), `middleware-error` (a middleware threw, which vetoes the event)
 * - `observer-error`: an instrumentation or registration observer, or a hook, threw
 * - `emit-error`: the reduce phase failed outside any one consumer
 * - `slice-teardown-error`: a disposer threw while a slice was unregistered
 *
 * Refusals: `cascade` (a causal chain exceeded its ceiling), `rejected` (a reducer declined the
 * write; level `info`, since a refusal is a normal outcome), `registration-cascade`.
 *
 * Development warnings, never sent in production: `key-collision`, `payload-by-reference`,
 * `dotted-key`, `snapshot-missing-slice`, `middleware-promise`, `observer-promise`,
 * `use-after-dispose` (an `emit` or `call` on a disposed store), `ephemeral-write` (an event on
 * an ephemeral channel wrote state).
 *
 * @public
 */
export type DiagnosticCode =
  | "effect-error"
  | "reducer-error"
  | "subscriber-error"
  | "connect-error"
  | "middleware-error"
  | "observer-error"
  | "emit-error"
  | "slice-teardown-error"
  | "cascade"
  | "rejected"
  | "registration-cascade"
  | "key-collision"
  | "payload-by-reference"
  | "dotted-key"
  | "snapshot-missing-slice"
  | "middleware-promise"
  | "observer-promise"
  | "use-after-dispose"
  | "ephemeral-write";

/**
 * Something a store has to say: a failure it contained, a refusal, or a development warning.
 *
 * @remarks
 * `code` is stable, for a program; `message` is for a person and may be reworded. `detail` holds
 * the values involved, such as `event`, `error` and `slice`, so a sink can forward them without
 * parsing the message.
 *
 * @public
 */
export interface Diagnostic {
  /** How serious it is. A sink that also accepts other levels is still accepted. */
  readonly level: "info" | "warn" | "error";
  /** What happened, stably. See {@link DiagnosticCode}. */
  readonly code: DiagnosticCode;
  /** A sentence for a person. May be reworded between versions; route on `code`. */
  readonly message: string;
  /** The values involved. */
  readonly detail?: Readonly<Record<string, unknown>>;
}

/**
 * Receives a store's {@link Diagnostic}s. See {@link StoreSpec.diagnostics}.
 *
 * @public
 */
export type DiagnosticSink = (diagnostic: Diagnostic) => void;

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
  reducer: { [K in R]: ReducerSpec<S[K], EM> };

  /**
   * Middleware chain executed before reducers/effects.
   * Accepts either functions (legacy) or MiddlewareSpec objects (recommended).
   *
   * An event stops propagating only when a middleware returns an explicit `false`, or
   * throws. Returning nothing allows it. Middleware is synchronous: a `Promise` is not
   * `false`, so it cannot veto.
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
   * Where the store reads the time: deduplication windows and {@link InstrumentedEvent.at}.
   *
   * @remarks
   * Inject one to control time in a test, or to give every library a host configures the same
   * clock. The default reads `Date.now()` at each call, so fake timers installed after the store
   * was created still apply. Durations such as {@link InstrumentedEvent.reduceTimeMs} are measured
   * with `performance.now()` either way.
   *
   * @default `{ now: () => Date.now() }`
   */
  clock?: Clock;

  /**
   * Where the store arms its timers: the deduplication cache prune and the idle timeout of
   * `store.call()`.
   *
   * @remarks
   * The default calls the global `setTimeout` and `clearTimeout` when a timer is armed or
   * cleared, so fake timers installed after the store was created still apply. `persist` takes
   * its own, `PersistOptions.scheduler`.
   *
   * @default the global `setTimeout` and `clearTimeout`
   */
  scheduler?: Scheduler;

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
   * Called when an `onEvent` subscriber throws, or rejects.
   *
   * @remarks
   * The fourth of a set: reducers, effects, rejections and cascades all had a hook, and event
   * subscribers had `console.error` and nothing else - so an application could not route a
   * failing subscriber to its own error reporting. Subscribers are the seam a decoration is
   * told to use, which makes the gap more visible than it was.
   *
   * A throwing subscriber never stops the others, with or without this hook.
   */
  onSubscriberError?: (
    error: unknown,
    event: EventUnion<EM>,
    phase: NotifiedPhase,
  ) => void;

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

  /**
   * Channels whose events are traffic, not history.
   *
   * @remarks
   * Reducers, subscribers and effects handle them as usual. What changes is everything that
   * records: they reach only instrumentation observers registered with `{ ephemeral: true }`, so
   * a devtools timeline or an audit log skips them and the store does no instrumentation work for
   * them while nobody opted in, and replay skips them. Use it for high-frequency signals such as
   * presence, cursor positions, typing indicators or progress ticks.
   *
   * An ephemeral event that writes state is warned about once in development (the
   * `ephemeral-write` diagnostic): replay would skip it, so a replayed history would diverge.
   */
  ephemeral?: readonly (keyof EM & string)[];

  /**
   * Where the store sends its diagnostics: every failure it contained, every refusal, and its
   * development warnings. See {@link Diagnostic}.
   *
   * @remarks
   * Without a sink the store writes to the console exactly as it always has. With one, the sink
   * replaces that output: the store's owner decides where its diagnostics go, and the store
   * itself writes nothing. The `on*` hooks above are still called either way.
   *
   * A sink that throws is ignored; it cannot break the store. Observers added later with
   * {@link StoreInstance.onDiagnostic} receive the same diagnostics, in addition to this sink.
   */
  diagnostics?: DiagnosticSink;
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
> extends StoreDecoration<R, S, EM> {
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
   * {@link Store.call} for the full contract: correlation, backpressure, timeouts, and why it
   * is a local primitive.
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
      ctx: EffectContext,
    ) => void | Promise<void>,
  ): Unsubscribe;

  /**
   * Register a post-reducer effect (sees final state). Returns an unsubscribe.
   */
  registerEffect<Spec extends EffectSpec<any, any>>(
    spec: Spec,
  ): Unsubscribe & { store: DecoratableStore<R, S, Merge<EM, EMAddOf<Spec>>>; dispose(): void };

  /**
   * Dynamically add middleware, in either the function or the spec form.
   */
  registerMiddleware<M extends MiddlewareInput<any, any>>(
    mw: M,
  ): Unsubscribe & { store: DecoratableStore<R, S, Merge<EM, EMAddOf<M>>>; dispose(): void };

  /**
   * Dynamically add/remove a namespaced reducer slice at runtime.
   *
   * @remarks
   * Generic over the spec for the same reason {@link StoreDecoration.registerSlice} is, and it
   * matters for anyone writing a decorator. Typed as `ReducerSpec<any, EM>` — the store's *own*
   * event map — a spec naming a channel the application's `EM` does not contain could not
   * typecheck, and neither direction of assignability held: the forward direction failed on
   * `reducer`, a property rather than a method, so `strictFunctionTypes` checks its parameters
   * contravariantly and bivariance does not rescue it; the reverse failed on `when`. A decoration
   * therefore had to keep a cast. With `Spec` inferred from the value, the concrete key tuple
   * satisfies `ReducerSpec<any, any>` and the contributed event map is recovered from the brand,
   * exactly as the `with*` family already did.
   */
  registerReducer<N extends string, Spec extends ReducerSpec<any, any>>(
    name: N,
    spec: Spec,
    options?: { owner?: string },
  ): Unsubscribe & { store: WidenedSlice<R, S, EM, N, Spec>; dispose(): void };

  /**
   * Releases the store. Afterwards it is inert: `emit()` resolves `{ committed: false }` without
   * running anything, `call()` rejects with `CallAbortedError` (as does every pending call), and
   * registration methods throw. {@link StoreInstance.signal} aborts last. Idempotent.
   */
  dispose(): void;

  /**
   * The store's current load: queue depth, effects in flight, deduplication. Cheap enough to read
   * on every scrape of a metrics endpoint.
   */
  metrics(): StoreMetrics;

  /**
   * Resolves when the store is idle: no event waiting to be reduced and no effect running.
   *
   * @remarks
   * For a graceful shutdown, where a process stops taking new work, waits for what is in
   * progress, and then disposes. A `call()` waiting for its reply and a pending timer are not
   * work the store is doing, so they do not delay it. Resolves at once when the store is already
   * idle or disposed, and every pending wait resolves on dispose. Bound it with a timeout: an
   * effect that never settles keeps the store busy. Never await it from an effect, which is
   * itself the work it would wait for.
   */
  whenIdle(): Promise<void>;

  /**
   * Aborted when the store is disposed. Created on first read; already aborted when read after
   * disposal. Tie work that should live exactly as long as the store to it.
   */
  readonly signal: AbortSignal;

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
   * - `'written'`: Events that actually changed state
   * - `'all'`: Both committed and uncommitted events (handler receives phase parameter).
   *   Deliberately not `written` as well: an event that writes is also committed, so folding
   *   it in would notify every existing `all` subscriber twice for one event.
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
    options?: {
      /**
       * Also call this handler while devtools is replaying, which it does not by default.
       *
       * @remarks
       * Opt in only for a handler that derives view state purely from the event stream and
       * performs no I/O. A handler that publishes, writes or notifies must stay out: replay
       * is a debugging operation, and a scrub of the timeline should not reach a peer, a
       * socket or an analytics endpoint.
       */
      duringReplay?: boolean;
    },
  ): Unsubscribe;

  /**
   * Called when the store gains or loses a reducer, middleware or effect.
   *
   * @remarks
   * A push seam, because `__devtoolsIntrospect()` is pull-only: a devtools panel's
   * subscription list goes stale the moment a decoration mounts anything, and a library that
   * needs to react to another library has nothing to wait on.
   *
   * Delivered as an **array, one batch per public call**. `replaceReducers` unmounts and then
   * remounts, so between those steps a slice that is merely being updated does not exist; a
   * per-change observer would see a spurious unmount. `hotReplace` delivers a single batch
   * spanning all three kinds.
   *
   * Observers run **after** the state broadcast, so the view layer has already been told a
   * fact before a library gets to react to it. A registration made *by* an observer is
   * legitimate and is queued rather than delivered re-entrantly: depth-first work,
   * breadth-first notification, so no observer ever sees a half-built topology.
   *
   * Synchronous. A `Promise` returned from an observer is not awaited, and is reported in
   * development, because the store has already moved on by the time it would resolve.
   *
   * **Replay never produces a change.** `__replayEvents` and `__applyExternalState` alter
   * state and never topology, so there is no `duringReplay` option here and none is needed.
   *
   * `dispose()` fires nothing: the store is going away, not being dismantled slice by slice.
   *
   * @param observer - Receives one batch per registration change.
   * @param options - `emitCurrent` synthesizes a `"mounted"` batch for everything already
   * installed, delivered synchronously before this call returns. Spec-time registrations
   * happen inside `createStore`, so a decorator applied afterwards never saw them arrive;
   * this closes that gap without a separate pull API to race against. The synthesized
   * changes carry their **real** origins, never a synthetic marker, because filtering on
   * provenance is the main thing an observer does.
   * @returns Unsubscribe function.
   */
  onRegistrationChange(
    observer: RegistrationObserver<EM>,
    options?: { emitCurrent?: boolean },
  ): Unsubscribe;

  /**
   * `true` while devtools is applying a snapshot or replaying events.
   *
   * @remarks
   * For anything that must branch rather than simply skip. Most code needs nothing: replay
   * does not notify event subscribers unless they opted in.
   *
   * A getter, so destructuring it takes a snapshot rather than a live view.
   */
  readonly isReplaying: boolean;

  /**
   * Replaces the entire middleware pipeline (HMR-friendly).
   *
   * @param next - New middleware array.
   */
  replaceMiddleware(
    next: MiddlewareInput<DeepReadonly<S>, EM>[],
    opts?: { scope?: ReplaceScope },
  ): void;

  /**
   * Replaces all registered effects (HMR-friendly).
   *
   * @param next - New effects array (as EffectSpecs).
   */
  replaceEffects(
    next: Array<EffectSpec<DeepReadonly<S>, EM>>,
    opts?: { scope?: ReplaceScope },
  ): void;

  /**
   * Replaces the entire reducer set (HMR-friendly).
   *
   * @param next - Slice specs keyed by slice name, each typed with its own slice's state. Every
   *   key is optional: an omitted slice this call owns is removed, and an omitted slice mounted
   *   at runtime is kept. See {@link ReducerReplacement}.
   * @param opts - `{ preserveState?: boolean }` (default `true`).
   */
  replaceReducers(
    next: ReducerReplacement<R, S, EM>,
    opts?: { preserveState?: boolean; scope?: ReplaceScope },
  ): void;

  /**
   * Convenience API to replace any subset of store parts (HMR patterns).
   *
   * @param partial - Partial replacement set.
   */
  hotReplace(partial: {
    reducer?: ReducerReplacement<R, S, EM>;
    middleware?: MiddlewareInput<DeepReadonly<S>, EM>[];
    effects?: Array<EffectSpec<DeepReadonly<S>, EM>>;
    preserveState?: boolean;
    scope?: ReplaceScope;
  }): void;

  /**
   * Replays a sequence of events from a snapshot through reducers ONLY. Skips dedup,
   * middleware, effects, DevTools logging, and event subscribers.
   *
   * A subscriber that legitimately wants replayed events opts in per subscription with
   * `onEvent(channel, type, handler, phase, { duringReplay: true })`. Without that opt-in,
   * scrubbing a timeline would re-run every handler as though the events had happened again -
   * publishing to peers, writing to sockets and firing analytics, with nothing available to
   * detect it.
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
    reducers: Array<{ name: string; when?: unknown; origin: Origin; owner?: string }>;
    effects: Array<{
      channel: string;
      type: string;
      name?: string;
      description?: string;
      origin: Origin;
    }>;
    middleware: Array<{
      name?: string;
      description?: string;
      when?: unknown;
      origin: Origin;
    }>;
    atomic: Array<{ reducer: string; property: string }>;
    /** `duringReplay` says whether a subscription hears replayed events. */
    event: Array<{ channel: string; type: string; phase: string; duringReplay: boolean }>;
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
  instrument(observer: InstrumentationObserver<EM>, options?: InstrumentOptions): Unsubscribe;

  /**
   * Observes the effect phase: once every effect for an event has settled, reports how long each
   * took, whether it failed, and what it is called.
   *
   * @remarks
   * {@link StoreInstance.instrument} reports an event after its reducers ran, before its
   * effects. This is the other half, for tracing and timing: effect spans, slow handlers, failure
   * rates by effect. Called only for an event whose effects ran at least one effect, and only
   * while an observer is registered is any timing taken. Events on an ephemeral channel reach it
   * only with `{ ephemeral: true }`, as with `instrument`. An observer that throws is reported
   * as `observer-error` and does not affect the store.
   *
   * @param observer - Called once per event whose effects ran.
   * @returns Unsubscribe function.
   */
  instrumentEffects(observer: EffectsObserver<EM>, options?: InstrumentOptions): Unsubscribe;

  /**
   * Observes the store's diagnostics: the failures it contained, its refusals and its
   * development warnings, as {@link Diagnostic}s.
   *
   * @remarks
   * For code attached to a store it did not create, such as a library that decorates one, which
   * cannot set {@link StoreSpec.diagnostics} or the `on*` hooks. An observer is additive: it
   * does not silence the console output a store without a sink produces, and it receives what a
   * sink receives. One that throws is ignored.
   *
   * @param observer - Called once per diagnostic.
   * @returns Unsubscribe function.
   */
  onDiagnostic(observer: DiagnosticSink): Unsubscribe;

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
 * Use `when` for event targeting. An earlier `events` array was removed; this remark
 * outlived it and described a property that no longer exists.
 *
 * **A reducer receives exactly one slice and returns exactly one slice.** `state` here is this
 * reducer's own slice, not the store's state, and the value returned is written back only under
 * this reducer's name. There is no path to a sibling: the reducer is handed no `getState`, no
 * store reference, and no second argument beyond the event, and returning a whole-store-shaped
 * object writes nothing extra because the commit is keyed by the name the reducer was mounted
 * under.
 *
 * So cross-slice isolation is a **framework guarantee, not a convention**. There is no second
 * writer to a slice and therefore no intra-slice authorisation question — only the ordinary
 * question of whether this reducer's own code is correct. The one cross-slice effect available is
 * a {@link Rejection}, which refuses the whole event rather than writing anywhere.
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
   * Initial state for this reducer's own slice.
   */
  state: S;

  /**
   * Event targeting: one of the exact forms of the `When` matcher.
   *
   * @remarks
   * `channelPattern` is not accepted here, by the type and at registration: a reducer's input
   * set has to be closed and readable from its spec. See {@link ExactWhen}.
   */
  when?: ExactWhen<EM>;

  /**
   * Pure reducer function: `(state, event) => nextState`, where `state` is this reducer's slice
   * and the return value replaces that slice and nothing else.
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
   * Event targeting: one of the exact forms of the `When` matcher.
   *
   * @remarks
   * `channelPattern` is not accepted here, by the type and at registration: every effect for
   * an event runs in sequence, and a pattern would hide which chains an effect joins. See
   * {@link ExactWhen}.
   */
  when?: ExactWhen<EM>;

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
 *
 * @remarks
 * **Only an explicit `false` vetoes.** Returning `true`, or returning nothing at all, allows
 * the event, so middleware that only logs or measures can simply fall off the end.
 *
 * The return type is `boolean | void` rather than `boolean` for that reason: under these
 * semantics an omitted `return` is correct, so making the compiler demand one would be
 * wrong. It was `boolean` while any falsy value vetoed, which made a missing `return`
 * silently swallow every event the middleware matched.
 *
 * Middleware runs in the synchronous reduce phase (so `getState()` is correct
 * immediately after `emit()`), and therefore must be synchronous. Perform async
 * work in effects instead - a `Promise` is not `false`, so an async middleware allows the
 * event while it is still deciding, and the store logs an error in development when it sees
 * one returned.
 *
 * A middleware that **throws** vetoes the event and logs, naming the event: a guard that
 * crashed has not decided the event is safe.
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
) => boolean | void;

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
 * What an effect receives about its own registration.
 *
 * @public
 */
export interface EffectContext {
  /**
   * Aborted when this effect stops being registered: its disposer ran, `replaceEffects` or
   * `hotReplace` removed it, or the store was disposed.
   *
   * @remarks
   * Hand it to work the effect starts, such as a `fetch`, so a reload or an unmount cancels the
   * request instead of letting it land in a store that no longer wants it. Created on first
   * read, and shared by every event the registration handles. An effect that is still running
   * when it aborts is not stopped, and what it emits afterwards is not dropped: unregistering an
   * effect is not the end of the store. Check `signal.aborted` before emitting a result that only
   * made sense while the effect was installed.
   */
  readonly signal: AbortSignal;
}

/**
 * Effect handler: runs AFTER reducers, sees the final state.
 *
 * @remarks
 * The fourth argument is optional to declare, so an effect written with three parameters is still
 * an `EffectFunction`.
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
  ctx: EffectContext,
) => void | Promise<void>;

/**
 * Any map of slice names to reducer specs.
 *
 * @remarks
 * The constraint for a helper that takes a store's `reducer` option and infers from it, as
 * {@link StateFromReducers} and {@link EMFromReducersStrict} do.
 *
 * @public
 */
export type ReducersMapAny = Record<string, ReducerSpec<any, any>>;

/**
 * The state a reducers map produces: each slice name mapped to its spec's state type.
 *
 * @remarks
 * This is the state `createStore` infers when it is given only `reducer`. Use it to name that
 * state without writing it out a second time.
 *
 * @example
 * ```ts
 * const reducer = { counter: counterSpec, todos: todosSpec };
 * type AppState = StateFromReducers<typeof reducer>;
 * // { counter: CounterState; todos: TodosState }
 * ```
 *
 * @public
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
 * The event map a reducers map produces, merged across its slices.
 *
 * @remarks
 * This is the event map the `createStore` inference overload derives. Each slice contributes its
 * own event map, and those maps are **merged** (channels, and each channel's `type → payload`
 * entries, combined across slices) rather than collapsed to one slice's map, so a store whose
 * slices declare different event maps still types `emit` against every slice's channels and
 * types. Pair it with {@link StateFromReducers} to name both halves of an inferred store.
 *
 * @public
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
 * Supports five targeting modes:
 * - `{ any: true }` — match all events
 * - `{ keys: [...] }` — match specific `[channel, type]` pairs (correlated)
 * - `{ channel: 'x' }` — match all events in a channel
 * - `{ channels: ['x', 'y'] }` — match all events in multiple channels
 * - `{ channelPattern: 'x' }` — match channels by pattern, with `*` standing for zero or more
 *   characters. Untyped by construction: it exists to match channels the event map does not name.
 *
 * @remarks
 * The first four compare exactly. `channelPattern` is for the case they cannot express: a channel
 * that arrives namespaced, such as a peer's `alias::plan` beside a local `plan`, where a
 * guard wants both and cannot know the aliases in advance.
 *
 * Without it such a guard has to match everything and filter in its own body, which costs the
 * pre-call skip and — more quietly — misreports itself, because the matcher an observer sees
 * through `onRegistrationChange` then says it matches the entire store.
 *
 * `*` stands for zero or more characters, so `"*plan"` covers `plan` and `bb::plan` with one rule,
 * and `"*::plan"` covers only the namespaced forms. Everything else in the pattern is literal.
 *
 * **`channelPattern` is for middleware only.** Reducers and effects take {@link ExactWhen}, and
 * registering one with a pattern throws. A reducer's input set has to be closed and readable from
 * its spec, or replaying the same log against the same code could fold a different set of events
 * once something adds a channel; and a pattern on an effect would enlist it, unseen, in the
 * sequential chain of every channel it matched.
 *
 * A matcher of none of the five forms (`{}`, `{ any: false }`, `{ keys: "x" }`) also throws at
 * registration, on every seam: it used to be accepted and match nothing.
 *
 * **It stays a string rather than a predicate on purpose.** A matcher is reported to observers and
 * travels to a devtools panel; a function would make every one of them opaque.
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
  | { channels: ReadonlyArray<keyof EM & string> }
  | { channelPattern: string };

/**
 * The exact forms of {@link When}: every form but `channelPattern`. What reducers and effects
 * accept.
 *
 * @remarks
 * Exact rather than pattern-matched on purpose, and refused rather than ignored: before 0.10.0 a
 * reducer or effect given a `channelPattern` registered without complaint and then handled
 * nothing at all.
 *
 * @typeParam EM - Event map.
 *
 * @public
 */
export type ExactWhen<EM extends EventMapBase> = Exclude<When<EM>, { channelPattern: string }>;

/**
 * What `replaceReducers` and `hotReplace({ reducer })` take: slice specs keyed by slice name,
 * each typed with **its own** slice's state, and every key optional.
 *
 * @remarks
 * Optional because the runtime treats an omitted slice in two ways, both legitimate: a slice the
 * replaced set owned is removed, and a slice mounted at runtime (`registerSlice`, `withSlice`, a
 * decorating library) is kept along with its state. Requiring every name made the only call that
 * typechecked on a decorated store one the runtime refuses, because naming a runtime slice
 * without `{ scope: "all" }` throws.
 *
 * Per slice because a reducer for one slice must not be able to return another's state. Typing
 * each entry with the union of every slice's state allowed exactly that, and refused an
 * annotated reducer on any store with two slices.
 *
 * Naming a slice mounted at runtime still typechecks and throws: telling the two kinds apart in
 * the type would need the store to track them separately, and the throw already says what to do.
 *
 * @typeParam R  - Slice names.
 * @typeParam S  - State by slice name.
 * @typeParam EM - Event map.
 *
 * @public
 */
export type ReducerReplacement<
  R extends string,
  S extends Record<R, any>,
  EM extends EventMapBase,
> = { [K in R]?: ReducerSpec<S[K], EM> };

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
 * Extracts the event union from a `When` matcher, for typing a handler from its matcher.
 *
 * @remarks
 * `{ channelPattern }` resolves to the whole {@link EventUnion}: a pattern is untyped by
 * construction, and the whole union is exactly what a middleware handler receives, which is the
 * only consumer a pattern can reach. It used to fall through to `never`.
 *
 * @typeParam EM - Event map.
 * @typeParam W  - When matcher type.
 *
 * @example
 * ```ts
 * const when = { keys: eventKeys<AppEM>()([["ui", "increment"], ["ui", "reset"]]) };
 * type Handled = EventFromWhen<AppEM, typeof when>;
 * // Event<AppEM, "ui", "increment"> | Event<AppEM, "ui", "reset">
 * ```
 *
 * @public
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
        : W extends { channelPattern: string }
          ? EventUnion<EM>
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
 * One change to a store's registrations.
 *
 * @remarks
 * Self-sufficient on purpose: an observer should never need a follow-up
 * `__devtoolsIntrospect()` call to act on what it was told.
 *
 * @public
 */
export interface RegistrationChange<EM extends EventMapBase = EventMapBase> {
  readonly kind: "reducer" | "middleware" | "effect";
  readonly op: "mounted" | "unmounted";
  /** Slice name for a reducer; `meta.name` for middleware and effects; absent when unnamed. */
  readonly name?: string;
  readonly origin: Origin;
  /** Introspection only, and only ever what a library passed. */
  readonly owner?: string;
  readonly description?: string;
  /**
   * The **normalized** matcher, as `matchesWhen` will actually use it.
   *
   * @remarks
   * Not the raw spec's `when`. `registerEffect` normalizes three ways, including turning no
   * targeting at all into `{ any: true }`, so handing back the raw form would describe
   * something other than what will fire.
   */
  readonly when?: When<EM>;
  /**
   * Reducers only: what happened to the slice's state.
   *
   * @remarks
   * Four values, and the fourth is the one that matters. `replaceReducers` updates an
   * existing slice by unmounting it with its state intact and remounting, so an observer
   * treating every `"unmounted"` as destruction would tear down a subscription it is about
   * to need. `"retained"` says the state survived; `"deleted"` says it did not.
   */
  readonly state?: "initialized" | "preserved" | "deleted" | "retained";
  /** Whether this registration is dispatched by key (O(1)) or by runtime matching. */
  readonly dispatch?: "keyed" | "pattern";
}

/**
 * Observer for {@link StoreInstance.onRegistrationChange}.
 *
 * @public
 */
export type RegistrationObserver<EM extends EventMapBase = EventMapBase> = (
  changes: readonly RegistrationChange<EM>[],
) => void;

/**
 * Where a registration came from.
 *
 * @remarks
 * The distinction already existed in the API surface and simply was not honoured. `replace*`
 * exists to replace *what the application authored*; a registration a library made through
 * `registerReducer` / `registerMiddleware` / `registerEffect` after construction was never in
 * that set, and no caller of `replaceReducers(myReducers)` means "and also delete the slice
 * devtools or a decoration mounted".
 *
 * - `spec` - supplied to `createStore`, or installed by a `replace*` call.
 * - `dynamic` - registered after construction, which is the only way to decorate a store
 *   that already exists.
 * - `internal` - the store's own machinery, currently the reply listener behind
 *   `store.call()`. Preserved even under `{ scope: "all" }`, because a test harness resetting
 *   a store between cases never means "and abandon the call that is in flight".
 *
 * Recorded internally. No public signature takes it, and **no library declares it**: getting
 * this right must not depend on anyone remembering to pass a string.
 *
 * @public
 */
export type Origin = "spec" | "dynamic" | "internal";

/**
 * Which registrations a `replace*` call is allowed to remove.
 *
 * @remarks
 * `"spec"` is the default and replaces only what the application authored. `"all"` restores
 * the pre-0.8.0 behaviour exactly, for a caller that genuinely wants it, such as a test
 * harness resetting a store between cases. `internal` registrations survive both.
 *
 * @public
 */
export type ReplaceScope = "spec" | "all";

/**
 * One `onEvent` subscription: the handler plus whether it asked to hear replayed events.
 *
 * @remarks
 * An entry per subscription rather than the bare handler, for two reasons. It is where the
 * replay opt-in lives; and it gives each subscription its own identity, so two subscriptions
 * sharing one handler function are two Set members and disposing one no longer removes both.
 *
 * @internal
 */
export interface EventSubscriberEntry<S, EM extends EventMapBase> {
  readonly handler: EventSubscriptionHandler<S, EM>;
  readonly duringReplay: boolean;
}

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
// ============================================
// Typed growth: decorating a store after construction
// ============================================

/**
 * Flattens an intersection into a single object type.
 *
 * @remarks
 * Chaining decorations produces `S & Record<"a", A> & Record<"b", B>`, which is correct but
 * displays as an intersection in every hover and error message. This collapses it.
 *
 * Apply it at the **top level only**. It is a homomorphic mapped type, so running it over a
 * slice whose state *is* a `Map`, `Set` or `Date` destroys that type - the same failure
 * {@link DeepReadonly} handles the built-ins explicitly to avoid.
 *
 * @public
 */
export type Prettify<T> = { [K in keyof T]: T[K] } & {};

/**
 * Merges `B` into `A`, flattening the result. An empty `B` leaves `A` untouched, so a
 * decoration that adds no events costs nothing at the type level.
 *
 * @public
 */
export type Merge<A, B> = [keyof B] extends [never] ? A : Prettify<A & B>;

/**
 * The slice-name union after adding `N`.
 *
 * @remarks
 * The `string extends N` guard is load-bearing. Passing a `string`-typed variable rather than
 * a literal would otherwise widen the union to `string`, and every `S[R1]` lookup downstream
 * would resolve to the union of every slice's state - silently destroying `useAtomicProp`
 * inference across the whole application. Degrading to "no widening" is the safe failure.
 *
 * @public
 */
export type WidenNames<R extends string, N extends string> = string extends N ? R : R | N;

/**
 * The state record after adding slice `N` with state `St`. Degrades to `S` when `N` is not a
 * string literal, for the reason given on {@link WidenNames}.
 *
 * @public
 */
export type WidenState<S, N extends string, St> = string extends N
  ? S
  : Prettify<S & Record<N, St>>;

/**
 * Phantom carrier for the event map a spec contributes.
 *
 * @remarks
 * `EMAdd` cannot be inferred from a spec's `when`: `{ keys: [["chan", "evt"]] }` carries
 * channel and type strings and no payload types, so there is nothing to infer a map from. And
 * TypeScript has no partial type-argument inference, so a `registerSlice<N, St, EMAdd>` would
 * force a caller who names `EMAdd` to hand-write `N` and `St` too.
 *
 * The way out is to put `EMAdd` in a **value** position, where inference works. The builders
 * ({@link defineSlice}, {@link defineMiddleware}, {@link defineEffect}) brand a spec with this
 * interface, and the register methods read it back with {@link EMAddOf}. Nothing exists at
 * runtime; the property is never assigned.
 *
 * The property is **required, not optional**: an optional one makes
 * `X extends EventMapCarrier<infer E>` match every object and infer `unknown`. And it is a
 * *function* type so `EMAdd` sits in both co- and contravariant position, which keeps the
 * inference exact rather than widening to a supertype.
 *
 * @public
 */
export interface EventMapCarrier<EMAdd extends EventMapBase> {
  /** Phantom. Never present at runtime, and never read. */
  readonly "~yoltraEventMap": (em: EMAdd) => EMAdd;
}

/**
 * Reads the event map a spec contributes, or `{}` when it declares none.
 *
 * @remarks
 * Only a branded spec widens the event map. An unbranded object literal contributes `{}`,
 * which is today's behaviour and therefore always safe.
 *
 * @public
 */
export type EMAddOf<X> = X extends { readonly "~yoltraEventMap": (em: infer E) => unknown }
  ? E extends EventMapBase
    ? E
    : EmptyEventMap
  : EmptyEventMap;

/**
 * The event map a spec contributes when it declares none.
 *
 * @remarks
 * `Record<never, never>` rather than `{}`: the bare empty-object type accepts any non-nullish
 * value, including `0` and `""`, so it would let nonsense through {@link Merge}. This has no
 * keys, which is the actual claim being made, and {@link Merge} short-circuits on it.
 *
 * @public
 */
export type EmptyEventMap = Record<never, never>;

/**
 * Reads a reducer spec's state type.
 *
 * @public
 */
export type StateOfSpec<X> = X extends ReducerSpec<infer St, any> ? St : never;

/**
 * What a decoration contributes to a store: some slices, some events, either possibly empty.
 *
 * @remarks
 * Phantom. Never constructed, and never present at runtime; it exists so a library can state
 * its contribution once and have {@link Decorated} and {@link StoreDecorator} read it back.
 *
 * @example
 * ```ts
 * type FlagsDecoration = Decoration<{ flags: FlagsState }, FlagsEM>;
 * ```
 *
 * @public
 */
export interface Decoration<
  AddS extends Record<string, any> = Record<never, never>,
  AddEM extends EventMapBase = EmptyEventMap,
> {
  readonly slices: AddS;
  readonly events: AddEM;
}

/**
 * The store type that results from applying a {@link Decoration}.
 *
 * @public
 */
export type Decorated<R extends string, S extends Record<R, any>, EM extends EventMapBase, D> =
  D extends Decoration<infer AddS, infer AddEM>
    ? StoreInstance<
        WidenNames<R, keyof AddS & string>,
        SatisfiesSlices<Prettify<S & AddS>, WidenNames<R, keyof AddS & string>>,
        Merge<EM, AddEM>
      >
    : never;

/**
 * The shape a `withX(store, config)` decorator conforms to, with `config` curried away.
 *
 * @remarks
 * **Generic over the incoming store on purpose**, and that is what makes composition work
 * rather than a variance rule. `R`, `S` and `EM` are inference sites, so at each call in a
 * nest TypeScript instantiates them from whatever the argument actually is: an EM-only
 * decorator nested inside one that also adds a slice infers the already-widened `R` and `S`
 * and carries them through untouched. Either order composes, and nothing is lost.
 *
 * Nesting is the composition mechanism; there is no `pipe`. Every decorator takes
 * `(store, config)`, so each step in a pipe needs a lambda to become unary, which makes
 * `pipe(store, s => withA(s, cfgA), s => withB(s, cfgB))` **longer** than
 * `withB(withA(store, cfgA), cfgB)`. A pipe only pays for curried decorators, which would be
 * a different convention from the one `withDevtools` already set.
 *
 * A dependency on another decoration needs no registry either: constrain the input.
 * `EM extends EventMapBase & RequiredEM` fails at the call site naming the channels that are
 * missing, and still composes, because TypeScript infers `EM` and then checks the constraint.
 *
 * @example
 * ```ts
 * export function withFlags<
 *   R extends string,
 *   S extends Record<R, any>,
 *   EM extends EventMapBase,
 * >(store: StoreInstance<R, S, EM>, config: FlagsConfig) {
 *   return store.withSlice("flags", defineSlice<FlagsEM>()({ ... }), {
 *     owner: "@scope/flags",
 *   });
 * }
 * ```
 *
 * @public
 */
export type StoreDecorator<D extends Decoration<any, any>> = <
  R extends string,
  S extends Record<R, any>,
  EM extends EventMapBase,
>(
  store: StoreInstance<R, S, EM>,
) => Decorated<R, S, EM, D>;

/**
 * A store that can be decorated, and whose type grows as it is.
 *
 * @public
 */
export type DecoratableStore<
  R extends string,
  S extends Record<R, any>,
  EM extends EventMapBase,
> = StoreInstance<R, S, EM>;

/**
 * Proves to the compiler that a widened state record still covers every slice name.
 *
 * @remarks
 * `StoreInstance` constrains `S extends Record<R, any>`, and TypeScript cannot correlate
 * {@link WidenState} with {@link WidenNames} well enough to see that the widened record
 * always carries the widened key set - both branch on `string extends N`, but it checks each
 * in isolation.
 *
 * The intersection is with `unknown`, **never `any`**. `T & unknown` reduces to `T`, so every
 * slice keeps its exact type; `T & any` is `any`, which silently collapses every slice's
 * state and destroys the inference this feature exists to provide. That was a real bug caught
 * by the spike, and it is the reason this helper is written out rather than inlined.
 *
 * @public
 */
export type SatisfiesSlices<T, K extends string> = Prettify<T & Record<K, unknown>>;

/**
 * The store type after mounting slice `N` from `Spec`.
 *
 * @public
 */
export type WidenedSlice<
  R extends string,
  S extends Record<R, any>,
  EM extends EventMapBase,
  N extends string,
  Spec,
> = DecoratableStore<
  WidenNames<R, N>,
  SatisfiesSlices<WidenState<S, N, StateOfSpec<Spec>>, WidenNames<R, N>>,
  Merge<EM, EMAddOf<Spec>>
>;

/**
 * The registration surface whose return types carry the widening.
 *
 * @remarks
 * Every method returns the **same runtime object**, re-typed. Subscriptions, effects,
 * middleware, the dedup cache, both buses and any in-flight `call()` are untouched; the only
 * runtime effect is the registration itself.
 *
 * Note there is no explicit type parameter for the added event map anywhere. It is inferred
 * from a single value position, so the partial-inference problem never arises and no call
 * site needs a type argument or a cast.
 *
 * @public
 */
export interface StoreDecoration<
  R extends string,
  S extends Record<R, any>,
  EM extends EventMapBase,
> {
  /**
   * Mounts a slice and hands back both the widened store and a disposer.
   *
   * The disposer is **library-private**: after it runs, the widened type still promises a
   * slice that is gone. Application code should take {@link StoreDecoration.withSlice}
   * instead, which returns no disposer at all.
   */
  registerSlice<N extends string, Spec extends ReducerSpec<any, any>>(
    name: N,
    spec: Spec,
    options?: { owner?: string },
  ): Unsubscribe & { store: WidenedSlice<R, S, EM, N, Spec>; dispose(): void };

  /** Mounts a slice and returns the widened store, for chaining. */
  withSlice<N extends string, Spec extends ReducerSpec<any, any>>(
    name: N,
    spec: Spec,
    options?: { owner?: string },
  ): WidenedSlice<R, S, EM, N, Spec>;

  /**
   * Registers middleware and returns the store widened by whatever event map it declares.
   *
   * Only the **spec form** can widen: `MiddlewareFunction`'s event parameter is
   * `EventUnion<EM>`, a mapped type TypeScript cannot infer `EM` back out of. A bare function
   * therefore contributes `{}`.
   */
  withMiddleware<M extends MiddlewareInput<any, any>>(
    mw: M,
  ): DecoratableStore<R, S, Merge<EM, EMAddOf<M>>>;

  /** Registers an effect and returns the store widened by whatever event map it declares. */
  withEffect<Spec extends EffectSpec<any, any>>(
    spec: Spec,
  ): DecoratableStore<R, S, Merge<EM, EMAddOf<Spec>>>;
}

/**
 * Declares a reducer spec together with the event map it contributes.
 *
 * @remarks
 * Curried so `EMAdd` is named once and `St` is inferred from `state`, which is what lets every
 * registration site stay free of type arguments. Identity at runtime.
 *
 * @example
 * ```ts
 * type LibEM = { "lib.flag": { enabled: { id: string } } };
 *
 * const flags = defineSlice<LibEM>()({
 *   state: { enabled: [] as string[] },
 *   when: { keys: [["lib.flag", "enabled"]] },
 *   reducer: (s, e) => (e.type === "enabled" ? { enabled: [...s.enabled, e.payload.id] } : s),
 * });
 *
 * const widened = store.withSlice("flags", flags);
 * // widened.getState().flags.enabled is string[], and `lib.flag` is emittable
 * ```
 *
 * @public
 */
export const defineSlice =
  <EMAdd extends EventMapBase>() =>
  <St>(spec: ReducerSpec<St, EMAdd>): ReducerSpec<St, EMAdd> & EventMapCarrier<EMAdd> =>
    spec as ReducerSpec<St, EMAdd> & EventMapCarrier<EMAdd>;

/**
 * Declares a middleware spec together with the event map it contributes.
 *
 * @remarks
 * The spec form is the **only** form that can widen an event map. Identity at runtime.
 *
 * @public
 */
export const defineMiddleware =
  <EMAdd extends EventMapBase, St = any>() =>
  (
    spec: MiddlewareSpec<DeepReadonly<St>, EMAdd>,
  ): MiddlewareSpec<DeepReadonly<St>, EMAdd> & EventMapCarrier<EMAdd> =>
    spec as MiddlewareSpec<DeepReadonly<St>, EMAdd> & EventMapCarrier<EMAdd>;

/**
 * Declares an effect spec together with the event map it contributes.
 *
 * @remarks
 * Identity at runtime.
 *
 * @public
 */
export const defineEffect =
  <EMAdd extends EventMapBase, St = any>() =>
  (
    spec: EffectSpec<DeepReadonly<St>, EMAdd>,
  ): EffectSpec<DeepReadonly<St>, EMAdd> & EventMapCarrier<EMAdd> =>
    spec as EffectSpec<DeepReadonly<St>, EMAdd> & EventMapCarrier<EMAdd>;
