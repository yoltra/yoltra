/**
 * @module @quojs/react
 */

import * as React from "react";
import { useContext, useMemo, useRef, useSyncExternalStore } from "react";
import type {
  EventMapBase,
  StoreInstance,
  Emit,
  DeepReadonly,
  WithGlob,
  Dotted,
} from "@quojs/core";

import { PathValue } from "./hooks";
import { warnOnce } from "../utils/warnOnce";

export type UseAtomicProp<R extends string, S extends Record<R, any>> = {
  <R1 extends R, P extends Dotted<S[R1]>>(spec: { reducer: R1; property: P }): PathValue<
    S[R1],
    P
  >;
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

export type UseAtomicProps<R extends string, S extends Record<R, any>> = {
  <R1 extends R, T>(
    specs: Array<{ reducer: R1; property: string | readonly string[] }>,
    selector: (state: DeepReadonly<S>) => T,
    isEqual?: (a: T, b: T) => boolean,
  ): T;
  <R1 extends R, T>(
    specs: Array<{
      reducer: R1;
      property: WithGlob<Dotted<S[R1]>> | readonly WithGlob<Dotted<S[R1]>>[];
    }>,
    selector: (state: DeepReadonly<S>) => T,
    isEqual?: (a: T, b: T) => boolean,
  ): T;
};

const hasWildcard = (p: string) => p.includes("*");
const normalizePath = (p: string) => p.replace(/^\./, "");
const splitPath = (p: string) => normalizePath(p).split(".").filter(Boolean);
const getAtPath = (obj: unknown, path: string): unknown => {
  if (!path) return obj;
  let cur: any = obj;
  for (const seg of splitPath(path)) {
    if (cur == null) return undefined;
    cur = cur[seg as any];
  }
  return cur;
};

export function shallowEqual<T extends Record<string, unknown>>(a: T, b: T) {
  if (Object.is(a, b)) return true;
  if (!a || !b) return false;
  const ka = Object.keys(a),
    kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if (!Object.is(a[k], (b as Record<string, unknown>)[k])) return false;
  }
  return true;
}

/**
 * Factory that binds typed React hooks to a specific {@link StoreInstance}.
 * @public
 */
export function createQuoHooks<
  R extends string,
  S extends Record<R, any>,
  EM extends EventMapBase,
>(StoreContext: React.Context<StoreInstance<R, S, EM> | null>) {
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
    spec: { reducer: R; property: string },
    map?: (value: unknown) => unknown,
    isEqual?: (a: unknown, b: unknown) => boolean,
  ): unknown => {
    const store = useStore();
    const normalizedSpec = useMemo(() => {
      const prop = normalizePath(spec.property);
      return { reducer: spec.reducer, property: prop } as const;
    }, [spec.reducer, spec.property]);

    const subscribe = useMemo(
      () => (notify: () => void) =>
        store.connect({ reducer: normalizedSpec.reducer, property: normalizedSpec.property }, () =>
          notify(),
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

  const useAtomicPropsImpl = <T,>(
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
    }, [JSON.stringify(specs)]);

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

  // Deprecated alias
  function useDispatch(): Emit<EM> {
    warnOnce(
      "quo:createHooks:useDispatch",
      "[@quojs/react] `useDispatch()` is deprecated and will be removed in v1.0.0. Use `useEmit()` instead.",
    );
    return useEmit();
  }

  return {
    useStore,
    useEmit,
    useSelector,
    useAtomicProp,
    useAtomicProps,
    /** @deprecated Use {@link useEmit} */
    useDispatch,
    shallowEqual,
  };
}