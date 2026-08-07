/**
 * The last uncovered branches on the way to the 95% floor, each a real behaviour:
 * a throwing pattern handler must not silence its neighbours, `off` on nothing must be a
 * no-op, a throwing migration reports and restores nothing, and a reducer with no targeting
 * at all hears every event.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { createStore, hydrate } from "../../src/index";
import type { ReducerSpec } from "../../src/index";
import { EventBus } from "../../src/eventBus/EventBus";
import { LooseEventBus } from "../../src/eventBus/LooseEventBus";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("a throwing pattern handler", () => {
  it("is logged and does not silence the pattern handlers after it", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const bus = new LooseEventBus<string, string, unknown>();
    const seen: string[] = [];

    bus.on("state", "todos.*", () => {
      throw new Error("pattern handler misbehaves");
    });
    bus.on("state", "todos.*", () => {
      seen.push("second pattern still runs");
    });

    bus.emit("state", "todos.1", {});

    expect(seen).toEqual(["second pattern still runs"]);
    expect(error).toHaveBeenCalled();
  });
});

describe("EventBus.off on subscriptions that do not exist", () => {
  it("is a no-op for an unknown channel and an unknown type alike", () => {
    type EM = { ui: { ping: null } };
    const bus = new EventBus<EM>();
    const handler = (): void => undefined;

    // Unknown channel: no handler map at all.
    expect(() => bus.off("ui", "ping", handler)).not.toThrow();

    // Known channel, unknown type: a map exists but holds no such set.
    bus.on("ui", "ping", handler);
    expect(() => bus.off("ui", "pong" as never, handler)).not.toThrow();
    bus.off("ui", "ping", handler);
  });
});

describe("a migration that throws", () => {
  it("reports through onError and restores nothing", async () => {
    const onError = vi.fn();
    const stored = JSON.stringify({ version: 1, slices: { counter: { n: 1 } } });

    const hydration = await hydrate({
      key: "app",
      version: 2,
      adapter: { read: () => stored, write: () => undefined, remove: () => undefined },
      migrate: () => {
        throw new Error("cannot lift version 1");
      },
      onError,
    });

    expect(hydration.restored).toBe(false);
    expect(hydration.slices).toEqual({});
    expect(onError).toHaveBeenCalledWith(expect.any(Error), "migrate");
  });
});

describe("a reducer with no targeting at all", () => {
  it("hears every event, which is what no targeting means", async () => {
    const tally: ReducerSpec<{ seen: number }, { a: { x: null }; b: { y: null } }> = {
      state: { seen: 0 },
      reducer: (s) => ({ seen: s.seen + 1 }),
    };
    const store = createStore<{ tally: { seen: number } }, { a: { x: null }; b: { y: null } }>({
      name: "untargeted",
      reducer: { tally },
    });

    await store.emit("a", "x", null);
    await store.emit("b", "y", null);

    expect(store.getState().tally.seen).toBe(2);
  });
});
