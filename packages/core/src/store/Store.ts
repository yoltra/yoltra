import { Reducer } from "../reducer/Reducer";
import { detectChangedProps } from "../utils/detectChangedProps";

import { EventBus } from "../eventBus/EventBus";
import { LooseEventBus } from "../eventBus/LooseEventBus";
import type {
  Action,
  ActionMapBase,
  ActionPair,
  ActionUnion,
  AMFromReducersStrict,
  Change,
  DeepReadonly,
  Dispatch,
  EffectFunction,
  MiddlewareFunction,
  ReducersMapAny,
  ReducerSpec,
  StateFromReducers,
  StoreInstance,
  StoreSpec,
  Unsubscribe,
} from "../types";
import { freezeState } from "../utils/immutability";

/**
 * Strongly-typed, channel/event-driven **store** with:
 * - **Slice reducers** (namespaced under `R`)
 * - **Middleware** (pre-reducer, can cancel propagation)
 * - **Effects** (post-reducer, async-safe)
 * - **Granular subscriptions** via dotted **property paths** (e.g., `"todos.3.title"`)
 * - Optional **Redux DevTools** integration (dev)
 *
 * @typeParam AM - Action map describing `(channel → event → payload)` types.
 * @typeParam R  - Union of slice names (string literal union).
 * @typeParam S  - Object map of slice states keyed by `R`.
 *
 * @remarks
 * - `dispatch()` is **serialized** internally: actions are queued and processed one-by-one.
 * - Reducers are wired through an internal {@link EventBus} by `(channel, event)`.
 * - Fine-grained change events are emitted through a {@link LooseEventBus} by **dotted paths**.
 * - State is **frozen** (shallowly, per-slice snapshot) before committing to discourage mutation.
 *
 * @example
 * ```ts
 * // Define slices
 * type Counter = { value: number };
 * type Todos = { items: Array<{ id: string; title: string }> };
 *
 * type S = { counter: Counter; todos: Todos };
 * type AM = {
 *   ui: { increment: number; setTitle: { id: string; title: string } };
 * };
 *
 * const store = createStore({
 *   name: 'Demo',
 *   reducer: {
 *     counter: {
 *       state: { value: 0 },
 *       actions: [['ui', 'increment']],
 *       reducer(s, a) {
 *         if (a.event === 'increment') return { value: s.value + a.payload };
 *         return s;
 *       }
 *     },
 *     todos: {
 *       state: { items: [] },
 *       actions: [['ui', 'setTitle']],
 *       reducer(s, a) {
 *         if (a.event === 'setTitle') {
 *           const next = structuredClone(s);
 *           const t = next.items.find(x => x.id === a.payload.id);
 *           if (t) t.title = a.payload.title;
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
 * // Dispatch
 * store.dispatch('ui', 'increment', 1);
 * ```
 *
 * @public
 */
export class Store<AM extends ActionMapBase, R extends string, S extends Record<R, any>>
  implements StoreInstance<R, S, AM> {
  /**
   * Store name (used by DevTools & diagnostics).
   * @public
   */
  name: string;

  /**
   * Registered middleware pipeline (run **before** reducers).
   * Return `false` to stop propagation.
   * @internal
   */
  private readonly middleware: MiddlewareFunction<DeepReadonly<S>, AM>[];

  /**
   * Installed slice reducers keyed by slice name.
   * @internal
   */
  private readonly reducers: Record<R, Reducer<S[R], AM>>;

  /**
   * Current immutable snapshot of the store state.
   * @internal
   */
  private state: DeepReadonly<S>;

  /**
   * Bus for reducer wiring (emit by `(channel, event)`).
   * @internal
   */
  private readonly reducerBus: EventBus<AM>;

  /**
   * Bus for **granular** connector events (emit by **dotted path** inside a slice).
   * @internal
   */
  private readonly connectorBus: LooseEventBus<R, string, Change>;

  /**
   * Coarse-grained listeners (called once per committed action).
   * @internal
   */
  private readonly listeners: Set<() => void> = new Set();

  /**
   * Registered effect handlers (run **after** reducers).
   * @internal
   */
  private readonly effects: Set<EffectFunction<DeepReadonly<S>, AM>> = new Set();

  /**
   * Track reducerBus unsubs per slice for HMR/register/unregister.
   * @internal
   */
  private readonly sliceUnsubs = new Map<string, Array<() => void>>();

  /**
   * Redux DevTools connection (dev only).
   * @internal
   */
  private devtools;

  /**
   * FIFO action queue for serialized dispatching.
   * @internal
   */
  private readonly actionQueue: Array<{ channel: string; event: string; payload: any }> = [];

  /**
   * Re-entrancy guard while draining the queue.
   * @internal
   */
  private isProcessingQueue = false;

  /**
   * Creates a store from a {@link StoreSpec}.
   *
   * @param spec - Store configuration (name, reducers, middleware, optional effects).
   * @public
   */
  constructor(
    spec: StoreSpec<R, S, AM> & { effects?: Array<EffectFunction<DeepReadonly<S>, AM>> },
  ) {
    this.name = spec.name ?? "Quo.js Store";
    this.reducerBus = new EventBus<AM>();
    this.connectorBus = new LooseEventBus();
    this.middleware = [...(spec.middleware ?? [])] as any;
    this.reducers = {} as Record<R, Reducer<S[R], AM>>;
    this.state = {} as any;

    /**
     * Reducer wiring
     */
    Object.entries(spec.reducer).forEach(([name, rSpec]) => {
      this.mountSlice(name as R, rSpec as ReducerSpec<S[R], AM>, { preserveState: false });
    });

    /**
     * Effects from spec (optional)
     */
    if (spec.effects?.length) {
      for (const eff of spec.effects) this.effects.add(eff);
    }

    type DevtoolsConn = {
      init: (state: any) => void;
      send: (action: any, state: any) => void;
      subscribe?: (listener: (message: any) => void) => void;
    };

    const ext = (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) as
      | { connect: (opts: any) => DevtoolsConn }
      | undefined;


    if (process.env.NODE_ENV !== 'production' && ext) {
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

      // Standard jump / rollback / reset carry state as a JSON string
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

      // Import a lifted history: take the latest computed state
      if (kind === "IMPORT_STATE" && msg.nextLiftedState?.computedStates?.length) {
        const latest = msg.nextLiftedState.computedStates.at(-1)!.state;
        this.__applyExternalState(latest);
        return;
      }

      // Commit re-baselines the history; re-init with current state
      if (kind === "COMMIT") {
        this.devtools?.init(this.state);
        return;
      }

      // Fallback: if DevTools provided a state string anyway, apply it
      if (msg.state) {
        const parsed = JSON.parse(msg.state);

        this.__applyExternalState(parsed);
      }
    });

    /**
     * method bindings
     */
    this.dispatch = this.dispatch.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.connect = this.connect.bind(this);
    this.getState = this.getState.bind(this);
    this.registerEffect = this.registerEffect.bind(this);
    this.onEffect = this.onEffect.bind(this);

    // HMR note: callers can later use this.hotReplace(...) with new reducers / middleware / effects
  }

  /**
   * Convenience helper to register an **effect** filtered by `(channel, event)`.
   *
   * @typeParam C - Channel key within `AM`.
   * @typeParam E - Event key within channel `C`.
   * @param channel - Channel to filter.
   * @param event - Event to filter.
   * @param handler - Effect handler `(payload, getState, dispatch, action)`.
   * @returns Unsubscribe/teardown function.
   *
   * @example
   * ```ts
   * const off = store.onEffect('ui', 'increment', async (n, get, dispatch) => {
   *   if (n > 10) await dispatch('ui', 'increment', -10);
   * });
   * // later
   * off();
   * ```
   *
   * @public
   */
  public onEffect<C extends keyof AM & string, E extends keyof AM[C] & string>(
    channel: C,
    event: E,
    handler: (
      payload: AM[C][E],
      getState: () => DeepReadonly<S>,
      dispatch: Dispatch<AM>,
      action: Action<AM, C, E>,
    ) => void | Promise<void>,
  ): () => void {
    const wrapped: EffectFunction<DeepReadonly<S>, AM> = (a, getState, dispatch) => {
      // @ts-expect-error do we need some sugar or not?
      if (a.channel !== channel || a.event !== event) return;
      // @ts-expect-error do we need some sugar or not?
      return handler(a.payload, getState, dispatch, a);
    };
    return this.registerEffect(wrapped);
  }

  /**
   * Invokes all registered **effects** sequentially for a given action.
   * Errors are caught and logged.
   * @param action - The action that was reduced.
   * @internal
   */
  private async notifyEffects(action: ActionUnion<AM>) {
    for (const h of [...this.effects]) {
      try {
        await h(action, this.getState, this.dispatch);
      } catch (e) {
        console.error("Effect error:", e);
      }
    }
  }

  /**
   * Applies a reduced action to a slice and emits **precise** connector events.
   *
   * For each changed **leaf path** (via {@link detectChangedProps}), emits that leaf and
   * all of its **ancestors** once (e.g., `"data"`, `"data.123"`, `"data.123.title"`).
   * Finally, notifies coarse listeners once.
   *
   * @param rName - Slice name being updated.
   * @param action - Reduced action with typed payload.
   * @internal
   */
  private forwardAction<C extends keyof AM, E extends keyof AM[C]>(
    rName: R,
    action: Action<AM, C, E>,
  ): void {
    // @ts-expect-error sometimes TS is a bitch
    const prev = this.state[rName] as S[R];
    // @ts-expect-error sometimes TS is a bitch
    const next = this.reducers[rName].reduce(prev, action);

    // If reducer returned same ref, definitely no change
    if (prev === next) return;

    // Compute precise leaf paths that changed (relative to slice root)
    const leafPaths = detectChangedProps(prev, next).filter(Boolean);

    /**If nothing actually changed at the leaves, treat as a no-op:
     * - do NOT commit a new slice
     * - do NOT notify fine-grained or coarse listeners  */
    if (leafPaths.length === 0) return;

    // Freeze & commit new slice
    const frozen = freezeState(structuredClone(next)) as DeepReadonly<S[R]>;
    (this.state as any)[rName] = frozen;

    // Emit deep + ancestor paths once each
    const toEmit = new Set<string>();
    for (const p of leafPaths) {
      for (const a of Store.buildAncestorPaths(p)) toEmit.add(a);
    }

    for (const prop of toEmit) {
      const oldValue = this.getAtPath(prev, prop);
      const newValue = this.getAtPath(frozen, prop);
      this.connectorBus.emit(rName, prop, { oldValue, newValue, path: prop });
    }

    // Notify coarse subscribers after all fine-grained emits
    this.listeners.forEach((l) => l());
  }

  /**
   * Applies an externally provided **whole-state** (e.g., time travel) and emits
   * fine-grained path changes for each slice.
   *
   * @param nextPlain - Plain JS object to become the new state.
   * @internal
   */
  private __applyExternalState(nextPlain: any) {
    const prev = this.state as any;
    const next = nextPlain;

    (Object.keys(this.reducers) as Array<R>).forEach((rName) => {
      const prevSlice = prev?.[rName];
      const nextSlice = next?.[rName];

      // Freeze the incoming slice before storing
      const frozenNextSlice = freezeState(structuredClone(nextSlice)) as DeepReadonly<
        S[typeof rName]
      >;
      (this.state as any)[rName] = frozenNextSlice;

      // If reference equal, nothing to emit
      if (prevSlice === nextSlice) return;

      // Full dotted leaf paths relative to the slice
      const leafPaths = detectChangedProps(prevSlice, nextSlice).filter(Boolean);
      if (leafPaths.length === 0) return;

      // Emit every leaf AND its ancestors once
      const toEmit = new Set<string>();
      for (const p of leafPaths) for (const a of Store.buildAncestorPaths(p)) toEmit.add(a);

      for (const path of toEmit) {
        const oldValue = this.getAtPath(prevSlice, path);
        const newValue = this.getAtPath(frozenNextSlice, path);
        this.connectorBus.emit(rName, path as any, { oldValue, newValue, path });
      }
    });

    // Coarse subscribers after all fine-grained emits
    this.listeners.forEach((l) => l());
  }

  /**
   * Dispatches a typed action `(channel, event, payload)`.
   * Actions are queued and processed **sequentially**.
   *
   * Pipeline per action:
   * 1) **Middleware** (may cancel by returning `false`)
   * 2) **Reducers** (via internal reducer bus)
   * 3) **Effects** (async, errors swallowed)
   * 4) **DevTools** (dev)
   *
   * @typeParam C - Channel key in `AM`.
   * @typeParam E - Event key within channel `C`.
   * @param channel - Channel name.
   * @param event - Event name.
   * @param payload - Payload typed as `AM[C][E]`.
   * @returns A promise that resolves when the action has finished processing.
   *
   * @example
   * ```ts
   * await store.dispatch('ui', 'increment', 1);
   * ```
   *
   * @public
   */
  public async dispatch<C extends keyof AM, E extends keyof AM[C]>(
    channel: C,
    event: E,
    payload: AM[C][E],
  ): Promise<void> {
    /**
     * enqueue always
     */
    this.actionQueue.push({ channel: channel as string, event: event as string, payload });
    if (this.isProcessingQueue) return;

    this.isProcessingQueue = true;
    try {
      while (this.actionQueue.length) {
        const { channel, event, payload } = this.actionQueue.shift()!;
        const action = { channel, event, payload } as Action<AM, C, E>;
        let propagate = true;

        /**
         * middleware
         */
        for (const mw of this.middleware) {
          try {
            // @ts-expect-error this is just an inference issue, not important
            const ok = await mw(this.state, action, this.dispatch);
            if (!ok) {
              propagate = false;
              break;
            }
          } catch (err) {
            /**
             * swallow - devtools / caller should not explode
             */
            console.error("middleware error:", err);
            propagate = false;
            break;
          }
        }

        /**
         * reducers
         */
        // @ts-expect-error this is just an inference issue, not important
        if (propagate) this.reducerBus.emit(channel as C, event as E, payload);

        /**
         * effects
         */
        if (propagate) await this.notifyEffects(action as any);

        /**
         * devtools
         */
        this.devtools?.send(
          { type: `Channel: ${channel} - Event: ${event}`, payload },
          this.state,
        );
      }
    } catch (err) {
      // capture any unanticipated errors so .dispatch() never rejects
      console.error("dispatch queue error:", err);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Connects a **fine-grained** listener to a dotted path under a slice.
   *
   * @overload
   * @param spec - `{ reducer, property }` where `property` is a dotted path (e.g., `"items.0.title"`).
   * @param h - Handler receiving a {@link Change} with `{ oldValue, newValue, path }`.
   * @returns Unsubscribe function.
   *
   * @example
   * ```ts
   * const off = store.connect({ reducer: 'todos', property: 'items.0.title' }, (chg) => {
   *   console.log('title change:', chg);
   * });
   * off();
   * ```
   *
   * @public
   */
  public connect(spec: { reducer: R; property: string }, h: (chg: Change) => void): () => void;
  public connect(spec: any, h: (chg: Change) => void): () => void {
    return this.connectorBus.on(spec.reducer, spec.property, h);
  }

  /**
   * Subscribes to **coarse-grained** commits (called once per successful action).
   * @param fn - Listener invoked after reducers/effects have run.
   * @returns Unsubscribe function.
   *
   * @example
   * ```ts
   * const off = store.subscribe(() => console.log('state committed'));
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
   * @public
   */
  public getState(): DeepReadonly<S> {
    return this.state;
  }

  /**
   * Registers a middleware (runs **before** reducers).
   *
   * @param mw - Middleware `(state, action, dispatch) => boolean|Promise<boolean>`.
   * @returns Unsubscribe function that removes this middleware.
   *
   * @example
   * ```ts
   * const off = store.registerMiddleware(async (state, action) => {
   *   console.log('action', action);
   *   return true; // allow
   * });
   * off();
   * ```
   *
   * @public
   */
  public registerMiddleware(mw: MiddlewareFunction<DeepReadonly<S>, AM>): Unsubscribe {
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
   * @param spec - Reducer spec (state, actions, reducer).
   * @returns Disposer function that **removes** the slice (and its state).
   *
   * @example
   * ```ts
   * const dispose = store.registerReducer('filters', {
   *   state: { q: '' },
   *   actions: [['ui', 'setQuery']],
   *   reducer(s, a) { return a.event === 'setQuery' ? { q: a.payload } : s; }
   * });
   * // Later:
   * dispose();
   * ```
   *
   * @public
   */
  public registerReducer(name: string, spec: ReducerSpec<any, AM>): () => void {
    if (name in this.reducers) throw new Error(`Reducer ${name} already exists`);

    this.mountSlice(name as R, spec as ReducerSpec<S[R], AM>, {
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
   * Registers an **effect** that runs after reducers have updated state.
   *
   * @param handler - `(action, getState, dispatch) => void|Promise<void>`.
   * @returns Unsubscribe function.
   *
   * @example
   * ```ts
   * const off = store.registerEffect(async (a, get, dispatch) => {
   *   if (a.channel === 'ui' && a.event === 'increment') {
   *     await dispatch('ui', 'increment', -1);
   *   }
   * });
   * off();
   * ```
   *
   * @public
   */
  public registerEffect(handler: EffectFunction<DeepReadonly<S>, AM>): () => void {
    this.effects.add(handler);
    return () => this.effects.delete(handler);
  }

  /**
   * Replaces the **entire** middleware pipeline (HMR-friendly).
   * @param next - New middleware array.
   * @public
   */
  public replaceMiddleware(next: MiddlewareFunction<DeepReadonly<S>, AM>[]): void {
    (this.middleware as any).length = 0;
    for (const mw of next) this.middleware.push(mw as any);
  }

  /**
   * Replaces all registered **effects** (HMR-friendly).
   * @param next - New effects set.
   * @public
   */
  public replaceEffects(next: Array<EffectFunction<DeepReadonly<S>, AM>>): void {
    this.effects.clear();
    for (const eff of next) this.effects.add(eff);
  }

  /**
   * Replaces the entire **reducer set** (HMR-friendly).
   *
   * @param next - Map of slice specs keyed by slice name.
   * @param opts - `{ preserveState?: boolean }` (default `true`).
   *
   * @example
   * ```ts
   * store.replaceReducers({
   *   counter: { state: { value: 0 }, actions: [['ui','increment']], reducer: rfn }
   * }, { preserveState: true });
   * ```
   *
   * @public
   */
  public replaceReducers(
    next: Record<R, ReducerSpec<S[R], AM>>,
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
        // Update reducer impl + action wiring; preserve current state
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
   * @public
   */
  public hotReplace(partial: {
    reducer?: Record<R, ReducerSpec<S[R], AM>>;
    middleware?: MiddlewareFunction<DeepReadonly<S>, AM>[];
    effects?: Array<EffectFunction<DeepReadonly<S>, AM>>;
    preserveState?: boolean;
  }): void {
    if (partial.middleware) this.replaceMiddleware(partial.middleware);
    if (partial.effects) this.replaceEffects(partial.effects);
    if (partial.reducer)
      this.replaceReducers(partial.reducer, { preserveState: partial.preserveState });
  }

  /**
   * Mounts a slice: installs reducer, initializes state (unless preserved),
   * and wires `(channel,event)` listeners on the reducer bus.
   *
   * @param name - Slice name.
   * @param rSpec - Reducer spec (state, actions, reducer).
   * @param opts - `{ preserveState: boolean }` whether to keep existing state.
   * @internal
   */
  private mountSlice(
    name: R,
    rSpec: ReducerSpec<S[R], AM>,
    opts: { preserveState: boolean },
  ): void {
    const rName = name as unknown as string;
    const { actions = [], reducer, state } = rSpec;

    // Install reducer instance
    // @ts-expect-error this is just a wrapped, nothing to care about
    this.reducers[name] = new Reducer(reducer, state);

    // Initialize state unless preserving an existing value
    if (!opts.preserveState || (this.state as any)[rName] === undefined) {
      (this.state as any)[rName] = freezeState(structuredClone(state));
    }

    // Wire reducerBus listeners and save disposers for HMR
    const unsubs: Array<() => void> = [];
    actions?.forEach(([ch, ev]) => {
      const u = this.reducerBus.on(ch, ev, (payload) =>
        this.forwardAction(name, { channel: ch, event: ev, payload } as ActionUnion<AM>),
      );

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
          console.error(`[DUX error]: ${e}`);
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
   * @param obj - Root object (slice or value).
   * @param path - Dotted path; leading dot is ignored.
   * @returns The value at the path, or `undefined`.
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

      // Works for arrays too (seg like "0")
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
 *     counter: { state: { value: 0 }, actions: [['ui','increment']], reducer: counterFn }
 *   },
 *   middleware: [],
 *   effects: []
 * });
 * ```
 *
 * @public
 */
export function createStore<RM extends ReducersMapAny>(cfg: {
  name: string,
  reducer: RM;
  middleware?: MiddlewareFunction<
    DeepReadonly<StateFromReducers<RM>>,
    AMFromReducersStrict<RM>
  >[];
  effects?: Array<
    EffectFunction<DeepReadonly<StateFromReducers<RM>>, AMFromReducersStrict<RM>>
  >;
}): StoreInstance<
  keyof RM & string,
  StateFromReducers<RM>,
  AMFromReducersStrict<RM>
>;

export function createStore(cfg: any) {
  type RM = typeof cfg.reducer;
  type S = StateFromReducers<RM>;
  type AM = AMFromReducersStrict<RM>;
  type RN = keyof RM & string;

  return new Store<AM, RN, S>({
    name: cfg.name,
    reducer: cfg.reducer as unknown as Record<RN, ReducerSpec<S[RN], AM>>,
    middleware: (cfg.middleware ?? []) as any,
    effects: (cfg.effects ?? []) as any,
  });
}

/**
 * Utility to define **typed** `(channel, events[])` definitions for reducer specs.
 *
 * @typeParam AM - Action map for the store.
 * @param _ - Internal marker parameter (usually `actions` array placeholder). Not used at runtime.
 * @returns A helper that, given a `channel` and a readonly `events` array, returns typed action pairs.
 *
 * @example
 * ```ts
 * // In a ReducerSpec:
 * const actions = typedActions<AM>([])('ui', ['increment', 'decrement'] as const);
 * // actions: ReadonlyArray<[channel, event]>
 * ```
 *
 * @public
 */
export const typedActions = <AM extends ActionMapBase>(_: string[][]) =>
  <C extends keyof AM & string, Evt extends readonly (keyof AM[C] & string)[]>(
    channel: C,
    events: Evt
  ): ReadonlyArray<ActionPair<AM>> =>
    events.map(e => [channel, e] as const);
