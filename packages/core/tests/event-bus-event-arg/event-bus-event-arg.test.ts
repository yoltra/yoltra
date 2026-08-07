import { describe, it, expect, vi } from "vitest";

import { EventBus } from "../../src/eventBus/EventBus";
import type { Event } from "../../src/types";

type EM = {
  ui: { toggle: boolean };
  data: { loaded: { items: string[] } };
};

describe("EventBus - optional source event argument", () => {
  it("forwards the source event to handlers that ask for it", () => {
    const bus = new EventBus<EM>();
    const seen: Array<Event<EM, "ui", "toggle"> | undefined> = [];

    bus.on("ui", "toggle", (_payload, event) => seen.push(event));

    const source: Event<EM, "ui", "toggle"> = {
      channel: "ui",
      type: "toggle",
      payload: true,
      id: "evt-1",
    };
    bus.emit("ui", "toggle", true, source);

    expect(seen).toHaveLength(1);
    expect(seen[0]).toBe(source);
    expect(seen[0]!.id).toBe("evt-1");
  });

  it("passes undefined when the emitter supplies no event", () => {
    const bus = new EventBus<EM>();
    const seen: Array<Event<EM, "ui", "toggle"> | undefined> = [];

    bus.on("ui", "toggle", (_payload, event) => seen.push(event));
    bus.emit("ui", "toggle", false);

    expect(seen).toEqual([undefined]);
  });

  it("keeps single-argument handlers working unchanged", () => {
    const bus = new EventBus<EM>();
    const payloads: boolean[] = [];

    // The pre-existing handler shape: declares only `payload`.
    bus.on("ui", "toggle", (payload) => payloads.push(payload));

    bus.emit("ui", "toggle", true, {
      channel: "ui",
      type: "toggle",
      payload: true,
      id: "evt-2",
    });
    bus.emit("ui", "toggle", false);

    expect(payloads).toEqual([true, false]);
  });

  it("delivers payload and event to every subscriber in order", () => {
    const bus = new EventBus<EM>();
    const calls: string[] = [];

    bus.on("data", "loaded", (payload, event) =>
      calls.push(`first:${payload.items.length}:${event?.id ?? "none"}`),
    );
    bus.on("data", "loaded", (payload, event) =>
      calls.push(`second:${payload.items.length}:${event?.id ?? "none"}`),
    );

    bus.emit("data", "loaded", { items: ["a", "b"] }, {
      channel: "data",
      type: "loaded",
      payload: { items: ["a", "b"] },
      id: "evt-3",
    });

    expect(calls).toEqual(["first:2:evt-3", "second:2:evt-3"]);
  });

  it("still removes handlers by identity via off() and the returned unsubscribe", () => {
    const bus = new EventBus<EM>();
    const viaOff: string[] = [];
    const viaUnsub: string[] = [];

    const handler = (_payload: boolean, event?: Event<EM, "ui", "toggle">) =>
      viaOff.push(event?.id ?? "none");
    bus.on("ui", "toggle", handler);
    const unsubscribe = bus.on("ui", "toggle", (_payload, event) =>
      viaUnsub.push(event?.id ?? "none"),
    );

    bus.off("ui", "toggle", handler);
    unsubscribe();

    bus.emit("ui", "toggle", true, {
      channel: "ui",
      type: "toggle",
      payload: true,
      id: "evt-4",
    });

    expect(viaOff).toEqual([]);
    expect(viaUnsub).toEqual([]);
  });

  it("isolates a throwing handler so later ones still receive the event", () => {
    const bus = new EventBus<EM>();
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const seen: string[] = [];

    bus.on("ui", "toggle", () => {
      throw new Error("boom");
    });
    bus.on("ui", "toggle", (_payload, event) => seen.push(event?.id ?? "none"));

    bus.emit("ui", "toggle", true, {
      channel: "ui",
      type: "toggle",
      payload: true,
      id: "evt-5",
    });

    expect(seen).toEqual(["evt-5"]);
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });
});
