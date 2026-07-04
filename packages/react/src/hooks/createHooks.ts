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
  PathValue,
  StoreInstance,
  WithGlob,
} from "@yoltra/core";
import * as React from "react";
import { useContext, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { getAtPath, hasWildcard, normalizePath, specsSignature, toDottedPath } from "../utils/path";
import { shallowEqual } from "../utils/shallowEqual";

/**
 * Call signature for the typed `useAtomicProp` hook returned by {@link createHooks}.
 *
 * Subscribes to a specific dotted path in a reducer's state and re-renders
 * only when that path changes. All type parameters are inferred automatically
 * from the store context — no explicit generics needed.
 *
 * @typeParam R - Reducer name union.
 * @typeParam S - State record keyed by `R`.
 *
 * @example
 * ```tsx
 * const { useAtomicProp } = createHooks(AppStoreContext);
 *
 * function TodoTitle({ index }: { index: number }) {
 *   const title = useAtomicProp({
 *     reducer: 'todos',
 *     property: `items.${index}.title`,
 *   });
 *   return <span>{title}</span>;
 * }
 * ```
 *
 * @public
 */
export type UseAtomicProp<R extends string, S extends Record<R, any>> = {
  // Typed accessor form: `p => p.a.b.c` gives full autocomplete + inferred return type.
  <R1 extends R, V>(
    reducer: R1,
    accessor: (state: DeepReadonly<S[R1]>) => V,
    isEqual?: (a: V, b: V) => boolean,
  ): V;
  <R1 extends R, P extends Dotted<S[R1]>>(spec: {
    reducer: R1;
    property: P;
  }): PathValue<S[R1], P>;
  <R1 extends R, P extends Dotted<S[R1]>, T>(
    spec: { reducer: R1; property: P },
    map: (value: PathValue<S[R1], P>) => T,
    isEqual?: (a: T, b: T) => boolean,
  ): T;
  <R1 extends R, P extends WithGlob<Dotted<S[R1]>>, T>(
    spec: { reducer: R1; property: P },
    map: (value: unknown) => T,
    isEqual?: (a: T, b: T) => boolean,
  ): T;
  <R1 extends R>(spec: { reducer: R1; property: string }): unknown;
  <R1 extends R, T>(
    spec: { reducer: R1; property: string },
    map: (value: unknown) => T,
    isEqual?: (a: T, b: T) => boolean,
  ): T;
};

/**
 * Call signature for the typed `useAtomicProps` hook returned by {@link createHooks}.
 *
 * Subscribes to multiple dotted paths across one or more reducers and recomputes
 * a derived value when any of them change.
 *
 * @typeParam R - Reducer name union.
 * @typeParam S - State record keyed by `R`.
 *
 * @example
 * ```tsx
 * const { useAtomicProps } = createHooks(AppStoreContext);
 *
 * function FilteredCount() {
 *   const count = useAtomicProps(
 *     [
 *       { reducer: 'todos', property: 'items.**' },
 *       { reducer: 'filter', property: 'q' },
 *     ],
 *     (s) => s.todos.items.filter(x => x.title.includes(s.filter.q)).length,
 *   );
 *   return <span>{count}</span>;
 * }
 * ```
 *
 * @public
 */
export type UseAtomicProps<R extends string, S extends Record<R, any>> = {
  <R1 extends R, T>(
    specs: Array<{
      reducer: R1;
      property: WithGlob<Dotted<S[R1]>> | readonly WithGlob<Dotted<S[R1]>>[];
    }>,
    selector: (state: DeepReadonly<S>) => T,
    isEqual?: (a: T, b: T) => boolean,
  ): T;
  <R1 extends R, T>(
    specs: Array<{ reducer: R1; property: string | readonly string[] }>,
    selector: (state: DeepReadonly<S>) => T,
    isEqual?: (a: T, b: T) => boolean,
  ): T;
};

/**
 * Call signature for the typed `useEvent` hook returned by {@link createHooks}.
 *
 * Subscribes to store events from a React component. Useful for notifications,
 * animations, analytics, and responding to rejected (uncommitted) events.
 *
 * @typeParam EM - Event map type.
 * @typeParam S  - Store state type.
 *
 * @example
 * ```tsx
 * const { useEvent } = createHooks(AppStoreContext);
 *
 * function SaveNotifier() {
 *   useEvent('ui', 'save', (event) => {
 *     showToast('Saved!');
 *   });
 *   return null;
 * }
 * ```
 *
 * @public
 */
export type UseEvent<EM extends EventMapBase, S> = <
  C extends keyof EM & string,
  T extends keyof EM[C] & string,
>(
  channel: C,
  type: T,
  handler: (
    event: Event<EM, C, T>,
    getState: () => DeepReadonly<S>,
    emit: Emit<EM>,
    phase: "committed" | "uncommitted",
  ) => void | Promise<void>,
  phase?: EventPhase,
) => void;

/**
 * The bundle of fully-typed hooks returned by {@link createHooks} (and, with the
 * store and provider added, by {@link createYoltra}).
 *
 * Naming this return shape explicitly — rather than letting it be inferred —
 * keeps `createYoltra`'s emitted `.d.ts` portable: the inferred form would leak
 * a reference to a non-re-exported internal symbol and trip TS2742 in
 * `composite`/`declaration` consumers.
 *
 * @typeParam R  - Reducer name union.
 * @typeParam S  - State record keyed by `R`.
 * @typeParam EM - Event map.
 *
 * @public
 */
export interface YoltraHooks<
  R extends string,
  S extends Record<R, any>,
  EM extends EventMapBase,
> {
  /** Reads the current store from context (falling back to the default store). */
  useStore: () => StoreInstance<R, S, EM>;
  /** Returns the store's typed `emit`. */
  useEmit: () => Emit<EM>;
  /** Subscribes to a derived value with an optional equality comparator. */
  useSelector: <T>(selector: (state: DeepReadonly<S>) => T, isEqual?: (a: T, b: T) => boolean) => T;
  /** Subscribes to a single dotted path (or typed accessor). */
  useAtomicProp: UseAtomicProp<R, S>;
  /** Subscribes to several paths and derives a value from the full state. */
  useAtomicProps: UseAtomicProps<R, S>;
  /** Runs a handler for a specific `(channel, type)` event. */
  useEvent: UseEvent<EM, S>;
  /** Shallow object equality using `Object.is` per-key. */
  shallowEqual: <T extends Record<string, unknown>>(a: T, b: T) => boolean;
}

/**
 * Factory that creates fully-typed React hooks bound to a specific store context.
 *
 * This is the **recommended** setup pattern for yoltra + React. It eliminates
 * the need for explicit type parameters on every hook call — all types are
 * inferred from the store context once, at creation time.
 *
 * @typeParam R  - Reducer name union.
 * @typeParam S  - State record keyed by `R`.
 * @typeParam EM - Event map.
 *
 * @param StoreContext - A React context carrying a `StoreInstance<R, S, EM>`.
 * @returns An object with typed hooks: `useStore`, `useEmit`, `useSelector`,
 *   `useAtomicProp`, `useAtomicProps`, `useEvent`, and `shallowEqual`.
 *
 * @throws If any returned hook is called outside a `<StoreProvider>`.
 *
 * @example Complete setup
 * ```tsx
 * // 1. Define your event map and state
 * type AppEM = { ui: { increment: number; decrement: number } };
 * type AppState = { counter: { value: number } };
 *
 * // 2. Create a typed context
 * import { createContext } from 'react';
 * import { StoreInstance } from '@yoltra/core';
 * const AppStoreContext = createContext<
 *   StoreInstance<'counter', AppState, AppEM> | null
 * >(null);
 *
 * // 3. Create typed hooks (do this once, export from a shared module)
 * const { useAtomicProp, useEmit, useEvent } = createHooks(AppStoreContext);
 *
 * // 4. Use in components — no explicit generics needed
 * function Counter() {
 *   const value = useAtomicProp({ reducer: 'counter', property: 'value' });
 *   const emit = useEmit();
 *   return (
 *     <button onClick={() => emit('ui', 'increment', 1)}>
 *       Count: {value}
 *     </button>
 *   );
 * }
 * ```
 *
 * @public
 */
export function createHooks<
  R extends string,
  S extends Record<R, any>,
  EM extends EventMapBase,
>(StoreContext: React.Context<StoreInstance<R, S, EM> | null>): YoltraHooks<R, S, EM> {
  function useStore(): StoreInstance<R, S, EM> {
    const ctx = useContext(StoreContext);
    if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
    return ctx;
  }

  function useEmit(): Emit<EM> {
    return useStore().emit;
  }

  function useSelector<T>(
    selector: (state: DeepReadonly<S>) => T,
    isEqual: (a: T, b: T) => boolean = Object.is,
  ): T {
    const store = useStore();
    const subscribe = useMemo(() => (notify: () => void) => store.subscribe(notify), [store]);
    const getSnapshot = useMemo(() => {
      let last = selector(store.getState());
      return () => {
        const next = selector(store.getState());
        return isEqual(last, next) ? last : (last = next);
      };
    }, [store, selector, isEqual]);
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  }

  type UseAtomicPropOverloads = UseAtomicProp<R, S>;

  const useAtomicPropImpl = (
    specOrReducer: { reducer: R; property: string } | R,
    mapOrAccessor?: (value: any) => unknown,
    isEqual?: (a: unknown, b: unknown) => boolean,
  ): unknown => {
    const store = useStore();

    // Two calling conventions, normalized to { reducer, property } + optional map:
    //  - useAtomicProp({ reducer, property }, map?, isEqual?)  (dotted-path string)
    //  - useAtomicProp(reducer, p => p.a.b, isEqual?)          (typed accessor)
    const accessorForm = typeof specOrReducer === "string";
    const reducer = (accessorForm ? specOrReducer : specOrReducer.reducer) as R;
    const rawProperty = accessorForm
      ? toDottedPath(mapOrAccessor as (p: any) => any)
      : specOrReducer.property;
    const map = accessorForm ? undefined : mapOrAccessor;

    const normalizedSpec = useMemo(() => {
      return { reducer, property: normalizePath(rawProperty) } as const;
    }, [reducer, rawProperty]);

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
        const full = store.getState() as DeepReadonly<S>;
        const slice = (full as any)[normalizedSpec.reducer];
        const source = isGlob ? slice : getAtPath(slice, normalizedSpec.property);
        return map ? map(source) : source;
      };
      const eq = isEqual ?? Object.is;
      let last = read();
      return () => {
        const next = read();
        return eq(last, next) ? last : (last = next);
      };
    }, [store, normalizedSpec, map, isEqual]);

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  };

  const useAtomicProp = useAtomicPropImpl as unknown as UseAtomicPropOverloads;

  type OneOrMany<T> = T | readonly T[];
  type UseAtomicPropsOverloads = UseAtomicProps<R, S>;

  const useAtomicPropsImpl = <T>(
    specs: Array<{ reducer: R; property: OneOrMany<string> }>,
    selector: (state: DeepReadonly<S>) => T,
    isEqual: (a: T, b: T) => boolean = Object.is,
  ): T => {
    const store = useStore();
    const versionRef = useRef(0);
    const lastSelRef = useRef<T | undefined>(undefined);
    const lastVerRef = useRef<number>(-1);

    const normalizedSpecs = useMemo(() => {
      return specs.map((sp) => ({
        reducer: sp.reducer,
        property: Array.isArray(sp.property)
          ? (sp.property as readonly string[]).map((p) => normalizePath(p))
          : normalizePath(sp.property as string),
      }));
    }, [specsSignature(specs)]);

    const subscribe = useMemo(
      () => (notify: () => void) => {
        const tick = () => {
          versionRef.current++;
          notify();
        };
        const unsubs = normalizedSpecs.flatMap((sp) => {
          const props = Array.isArray(sp.property) ? sp.property : [sp.property];
          return props.map((p) => store.connect({ reducer: sp.reducer, property: p }, tick));
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
          const next = selector(store.getState());
          const prev = lastSelRef.current;
          if (prev === undefined || !isEqual(prev, next)) lastSelRef.current = next;
          lastVerRef.current = versionRef.current;
        }
        return lastSelRef.current as T;
      };
    }, [store, selector, isEqual]);

    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  };

  const useAtomicProps = useAtomicPropsImpl as unknown as UseAtomicPropsOverloads;

  type UseEventOverloads = UseEvent<EM, S>;

  const useEvent: UseEventOverloads = <
    C extends keyof EM & string,
    T extends keyof EM[C] & string,
  >(
    channel: C,
    type: T,
    handler: (
      event: Event<EM, C, T>,
      getState: () => DeepReadonly<S>,
      emit: Emit<EM>,
      phase: "committed" | "uncommitted",
    ) => void | Promise<void>,
    phase: EventPhase = "committed",
  ): void => {
    const store = useStore();
    const handlerRef = useRef(handler);
    handlerRef.current = handler; // Always keep latest handler (solves stale closures)

    useEffect(() => {
      return store.onEvent(
        channel,
        type,
        (event, getState, emit, eventPhase) => {
          handlerRef.current(
            event as Event<EM, C, T>,
            getState as () => DeepReadonly<S>,
            emit,
            eventPhase,
          );
        },
        phase,
      );
    }, [store, channel, type, phase]);
  };

  return {
    useStore,
    useEmit,
    useSelector,
    useAtomicProp,
    useAtomicProps,
    useEvent,
    shallowEqual,
  };
}
