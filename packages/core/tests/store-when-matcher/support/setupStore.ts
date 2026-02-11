import { createStore } from "../../../src/store/Store";
import { eventKeys } from "../../../src/types";
import type { ReducerSpec } from "../../../src/types";

/**
 * Test state with multiple slices
 */
export type AppState = {
  counter: { value: number };
  logger: { logs: string[] };
};

/**
 * Test event map with multiple channels
 */
export type AppEvents = {
  ui: {
    increment: number;
    decrement: number;
    reset: void;
  };
  admin: {
    clearLogs: void;
    setCounter: number;
  };
  system: {
    init: void;
    shutdown: void;
  };
};

/**
 * Helper to create event keys with proper types
 */
export const keys = eventKeys<AppEvents>();

/**
 * Counter reducer using legacy `events` array
 */
const counterReducerLegacy: ReducerSpec<AppState["counter"], AppEvents> = {
  state: { value: 0 },
  events: [
    ["ui", "increment"],
    ["ui", "decrement"],
    ["ui", "reset"],
    ["admin", "setCounter"],
  ],
  reducer(state, event) {
    if (event.channel === "ui") {
      if (event.type === "increment") return { value: state.value + (event.payload as number) };
      if (event.type === "decrement") return { value: state.value - (event.payload as number) };
      if (event.type === "reset") return { value: 0 };
    }
    if (event.channel === "admin" && event.type === "setCounter") {
      return { value: event.payload as number };
    }
    return state;
  },
};

/**
 * Counter reducer using `when: { keys: [...] }`
 */
const counterReducerWithWhenKeys: ReducerSpec<AppState["counter"], AppEvents> = {
  state: { value: 0 },
  when: {
    keys: keys([
      ["ui", "increment"],
      ["ui", "decrement"],
      ["ui", "reset"],
      ["admin", "setCounter"],
    ]),
  },
  reducer(state, event) {
    if (event.channel === "ui") {
      if (event.type === "increment") return { value: state.value + (event.payload as number) };
      if (event.type === "decrement") return { value: state.value - (event.payload as number) };
      if (event.type === "reset") return { value: 0 };
    }
    if (event.channel === "admin" && event.type === "setCounter") {
      return { value: event.payload as number };
    }
    return state;
  },
};

/**
 * Logger reducer using `when: { channel: 'ui' }` to log all UI events
 */
const loggerReducerWithChannel: ReducerSpec<AppState["logger"], AppEvents> = {
  state: { logs: [] },
  when: { channel: "ui" },
  reducer(state, event) {
    return {
      logs: [...state.logs, `${event.channel}:${event.type}`],
    };
  },
};

/**
 * Logger reducer using `when: { channels: ['ui', 'admin'] }`
 */
const loggerReducerWithChannels: ReducerSpec<AppState["logger"], AppEvents> = {
  state: { logs: [] },
  when: { channels: ["ui", "admin"] },
  reducer(state, event) {
    return {
      logs: [...state.logs, `${event.channel}:${event.type}`],
    };
  },
};

/**
 * Logger reducer using `when: { any: true }` to log all events
 */
const loggerReducerWithAny: ReducerSpec<AppState["logger"], AppEvents> = {
  state: { logs: [] },
  when: { any: true },
  reducer(state, event) {
    return {
      logs: [...state.logs, `${event.channel}:${event.type}`],
    };
  },
};

/**
 * Factory functions for different store configurations
 */
export function makeStoreWithLegacyEvents() {
  return createStore<AppState, AppEvents>({
    name: "LegacyEventsStore",
    reducer: {
      counter: counterReducerLegacy,
      logger: { state: { logs: [] }, events: [], reducer: (s) => s },
    },
  });
}

export function makeStoreWithWhenKeys() {
  return createStore<AppState, AppEvents>({
    name: "WhenKeysStore",
    reducer: {
      counter: counterReducerWithWhenKeys,
      logger: { state: { logs: [] }, events: [], reducer: (s) => s },
    },
  });
}

export function makeStoreWithChannelMatcher() {
  return createStore<AppState, AppEvents>({
    name: "ChannelMatcherStore",
    reducer: {
      counter: { state: { value: 0 }, events: [], reducer: (s) => s },
      logger: loggerReducerWithChannel,
    },
  });
}

export function makeStoreWithChannelsMatcher() {
  return createStore<AppState, AppEvents>({
    name: "ChannelsMatcherStore",
    reducer: {
      counter: { state: { value: 0 }, events: [], reducer: (s) => s },
      logger: loggerReducerWithChannels,
    },
  });
}

export function makeStoreWithAnyMatcher() {
  return createStore<AppState, AppEvents>({
    name: "AnyMatcherStore",
    reducer: {
      counter: { state: { value: 0 }, events: [], reducer: (s) => s },
      logger: loggerReducerWithAny,
    },
  });
}

export function makeStoreWithDedupConfig(dedupWindowMs: number) {
  return createStore<AppState, AppEvents>({
    name: "DedupConfigStore",
    reducer: {
      counter: counterReducerLegacy,
      logger: { state: { logs: [] }, events: [], reducer: (s) => s },
    },
    dedupWindowMs,
  });
}
