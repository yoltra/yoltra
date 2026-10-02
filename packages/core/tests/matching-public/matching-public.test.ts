import { describe, expect, it } from "vitest";

import { createStore, describeWhenProblem, matchesWhen } from "../../src/index";
import type { InstrumentedEvent } from "../../src/index";

/**
 * `matchesWhen` and `describeWhenProblem` are the store's own matcher and validator, exported so
 * code that filters by a `When` gets the store's semantics instead of a copy that can drift.
 */

type EM = { orders: { created: null; paid: null }; billing: { charged: null }; misc: { x: null } };

const ev = (channel: string, type: string) => ({ channel, type });

describe("matchesWhen", () => {
  it("covers every form, as the store applies them", () => {
    expect(matchesWhen(undefined, ev("misc", "x"))).toBe(true);
    expect(matchesWhen({ any: true }, ev("misc", "x"))).toBe(true);
    expect(matchesWhen<EM>({ keys: [["orders", "paid"]] }, ev("orders", "paid") as never)).toBe(true);
    expect(matchesWhen<EM>({ keys: [["orders", "paid"]] }, ev("orders", "created") as never)).toBe(false);
    expect(matchesWhen({ channel: "orders" }, ev("orders", "created"))).toBe(true);
    expect(matchesWhen({ channels: ["orders", "billing"] }, ev("billing", "charged"))).toBe(true);
    expect(matchesWhen({ channels: ["orders"] }, ev("misc", "x"))).toBe(false);
  });

  it("applies channelPattern as middleware does, including namespaced channels", () => {
    expect(matchesWhen({ channelPattern: "*::orders" }, ev("peer-1::orders", "created"))).toBe(true);
    expect(matchesWhen({ channelPattern: "*orders" }, ev("orders", "created"))).toBe(true);
    expect(matchesWhen({ channelPattern: "*::orders" }, ev("orders", "created"))).toBe(false);
  });

  it("agrees with the store about which events a middleware sees", async () => {
    const when = { channels: ["orders"] } as const;
    const seenByStore: string[] = [];
    const store = createStore<Record<string, never>, EM>({
      name: "Match",
      middleware: [{ when, middleware: (_s, e) => void seenByStore.push(`${e.channel}/${e.type}`) }],
    });
    const seenByFilter: string[] = [];
    store.instrument((info: InstrumentedEvent) => {
      // An instrumented event's `event` is accepted as is.
      if (matchesWhen(when, info.event)) seenByFilter.push(`${info.event.channel}/${info.event.type}`);
    });

    await store.emit("orders", "created", null);
    await store.emit("billing", "charged", null);
    await store.emit("orders", "paid", null);

    expect(seenByFilter).toEqual(seenByStore);
    expect(seenByFilter).toEqual(["orders/created", "orders/paid"]);
  });
});

describe("describeWhenProblem", () => {
  it("returns the store's own refusal, or undefined for a well-formed matcher", () => {
    expect(describeWhenProblem({ channels: ["a"] }, "reducer")).toBeUndefined();
    expect(describeWhenProblem(undefined, "effect")).toBeUndefined();
    expect(describeWhenProblem({ channelPattern: "*" }, "middleware")).toBeUndefined();
    expect(describeWhenProblem({ channelPattern: "*" }, "effect")).toMatch(/an effect takes/);
    expect(describeWhenProblem({ any: false }, "middleware")).toEqual(expect.any(String));
  });
});
