// file: quojs/packages/react/tests/helpers/mockStore.ts
import type { StoreInstance, EventMapBase } from "@quojs/core";
import { vi } from "vitest";

export type AnyState = Record<string, any>;

export interface MockStoreExtras<S extends AnyState> {
  /** Imperatively replace or derive the next state. */
  setState(next: S | ((prev: S) => S)): void;
  /** Notify all subscribers and all connection callbacks. */
  notifyAll(): void;
  /** Notify subscribers and only connections for the given reducer/property. */
  notifyPath(reducer: string, property: string): void;
  /** Introspection helpers for assertions. */
  getSubscribersCount(): number;
  getConnections(): Array<{ reducer: string; property: string }>;
}

/**
 * Minimal mock implementation of {@link StoreInstance} used only for React tests.
 *
 * It implements:
 * - getState()
 * - subscribe(listener)
 * - connect({ reducer, property }, cb)
 * - emit(...) (spied)
 */
export function createMockStore<S extends AnyState = AnyState>(
  initialState: S,
): {
  store: StoreInstance<string, S, EventMapBase> &
    MockStoreExtras<S> & { emit: ReturnType<typeof vi.fn>; connect: ReturnType<typeof vi.fn> };
} {
  let state = initialState;
  const subscribers = new Set<() => void>();
  const connections: Array<{ reducer: string; property: string; cb: () => void }> = [];

  const subscribe = (listener: () => void) => {
    subscribers.add(listener);
    return () => {
      subscribers.delete(listener);
    };
  };

  const connect = vi.fn(
    (
      spec: { reducer: string; property: string },
      cb: () => void,
    ) => {
      const entry = { reducer: spec.reducer, property: spec.property, cb };
      connections.push(entry);
      return () => {
        const idx = connections.indexOf(entry);
        if (idx >= 0) connections.splice(idx, 1);
      };
    },
  );

  const emit = vi.fn();

  const storeCore: any = {
    getState: () => state,
    subscribe,
    connect,
    emit,
  };

  const extras: MockStoreExtras<S> = {
    setState(next) {
      state = typeof next === "function" ? (next as (prev: S) => S)(state) : next;
    },
    notifyAll() {
      subscribers.forEach((fn) => fn());
      connections.forEach((c) => c.cb());
    },
    notifyPath(reducer, property) {
      subscribers.forEach((fn) => fn());
      connections.forEach((c) => {
        if (c.reducer === reducer && c.property === property) c.cb();
      });
    },
    getSubscribersCount() {
      return subscribers.size;
    },
    getConnections() {
      return connections.map(({ reducer, property }) => ({ reducer, property }));
    },
  };

  const store = Object.assign(storeCore, extras);

  return {
    store: store as StoreInstance<string, S, EventMapBase> &
      MockStoreExtras<S> & { emit: typeof emit; connect: typeof connect },
  };
}
