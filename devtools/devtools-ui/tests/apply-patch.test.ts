import { describe, it, expect } from "vitest";

import type { JsonPatch } from "@yoltra/devtools-protocol";

import { applyPatches } from "../src/utils/apply-patch";

describe("applyPatches array semantics (DEV-6)", () => {
  it("inserts into an array for an add op instead of overwriting (RFC 6902)", () => {
    const state = { list: ["a", "b", "c"] };
    const patches: JsonPatch[] = [{ op: "add", path: "/list/1", value: "X" }];
    const next = applyPatches(state, patches) as { list: string[] };
    expect(next.list).toEqual(["a", "X", "b", "c"]);
  });

  it("appends for the '-' end-of-array token on add", () => {
    const state = { list: ["a"] };
    const patches: JsonPatch[] = [{ op: "add", path: "/list/-", value: "b" }];
    const next = applyPatches(state, patches) as { list: string[] };
    expect(next.list).toEqual(["a", "b"]);
  });

  it("replace overwrites an array index (not insert)", () => {
    const state = { list: ["a", "b"] };
    const patches: JsonPatch[] = [{ op: "replace", path: "/list/0", value: "Z" }];
    const next = applyPatches(state, patches) as { list: string[] };
    expect(next.list).toEqual(["Z", "b"]);
  });

  it("add on an object member sets it (add-or-replace)", () => {
    const state = { obj: { a: 1 } };
    const patches: JsonPatch[] = [{ op: "add", path: "/obj/b", value: 2 }];
    const next = applyPatches(state, patches) as { obj: Record<string, number> };
    expect(next.obj).toEqual({ a: 1, b: 2 });
  });
});

describe("applyPatches: cost and identity", () => {
  it("leaves untouched subtrees at the same reference", () => {
    const state = {
      counter: { value: 0 },
      // Standing in for the rest of an application's state: none of it is involved in the
      // patch below, and none of it should be rebuilt because of it.
      catalog: { items: [{ id: 1 }, { id: 2 }], meta: { loadedAt: "t" } },
    };

    const next = applyPatches(state, [{ op: "replace", path: "/counter/value", value: 1 }]);

    // Deep-cloning first made every subtree new, so the panel's memoization saw the whole store
    // change on every event and re-rendered the entire state view for a one-field update.
    expect(next.catalog).toBe(state.catalog);
    expect(next.catalog.items).toBe(state.catalog.items);
    expect(next.counter).not.toBe(state.counter);
    expect(next.counter.value).toBe(1);
  });

  it("still does not mutate the value it was given", () => {
    const state = { a: { b: 1 }, list: [1, 2] };
    const snapshot = JSON.stringify(state);

    applyPatches(state, [
      { op: "replace", path: "/a/b", value: 9 },
      { op: "add", path: "/list/0", value: 0 },
      { op: "remove", path: "/list/2" },
    ]);

    // The clone was doing no work the immutable helpers were not already doing.
    expect(JSON.stringify(state)).toBe(snapshot);
  });

  it("carries values the old clone could not", () => {
    // `structuredClone` throws on a function anywhere in the tree. State reaches the panel
    // encoded now, but the patch applier should not be the thing that decides what is
    // representable — it is copying references, not serializing them.
    const state = { keep: () => "kept", n: 1 };

    const next = applyPatches(state, [{ op: "replace", path: "/n", value: 2 }]);

    expect(next.keep()).toBe("kept");
    expect(next.n).toBe(2);
  });
});
