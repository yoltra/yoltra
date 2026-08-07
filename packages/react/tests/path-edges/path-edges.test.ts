/**
 * The path utilities' refusal edges: a typed accessor that calls a method must fail with the
 * message that explains itself, a symbol access records nothing, and `getAtPath` answers
 * `undefined` past a null rather than throwing.
 */

import { describe, expect, it } from "vitest";

import { getAtPath, toDottedPath } from "../../src/utils/path";

describe("toDottedPath", () => {
  it("throws the explanatory error when the accessor calls a method", () => {
    expect(() => toDottedPath((p: any) => p.items.map((x: unknown) => x))).toThrow(
      /cannot.*call functions|called a method/,
    );
  });

  it("records nothing for a symbol access", () => {
    expect(toDottedPath((p: any) => p[Symbol.toPrimitive])).toBe("");
  });
});

describe("getAtPath", () => {
  it("returns the object itself for an empty path", () => {
    const obj = { a: 1 };
    expect(getAtPath(obj, "")).toBe(obj);
  });

  it("answers undefined past a null instead of throwing", () => {
    expect(getAtPath({ a: null }, "a.b")).toBeUndefined();
    expect(getAtPath(null, "a")).toBeUndefined();
  });
});
