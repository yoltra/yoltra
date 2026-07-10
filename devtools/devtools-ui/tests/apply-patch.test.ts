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
