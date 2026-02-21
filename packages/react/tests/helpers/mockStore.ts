// file: yoltra/packages/react/tests/helpers/mockStore.ts
import type { StoreInstance, EventMapBase, EventPhase } from "@yoltra/core";
import { vi } from "vitest";

export type AnyState = Record<string, any>;

export interface MockStoreExtras<S extends AnyState> {
  /** Imperatively replace or derive the next state. */
  setState(next: S | ((prev: S) => S)): void;
  /** Notify all subscribers and all connection callbacks. */
  notifyAll(): void;
  /** Notify subscribers and only connections for the given reducer/property. */
  notifyPath(reducer: string, property: string): void;
  /** Notify event subscribers for a given channel/type/phase. */
  notifyEvent(
    channel: string,
    type: string,
    payload: any,
    phase: "committed" | "uncommitted",
  ): void;
  /** Introspection helpers for assertions. */
  getSubscribersCount(): number;
  getConnections(): Array<{ reducer: string; property: string }>;
  getEventSubscriptions(): Array<{
    channel: string;
    type: string;
    phase: EventPhase;
  }>;
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
    MockStoreExtras<S> & {
      emit: ReturnType<typeof vi.fn>;
      connect: ReturnType<typeof vi.fn>;
      onEvent: ReturnType<typeof vi.fn>;
    };
} {
  let state = initialState;
  const subscribers = new Set<() => void>();
  const connections: Array<{ reducer: string; property: string; cb: () => void }> = [];
  const eventSubscriptions: Array<{
    channel: string;
    type: string;
    phase: EventPhase;
    cb: (
      event: any,
      getState: () => S,
      emit: any,
      phase: "committed" | "uncommitted",
    ) => void;
  }> = [];

  const subscribe = (listener: () => void) => {
    subscribers.add(listener);
    return () => {
      subscribers.delete(listener);
    };
  };

  const connect = vi.fn(
    (spec: { reducer: string; property: string }, cb: () => void) => {
      const entry = { reducer: spec.reducer, property: spec.property, cb };
      connections.push(entry);
      return () => {
        const idx = connections.indexOf(entry);
        if (idx >= 0) connections.splice(idx, 1);
      };
    },
  );

  const emit = vi.fn();

  const onEvent = vi.fn(
    (
      channel: string,
      type: string,
      cb: (
        event: any,
        getState: () => S,
        emit: any,
        phase: "committed" | "uncommitted",
      ) => void,
      phase: EventPhase = "committed",
    ) => {
      const entry = { channel, type, phase, cb };
      eventSubscriptions.push(entry);
      return () => {
        const idx = eventSubscriptions.indexOf(entry);
        if (idx >= 0) eventSubscriptions.splice(idx, 1);
      };
    },
  );

  const storeCore: any = {
    getState: () => state,
    subscribe,
    connect,
    emit,
    onEvent,
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
    notifyEvent(channel, type, payload, phase) {
      const event = { channel, type, payload, id: Symbol("mock-event") };
      eventSubscriptions.forEach((sub) => {
        const matchChannel = sub.channel === channel;
        const matchType = sub.type === type;
        const matchPhase =
          sub.phase === "all" || sub.phase === phase;
        if (matchChannel && matchType && matchPhase) {
          sub.cb(event, () => state, emit, phase);
        }
      });
    },
    getSubscribersCount() {
      return subscribers.size;
    },
    getConnections() {
      return connections.map(({ reducer, property }) => ({ reducer, property }));
    },
    getEventSubscriptions() {
      return eventSubscriptions.map(({ channel, type, phase }) => ({
        channel,
        type,
        phase,
      }));
    },
  };

  const store = Object.assign(storeCore, extras);

  return {
    store: store as StoreInstance<string, S, EventMapBase> &
      MockStoreExtras<S> & { emit: typeof emit; connect: typeof connect; onEvent: typeof onEvent },
  };
}
