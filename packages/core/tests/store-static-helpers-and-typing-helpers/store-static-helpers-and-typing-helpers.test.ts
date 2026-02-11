import { describe, it, expect } from "vitest";
import { Store, typedEvents } from "../../src/store/Store";
import type { EventKey } from "../../src/types";

describe("Store.buildAncestorPaths", () => {
  it("builds ancestor paths for a dotted path", () => {
    expect(Store.buildAncestorPaths("a.b.c")).toEqual(["a", "a.b", "a.b.c"]);
    expect(Store.buildAncestorPaths(".x.y")).toEqual(["x", "x.y"]);
    expect(Store.buildAncestorPaths("")).toEqual([]);
  });
});

describe("typedEvents", () => {
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

  it("works with different channels", () => {
    const makeEvents = typedEvents<EM>([]);

    const uiKeys = makeEvents("ui", ["increment"] as const);
    const dataKeys = makeEvents("data", ["loaded"] as const);

    expect(uiKeys).toEqual([["ui", "increment"]]);
    expect(dataKeys).toEqual([["data", "loaded"]]);
  });
});
