/**
 * A minimal “record of record” constraint for ActionMaps */
export type ActionMapBase = {
  [C in string]: { [E in string]: unknown };
};

export type ActionPair<AM extends ActionMapBase> = {
  [C in keyof AM & string]: [C, keyof AM[C] & string];
}[keyof AM & string];

/**
 * A single bus action */
export interface Action<
  AM extends ActionMapBase = ActionMapBase,
  C extends keyof AM = keyof AM,
  E extends keyof AM[C] = keyof AM[C],
  P = AM[C][E],
> {
  channel: C;
  event: E;
  payload: P;
}

/**
 * Generic “old > new” wrapper (now carries the dotted `path` that changed) */
export interface Change<V = any> {
  oldValue: V;
  newValue: V;
  /** dotted path for fine-grained listeners; top-level emits like "data" */
  path?: string;
}

/**
 * Dispatch narrowed to the developer’s ActionMap */
export type Dispatch<AM extends ActionMapBase> = <C extends keyof AM, E extends keyof AM[C]>(
  channel: C,
  event: E,
  payload: AM[C][E],
) => void;

/** Basic unsubscribe handle */
export type Unsubscribe = () => void;

/**
 * Store spec - what you feed into the constructor / factory */
export type StoreSpec<R extends string, S extends Record<R, any>, AM extends ActionMapBase> = {
  /**
   * Store name.
   * 
   * This is mostly used by DevTools to identify the instance. */
  name: string;

  /**
  * Map of slice name -> reducer spec.
  * Each entry declares initial state, the reducer function, and the list of (channel,event) pairs this slice responds to */
  reducer: Record<R, ReducerSpec<S[R], AM>>;


  /**
  * Middleware chain executed before reducers/effects.
  * If any middleware returns false (or resolves to false), the action will not propagate to reducers/effects */
  middleware?: MiddlewareFunction<DeepReadonly<S>, AM>[];


  /**
  * Optional side-effect handlers registered at construction time (runs after reducers for every propagated action).
  * Equivalent to calling store.registerEffect for each item */
  effects?: Array<EffectFunction<DeepReadonly<S>, AM>>;
};

/**
 * Public Store surface.
 *
 * NOTE: `S` is the *exposed* state type (already readonly at the call site).
 * Your concrete Store implements this as StoreInstance<R, DeepReadonly<S>, AM> */
export interface StoreInstance<
  R extends string = string,
  S extends Record<R, any> = Record<string, any>,
  AM extends ActionMapBase = ActionMapBase
> {
  /**
   * Store name.
   * 
   * This is mostly used by DevTools to identify the instance. */
  name: string;

  /**
   * Read the full state (already readonly by the time you supply `S`) */
  getState(): DeepReadonly<S>;

  /**
   * Dispatch a typed action (channel, event, payload) */
  dispatch: Dispatch<AM>;

  /**
   * Coarse subscription: runs after any state change */
  subscribe(listener: () => void): Unsubscribe;

  /**
   * Fine-grained subscription: listen to specific reducer.property path(s).
   * Accepts a string or string[] of dotted paths (e.g., "data.123.title").
   * Fires only when those path(s) actually change */
  connect(
    spec: Connect<R, S>,
    handler: (change: Change) => void
  ): Unsubscribe;

  /**
   * Register a post-reducer effect (sees final state). Returns an unsubscribe.
   * `S` here is the same exposed type returned by `getState()` */
  registerEffect(handler: EffectFunction<DeepReadonly<S>, AM>): Unsubscribe;

  /**
   * Convenience effect filter by channel & event. Returns an unsubscribe */
  onEffect<C extends keyof AM & string, E extends keyof AM[C] & string>(
    channel: C,
    event: E,
    handler: (
      payload: AM[C][E],
      getState: () => DeepReadonly<S>,
      dispatch: Dispatch<AM>,
      action: Action<AM, C, E>
    ) => void | Promise<void>
  ): Unsubscribe;

  /**
   * Dynamically add middleware */
  registerMiddleware(mw: MiddlewareFunction<DeepReadonly<S>, AM>): Unsubscribe;

  /**
   * Dynamically add/remove a namespaced reducer slice at runtime */
  registerReducer(name: string, spec: ReducerSpec<any, AM>): Unsubscribe;
}

/**
 * One reducer’s definition blob */
export interface ReducerSpec<S = any, AM extends ActionMapBase = ActionMapBase> {
  /** List of `[channel, event]` pairs this reducer cares about */
  actions: ReadonlyArray<ActionPair<AM>>;
  reducer: ReducerFunction<S, AM>;
  state: S;
}

/**
 * Pure reducer fn */
export type ReducerFunction<S = any, AM extends ActionMapBase = ActionMapBase> = (
  state: S,
  action: ActionUnion<AM>,
) => S;

/**
 * Every legal `{channel,event,payload}` as a *distinct* object type */
export type ActionUnion<AM extends ActionMapBase> = {
  [C in keyof AM]: { [E in keyof AM[C]]: Action<AM, C, E> }[keyof AM[C]];
}[keyof AM];

/**
 * Middleware may mutate, log, side-effect, or veto an action.
 * Return true to continue; false to swallow / cancel propagation */
export type MiddlewareFunction<S = any, AM extends ActionMapBase = ActionMapBase> = (
  state: S,
  action: ActionUnion<AM>,
  dispatch: Dispatch<AM>,
) => boolean | Promise<boolean>;

/**
 * Side-effect handler: runs AFTER reducers, sees the final state */
export type EffectFunction<S = any, AM extends ActionMapBase = ActionMapBase> =
  <C extends keyof AM, E extends keyof AM[C]>(
    action: Action<AM, C, E>,
    getState: () => S,
    dispatch: Dispatch<AM>,
  ) => void | Promise<void>;

  export type ReducersMapAny = Record<string, ReducerSpec<any, any>>;

export type StateFromReducers<R> = {
  [K in keyof R]: R[K] extends ReducerSpec<infer S, any> ? S : never;
};

export type AMFromReducersStrict<RM extends ReducersMapAny> =
  RM[keyof RM] extends ReducerSpec<any, infer AM>
    ? (RM[keyof RM] extends ReducerSpec<any, AM> ? AM : never)
    : never;

export type DeepRO<T> = DeepReadonly<T>;

// Helper for “top-level only”
export type TopLevelProp<R extends string, S extends Record<R, any>> =
  keyof S[R] & string;

// Two shapes:
export type ConnectTopLevel<R extends string, S extends Record<R, any>> = {
  reducer: R;
  property: TopLevelProp<R, S> | readonly TopLevelProp<R, S>[];
};

export type ConnectAny<R extends string> = {
  reducer: R;
  property: string | readonly string[];
};

// Final union used everywhere public
export type Connect<R extends string = string, S extends Record<R, any> = Record<R, any>> =
  | ConnectTopLevel<R, S>
  | ConnectAny<R>;

export type Primitive = string | number | boolean | bigint | symbol | null | undefined | Date | RegExp;

/**
 * Compute dotted paths of T, including nested objects and arrays */
export type Path<T> =
  T extends Primitive ? never :
  T extends readonly (infer U)[] ?
  | `${number}`
  | (Path<U> extends never ? never : `${number}.${Path<U>}`)
  : {
    [K in keyof T & string]:
    T[K] extends Primitive
    ? K
    : K | (Path<T[K]> extends never ? never : `${K}.${Path<T[K]>}`)
  }[keyof T & string];

/**
 * Allow wildcard patterns like "*" and "**" anywhere in the string */
export type WithGlob<T extends string> = T | `${string}*${string}`;

/**
 * Dotted keys of a slice: top-level keys or any nested path */
export type Dotted<Slice> = (keyof Slice & string) | Path<Slice>;

/**
 * Connect type tied to a specific state record S keyed by reducer names R.
 * - property accepts top-level keys, deep dotted paths, or wildcard patterns over them */
export type ConnectDeep<
  R extends string,
  S extends Record<R, any>,
> = {
  reducer: R;
  property: WithGlob<Dotted<S[R]>>;
};

export type DeepReadonly<T> = T extends (infer A)[]
  ? ReadonlyArray<DeepReadonly<A>>
  : T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;