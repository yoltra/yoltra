/**
 * The path utilities' refusal edges: a typed accessor that calls a method must fail with the
 * message that explains itself, a symbol access records nothing, and `getAtPath` answers
 * `undefined` past a null rather than throwing.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { getAtPath, toDottedPath } from "../../src/utils/path";

describe("toDottedPath", () => {
  it("throws the explanatory error when the accessor calls a method", () => {
    expect(() => toDottedPath((p: any) => p.items.map((x: unknown) => x))).toThrow(
      /cannot.*call functions|called a method/,
    );
  });

  it("records nothing for a symbol access, and says why", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    expect(toDottedPath((p: any) => p[Symbol.toPrimitive])).toBe("");

    // An empty path silently subscribes to the whole slice, so the accessor that produced it
    // has to explain itself — otherwise the only symptom is a component re-rendering far more
    // than its author expected.
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/recorded no property access/);
  });
});

// `warnOnce` dedupes on a module-scoped key, so restoring the spy between tests keeps a later
// empty-path case from inheriting this one's suppression.
afterEach(() => {
  vi.restoreAllMocks();
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
