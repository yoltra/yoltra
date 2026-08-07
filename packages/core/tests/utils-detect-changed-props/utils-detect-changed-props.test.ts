import { describe, it, expect, vi } from "vitest";
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

  it("marks the array path and the appended index when length changes", () => {
    const oldState = { nums: [1, 2] };
    const newState = { nums: [1, 2, 3] };

    // The array itself changed, and so did index 2. Reporting only `nums` left an exact
    // subscriber on `nums.2` unnotified.
    const paths = detectChangedProps(oldState, newState);
    expect(paths).toEqual(["nums", "nums.2"]);
  });

  it("reports the shifted leaves when an element is prepended", () => {
    const oldState = { items: [{ title: "A" }, { title: "B" }] };
    const newState = { items: [{ title: "NEW" }, { title: "A" }, { title: "B" }] };

    // CORE-01: the regression that made this necessary. An `unshift` reported `items` alone, so
    // a component bound to the exact path `items.0.title` — the documentation's own headline
    // example — kept rendering "A" after the value there became "NEW". Positional paths mean a
    // shift genuinely changes almost every index; the remedy for that cost is identity-keyed
    // state, not a diff that stays silent.
    const paths = detectChangedProps(oldState, newState);
    expect(paths).toContain("items");
    expect(paths).toContain("items.0.title");
    expect(paths).toContain("items.1.title");
    expect(paths).toContain("items.2");
  });

  it("reports removed indices when an element is dropped", () => {
    const oldState = { items: ["a", "b", "c"] };
    const newState = { items: ["a", "b"] };

    const paths = detectChangedProps(oldState, newState);
    expect(paths).toEqual(["items", "items.2"]);
  });

  it("does not report a length change when only a leaf moved", () => {
    const oldState = { items: [{ title: "A" }, { title: "B" }] };
    const newState = { items: [{ title: "A" }, { title: "B!" }] };

    // Equal lengths still take the precise path: no array-level noise.
    const paths = detectChangedProps(oldState, newState);
    expect(paths).toEqual(["items.1.title"]);
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

  it("reports the path when one side is an array and the other an object", () => {
    // Not a diffable pair: the two have nothing comparable, and descending would produce index
    // paths against key paths. The value changed shape, so the value changed.
    expect(detectChangedProps({ items: [1, 2] }, { items: { 0: 1, 1: 2 } })).toEqual(["items"]);
    expect(detectChangedProps({ items: { a: 1 } }, { items: [1] })).toEqual(["items"]);
  });

  it("reports a key added with an undefined value, which reads as equal to an absent one", () => {
    // The diff skips a key whose two values are identical, which is what makes it fast. Reading
    // a missing key also yields `undefined`, so on this input a value comparison alone concludes
    // "unchanged" for a key that was genuinely added — presence has to be established first.
    const paths = detectChangedProps({ a: 1 }, { a: 1, pending: undefined });
    expect(paths).toEqual(["pending"]);
  });

  it("reports a key removed although its value was undefined", () => {
    const paths = detectChangedProps({ a: 1, pending: undefined }, { a: 1 });
    expect(paths).toEqual(["pending"]);
  });

  it("reports nothing for a key that holds undefined on both sides", () => {
    // The mirror of the two above: same key, same value, and the shapes agree — so there is
    // nothing to report, and the fast path is right to skip it.
    expect(detectChangedProps({ a: 1, pending: undefined }, { a: 1, pending: undefined })).toEqual(
      [],
    );
  });

  it("still finds a removal when the addition is on the other side", () => {
    // Equal key counts with different keys: the shapes match by size and not by content, so the
    // cheap same-shape conclusion must not be drawn from the count alone.
    const paths = detectChangedProps({ a: 1, gone: 2 }, { a: 1, fresh: 2 }).sort();
    expect(paths).toEqual(["fresh", "gone"]);
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

describe("detectChangedProps: values with no enumerable contents", () => {
  it("reports a replaced Map instead of silently seeing nothing", () => {
    // CORE-02. `Object.keys(new Map([["a", 1]]))` is `[]`, so the key-walk compared two empty
    // objects and reported no change. The store treats "no changed paths" as a no-op and skips
    // the commit, so a reducer returning a new Map produced no state update, no notification and
    // no error — the update vanished with nothing to debug.
    const oldState = { index: new Map([["a", 1]]) };
    const newState = { index: new Map([["a", 2]]) };

    expect(detectChangedProps(oldState, newState)).toEqual(["index"]);
  });

  it("reports a replaced Set", () => {
    const oldState = { tags: new Set(["x"]) };
    const newState = { tags: new Set(["x", "y"]) };

    expect(detectChangedProps(oldState, newState)).toEqual(["tags"]);
  });

  it("treats a Map replacing a plain object as a change", () => {
    expect(detectChangedProps({ v: {} }, { v: new Map() })).toEqual(["v"]);
  });

  it("reports a class instance whose state is private", () => {
    class Counter {
      #n: number;
      constructor(n: number) {
        this.#n = n;
      }
      get value(): number {
        return this.#n;
      }
    }

    // Private fields and accessors are not own enumerable keys, so there is nothing to walk.
    // Two distinct references with nothing comparable are assumed different: a false "changed"
    // costs a render, a false "unchanged" costs correctness.
    expect(detectChangedProps({ c: new Counter(1) }, { c: new Counter(2) })).toEqual(["c"]);
  });

  it("still reports nothing when the same reference is returned", () => {
    const shared = new Map([["a", 1]]);
    // The immutability contract does the work here: an in-place mutation returning the same
    // reference is not a state change, and the reference check at the top catches it.
    expect(detectChangedProps({ index: shared }, { index: shared })).toEqual([]);
  });
});

describe("keys that dotted paths cannot express", () => {
  it("warns when a state key contains a dot", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    // `{ "a.b": 1 }` and `{ a: { b: 1 } }` both produce the path "a.b", so a subscription or a
    // devtools patch aimed at one silently addresses the other. Nothing downstream can tell them
    // apart from the string, which is why it is said here, where the key is still intact.
    detectChangedProps({ "release.version": 1 }, { "release.version": 2 });

    const message = warn.mock.calls.map((c) => String(c[0])).find((m) => m.includes("dot"));
    expect(message).toContain("release.version");
    warn.mockRestore();
  });

  it("says it once per key, not once per event", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    for (let i = 0; i < 5; i++) detectChangedProps({ "x.y": i }, { "x.y": i + 1 });

    expect(warn.mock.calls.filter((c) => String(c[0]).includes("x.y"))).toHaveLength(1);
    warn.mockRestore();
  });

  it("stays quiet for ordinary keys", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    detectChangedProps({ user: { name: "Ada" } }, { user: { name: "Grace" } });
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
