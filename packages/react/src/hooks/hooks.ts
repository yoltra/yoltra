import { useContext, useMemo, useRef, useSyncExternalStore } from "react";
import { StoreContext } from "../context/StoreContext";
import type {
  ActionMapBase,
  Dispatch,
  StoreInstance,
  Dotted,
  WithGlob,
  ConnectDeep,
} from "@quojs/core";
import { warnOnce } from "../utils/warnOnce";

/**
 * Resolves the value type at a **dotted path** `P` inside object/array `T`.
 * Supports numeric segments for arrays (e.g., `"items.0.title"`).
 *
 * @typeParam T - Root type to index into.
 * @typeParam P - Dotted path string.
 *
 * @example
 * ```ts
 * type S = { todos: Array<{ title: string; done: boolean }> };
 * type T1 = PathValue<S['todos'], '0.title'>; // string
 * type T2 = PathValue<S, 'todos.0'>;          // { title: string; done: boolean }
 * ```
 *
 * @internal
 */
export type PathValue<T, P extends string> =
  P extends `${infer K}.${infer Rest}`
    ? K extends `${number}`
      ? T extends readonly (infer U)[]
        ? PathValue<U, Rest>
        : any
      : K extends keyof T
        ? PathValue<T[K], Rest>
        : any
    : P extends `${number}`
      ? T extends readonly (infer U)[]
        ? U
        : any
      : P extends keyof T
        ? T[P]
        : any;

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
 * @internal
 */
export type OneOrMany<T> = T | readonly T[];

/** @internal */
function hasWildcard(p: string): boolean { return p.includes("*"); }
/** @internal */
function normalizePath(p: string): string { return p.replace(/^\./, ""); }
/** @internal */
function splitPath(p: string): string[] { return normalizePath(p).split(".").filter(Boolean); }
/**
 * Reads a dotted path from an object; returns `undefined` when a segment is missing.
 * @internal
 */
function getAtPath(obj: any, path: string): any {
  if (!path) return obj;

  let cur = obj;
  for (const seg of splitPath(path)) {
    if (cur == null) return undefined;

    cur = cur[seg as any];
  }

  return cur;
}

/**
 * Returns the current {@link StoreInstance} from {@link StoreContext}.
 * Throws if used outside of a `<StoreProvider>`.
 *
 * @typeParam AM - Action map type.
 * @typeParam R  - Reducer name union.
 * @typeParam S  - State record keyed by `R`.
 *
 * @example
 * ```tsx
 * const store = useStore<MyAM, 'counter' | 'todos', AppState>();
 * const state = store.getState();
 * ```
 *
 * @public
 */
export function useStore<AM extends ActionMapBase, R extends string, S extends Record<R, any>>(): StoreInstance<R, S, AM> {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");

  return ctx as StoreInstance<R, S, AM>;
}

/**
 * Returns the store’s `dispatch` function (stable reference).
 *
 * @typeParam AM - Action map type.
 *
 * @example
 * ```tsx
 * const dispatch = useDispatch<MyAM>();
 * dispatch('ui', 'toggle', true);
 * ```
 *
 * @public
 */
export function useDispatch<AM extends ActionMapBase>(): Dispatch<AM> {
  return useStore<AM, any, any>().dispatch;
}

/**
 * Shallow object equality using `Object.is` per-key.
 *
 * @example
 * ```ts
 * shallowEqual({ a: 1 }, { a: 1 }) // true
 * shallowEqual({ a: 1 }, { a: 2 }) // false
 * ```
 *
 * @public
 */
export function shallowEqual<T extends Record<string, any>>(a: T, b: T) {
  if (Object.is(a, b)) return true;
  if (!a || !b) return false;

  const ka = Object.keys(a), kb = Object.keys(b);
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
  selector: (state: S) => T,
  isEqual: (a: T, b: T) => boolean = Object.is
): T {
  const store = useStore<any, any, S>();

  const subscribe = useMemo(
    () => (notify: () => void) => store.subscribe(notify),
    [store]
  );

  const getSnapshot = useMemo(() => {
    let last = selector(store.getState() as S);
    return () => {
      const next = selector(store.getState() as S);

      return isEqual(last, next) ? last : (last = next);
    };
  }, [store, selector, isEqual]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Fine-grained **single-path** selector for a Reducer' state.
 *
 * Re-renders only when the specified `reducer.property` (dotted path) actually changes.
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
 * @example Exact path
 * ```tsx
 * const title = useAtomicProp<'todos', AppState, 'items.0.title'>(
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
// Light first overloads to avoid deep Dotted<> instantiation on large types
export function useAtomicProp<R extends string, S extends Record<R, any>>(
  spec: { reducer: R; property: string },
): unknown;
export function useAtomicProp<R extends string, S extends Record<R, any>, T>(
  spec: { reducer: R; property: string },
  map: (value: any) => T,
  isEqual?: (a: T, b: T) => boolean,
): T;
// Precise overloads (kept)
export function useAtomicProp<R extends string, S extends Record<R, any>, P extends Dotted<S[R]>>(
  spec: { reducer: R; property: P },
): PathValue<S[R], P>;
export function useAtomicProp<R extends string, S extends Record<R, any>, P extends Dotted<S[R]>, T>(
  spec: { reducer: R; property: P },
  map: (value: PathValue<S[R], P>) => T,
  isEqual?: (a: T, b: T) => boolean,
): T;
export function useAtomicProp<R extends string, S extends Record<R, any>, P extends WithGlob<Dotted<S[R]>>, T>(
  spec: { reducer: R; property: P },
  map: (value: any) => T,
  isEqual?: (a: T, b: T) => boolean,
): T;
export function useAtomicProp<R extends string, S extends Record<R, any>, T = any>(
  spec: { reducer: R; property: string },
  map?: (value: any) => T,
  isEqual: (a: T, b: T) => boolean = Object.is
): T {
  return _useAtomicPropImpl<R, S, T>(spec, map, isEqual);
}

/** @internal (was `_useSlicePropImpl`; renamed to avoid the TS overload check) */
function _useAtomicPropImpl<R extends string, S extends Record<R, any>, T = any>(
  spec: { reducer: R; property: string },
  map?: (value: any) => T,
  isEqual: (a: T, b: T) => boolean = Object.is
): T {
  const store = useStore<any, R, S>();

  const normalizedSpec = useMemo(() => {
    const prop = normalizePath(spec.property);
    return { reducer: spec.reducer, property: prop } as const;
  }, [spec.reducer, spec.property]);

  const subscribe = useMemo(
    () => (notify: () => void) =>
      store.connect(normalizedSpec as unknown as ConnectDeep<R, S>, () => notify()),
    [store, normalizedSpec]
  );

  const getSnapshot = useMemo(() => {
    const isGlob = hasWildcard(normalizedSpec.property);
    const read = () => {
      const full = store.getState() as S;
      const slice = full[normalizedSpec.reducer];
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
 * @deprecated Use {@link useAtomicProp} instead. Will be removed in `0.5.0`.
 * Fine-grained **single-path** selector for a Reducer.
 */
export function useSliceProp<R extends string, S extends Record<R, any>, P extends Dotted<S[R]>>(
  spec: { reducer: R; property: P },
): PathValue<S[R], P>;
export function useSliceProp<R extends string, S extends Record<R, any>, P extends Dotted<S[R]>, T>(
  spec: { reducer: R; property: P },
  map: (value: PathValue<S[R], P>) => T,
  isEqual?: (a: T, b: T) => boolean,
): T;
export function useSliceProp<R extends string, S extends Record<R, any>, P extends WithGlob<Dotted<S[R]>>, T>(
  spec: { reducer: R; property: P },
  map: (value: any) => T,
  isEqual?: (a: T, b: T) => boolean,
): T;
export function useSliceProp<R extends string, S extends Record<R, any>, T = any>(
  spec: { reducer: R; property: string },
  map?: (value: any) => T,
  isEqual: (a: T, b: T) => boolean = Object.is
): T {
  warnOnce(
    "quo:useSliceProp",
    "[@quojs/react] `useSliceProp()` is deprecated and will be removed in 0.5.0. Use `useAtomicProp()`."
  );
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
 *     { reducer: 'todos',  property: ['items.**'] },
 *     { reducer: 'filter', property: 'q' }
 *   ],
 *   (s) => s.todos.items.filter(x => x.title.includes(s.filter.q)).length
 * );
 * ```
 *
 * @public
 */
// Light first overload to keep callsites simple
export function useAtomicProps<R extends string, S extends Record<R, any>, T>(
  specs: Array<{ reducer: R; property: OneOrMany<string> }>,
  selector: (state: S) => T,
  isEqual?: (a: T, b: T) => boolean
): T;
// Precise overload (kept)
export function useAtomicProps<R extends string, S extends Record<R, any>, T>(
  specs: Array<{ reducer: R; property: OneOrMany<WithGlob<Dotted<S[R]>>> }>,
  selector: (state: S) => T,
  isEqual?: (a: T, b: T) => boolean
): T;
// Implementation widened to be compatible with both overloads
export function useAtomicProps<R extends string, S extends Record<R, any>, T>(
  specs: Array<{
    reducer: R;
    property:
      | OneOrMany<string>
      | OneOrMany<WithGlob<Dotted<S[R]>>>;
  }>,
  selector: (state: S) => T,
  isEqual: (a: T, b: T) => boolean = Object.is
): T {
  return _useSlicePropsImpl<R, S, T>(specs as any, selector, isEqual);
}

/** @internal (old slicy impl) */
function _useSlicePropsImpl<R extends string, S extends Record<R, any>, T>(
  specs: Array<{
    reducer: R;
    property:
      | OneOrMany<string>
      | OneOrMany<WithGlob<Dotted<S[R]>>>;
  }>,
  selector: (state: S) => T,
  isEqual: (a: T, b: T) => boolean = Object.is
): T {
  const store = useStore<ActionMapBase, R, S>();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(specs)]);

  const subscribe = useMemo(
    () => (notify: () => void) => {
      const tick = () => { versionRef.current++; notify(); };

      // connect once per property (handles array or single string)
      const unsubs = normalizedSpecs.flatMap((sp) => {
        const props = Array.isArray(sp.property) ? sp.property : [sp.property];

        return props.map((p) =>
          store.connect({ reducer: sp.reducer, property: p } as unknown as ConnectDeep<R, S>, tick)
        );
      });

      return () => { for (const u of unsubs) u(); };
    },
    [store, normalizedSpecs]
  );

  const getSnapshot = useMemo(() => {
    return () => {
      if (lastVerRef.current !== versionRef.current) {
        const next = selector(store.getState() as S);
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
 * @deprecated Use {@link useAtomicProps} instead. Will be removed in `0.5.0`.
 * Multi-path fine-grained selector.
 */
export function useSliceProps<R extends string, S extends Record<R, any>, T>(
  specs: Array<{ reducer: R; property: OneOrMany<WithGlob<Dotted<S[R]>>> }>,
  selector: (state: S) => T,
  isEqual: (a: T, b: T) => boolean = Object.is
): T {
  warnOnce(
    "quo:useSliceProps",
    "[@quojs/react] `useSliceProps()` is deprecated and will be removed in 0.5.0. Use `useAtomicProps()`."
  );
  return _useSlicePropsImpl<R, S, T>(specs as any, selector as any, isEqual as any);
}
