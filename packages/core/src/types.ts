/**
 * @module @quojs/core
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
 * // { channel: 'ui'; type: 'toggle'; payload: boolean; id: symbol }
 * ```
 *
 * @public
 */
export interface Event<
  EM extends EventMapBase = EventMapBase,
  C extends keyof EM = keyof EM,
  T extends keyof EM[C] = keyof EM[C],
  P = EM[C][T],
> {
  channel: C;
  type: T;
  payload: P;
  /** Unique identifier for deduplication (automatically added by store) */
  id: symbol;
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
export type Emit<EM extends EventMapBase> = <C extends keyof EM, T extends keyof EM[C]>(
  channel: C,
  type: T,
  payload: EM[C][T],
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
export type StoreSpec<R extends string, S extends Record<R, any>, EM extends EventMapBase> = {
  /**
   * Store name (used by DevTools to identify the instance).
   */
  name: string;

  /**
   * Map of slice name → reducer spec.
   * Each entry declares initial state, the reducer function, and the list of EventKeys this slice responds to.
   */
  reducer: Record<R, ReducerSpec<S[R], EM>>;

  /**
   * Middleware chain executed before reducers/effects.
   * If any middleware returns false (or resolves to false), the event will not propagate to reducers/effects.
   */
  middleware?: MiddlewareFunction<DeepReadonly<S>, EM>[];

  /**
   * Optional side-effect handlers registered at construction time (runs after reducers for every propagated event).
   * Equivalent to calling store.registerEffect for each item.
   */
  effects?: Array<EffectSpec<DeepReadonly<S>, EM>>;
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
   * @deprecated Use {@link StoreInstance.emit | `emit`} instead. Will be removed in v1.0.0.
   *
   * Legacy alias for `emit`. Quo.js now uses event-bus terminology:
   * - "dispatch" → "emit"
   * - "action" → "event"
   */
  dispatch<C extends keyof EM, T extends keyof EM[C]>(
    channel: C,
    type: T,
    payload: EM[C][T],
  ): Promise<void>;
}


/**
 * One reducer's definition blob (stateful event consumer).
 *
 * @typeParam S  - State managed by this reducer.
 * @typeParam EM - Event map.
 *
 * @example
 * ```ts
 * const counterSpec: ReducerSpec<{ value: number }, MyEM> = {
 *   state: { value: 0 },
 *   events: [['ui', 'increment'], ['ui', 'decrement']],
 *   reducer(s, evt) {
 *     if (evt.type === 'increment') return { value: s.value + evt.payload };
 *     if (evt.type === 'decrement') return { value: s.value - evt.payload };
 *     return s;
 *   }
 * };
 * ```
 *
 * @public
 */
export interface ReducerSpec<S = any, EM extends EventMapBase = EventMapBase> {
  /**
   * List of EventKeys `[channel, type]` that this reducer responds to.
   */
  events: ReadonlyArray<EventKey<EM>>;

  /**
   * Pure reducer function: `(state, event) => nextState`.
   */
  reducer: ReducerFunction<S, EM>;

  /**
   * Initial state for this reducer.
   */
  state: S;
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
 * - Effects subscribe to EventKeys (like reducers).
 * - Effects are async and do not own state.
 * - Effects run after reducers.
 * - Effects are keyed (no scanning all effects on every event).
 *
 * @example
 * ```ts
 * const logEffect: EffectSpec<AppState, MyEM> = {
 *   events: [['ui', 'increment']],
 *   effect: async (evt, getState, emit) => {
 *     console.log('increment', evt.payload, getState().counter.value);
 *   }
 * };
 * ```
 *
 * @public
 */
export interface EffectSpec<S = any, EM extends EventMapBase = EventMapBase> {
  /**
   * List of EventKeys `[channel, type]` that this effect responds to.
   */
  events: ReadonlyArray<EventKey<EM>>;

  /**
   * Async effect handler: `(event, getState, emit) => void | Promise<void>`.
   */
  effect: EffectFunction<S, EM>;
}

/**
 * Every legal `{ channel, type, payload, id }` as a *distinct* object type.
 *
 * @typeParam EM - Event map.
 *
 * @public
 */
export type EventUnion<EM extends EventMapBase> = {
  [C in keyof EM]: { [T in keyof EM[C]]: Event<EM, C, T> }[keyof EM[C]];
}[keyof EM];

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

// ============================================================================
// DEPRECATED TYPES - Will be removed in v1.0.0
// ============================================================================

/**
 * @deprecated Use {@link EventMapBase} instead. Will be removed in v1.0.0.
 *
 * Legacy type alias. Quo.js now uses event-bus terminology.
 *
 * @public
 */
export type ActionMapBase = EventMapBase;

/**
 * @deprecated Use {@link EventKey} instead. Will be removed in v1.0.0.
 *
 * Legacy type alias. Quo.js now uses event-bus terminology.
 *
 * @public
 */
export type ActionPair<EM extends EventMapBase> = EventKey<EM>;

/**
 * @deprecated Use {@link Event} instead. Will be removed in v1.0.0.
 *
 * Legacy type alias. Quo.js now uses event-bus terminology.
 * Note: The new Event type includes an `id` field for deduplication.
 *
 * @public
 */
export type Action<
  EM extends EventMapBase = EventMapBase,
  C extends keyof EM = keyof EM,
  T extends keyof EM[C] = keyof EM[C],
  P = EM[C][T],
> = Event<EM, C, T, P>;

/**
 * @deprecated Use {@link EventUnion} instead. Will be removed in v1.0.0.
 *
 * Legacy type alias. Quo.js now uses event-bus terminology.
 *
 * @public
 */
export type ActionUnion<EM extends EventMapBase> = EventUnion<EM>;

/**
 * @deprecated Use {@link Emit} instead. Will be removed in v1.0.0.
 *
 * Legacy type alias. Quo.js now uses event-bus terminology.
 *
 * @public
 */
export type Dispatch<EM extends EventMapBase> = Emit<EM>;