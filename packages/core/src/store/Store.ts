/**
 * @module @quojs/core
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
  MiddlewareFunction,
  ReducersMapAny,
  ReducerSpec,
  StateFromReducers,
  StoreInstance,
  StoreSpec,
  Unsubscribe,
  EMFromReducersStrict,
  Emit,
} from "../types";
import { freezeState } from "../utils/immutability";

/**
 * Strongly-typed, channel/event-driven **store** with:
 * - **Slice reducers** (namespaced under `R`)
 * - **Middleware** (pre-reducer, can cancel propagation)
 * - **Effects** (post-reducer, async-safe, keyed by EventKey)
 * - **Granular subscriptions** via dotted **property paths** (e.g., `"todos.3.title"`)
 * - **Event deduplication** via unique event IDs (prevents React Strict Mode double-firing)
 * - Optional **Redux DevTools** integration (dev)
 *
 * @typeParam EM - Event map describing `(channel → type → payload)` types.
 * @typeParam R  - Union of slice names (string literal union).
 * @typeParam S  - Object map of slice states keyed by `R`.
 *
 * @remarks
 * - `emit()` is **serialized** internally: events are queued and processed one-by-one.
 * - Each event receives a unique `id` (symbol) for deduplication.
 * - Reducers are wired through an internal {@link EventBus} by `(channel, type)`.
 * - Effects are keyed by `(channel, type)` for O(1) lookup (no scanning).
 * - Fine-grained change events are emitted through a {@link LooseEventBus} by **dotted paths**.
 * - State is **immutable**: each slice change creates a new state reference (shallow clone).
 * - State slices are **frozen** (deeply) before committing to discourage mutation.
 *
 * @example
 * ```ts
 * type Counter = { value: number };
 * type Todos = { items: Array<{ id: string; title: string }> };
 * type S = { counter: Counter; todos: Todos };
 * type EM = {
 *   ui: { increment: number; setTitle: { id: string; title: string } };
 * };
 *
 * const store = createStore({
 *   name: 'Demo',
 *   reducer: {
 *     counter: {
 *       state: { value: 0 },
 *       events: [['ui', 'increment']],
 *       reducer(s, evt) {
 *         if (evt.type === 'increment') return { value: s.value + evt.payload };
 *         return s;
 *       }
 *     },
 *     todos: {
 *       state: { items: [] },
 *       events: [['ui', 'setTitle']],
 *       reducer(s, evt) {
 *         if (evt.type === 'setTitle') {
 *           const next = structuredClone(s);
 *           const t = next.items.find(x => x.id === evt.payload.id);
 *           if (t) t.title = evt.payload.title;
 *           return next;
 *         }
 *         return s;
 *       }
 *     }
 *   }
 * });
 *
 * // Subscribe to a dotted path
 * const unsub = store.connect({ reducer: 'todos', property: 'items.0.title' }, (chg) => {
 *   console.log('title changed from', chg.oldValue, 'to', chg.newValue);
 * });
 *
 * // Emit event
 * await store.emit('ui', 'increment', 1);
 * ```
 *
 * @public
 */
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
   * Return `false` to stop propagation.
   *
   * @internal
   */
  private readonly middleware: MiddlewareFunction<DeepReadonly<S>, EM>[];

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
   *
   * @internal
   */
  private readonly effects = new Map<string, Set<EffectFunction<DeepReadonly<S>, EM>>>();

  /**
   * Track reducerBus unsubs per slice for HMR/register/unregister.
   *
   * @internal
   */
  private readonly sliceUnsubs = new Map<string, Array<() => void>>();

  /**
   * Redux DevTools connection (dev only).
   *
   * @internal
   */
  private devtools;

  /**
   * FIFO event queue for serialized emission.
   *
   * @internal
   */
  private readonly eventQueue: Array<{ channel: string; type: string; payload: any; id: symbol }> =
    [];

  /**
   * Re-entrancy guard while draining the queue.
   *
   * @internal
   */
  private isProcessingQueue = false;

  /**
   * Tracks processed event IDs to prevent duplicate processing (React Strict Mode safety).
   * Uses a Set with TTL-based cleanup.
   *
   * @internal
   */
  private readonly processedEventIds = new Set<symbol>();

  /**
   * Timer for periodic cleanup of processed event IDs.
   *
   * @internal
   */
  private eventIdCleanupTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * Creates a store from a {@link StoreSpec}.
   *
   * @param spec - Store configuration (name, reducers, middleware, optional effects).
   *
   * @public
   */
  constructor(spec: StoreSpec<R, S, EM>) {
    this.name = spec.name ?? "Quo.js Store";
    this.reducerBus = new EventBus<EM>();
    this.connectorBus = new LooseEventBus();
    this.middleware = [...(spec.middleware ?? [])] as any;
    this.reducers = {} as Record<R, Reducer<S[R], EM>>;
    this.state = {} as any;

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

    /**
     * Event ID cleanup (run every 30 seconds in dev, 5 minutes in prod)
     */
    const cleanupInterval =
      process.env.NODE_ENV === "production" ? 5 * 60 * 1000 : 30 * 1000;
    this.eventIdCleanupTimer = setInterval(() => {
      // clear all processed IDs often to prevent memory leaks
      // in reallity, IDs from >30s ago are OK to forget
      this.processedEventIds.clear();
    }, cleanupInterval);

    type DevtoolsConn = {
      init: (state: any) => void;
      send: (action: any, state: any) => void;
      subscribe?: (listener: (message: any) => void) => void;
    };

    const ext = (
      typeof window !== "undefined" && (window as any).__REDUX_DEVTOOLS_EXTENSION__
    ) as
      | { connect: (opts: any) => DevtoolsConn }
      | undefined;

    if (process.env.NODE_ENV !== "production" && ext) {
      const instanceId = spec.name ?? "Quo.js Store";

      this.devtools = ext.connect({
        name: instanceId,
        instanceId,
        serialize: true,
        features: { pause: true, export: true, test: true, jump: true, skip: true, lock: true },
        trace: true,
      });

      this.devtools.init(this.getState());
    }

    /**
     * DevTools wiring
     */
    this.devtools?.init(this.state);
    this.devtools?.subscribe?.((msg: any) => {
      if (msg.type !== "DISPATCH") return;
      const kind = msg.payload?.type as string | undefined;

      // standard jump / rollback / reset carry state as a JSON string
      if (
        kind === "JUMP_TO_STATE" ||
        kind === "JUMP_TO_ACTION" ||
        kind === "ROLLBACK" ||
        kind === "RESET"
      ) {
        if (msg.state) {
          const parsed = JSON.parse(msg.state);
          this.__applyExternalState(parsed);
        }
        return;
      }

      // import a lifted history: take the latest computed state
      if (kind === "IMPORT_STATE" && msg.nextLiftedState?.computedStates?.length) {
        const latest = msg.nextLiftedState.computedStates.at(-1)!.state;

        this.__applyExternalState(latest);

        return;
      }

      // commit re-baselines the history; re-init with current state
      if (kind === "COMMIT") {
        this.devtools?.init(this.state);

        return;
      }

      // if DevTools provided a state string anyway, apply it
      if (msg.state) {
        const parsed = JSON.parse(msg.state);

        this.__applyExternalState(parsed);
      }
    });

    /**
     * Method bindings
     */
    this.dispose = this.dispose.bind(this);
    this.notifyEffects = this.notifyEffects.bind(this);

    // private API
    this.forwardEvent = this.forwardEvent.bind(this);
    this.__applyExternalState = this.__applyExternalState.bind(this);
    this.mountSlice = this.mountSlice.bind(this);
    this.unmountSlice = this.unmountSlice.bind(this);
    this.getAtPath = this.getAtPath.bind(this);

    // public API
    this.emit = this.emit.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.connect = this.connect.bind(this);
    this.onEffect = this.onEffect.bind(this);
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
    if (this.eventIdCleanupTimer) {
      clearInterval(this.eventIdCleanupTimer);

      this.eventIdCleanupTimer = null;
    }

    this.processedEventIds.clear();
  }

  /**
   * Invokes all registered **effects** for a given event key sequentially.
   * Errors are caught and logged.
   *
   * @param event - The event that was reduced.
   * @internal
   */
  private async notifyEffects(event: EventUnion<EM>) {
    const key = `${String(event.channel)}::${String(event.type)}`;
    const effectSet = this.effects.get(key);
    if (!effectSet || effectSet.size === 0) return;

    for (const h of [...effectSet]) {
      try {
        await h(event, this.getState, this.emit);
      } catch (e) {
        console.error("Effect error:", e);
      }
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
  private forwardEvent<C extends keyof EM, T extends keyof EM[C]>(
    rName: R,
    event: Event<EM, C, T>,
  ): boolean {
    // @ts-expect-error sometimes TS is a bitch
    const prev = this.state[rName] as S[R];
    // @ts-expect-error sometimes TS is a bitch
    const next = this.reducers[rName].reduce(prev, event);

    // if reducer returned same ref, definitely no change
    if (prev === next) return false;

    // compute precise leaf paths that changed (relative to slice root)
    const leafPaths = detectChangedProps(prev, next).filter(Boolean);

    // if nothing actually changed at the leaves, treat as a no-op
    if (leafPaths.length === 0) return false;

    // freeze & commit new slice WITH NEW STATE REFERENCE (shallow clone)
    const frozen = freezeState(structuredClone(next)) as DeepReadonly<S[R]>;
    this.state = { ...this.state, [rName]: frozen } as DeepReadonly<S>;

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
   * Applies an externally provided **whole-state** (e.g., DevTools time travel) and emits
   * fine-grained path changes for each slice.
   *
   * **State Immutability**: If any slices change, a new state object is created via
   * shallow spread. This ensures consistent immutability with {@link forwardEvent}.
   *
   * @param nextPlain - Plain JS object to become the new state.
   *
   * @internal
   */
  private __applyExternalState(nextPlain: any) {
    const prev = this.state as any;
    const next = nextPlain;

    let newState = { ...this.state } as any;
    let anyChanged = false;

    (Object.keys(this.reducers) as Array<R>).forEach((rName) => {
      const prevSlice = prev?.[rName];
      const nextSlice = next?.[rName];

      // if reference equal, nothing to emit
      if (prevSlice === nextSlice) return;

      // freeze the incoming slice before storing
      const frozenNextSlice = freezeState(structuredClone(nextSlice)) as DeepReadonly<
        S[typeof rName]
      >;
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
   * Emits a typed event `(channel, type, payload)`.
   * Events are queued and processed **sequentially** (FIFO).
   *
   * **Pipeline per event:**
   * 1. **Deduplication check** - Skip if event ID already processed (React Strict Mode safety)
   * 2. **Middleware** - Pre-reducer hooks; may cancel by returning `false`
   * 3. **Reducers** - Synchronous state updates via internal event bus
   * 4. **Effects** - Async side-effects keyed by `(channel, type)` for O(1) lookup
   * 5. **Coarse subscribers** - External store subscribers (only if state changed)
   * 6. **DevTools** - Redux DevTools logging (dev only)
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
   * @returns A promise that resolves when the event has finished processing.
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
  public async emit<C extends keyof EM, T extends keyof EM[C]>(
    channel: C,
    type: T,
    payload: EM[C][T],
  ): Promise<void> {
    // generate unique ID for this event (deduplication)
    const id = Symbol("event");

    /**
     * enqueue always
     */
    this.eventQueue.push({
      channel: channel as string,
      type: type as string,
      payload,
      id,
    });

    if (this.isProcessingQueue) return;

    this.isProcessingQueue = true;
    try {
      while (this.eventQueue.length) {
        const { channel, type, payload, id } = this.eventQueue.shift()!;

        // deduplication check: skip if already processed (React Strict Mode safety)
        if (this.processedEventIds.has(id)) {
          continue;
        }

        // mark as processed
        this.processedEventIds.add(id);

        const event = { channel, type, payload, id } as Event<EM, C, T>;
        let propagate = true;

        /**
         * middleware
         */
        for (const mw of this.middleware) {
          try {
            // @ts-expect-error this is just an inference issue, not important
            const ok = await mw(this.state, event, this.emit);
            if (!ok) {
              propagate = false;
              break;
            }
          } catch (err) {
            console.error("Middleware error:", err);
            propagate = false;
            break;
          }
        }

        if (!propagate) {
          // event cancelled, but still log to DevTools
          this.devtools?.send(
            { type: `Channel: ${channel} - Type: ${type} [CANCELLED]`, payload },
            this.state,
          );
          continue;
        }

        /**
         * Reducers - track if any slice changed via reference equality
         */
        const stateBefore = this.state;
        // @ts-expect-error inference issue
        this.reducerBus.emit(channel as C, type as T, payload);
        const stateAfter = this.state;
        const anySliceChanged = stateBefore !== stateAfter;

        /**
         * Effects (keyed lookup, async)
         */
        await this.notifyEffects(event as any);

        /**
         * Coarse subscribers (ONCE per event, only if state changed)
         */
        if (anySliceChanged) {
          this.listeners.forEach((l) => l());
        }

        /**
         * DevTools
         */
        this.devtools?.send(
          { type: `Channel: ${channel} - Type: ${type}`, payload },
          this.state,
        );
      }
    } catch (err) {
      console.error("Emit queue error:", err);
    } finally {
      this.isProcessingQueue = false;
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
    const { events, effect } = spec;
    const unsubs: Array<() => void> = [];

    for (const [channel, type] of events) {
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
    T extends keyof EM[C]
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

    // Re-init devtools baseline
    this.devtools?.init(this.state);
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
    const { events = [], reducer, state } = rSpec;

    // Install reducer instance (FIXED: only pass reducer function)
    this.reducers[name] = new Reducer(reducer);

    // Initialize state unless preserving an existing value
    if (!opts.preserveState || (this.state as any)[rName] === undefined) {
      (this.state as any)[rName] = freezeState(structuredClone(state));
    }

    // Wire reducerBus listeners and save disposers for HMR
    const unsubs: Array<() => void> = [];
    events?.forEach(([ch, tp]) => {
      const u = this.reducerBus.on(ch, tp, (payload) => {
        const event = { channel: ch, type: tp, payload, id: Symbol("reducer-event") } as Event<
          EM,
          typeof ch,
          typeof tp
        >;
        this.forwardEvent(name, event as any);
      });

      unsubs.push(u);
    });

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
 * Factory helper to create a typed {@link Store} from a reducers map.
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
 *       events: [['ui','increment']],
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
}): StoreInstance<keyof RM & string, StateFromReducers<RM>, EMFromReducersStrict<RM>>;

export function createStore(cfg: any) {
  type RM = typeof cfg.reducer;
  type S = StateFromReducers<RM>;
  type EM = EMFromReducersStrict<RM>;
  type RN = keyof RM & string;

  return new Store<EM, RN, S>({
    name: cfg.name,
    reducer: cfg.reducer as unknown as Record<RN, ReducerSpec<S[RN], EM>>,
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