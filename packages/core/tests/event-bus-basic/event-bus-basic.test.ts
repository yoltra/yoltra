import { describe, it, expect, vi, beforeEach } from "vitest";

import { EventBus } from "../../src/eventBus/EventBus";

type EM = {
  ui: { toggle: boolean; label: string };
  data: { loaded: { items: string[] } };
};

describe("EventBus - basic behaviour", () => {
  let bus: EventBus<EM>;

  beforeEach(() => {
    bus = new EventBus<EM>();
  });

  it("invokes handlers for exact (channel, type) in subscription order", () => {
    const calls: Array<string> = [];

    bus.on("ui", "toggle", (payload) => {
      calls.push(`h1:${payload}`);
    });
    bus.on("ui", "toggle", (payload) => {
      calls.push(`h2:${payload}`);
    });
    bus.on("ui", "label", (payload) => {
      calls.push(`label:${payload}`);
    });

    bus.emit("ui", "toggle", true);
    bus.emit("ui", "label", "x");
    bus.emit("data", "loaded", { items: ["a"] });

    expect(calls).toEqual(["h1:true", "h2:true", "label:x"]);
  });

  it("unsubscribe function returned by on removes handler", () => {
    const calls: string[] = [];

    const h1 = (payload: boolean) => {
      calls.push(`h1:${payload}`);
    };
    const h2 = (payload: boolean) => {
      calls.push(`h2:${payload}`);
    };

    const off1 = bus.on("ui", "toggle", h1);
    bus.on("ui", "toggle", h2);

    bus.emit("ui", "toggle", true);
    off1();
    bus.emit("ui", "toggle", false);

    expect(calls).toEqual(["h1:true", "h2:true", "h2:false"]);
  });

  it("off removes only specified handler and cleans empty maps", () => {
    const calls: string[] = [];
    const h1 = (payload: boolean) => calls.push(`h1:${payload}`);
    const h2 = (payload: boolean) => calls.push(`h2:${payload}`);

    bus.on("ui", "toggle", h1);
    bus.on("ui", "toggle", h2);

    bus.off("ui", "toggle", h1);
    bus.emit("ui", "toggle", true);

    expect(calls).toEqual(["h2:true"]);

    bus.off("ui", "toggle", h2);
    // nothing should happen; internal map for ('ui','toggle') should be gone
    bus.emit("ui", "toggle", false);
    expect(calls).toEqual(["h2:true"]);
  });

  it("emit is a no-op when there are no handlers", () => {
    expect(() => {
      bus.emit("ui", "toggle", true);
      bus.emit("data", "loaded", { items: [] });
    }).not.toThrow();
  });

  it("error in one handler is logged and does not stop other handlers", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const calls: string[] = [];

    bus.on("ui", "toggle", () => {
      throw new Error("boom");
    });
    bus.on("ui", "toggle", (payload) => {
      calls.push(`ok:${payload}`);
    });

    bus.emit("ui", "toggle", true);

    expect(calls).toEqual(["ok:true"]);
    expect(errorSpy).toHaveBeenCalledTimes(1);

    errorSpy.mockRestore();
  });

  it("clear removes all handlers", () => {
    const calls: string[] = [];
    bus.on("ui", "toggle", (p) => calls.push(String(p)));
    bus.on("data", "loaded", () => calls.push("loaded"));

    bus.clear();
    bus.emit("ui", "toggle", true);
    bus.emit("data", "loaded", { items: [] });

    expect(calls).toEqual([]);
  });
});
