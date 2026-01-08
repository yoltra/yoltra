import { describe, it, expect } from "vitest";
import { Store, typedEvents, typedActions } from "../../src/store/Store";
import type { EventKey, EventMapBase } from "../../src/types";

describe("Store.buildAncestorPaths", () => {
  it("builds ancestor paths for a dotted path", () => {
    expect(Store.buildAncestorPaths("a.b.c")).toEqual(["a", "a.b", "a.b.c"]);
    expect(Store.buildAncestorPaths(".x.y")).toEqual(["x", "x.y"]);
    expect(Store.buildAncestorPaths("")).toEqual([]);
  });
});

describe("typedEvents / typedActions", () => {
  type EM = {
    ui: { increment: number; decrement: number };
    data: { loaded: { items: string[] } };
  };

  it("maps event names to EventKey tuples at runtime", () => {
    const makeEvents = typedEvents<EM>([]);
    const keys = makeEvents("ui", ["increment", "decrement"] as const);

    const expected: ReadonlyArray<EventKey<EM>> = [
      ["ui", "increment"],
      ["ui", "decrement"],
    ];

    expect(keys).toEqual(expected);
  });

  it("typedActions is an alias of typedEvents", () => {
    const makeEvents = typedEvents<EM>([]);
    const makeActions = typedActions<EM>([]);

    const eventsKeys = makeEvents("data", ["loaded"] as const);
    const actionKeys = makeActions("data", ["loaded"] as const);

    expect(actionKeys).toEqual(eventsKeys);
  });
});
