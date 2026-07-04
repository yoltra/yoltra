import { describe, it, expect } from "vitest";
import { detectChangedProps } from "../../src/utils/detectChangedProps";

describe("detectChangedProps", () => {
  it("returns empty array for identical references", () => {
    const obj = { a: 1 };
    const result = detectChangedProps(obj, obj);
    expect(result).toEqual([]);
  });

  it("detects primitive differences", () => {
    expect(detectChangedProps(1, 2, "num")).toEqual(["num"]);
    expect(detectChangedProps(null, {}, "x")).toEqual(["x"]);
    expect(detectChangedProps({}, null, "y")).toEqual(["y"]);
  });

  it("compares Date instances by time value", () => {
    const d1 = new Date(0);
    const d2 = new Date(0);
    const d3 = new Date(1);

    expect(detectChangedProps(d1, d2, "created")).toEqual([]);
    expect(detectChangedProps(d1, d3, "created")).toEqual(["created"]);
  });

  it("compares RegExp instances by source and flags", () => {
    const r1 = /a/i;
    const r2 = /a/i;
    const r3 = /a/g;

    expect(detectChangedProps(r1, r2, "pattern")).toEqual([]);
    expect(detectChangedProps(r1, r3, "pattern")).toEqual(["pattern"]);
  });

  it("diffs arrays with equal length element-wise", () => {
    const oldState = { items: [{ title: "A" }, { title: "B" }] };
    const newState = { items: [{ title: "A+" }, { title: "B" }] };

    const paths = detectChangedProps(oldState, newState);
    expect(paths).toEqual(["items.0.title"]);
  });

  it("marks array path when length changes", () => {
    const oldState = { nums: [1, 2] };
    const newState = { nums: [1, 2, 3] };

    const paths = detectChangedProps(oldState, newState);
    expect(paths).toEqual(["nums"]);
  });

  it("handles object key additions, removals, and nested changes", () => {
    const oldState = { user: { name: "Ada", age: 37 }, extra: 1 };
    const newState = { user: { name: "Grace", age: 37 }, added: true };

    const paths = detectChangedProps(oldState, newState).sort();

    // we expect:
    //   - user.name changed
    //   - extra removed
    //   - added key introduced
    expect(paths.sort()).toEqual(["added", "extra", "user.name"].sort());
  });

  it("is safe on cyclic structures", () => {
    const a: any = {};
    a.self = a;

    const b: any = {};
    b.self = b;

    const paths = detectChangedProps(a, b);
    // The function must terminate; exact paths are less important here.
    expect(Array.isArray(paths)).toBe(true);
  });

  it("diffs a shared sub-object at sibling paths (no false negative from aliasing)", () => {
    // The SAME object is referenced from two keys and genuinely changes. Both
    // sites must be reported — the old pair-tracker dropped the second (CORE-1).
    const child = { v: 1 };
    const child2 = { v: 2 };

    const paths = detectChangedProps({ a: child, b: child }, { a: child2, b: child2 }).sort();
    expect(paths).toEqual(["a.v", "b.v"]);
  });

  it("diffs a shared object aliased across two arrays", () => {
    const oc = { v: 1 };
    const nc = { v: 2 };

    const paths = detectChangedProps({ x: [oc], y: [oc] }, { x: [nc], y: [nc] }).sort();
    expect(paths).toEqual(["x.0.v", "y.0.v"]);
  });

  it("treats two NaN values as equal (no spurious change)", () => {
    expect(detectChangedProps({ a: NaN }, { a: NaN })).toEqual([]);
    expect(detectChangedProps(NaN, NaN, "n")).toEqual([]);
    expect(detectChangedProps({ a: NaN }, { a: 1 })).toEqual(["a"]);
  });

  it("terminates on cycles while still reporting sibling changes", () => {
    const oc: any = { v: 1 };
    oc.self = oc;
    const nc: any = { v: 2 };
    nc.self = nc;

    // Same cyclic object aliased at two keys, with a real change at each.
    const paths = detectChangedProps({ a: oc, b: oc }, { a: nc, b: nc }).sort();
    expect(paths).toEqual(["a.v", "b.v"]);
  });
});
