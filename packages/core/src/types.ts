/**
 * @module @yoltra/core
 */

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
 * A single event object: `{ channel, type, payload, id }`.
 *
 * @typeParam EM - Event map.
 * @typeParam C  - Channel key.
 * @typeParam T  - Type key within channel `C`.
 * @typeParam P  - Payload type (defaults to `EM[C][T]`).
 *
 * @remarks
 * - The `id` field is automatically added by the store to enable deduplication.
 * - Used for preventing duplicate event processing (e.g., React Strict Mode).
 *
 * @example
 * ```ts
 * type EM = { ui: { toggle: boolean } };
 * type Evt = Event<EM, 'ui', 'toggle'>;
 * // { channel: 'ui'; type: 'toggle'; payload: boolean; id: string }
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
}

export type Emit<EM extends EventMapBase> = <
  C extends keyof EM & string,
  T extends keyof EM[C] & string,
>(
  channel: C,
  type: T,
  payload: EM[C][T],
  opts?: EmitOptions,
) => Promise<void>;

/**
 * Basic unsubscribe handle.
 *
 * @public
 */
export type Unsubscribe = () => void;

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
};

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
  connect(spec: { reducer: R; property: string }, handler: (change: Change) => void): Unsubscribe;

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
   * Dynamically add middleware.
   */
  registerMiddleware(mw: MiddlewareFunction<DeepReadonly<S>, EM>): Unsubscribe;

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
    middleware?: MiddlewareFunction<DeepReadonly<S>, EM>[];
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
    events: Array<{ channel: string; type: string; payload: any; id: string }>,
  ): void;

  /**
   * Returns a structured introspection snapshot for DevTools UIs.
   *
   * @returns Reducers, effects, middleware, event subscriptions, and coarse subscriber count.
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
  };
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
 * @example Using `when` (recommended)
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
 * @example Using `events` (legacy)
 * ```ts
 * const counterSpec: ReducerSpec<{ value: number }, MyEM> = {
 *   state: { value: 0 },
 *   events: [['ui', 'increment'], ['ui', 'decrement']],
 *   reducer(s, evt) { ... },
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
   * Preferred over `events` for new code.
   */
  when?: When<EM>;

  /**
   * List of EventKeys `[channel, type]` that this reducer responds to.
   * @deprecated Use `when: { keys: [...] }` instead for better type inference.
   */
  events?: ReadonlyArray<EventKey<EM>>;

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
) => S;

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
 * @example Using `when` (recommended)
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
   * Preferred over `events` for new code.
   */
  when?: When<EM>;

  /**
   * List of EventKeys `[channel, type]` that this effect responds to.
   * @deprecated Use `when: { keys: [...] }` instead for better type inference.
   */
  events?: ReadonlyArray<EventKey<EM>>;

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
 * Middleware function: may mutate, log, side-effect, or veto an event.
 * Return true to continue; false to swallow / cancel propagation.
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
) => boolean | Promise<boolean>;

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
   * Middleware function: `(state, event, emit) => boolean | Promise<boolean>`.
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
 * Helper: derive event map from a reducers map (strict).
 * Used by createStore inference overload.
 *
 * @internal
 */
export type EMFromReducersStrict<RM extends ReducersMapAny> = RM[keyof RM] extends ReducerSpec<
  any,
  infer EM
>
  ? RM[keyof RM] extends ReducerSpec<any, EM>
    ? EM
    : never
  : never;

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
 * @public
 */
export type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
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
 * Compute dotted paths of T, including nested objects and arrays.
 *
 * @typeParam T - Type to compute paths for.
 *
 * @public
 */
export type Path<T> = T extends Primitive
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
 * @public
 */
export type Dotted<Slice> = (keyof Slice & string) | Path<Slice>;

/**
 * Deep readonly type: recursively makes all properties readonly.
 *
 * @typeParam T - Type to make readonly.
 *
 * @public
 */
export type DeepReadonly<T> = T extends (infer A)[]
  ? ReadonlyArray<DeepReadonly<A>>
  : T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

/**
 * Phase of event subscription notification.
 *
 * - `'committed'`: Events that passed middleware and reached reducers (default)
 * - `'uncommitted'`: Events rejected by middleware
 * - `'all'`: Both committed and uncommitted events
 *
 * @public
 */
export type EventPhase = "committed" | "uncommitted" | "all";

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
  phase: "committed" | "uncommitted",
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
  phase: "committed" | "uncommitted",
) => void | Promise<void>;