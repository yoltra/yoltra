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

describe("applyPatches: a pointer is attacker-chosen", () => {
  // Patches arrive from a peer store or hub, so the path is not ours. A segment that walks
  // the prototype chain must be dropped, not followed: one `add` to `/__proto__/isAdmin`
  // would otherwise land on every object in the panel's process.
  const poisoned = ["__proto__", "constructor", "prototype"];

  it("drops a write through a prototype-chain segment", () => {
    for (const key of poisoned) {
      const next = applyPatches({ safe: 1 }, [
        { op: "add", path: `/${key}/polluted`, value: true },
      ]) as Record<string, any>;

      expect(next[key]?.polluted).toBeUndefined();
      expect(next.safe).toBe(1);
    }

    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(Object.prototype, "polluted")).toBe(false);
  });

  it("drops a remove through one too", () => {
    for (const key of poisoned) {
      const next = applyPatches({ safe: 1 }, [{ op: "remove", path: `/${key}/toString` }]);
      expect(next.safe).toBe(1);
    }

    expect(typeof ({} as Record<string, unknown>).toString).toBe("function");
  });
});

describe("applyPatches: RFC 6901 pointer decoding", () => {
  it("reads ~1 as / and ~0 as ~", () => {
    // A slice keyed by a URL or a dotted name arrives escaped. Decoding it wrong writes a
    // brand-new key beside the real one and the panel shows a slice that never updates.
    const state = { "a/b": 0, "c~d": 0 };

    const next = applyPatches(state, [
      { op: "replace", path: "/a~1b", value: 1 },
      { op: "replace", path: "/c~0d", value: 2 },
    ]);

    expect(next["a/b"]).toBe(1);
    expect(next["c~d"]).toBe(2);
    expect(Object.keys(next)).toEqual(["a/b", "c~d"]);
  });

  it("treats the empty pointer as the whole document", () => {
    expect(applyPatches({ old: true }, [{ op: "replace", path: "", value: { fresh: 1 } }])).toEqual({
      fresh: 1,
    });
    expect(applyPatches({ old: true }, [{ op: "replace", path: "/", value: { fresh: 2 } }])).toEqual(
      { fresh: 2 },
    );
  });
});

describe("applyPatches: remove, and array indices that do not fit", () => {
  it("removes an object member", () => {
    const next = applyPatches({ obj: { a: 1, b: 2 } }, [{ op: "remove", path: "/obj/a" }]);
    expect(next.obj).toEqual({ b: 2 });
  });

  it("removes an array element by index, closing the gap", () => {
    const next = applyPatches({ list: ["a", "b", "c"] }, [{ op: "remove", path: "/list/1" }]);
    expect(next.list).toEqual(["a", "c"]);
  });

  it("falls back to a plain set when an array add index is out of range or not a number", () => {
    // Out of contract for RFC 6902, but a best-effort set keeps the value reachable instead
    // of dropping it silently.
    const outOfRange = applyPatches({ list: ["a"] }, [{ op: "add", path: "/list/9", value: "z" }]);
    expect(outOfRange.list[9]).toBe("z");

    const nonNumeric = applyPatches({ list: ["a"] }, [
      { op: "add", path: "/list/label", value: "z" },
    ]) as { list: string[] & { label?: string } };
    expect(nonNumeric.list.label).toBe("z");
    expect(nonNumeric.list[0]).toBe("a");
  });
});
