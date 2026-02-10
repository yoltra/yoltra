/**
 * @module @quojs/react
 */

import { useContext, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { StoreContext } from "../context/StoreContext";
import type {
  EventMapBase,
  Event,
  Emit,
  StoreInstance,
  Dotted,
  WithGlob,
  DeepReadonly,
  EventPhase,
  PathValue,
} from "@quojs/core";
import { hasWildcard, normalizePath, getAtPath } from "../utils/path";

/**
 * Re-export of {@link PathValue} from `@quojs/core`.
 *
 * Resolves the TypeScript type at a dotted path `P` within object type `T`.
 * See the core definition for full documentation.
 *
 * @public
 */
export type { PathValue };

/**
 * Accepts either a single value or a readonly array of that value.
 * Useful for APIs that take one-or-many keys.
 *
 * @example
 * ```ts
 * function takeIds(ids: OneOrMany<string>) { /* ... *\/ }
 * takeIds('a');
 * takeIds(['a','b'] as const);
 * ```
 *
 * @public
 */
export type OneOrMany<T> = T | readonly T[];

/**
 * Returns the current {@link StoreInstance} from {@link StoreContext}.
 * Throws if used outside of a `<StoreProvider>`.
 *
 * @typeParam EM - Event map type.
 * @typeParam R  - Reducer name union.
 * @typeParam S  - State record keyed by `R`.
 *
 * @example
 * ```tsx
 * const store = useStore<MyEM, 'counter' | 'todos', AppState>();
 * const state = store.getState();
 * ```
 *
 * @public
 */
export function useStore<
  EM extends EventMapBase,
  R extends string,
  S extends Record<R, any>,
>(): StoreInstance<R, S, EM> {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");

  return ctx as StoreInstance<R, S, EM>;
}

/**
 * Returns the store's `emit` function (stable reference).
 *
 * @typeParam EM - Event map type.
 *
 * @example
 * ```tsx
 * const emit = useEmit<MyEM>();
 * await emit('ui', 'toggle', true);
 * ```
 *
 * @public
 */
export function useEmit<EM extends EventMapBase>(): Emit<EM> {
  return useStore<EM, any, any>().emit;
}

/**
 * Shallow object equality using `Object.is` per-key.
 *
 * Useful as the `isEqual` argument for `useAtomicProp` and `useAtomicProps`
 * when the derived value is a plain object. Also available from the object
 * returned by {@link createQuoHooks}.
 *
 * @example
 * ```ts
 * shallowEqual({ a: 1 }, { a: 1 }); // true
 * shallowEqual({ a: 1 }, { a: 2 }); // false
 * ```
 *
 * @public
 */
export function shallowEqual<T extends Record<string, any>>(a: T, b: T) {
  if (Object.is(a, b)) return true;
  if (!a || !b) return false;

  const ka = Object.keys(a),
    kb = Object.keys(b);
  if (ka.length !== kb.length) return false;

  for (const k of ka) {
    if (!Object.is(a[k], (b as any)[k])) return false;
  }

  return true;
}

/**
 * Selects a derived value from the store using an external-store subscription.
 * Re-renders when the selected value changes per `isEqual`.
 *
 * @typeParam S - State type returned by `getState()`.
 * @typeParam T - Selected value type.
 * @param selector - `(state) => value` derived from the current state.
 * @param isEqual  - Optional equality comparator (defaults to `Object.is`).
 *
 * @example
 * ```tsx
 * const total = useSelector((s: AppState) => s.todos.items.length);
 * ```
 *
 * @public
 */
export function useSelector<S extends Record<any, any>, T>(
  selector: (state: DeepReadonly<S>) => T,
  isEqual: (a: T, b: T) => boolean = Object.is,
): T {
  const store = useStore<any, any, S>();

  const subscribe = useMemo(
    () => (notify: () => void) => store.subscribe(notify),
    [store],
  );

  const getSnapshot = useMemo(() => {
    let last = selector(store.getState() as DeepReadonly<S>);
    return () => {
      const next = selector(store.getState() as DeepReadonly<S>);
      return isEqual(last, next) ? last : (last = next);
    };
  }, [store, selector, isEqual]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// Strongly-typed implementation for the common case
function useAtomicPropImpl<
  R extends string,
  S extends Record<R, any>,
  R1 extends R,
  P extends Dotted<S[R1]>,
>(spec: { reducer: R1; property: P }): PathValue<S[R1], P> {
  const store = useStore<any, R, S>();

  const normalizedSpec = useMemo(() => {
    const prop = normalizePath(spec.property);
    return { reducer: spec.reducer, property: prop } as const;
  }, [spec.reducer, spec.property]);

  const subscribe = useMemo(
    () => (notify: () => void) =>
      store.connect(
        { reducer: normalizedSpec.reducer, property: normalizedSpec.property },
        () => notify(),
      ),
    [store, normalizedSpec],
  );

  const getSnapshot = useMemo(() => {
    const isGlob = hasWildcard(normalizedSpec.property);
    const read = () => {
      const full = store.getState() as S;
      const slice = (full as any)[normalizedSpec.reducer];
      const source = isGlob ? slice : getAtPath(slice, normalizedSpec.property);
      return source;
    };

    let last = read();
    return () => {
      const next = read();
      return Object.is(last, next) ? last : (last = next);
    };
  }, [store, normalizedSpec]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot) as PathValue<S[R1], P>;
}

/** @internal */
function _useAtomicPropImpl<R extends string, S extends Record<R, any>, T = any>(
  spec: { reducer: R; property: string },
  map?: (value: any) => T,
  isEqual: (a: T, b: T) => boolean = Object.is,
): T {
  const store = useStore<any, R, S>();

  const normalizedSpec = useMemo(() => {
    const prop = normalizePath(spec.property);
    return { reducer: spec.reducer, property: prop } as const;
  }, [spec.reducer, spec.property]);

  const subscribe = useMemo(
    () => (notify: () => void) =>
      store.connect(
        { reducer: normalizedSpec.reducer, property: normalizedSpec.property },
        () => notify(),
      ),
    [store, normalizedSpec],
  );

  const getSnapshot = useMemo(() => {
    const isGlob = hasWildcard(normalizedSpec.property);
    const read = () => {
      const full = store.getState() as S;
      const slice = (full as any)[normalizedSpec.reducer];
      const source = isGlob ? slice : getAtPath(slice, normalizedSpec.property);
      return map ? map(source) : (source as unknown as T);
    };

    let last = read();
    return () => {
      const next = read();
      return isEqual(last, next) ? last : (last = next);
    };
  }, [store, normalizedSpec, map, isEqual]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot) as any;
}

/**
 * Fine-grained **single-path** selector for a reducer's state.
 *
 * Re-renders only when the specified `reducer.property` (dotted path) actually changes.
 * For most applications, prefer using the typed version from {@link createQuoHooks}
 * which infers all type parameters automatically.
 *
 * **Supports**
 * - Exact root prop: `{ reducer: "todo", property: "data" }`
 * - Exact deep path: `{ reducer: "todo", property: "data.123.title" }`
 * - Wildcards (pattern): `{ reducer: "todo", property: "data.*" }` or `"data.**"`
 *
 * **Overloads**
 * - Exact path (no `*`): returns the precise `PathValue` when `map` is omitted
 * - Exact path + `map`: returns `T` from `map(value)`
 * - Glob path (with `*`/`**`): requires `map` and returns `T` from `map(state)`
 *
 * @example Via createQuoHooks (recommended)
 * ```tsx
 * const { useAtomicProp } = createQuoHooks(AppStoreContext);
 *
 * function TodoTitle({ index }: { index: number }) {
 *   // Types are inferred — no explicit generics needed
 *   const title = useAtomicProp({
 *     reducer: 'todos',
 *     property: `items.${index}.title`,
 *   });
 *   return <span>{title}</span>;
 * }
 * ```
 *
 * @example Standalone with explicit generics
 * ```tsx
 * const title = useAtomicProp<'todos', AppState, 'todos', 'items.0.title'>(
 *   { reducer: 'todos', property: 'items.0.title' }
 * );
 * ```
 *
 * @example Map over exact path
 * ```tsx
 * const len = useAtomicProp(
 *   { reducer: 'todos', property: 'items' },
 *   items => items.length
 * );
 * ```
 *
 * @example Glob pattern over state
 * ```tsx
 * const titles = useAtomicProp(
 *   { reducer: 'todos', property: 'items.**' },
 *   state => state.items.map(x => x.title),
 *   shallowEqual
 * );
 * ```
 *
 * @public
 */
export function useAtomicProp<
  R extends string,
  S extends Record<R, any>,
  R1 extends R,
  P extends Dotted<S[R1]>,
>(spec: { reducer: R1; property: P }): PathValue<S[R1], P>;
export function useAtomicProp<
  R extends string,
  S extends Record<R, any>,
  R1 extends R,
  P extends Dotted<S[R1]>,
  T,
>(
  spec: { reducer: R1; property: P },
  map: (value: PathValue<S[R1], P>) => T,
  isEqual?: (a: T, b: T) => boolean,
): T;
export function useAtomicProp<
  R extends string,
  S extends Record<R, any>,
  R1 extends R,
  P extends WithGlob<Dotted<S[R1]>>,
  T,
>(
  spec: { reducer: R1; property: P },
  map: (value: any) => T,
  isEqual?: (a: T, b: T) => boolean,
): T;
export function useAtomicProp<R extends string, S extends Record<R, any>>(spec: {
  reducer: R;
  property: string;
}): unknown;
export function useAtomicProp<R extends string, S extends Record<R, any>, T>(
  spec: { reducer: R; property: string },
  map: (value: any) => T,
  isEqual?: (a: T, b: T) => boolean,
): T;
export function useAtomicProp<R extends string, S extends Record<R, any>, T = any>(
  spec: { reducer: R; property: string },
  map?: (value: any) => T,
  isEqual: (a: T, b: T) => boolean = Object.is,
): T {
  if (!map && !hasWildcard(spec.property)) {
    return useAtomicPropImpl<R, S, any, any>(spec) as any;
  }
  return _useAtomicPropImpl<R, S, T>(spec, map, isEqual);
}

/**
 * **Multi-path** fine-grained selector.
 *
 * Subscribes to several `reducer.property` paths (supports deep & wildcard)
 * and recomputes `selector(state)` when any of them change.
 *
 * @typeParam R - Slice name union.
 * @typeParam S - State record keyed by `R`.
 * @typeParam T - Derived value type.
 *
 * @param specs    - Array of `{ reducer, property }`, where `property` can be a string or array of strings. Supports `*`/`**`.
 * @param selector - `(state) => T` function run against the full state.
 * @param isEqual  - Equality comparator for the derived value (defaults to `Object.is`).
 *
 * @example
 * ```tsx
 * const total = useAtomicProps<'todos' | 'filter', AppState, number>(
 *   [
 *     { reducer: 'todos',  property: 'items.**' },
 *     { reducer: 'filter', property: 'q' }
 *   ],
 *   (s) => s.todos.items.filter(x => x.title.includes(s.filter.q)).length
 * );
 * ```
 *
 * @public
 */
export function useAtomicProps<R extends string, S extends Record<R, any>, T>(
  specs: Array<{ reducer: R; property: OneOrMany<WithGlob<Dotted<S[R]>>> }>,
  selector: (state: DeepReadonly<S>) => T,
  isEqual?: (a: T, b: T) => boolean,
): T;
export function useAtomicProps<R extends string, S extends Record<R, any>, T>(
  specs: Array<{ reducer: R; property: OneOrMany<string> }>,
  selector: (state: DeepReadonly<S>) => T,
  isEqual?: (a: T, b: T) => boolean,
): T;
export function useAtomicProps<R extends string, S extends Record<R, any>, T>(
  specs: Array<{
    reducer: R;
    property: OneOrMany<string> | OneOrMany<WithGlob<Dotted<S[R]>>>;
  }>,
  selector: (state: DeepReadonly<S>) => T,
  isEqual: (a: T, b: T) => boolean = Object.is,
): T {
  return _useAtomicPropsImpl<R, S, T>(specs as any, selector, isEqual);
}

/** @internal */
function _useAtomicPropsImpl<R extends string, S extends Record<R, any>, T>(
  specs: Array<{
    reducer: R;
    property: OneOrMany<string> | OneOrMany<WithGlob<Dotted<S[R]>>>;
  }>,
  selector: (state: DeepReadonly<S>) => T,
  isEqual: (a: T, b: T) => boolean = Object.is,
): T {
  const store = useStore<EventMapBase, R, S>();

  const versionRef = useRef(0);
  const lastSelRef = useRef<T | undefined>(undefined);
  const lastVerRef = useRef<number>(-1);

  const normalizedSpecs = useMemo(() => {
    return specs.map((sp) => ({
      reducer: sp.reducer,
      property: Array.isArray(sp.property)
        ? (sp.property as readonly string[]).map((p) => normalizePath(p as string))
        : normalizePath(sp.property as string),
    }));
  }, [JSON.stringify(specs)]);

  const subscribe = useMemo(
    () => (notify: () => void) => {
      const tick = () => {
        versionRef.current++;
        notify();
      };

      const unsubs = normalizedSpecs.flatMap((sp) => {
        const props = Array.isArray(sp.property) ? sp.property : [sp.property];
        return props.map((p) =>
          store.connect({ reducer: sp.reducer, property: p }, tick),
        );
      });

      return () => {
        for (const u of unsubs) u();
      };
    },
    [store, normalizedSpecs],
  );

  const getSnapshot = useMemo(() => {
    return () => {
      if (lastVerRef.current !== versionRef.current) {
        const next = selector(store.getState() as DeepReadonly<S>);
        const prev = lastSelRef.current as T | undefined;

        if (prev === undefined || !isEqual(prev, next)) {
          lastSelRef.current = next;
        }

        lastVerRef.current = versionRef.current;
      }

      return lastSelRef.current as T;
    };
  }, [store, selector, isEqual]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Subscribe to store events from a React component.
 *
 * This hook enables reactive UI patterns by allowing components to respond
 * to specific events without selecting state. Useful for:
 * - Showing notifications on certain events
 * - Triggering animations
 * - Logging/analytics
 * - Responding to rejected (uncommitted) events
 *
 * **Phases:**
 * - `'committed'` (default): Events that passed middleware and reached reducers
 * - `'uncommitted'`: Events rejected by middleware
 * - `'all'`: Both committed and uncommitted events (handler receives phase parameter)
 *
 * @typeParam EM - Event map type.
 * @typeParam C - Channel key within `EM`.
 * @typeParam T - Event type key within channel `C`.
 *
 * @param channel - Event channel to subscribe to.
 * @param type - Event type to subscribe to.
 * @param handler - Handler called when the event fires. Receives `(event, getState, emit, phase)`.
 * @param phase - Event phase to subscribe to (default: `'committed'`).
 *
 * @example Committed events (default)
 * ```tsx
 * useEvent('ui', 'save', (event, getState, emit, phase) => {
 *   showToast('Saved successfully!');
 * });
 * ```
 *
 * @example Rejected events
 * ```tsx
 * useEvent('ui', 'delete', (event, getState, emit, phase) => {
 *   showToast('Delete was blocked by middleware');
 * }, 'uncommitted');
 * ```
 *
 * @example All events
 * ```tsx
 * useEvent('ui', 'action', (event, getState, emit, phase) => {
 *   console.log('Action:', phase); // 'committed' or 'uncommitted'
 * }, 'all');
 * ```
 *
 * @public
 */
export function useEvent<
  EM extends EventMapBase,
  C extends keyof EM & string,
  T extends keyof EM[C] & string,
>(
  channel: C,
  type: T,
  handler: (
    event: Event<EM, C, T>,
    getState: () => DeepReadonly<any>,
    emit: Emit<EM>,
    phase: "committed" | "uncommitted",
  ) => void | Promise<void>,
  phase: EventPhase = "committed",
): void {
  const store = useStore<EM, any, any>();
  const handlerRef = useRef(handler);
  handlerRef.current = handler; // Always keep latest handler (solves stale closures)

  useEffect(() => {
    return store.onEvent(
      channel,
      type,
      (event, getState, emit, eventPhase) => {
        handlerRef.current(event as Event<EM, C, T>, getState, emit, eventPhase);
      },
      phase,
    );
  }, [store, channel, type, phase]);
}