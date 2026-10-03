import { describe, it, expect } from "vitest";
import { Store, createStore, typedEvents } from "../../src/store/Store";
import { defineEffect, defineMiddleware, defineSlice, eventKeys } from "../../src/types";
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

describe("spec builders (defineSlice / defineMiddleware / defineEffect)", () => {
  // These exist for their return *type*: they park the event map a decoration contributes in
  // a value position, which is the only place TypeScript can infer it from. At runtime they
  // must do nothing at all, and these tests pin that.
  type LibEM = { "lib.flag": { enabled: { id: string } } };

  it("returns the very same spec object, not a copy", () => {
    const spec = {
      state: { enabled: [] as string[] },
      when: { keys: eventKeys<LibEM>()([["lib.flag", "enabled"]]) },
      reducer: (s: { enabled: string[] }) => s,
    };

    expect(defineSlice<LibEM>()(spec)).toBe(spec);
  });

  it("adds no runtime property, so the brand cannot leak into state or the wire", () => {
    // The brand is a phantom. If it were ever assigned, it would show up in
    // `Object.keys`, in a devtools snapshot, and in anything that serializes a spec.
    const before = {
      state: { n: 0 },
      when: { any: true as const },
      reducer: (s: { n: number }) => s,
    };
    const after = defineSlice<LibEM>()(before);

    expect(Object.keys(after)).toEqual(["state", "when", "reducer"]);
    expect("~yoltraEventMap" in after).toBe(false);
  });

  it("is identity for middleware and effect specs too", () => {
    const mw = { when: { any: true as const }, middleware: () => true };
    const fx = { when: { any: true as const }, effect: async () => {} };

    expect(defineMiddleware<LibEM>()(mw)).toBe(mw);
    expect(defineEffect<LibEM>()(fx)).toBe(fx);
    expect(Object.keys(defineEffect<LibEM>()(fx))).toEqual(["when", "effect"]);
  });

  it("leaves a built spec usable by a real store", () => {
    // The point of the builders is that the spec they return is an ordinary spec. If the
    // brand ever became real, this would break.
    const slice = defineSlice<LibEM>()({
      state: { enabled: [] as string[] },
      when: { keys: [["lib.flag", "enabled"]] },
      reducer: (s, e) =>
        e.type === "enabled" ? { enabled: [...s.enabled, e.payload.id] } : s,
    });

    const store = createStore({
      name: "BuilderStore",
      reducer: { flags: slice },
    });

    return store.emit("lib.flag", "enabled", { id: "a1" }).then(() => {
      expect(store.getState().flags.enabled).toEqual(["a1"]);
    });
  });
});
