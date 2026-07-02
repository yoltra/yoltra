import { describe, it, expect } from "vitest";

import { computePatches, getAtPath, patchesFromChange } from "../src/patch-utils";

describe("patch-utils", () => {
  describe("patchesFromChange", () => {
    it("emits replace ops for changed leaf values (dotted paths -> JSON pointers)", () => {
      const patches = patchesFromChange(
        ["counter.value", "todos.items.0.title"],
        { "counter.value": 1, "todos.items.0.title": "A" },
        { "counter.value": 2, "todos.items.0.title": "A2" },
      );
      expect(patches).toEqual([
        { op: "replace", path: "/counter/value", value: 2 },
        { op: "replace", path: "/todos/items/0/title", value: "A2" },
      ]);
    });

    it("emits add for new paths and remove for deleted paths", () => {
      const patches = patchesFromChange(
        ["a.added", "a.removed"],
        { "a.removed": "gone" },
        { "a.added": "new" },
      );
      expect(patches).toEqual([
        { op: "add", path: "/a/added", value: "new" },
        { op: "remove", path: "/a/removed" },
      ]);
    });

    it("returns an empty patch set when nothing changed", () => {
      expect(patchesFromChange([], {}, {})).toEqual([]);
    });
  });

  describe("computePatches", () => {
    it("diffs full prev/next states along dotted paths", () => {
      const prev = { counter: { value: 1 } };
      const next = { counter: { value: 2 } };
      expect(computePatches(prev, next, ["counter.value"])).toEqual([
        { op: "replace", path: "/counter/value", value: 2 },
      ]);
    });
  });

  describe("getAtPath", () => {
    it("reads nested values and returns undefined for unreachable paths", () => {
      expect(getAtPath({ a: { b: 1 } }, "a.b")).toBe(1);
      expect(getAtPath({ a: null }, "a.b.c")).toBeUndefined();
      expect(getAtPath({ x: 1 }, "")).toEqual({ x: 1 });
    });
  });
});
