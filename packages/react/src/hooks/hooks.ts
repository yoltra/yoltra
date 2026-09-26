/**
 * @module @yoltra/react
 */

import type {
  DeepReadonly,
  Dotted,
  Emit,
  Event,
  EventMapBase,
  EventPhase,
  NotifiedPhase,
  PathValue,
  StoreInstance,
  WithGlob,
} from "@yoltra/core";
import { useCallback, useContext, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { StoreContext } from "../context/StoreContext";
import { createHooks, type YoltraHooks } from "./createHooks";
import { guardProjection, projectDeclared } from "../utils/declaredProjection";
import { getAtPath, hasWildcard, normalizePath, specsSignature } from "../utils/path";
import { useStableSnapshot } from "../utils/useStableSnapshot";

/**
 * Re-export of {@link PathValue} from `@yoltra/core`.
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
 * The one implementation behind every export in this module.
 *
 * @remarks
 * These used to be a second, parallel implementation of the same six hooks, and the two
 * drifted: the `written` phase once left three copies claiming a handler could only ever see
 * two, and `useAtomicProps`' declared-path guard existed here and **not** in the copy
 * `createYoltra` hands out - so the recommended path was the unguarded one. The exports below
 * are now typed faces on this single set, which is the only arrangement where a fix cannot
 * land in one copy and miss the other.
 *
 * Bound to the package-level context, which is what `<StoreProvider>` fills.
 *
 * Built lazily, on first render rather than at module load. `createHooks` reaches the
 * Suspense hooks, which reach this module, so evaluating it at import time made whichever
 * of the three loaded first see the others half-initialized. By first render every module
 * is settled.
 *
 * @internal
 */
let boundHooks: YoltraHooks<string, Record<string, any>, EventMapBase> | null = null;

/** @internal */
function bound(): YoltraHooks<string, Record<string, any>, EventMapBase> {
  boundHooks ??= createHooks(
    StoreContext as unknown as React.Context<
      StoreInstance<string, Record<string, any>, EventMapBase> | null
    >,
  );
  return boundHooks;
}

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
  return bound().useStore() as unknown as StoreInstance<R, S, EM>;
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
  return bound().useEmit() as unknown as Emit<EM>;
}

// `shallowEqual` is single-sourced in `../utils/shallowEqual` and re-exported
// here so both the public barrel (`@yoltra/react`) and the object returned by
// `createHooks`/`createYoltra` reference the same symbol (avoids a TS2742
// non-portable-type leak in `createYoltra`'s inferred return type).
export { shallowEqual } from "../utils/shallowEqual";

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
  return (bound().useSelector as (...args: unknown[]) => T)(selector, isEqual);
}

/**
 * Fine-grained **single-path** selector for a reducer's state.
 *
 * Re-renders only when the specified `reducer.property` (dotted path) actually changes.
 * For most applications, prefer using the typed version from {@link createHooks}
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
 * @example Via createHooks (recommended)
 * ```tsx
 * const { useAtomicProp } = createHooks(AppStoreContext);
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
  return (bound().useAtomicProp as (...args: unknown[]) => T)(spec, map, isEqual);
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
 * @remarks
 * The selector receives **only the paths declared in `specs`**, not the whole store. Reading
 * anything else yields `undefined` in production and throws in development, naming the path.
 *
 * That is deliberate, and it replaced a real bug: the two arguments used to be independent, so
 * a component could subscribe to one path and read another. It compiled, it ran, and it worked
 * for as long as the two happened to change together — this repository shipped exactly that in
 * its own example, where a list subscribed to `todo.filter` while reading `todo.data` and
 * re-rendered only because adding a todo also rewrote `filter.categories`.
 *
 * Correct code is unaffected. Code that read more than it declared was already wrong, and now
 * says so on the first render rather than on the first day the coincidence breaks.
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
  return (bound().useAtomicProps as (...args: unknown[]) => T)(specs, selector, isEqual);
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
    phase: NotifiedPhase,
  ) => void | Promise<void>,
  phase: EventPhase = "committed",
  options?: {
    /**
     * Also run this handler while devtools is replaying, which it does not by default.
     *
     * @remarks
     * Opt in only for a handler that derives view state purely from the event stream. A
     * handler that publishes, writes or notifies must stay out: scrubbing a timeline is a
     * debugging operation and should not reach a peer, a socket or an analytics endpoint.
     */
    duringReplay?: boolean;
  },
): void {
  (bound().useEvent as (...args: unknown[]) => void)(channel, type, handler, phase, options);
}
