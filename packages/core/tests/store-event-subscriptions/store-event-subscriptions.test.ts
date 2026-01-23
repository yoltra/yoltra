import { describe, it, expect, vi } from "vitest";

import type { EventSubscriptionHandler, EffectSpec } from "../../src/types";
import {
  makeStore,
  makeStoreWithBlockingMiddleware,
  AppState,
  AppEvents,
} from "./support/setupStore";

describe("Store - event subscriptions", () => {
  describe("committed event subscriptions", () => {
    it("receives events after reducers when event passes middleware", async () => {
      const store = makeStore();
      const calls: Array<{ payload: number; stateValue: number }> = [];

      store.onEvent("ui", "increment", (event, getState, _emit, phase) => {
        calls.push({
          payload: event.payload as number,
          stateValue: getState().counter.value,
        });
        expect(phase).toBe("committed");
      });

      await store.emit("ui", "increment", 5);
      await store.emit("ui", "increment", 3);

      expect(calls).toEqual([
        { payload: 5, stateValue: 5 }, // State already updated by reducer
        { payload: 3, stateValue: 8 },
      ]);
    });

    it("uses 'committed' as default phase", async () => {
      const store = makeStore();
      const handler = vi.fn();

      // No phase specified - should default to 'committed'
      store.onEvent("ui", "increment", handler);

      await store.emit("ui", "increment", 1);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ channel: "ui", type: "increment", payload: 1 }),
        expect.any(Function),
        expect.any(Function),
        "committed",
      );
    });

    it("does not receive uncommitted (rejected) events", async () => {
      const store = makeStoreWithBlockingMiddleware();
      const handler = vi.fn();

      store.onEvent("ui", "blocked", handler, "committed");

      await store.emit("ui", "blocked", null);

      expect(handler).not.toHaveBeenCalled();
    });

    it("is called before effects", async () => {
      const store = makeStore();
      const order: string[] = [];

      const effect: EffectSpec<Readonly<AppState>, AppEvents> = {
        events: [["ui", "increment"]],
        effect: async () => {
          order.push("effect");
        },
      };
      store.registerEffect(effect);

      store.onEvent("ui", "increment", () => {
        order.push("event-subscription");
      });

      await store.emit("ui", "increment", 1);

      expect(order).toEqual(["event-subscription", "effect"]);
    });
  });

  describe("uncommitted event subscriptions", () => {
    it("receives events rejected by middleware", async () => {
      const store = makeStoreWithBlockingMiddleware();
      const calls: Array<{ type: string; phase: string }> = [];

      store.onEvent(
        "ui",
        "blocked",
        (event, _getState, _emit, phase) => {
          calls.push({ type: event.type as string, phase });
        },
        "uncommitted",
      );

      await store.emit("ui", "blocked", null);

      expect(calls).toEqual([{ type: "blocked", phase: "uncommitted" }]);
    });

    it("does not receive committed events", async () => {
      const store = makeStore();
      const handler = vi.fn();

      store.onEvent("ui", "increment", handler, "uncommitted");

      await store.emit("ui", "increment", 5);

      expect(handler).not.toHaveBeenCalled();
    });

    it("has access to current state (unchanged since event was rejected)", async () => {
      const store = makeStoreWithBlockingMiddleware();

      // First, set some state
      await store.emit("ui", "increment", 10);
      expect(store.getState().counter.value).toBe(10);

      let capturedState: number | undefined;
      store.onEvent(
        "ui",
        "blocked",
        (_event, getState) => {
          capturedState = getState().counter.value;
        },
        "uncommitted",
      );

      await store.emit("ui", "blocked", null);

      // State should be unchanged since event was rejected
      expect(capturedState).toBe(10);
      expect(store.getState().counter.value).toBe(10);
    });
  });

  describe("'all' event subscriptions", () => {
    it("receives both committed and uncommitted events", async () => {
      const store = makeStoreWithBlockingMiddleware();
      const calls: Array<{ type: string; phase: string }> = [];

      store.onEvent(
        "ui",
        "increment",
        (event, _getState, _emit, phase) => {
          calls.push({ type: event.type as string, phase });
        },
        "all",
      );

      store.onEvent(
        "ui",
        "blocked",
        (event, _getState, _emit, phase) => {
          calls.push({ type: event.type as string, phase });
        },
        "all",
      );

      await store.emit("ui", "increment", 5); // committed
      await store.emit("ui", "blocked", null); // uncommitted

      expect(calls).toEqual([
        { type: "increment", phase: "committed" },
        { type: "blocked", phase: "uncommitted" },
      ]);
    });

    it("receives correct phase parameter", async () => {
      const store = makeStoreWithBlockingMiddleware();
      const phases: string[] = [];

      store.onEvent(
        "ui",
        "increment",
        (_event, _getState, _emit, phase) => {
          phases.push(phase);
        },
        "all",
      );

      store.onEvent(
        "ui",
        "dangerous",
        (_event, _getState, _emit, phase) => {
          phases.push(phase);
        },
        "all",
      );

      await store.emit("ui", "increment", 1);
      await store.emit("ui", "dangerous", null);

      expect(phases).toEqual(["committed", "uncommitted"]);
    });
  });

  describe("handler parameters", () => {
    it("receives the full event object", async () => {
      const store = makeStore();
      let capturedEvent: any;

      store.onEvent("ui", "increment", (event) => {
        capturedEvent = event;
      });

      await store.emit("ui", "increment", 42);

      expect(capturedEvent).toMatchObject({
        channel: "ui",
        type: "increment",
        payload: 42,
      });
      expect(typeof capturedEvent.id).toBe("symbol");
    });

    it("receives working getState function", async () => {
      const store = makeStore();
      let stateValue: number | undefined;

      store.onEvent("ui", "increment", (_event, getState) => {
        stateValue = getState().counter.value;
      });

      await store.emit("ui", "increment", 7);

      expect(stateValue).toBe(7);
    });

    it("receives working emit function", async () => {
      const store = makeStore();

      store.onEvent("ui", "increment", async (_event, _getState, emit) => {
        // Emit another event from the subscription handler
        await emit("ui", "decrement", 1);
      });

      await store.emit("ui", "increment", 10);

      // 10 - 1 = 9
      expect(store.getState().counter.value).toBe(9);
    });
  });

  describe("unsubscribe", () => {
    it("removes the handler when unsubscribe is called", async () => {
      const store = makeStore();
      const handler = vi.fn();

      const unsubscribe = store.onEvent("ui", "increment", handler);

      await store.emit("ui", "increment", 1);
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();

      await store.emit("ui", "increment", 2);
      expect(handler).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    it("can unsubscribe from uncommitted subscriptions", async () => {
      const store = makeStoreWithBlockingMiddleware();
      const handler = vi.fn();

      const unsubscribe = store.onEvent("ui", "blocked", handler, "uncommitted");

      await store.emit("ui", "blocked", null);
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();

      await store.emit("ui", "blocked", null);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("can unsubscribe from 'all' subscriptions", async () => {
      const store = makeStore();
      const handler = vi.fn();

      const unsubscribe = store.onEvent("ui", "increment", handler, "all");

      await store.emit("ui", "increment", 1);
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();

      await store.emit("ui", "increment", 2);
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("multiple subscribers", () => {
    it("calls all subscribers for the same event", async () => {
      const store = makeStore();
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      store.onEvent("ui", "increment", handler1);
      store.onEvent("ui", "increment", handler2);
      store.onEvent("ui", "increment", handler3);

      await store.emit("ui", "increment", 5);

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).toHaveBeenCalledTimes(1);
    });

    it("phase-specific and 'all' subscribers both receive the event", async () => {
      const store = makeStore();
      const committedHandler = vi.fn();
      const allHandler = vi.fn();

      store.onEvent("ui", "increment", committedHandler, "committed");
      store.onEvent("ui", "increment", allHandler, "all");

      await store.emit("ui", "increment", 1);

      expect(committedHandler).toHaveBeenCalledTimes(1);
      expect(allHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe("error handling", () => {
    it("logs error but continues to other subscribers", async () => {
      const store = makeStore();
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const goodHandler = vi.fn();

      store.onEvent("ui", "increment", () => {
        throw new Error("subscription boom");
      });
      store.onEvent("ui", "increment", goodHandler);

      await store.emit("ui", "increment", 1);

      expect(errorSpy).toHaveBeenCalledWith(
        "Event subscription error:",
        expect.any(Error),
      );
      expect(goodHandler).toHaveBeenCalledTimes(1);

      errorSpy.mockRestore();
    });

    it("error in 'all' subscriber does not affect phase-specific subscribers", async () => {
      const store = makeStore();
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const committedHandler = vi.fn();

      // Register committed handler first
      store.onEvent("ui", "increment", committedHandler, "committed");

      // Register 'all' handler that throws
      store.onEvent(
        "ui",
        "increment",
        () => {
          throw new Error("all subscription boom");
        },
        "all",
      );

      await store.emit("ui", "increment", 1);

      // Committed handler should still be called (runs before 'all')
      expect(committedHandler).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalled();

      errorSpy.mockRestore();
    });
  });

  describe("cross-notification isolation", () => {
    it("committed subscribers do not receive uncommitted events", async () => {
      const store = makeStoreWithBlockingMiddleware();
      const committedHandler = vi.fn();

      store.onEvent("ui", "blocked", committedHandler, "committed");

      await store.emit("ui", "blocked", null); // Will be rejected

      expect(committedHandler).not.toHaveBeenCalled();
    });

    it("uncommitted subscribers do not receive committed events", async () => {
      const store = makeStore();
      const uncommittedHandler = vi.fn();

      store.onEvent("ui", "increment", uncommittedHandler, "uncommitted");

      await store.emit("ui", "increment", 5); // Will be committed

      expect(uncommittedHandler).not.toHaveBeenCalled();
    });
  });

  describe("async handlers", () => {
    it("awaits async handlers", async () => {
      const store = makeStore();
      const order: string[] = [];

      store.onEvent("ui", "increment", async () => {
        order.push("handler-start");
        await new Promise((resolve) => setTimeout(resolve, 10));
        order.push("handler-end");
      });

      await store.emit("ui", "increment", 1);

      expect(order).toEqual(["handler-start", "handler-end"]);
    });
  });
});
