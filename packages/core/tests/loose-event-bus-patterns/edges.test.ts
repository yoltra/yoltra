/**
 * The bus's less-travelled edges: a handler that throws must not silence its neighbours, an
 * unsubscribe must be safe against paths the index no longer holds, and the DevTools
 * introspection must list pattern subscriptions alongside exact ones.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { LooseEventBus } from "../../src/eventBus/LooseEventBus";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("delivery in the face of a throwing handler", () => {
  it("logs the throw and still calls the handlers after it", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const bus = new LooseEventBus<string, string, unknown>();
    const seen: string[] = [];

    bus.on("state", "changed", () => {
      throw new Error("first handler misbehaves");
    });
    bus.on("state", "changed", () => {
      seen.push("second still runs");
    });

    bus.emit("state", "changed", {});

    expect(seen).toEqual(["second still runs"]);
    expect(error).toHaveBeenCalled();
  });
});

describe("pattern unsubscription edges", () => {
  it("survives unsubscribing a wildcard-head pattern, twice", () => {
    const bus = new LooseEventBus<string, string, unknown>();
    const handler = (): void => undefined;

    const off = bus.on("state", "*.value", handler);
    off();
    // The second call finds no bucket to clean; the point is that it does not throw.
    expect(() => bus.off("state", "*.value", handler)).not.toThrow();
  });

  it("survives unsubscribing from a channel that never had patterns", () => {
    const bus = new LooseEventBus<string, string, unknown>();
    expect(() => bus.off("ghost", "a.*", () => undefined)).not.toThrow();
  });
});

describe("__introspect", () => {
  it("lists exact and pattern subscriptions with their counts", () => {
    const bus = new LooseEventBus<string, string, unknown>();
    bus.on("state", "changed", () => undefined);
    bus.on("state", "changed", () => undefined);
    bus.on("state", "todos.*.title", () => undefined);

    const summary = bus.__introspect();

    expect(summary).toContainEqual({ channel: "state", type: "changed", count: 2 });
    expect(summary).toContainEqual({ channel: "state", type: "todos.*.title", count: 1 });
  });
});
