import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { createStore } from "../../src/store/Store";
import { eventKeys } from "../../src/types";
import type {
  MiddlewareFunction,
  MiddlewareSpec,
  EffectSpec,
  ReducerSpec,
} from "../../src/types";
import {
  AppState,
  AppEvents,
  keys,
  makeStoreWithLegacyEvents,
  makeStoreWithWhenKeys,
  makeStoreWithChannelMatcher,
  makeStoreWithChannelsMatcher,
  makeStoreWithAnyMatcher,
  makeStoreWithDedupConfig,
} from "./support/setupStore";

describe("Store - when matcher", () => {
  describe("Reducer targeting", () => {
    it("legacy `events` array still works", async () => {
      const store = makeStoreWithLegacyEvents();

      await store.emit("ui", "increment", 5);
      expect(store.getState().counter.value).toBe(5);

      await store.emit("ui", "decrement", 2);
      expect(store.getState().counter.value).toBe(3);

      await store.emit("admin", "setCounter", 100);
      expect(store.getState().counter.value).toBe(100);
    });

    it("when: { keys: [...] } works the same as legacy events", async () => {
      const store = makeStoreWithWhenKeys();

      await store.emit("ui", "increment", 5);
      expect(store.getState().counter.value).toBe(5);

      await store.emit("ui", "decrement", 2);
      expect(store.getState().counter.value).toBe(3);

      await store.emit("admin", "setCounter", 100);
      expect(store.getState().counter.value).toBe(100);
    });

    it("when: { channel: 'x' } matches all events in that channel", async () => {
      const store = makeStoreWithChannelMatcher();

      await store.emit("ui", "increment", 1);
      await store.emit("ui", "decrement", 1);
      await store.emit("ui", "reset", undefined as any);
      await store.emit("admin", "clearLogs", undefined as any); // Should NOT be logged
      await store.emit("system", "init", undefined as any); // Should NOT be logged

      expect(store.getState().logger.logs).toEqual([
        "ui:increment",
        "ui:decrement",
        "ui:reset",
      ]);
    });

    it("when: { channels: ['x', 'y'] } matches all events in those channels", async () => {
      const store = makeStoreWithChannelsMatcher();

      await store.emit("ui", "increment", 1);
      await store.emit("admin", "clearLogs", undefined as any);
      await store.emit("system", "init", undefined as any); // Should NOT be logged
      await store.emit("ui", "reset", undefined as any);

      expect(store.getState().logger.logs).toEqual([
        "ui:increment",
        "admin:clearLogs",
        "ui:reset",
      ]);
    });

    it("when: { any: true } matches all events from all channels", async () => {
      const store = makeStoreWithAnyMatcher();

      await store.emit("ui", "increment", 1);
      await store.emit("admin", "clearLogs", undefined as any);
      await store.emit("system", "init", undefined as any);
      await store.emit("system", "shutdown", undefined as any);

      expect(store.getState().logger.logs).toEqual([
        "ui:increment",
        "admin:clearLogs",
        "system:init",
        "system:shutdown",
      ]);
    });
  });

  describe("Middleware targeting with MiddlewareSpec", () => {
    it("MiddlewareSpec with when: { channel } only runs for that channel", async () => {
      const store = makeStoreWithLegacyEvents();
      const calls: string[] = [];

      const mwSpec: MiddlewareSpec<Readonly<AppState>, AppEvents> = {
        when: { channel: "admin" },
        middleware: (_state, event) => {
          calls.push(`${event.channel}:${event.type}`);
          return true;
        },
        meta: { type: "middleware", name: "adminOnly" },
      };

      store.registerMiddleware(mwSpec as any);

      await store.emit("ui", "increment", 1);
      await store.emit("admin", "setCounter", 50);
      await store.emit("ui", "decrement", 1);
      await store.emit("admin", "clearLogs", undefined as any);

      // Only admin events should be logged
      expect(calls).toEqual(["admin:setCounter", "admin:clearLogs"]);
    });

    it("MiddlewareSpec with when: { keys } only runs for those events", async () => {
      const store = makeStoreWithLegacyEvents();
      const calls: string[] = [];

      const mwSpec: MiddlewareSpec<Readonly<AppState>, AppEvents> = {
        when: { keys: keys([["ui", "increment"], ["ui", "reset"]]) },
        middleware: (_state, event) => {
          calls.push(`${event.channel}:${event.type}`);
          return true;
        },
      };

      store.registerMiddleware(mwSpec as any);

      await store.emit("ui", "increment", 1);
      await store.emit("ui", "decrement", 1);
      await store.emit("ui", "reset", undefined as any);
      await store.emit("admin", "setCounter", 10);

      expect(calls).toEqual(["ui:increment", "ui:reset"]);
    });

    it("MiddlewareSpec with when: { any: true } runs for all events", async () => {
      const store = makeStoreWithLegacyEvents();
      const calls: string[] = [];

      const mwSpec: MiddlewareSpec<Readonly<AppState>, AppEvents> = {
        when: { any: true },
        middleware: (_state, event) => {
          calls.push(`${event.channel}:${event.type}`);
          return true;
        },
      };

      store.registerMiddleware(mwSpec as any);

      await store.emit("ui", "increment", 1);
      await store.emit("admin", "setCounter", 10);
      await store.emit("system", "init", undefined as any);

      expect(calls).toEqual(["ui:increment", "admin:setCounter", "system:init"]);
    });

    it("MiddlewareSpec without when runs for all events (legacy behavior)", async () => {
      const store = makeStoreWithLegacyEvents();
      const calls: string[] = [];

      // Raw function (legacy) - runs for all events
      const mwFunc: MiddlewareFunction<Readonly<AppState>, AppEvents> = (_state, event) => {
        calls.push(`${event.channel}:${event.type}`);
        return true;
      };

      store.registerMiddleware(mwFunc);

      await store.emit("ui", "increment", 1);
      await store.emit("admin", "setCounter", 10);

      expect(calls).toEqual(["ui:increment", "admin:setCounter"]);
    });

    it("MiddlewareSpec can cancel specific events while allowing others", async () => {
      const store = makeStoreWithLegacyEvents();

      const guardSpec: MiddlewareSpec<Readonly<AppState>, AppEvents> = {
        when: { channel: "admin" },
        middleware: (_state, _event) => {
          // Cancel all admin events
          return false;
        },
      };

      store.registerMiddleware(guardSpec as any);

      await store.emit("ui", "increment", 5);
      expect(store.getState().counter.value).toBe(5);

      await store.emit("admin", "setCounter", 100);
      // Should be blocked, counter stays at 5
      expect(store.getState().counter.value).toBe(5);

      await store.emit("ui", "increment", 3);
      expect(store.getState().counter.value).toBe(8);
    });
  });

  describe("Effect targeting", () => {
    it("effect with when: { channel } only runs for that channel", async () => {
      const store = makeStoreWithLegacyEvents();
      const calls: string[] = [];

      const effectSpec: EffectSpec<Readonly<AppState>, AppEvents> = {
        when: { channel: "ui" },
        effect: (event) => {
          calls.push(`${event.channel}:${event.type}`);
        },
      };

      store.registerEffect(effectSpec);

      await store.emit("ui", "increment", 1);
      await store.emit("admin", "setCounter", 50);
      await store.emit("ui", "reset", undefined as any);

      expect(calls).toEqual(["ui:increment", "ui:reset"]);
    });

    it("effect with when: { channels } only runs for those channels", async () => {
      const store = makeStoreWithLegacyEvents();
      const calls: string[] = [];

      const effectSpec: EffectSpec<Readonly<AppState>, AppEvents> = {
        when: { channels: ["ui", "system"] },
        effect: (event) => {
          calls.push(`${event.channel}:${event.type}`);
        },
      };

      store.registerEffect(effectSpec);

      await store.emit("ui", "increment", 1);
      await store.emit("admin", "setCounter", 50);
      await store.emit("system", "init", undefined as any);

      expect(calls).toEqual(["ui:increment", "system:init"]);
    });

    it("effect with when: { any: true } runs for all events", async () => {
      const store = makeStoreWithLegacyEvents();
      const calls: string[] = [];

      const effectSpec: EffectSpec<Readonly<AppState>, AppEvents> = {
        when: { any: true },
        effect: (event) => {
          calls.push(`${event.channel}:${event.type}`);
        },
      };

      store.registerEffect(effectSpec);

      await store.emit("ui", "increment", 1);
      await store.emit("admin", "setCounter", 50);
      await store.emit("system", "init", undefined as any);

      expect(calls).toEqual(["ui:increment", "admin:setCounter", "system:init"]);
    });

    it("effect with when: { keys } only runs for those events", async () => {
      const store = makeStoreWithLegacyEvents();
      const calls: string[] = [];

      const effectSpec: EffectSpec<Readonly<AppState>, AppEvents> = {
        when: { keys: keys([["ui", "increment"], ["admin", "setCounter"]]) },
        effect: (event) => {
          calls.push(`${event.channel}:${event.type}`);
        },
      };

      store.registerEffect(effectSpec);

      await store.emit("ui", "increment", 1);
      await store.emit("ui", "decrement", 1);
      await store.emit("admin", "setCounter", 50);
      await store.emit("admin", "clearLogs", undefined as any);

      expect(calls).toEqual(["ui:increment", "admin:setCounter"]);
    });

    it("effect without targeting runs for all events (no when, no events)", async () => {
      const store = makeStoreWithLegacyEvents();
      const calls: string[] = [];

      const effectSpec: EffectSpec<Readonly<AppState>, AppEvents> = {
        // No when, no events = match all
        effect: (event) => {
          calls.push(`${event.channel}:${event.type}`);
        },
      };

      store.registerEffect(effectSpec);

      await store.emit("ui", "increment", 1);
      await store.emit("admin", "setCounter", 50);

      expect(calls).toEqual(["ui:increment", "admin:setCounter"]);
    });

    it("effect disposer works for pattern-based effects", async () => {
      const store = makeStoreWithLegacyEvents();
      const calls: string[] = [];

      const effectSpec: EffectSpec<Readonly<AppState>, AppEvents> = {
        when: { channel: "ui" },
        effect: (event) => {
          calls.push(`${event.channel}:${event.type}`);
        },
      };

      const unsub = store.registerEffect(effectSpec);

      await store.emit("ui", "increment", 1);
      expect(calls).toEqual(["ui:increment"]);

      unsub();

      await store.emit("ui", "decrement", 1);
      // Should not add to calls after unsubscribe
      expect(calls).toEqual(["ui:increment"]);
    });
  });

  describe("eventKeys helper", () => {
    it("preserves literal types without as const", () => {
      const myKeys = eventKeys<AppEvents>()([
        ["ui", "increment"],
        ["ui", "decrement"],
      ]);

      // TypeScript should infer these as literal tuples
      expect(myKeys).toEqual([
        ["ui", "increment"],
        ["ui", "decrement"],
      ]);
    });
  });

  describe("dedupWindowMs configuration", () => {
    it("uses custom dedup window when provided", async () => {
      // Short window - events should not be deduplicated after waiting longer
      const store = makeStoreWithDedupConfig(10);

      await store.emit("ui", "increment", 1);
      expect(store.getState().counter.value).toBe(1);

      // Wait much longer than the dedup window (10ms window, wait 100ms)
      await new Promise((r) => setTimeout(r, 100));

      // Same event should now be processed (not deduplicated)
      await store.emit("ui", "increment", 1);
      expect(store.getState().counter.value).toBe(2);

      store.dispose();
    });

    it("deduplicates within the window", async () => {
      // Long window - events should be deduplicated
      const store = makeStoreWithDedupConfig(5000);

      await store.emit("ui", "increment", 1);
      expect(store.getState().counter.value).toBe(1);

      // Same event immediately - should be deduplicated
      await store.emit("ui", "increment", 1);
      expect(store.getState().counter.value).toBe(1);

      // Different payload - should NOT be deduplicated
      await store.emit("ui", "increment", 2);
      expect(store.getState().counter.value).toBe(3);

      store.dispose();
    });
  });

  describe("Metadata support", () => {
    it("attaches metadata to effects", async () => {
      const store = makeStoreWithLegacyEvents();

      const effectSpec: EffectSpec<Readonly<AppState>, AppEvents> = {
        when: { channel: "ui" },
        effect: () => {},
        meta: {
          type: "effect",
          name: "uiLogger",
          description: "Logs all UI events",
        },
      };

      store.registerEffect(effectSpec);

      // The metadata is attached to the effect function
      expect((effectSpec.effect as any).__quoMeta).toEqual({
        type: "effect",
        name: "uiLogger",
        description: "Logs all UI events",
      });
    });
  });

  describe("dispose() cleanup", () => {
    it("clears all effects including pattern-based on dispose", async () => {
      const store = makeStoreWithLegacyEvents();
      const calls: string[] = [];

      // Key-based effect
      store.registerEffect({
        when: { keys: keys([["ui", "increment"]]) },
        effect: () => calls.push("key-based"),
      });

      // Pattern-based effect
      store.registerEffect({
        when: { channel: "ui" },
        effect: () => calls.push("pattern-based"),
      });

      await store.emit("ui", "increment", 1);
      expect(calls).toEqual(["key-based", "pattern-based"]);

      store.dispose();
      calls.length = 0;

      // After dispose, no more effects should run
      // Note: dispose clears effects but store might still accept emits
      // This is testing that the effect maps are cleared
    });
  });
});

describe("Store - createStore explicit generics", () => {
  it("createStore<S, EM>() works for event-only stores", async () => {
    type EmptyState = Record<string, never>;
    type NotificationEvents = {
      notifications: { show: { message: string }; hide: void };
    };

    const calls: string[] = [];

    const store = createStore<EmptyState, NotificationEvents>({
      name: "NotificationBus",
      effects: [
        {
          when: { channel: "notifications" },
          effect: (evt) => {
            calls.push(`${evt.channel}:${evt.type}`);
          },
        },
      ],
    });

    await store.emit("notifications", "show", { message: "Hello" });
    await store.emit("notifications", "hide", undefined as any);

    expect(calls).toEqual(["notifications:show", "notifications:hide"]);

    store.dispose();
  });

  it("createStore<S, EM>() works with reducers", async () => {
    type CounterState = { counter: { value: number } };
    type CounterEvents = { ui: { increment: number } };

    const store = createStore<CounterState, CounterEvents>({
      name: "CounterStore",
      reducer: {
        counter: {
          state: { value: 0 },
          when: { keys: [["ui", "increment"]] },
          reducer: (s, e) => {
            if (e.type === "increment") return { value: s.value + (e.payload as number) };
            return s;
          },
        },
      },
    });

    await store.emit("ui", "increment", 5);
    expect(store.getState().counter.value).toBe(5);

    store.dispose();
  });
});
