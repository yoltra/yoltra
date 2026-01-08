import { describe, it, expect } from "vitest";
import { freezeState } from "../../src/utils/immutability";

describe("freezeState", () => {
  it("returns primitives and null as-is", () => {
    expect(freezeState(42)).toBe(42);
    expect(freezeState("x")).toBe("x");
    const n: null = null;
    expect(freezeState(n)).toBe(n);
  });

  it("deep-freezes nested objects and arrays", () => {
    const state: any = {
      user: { name: "Ada" },
      items: [1, { id: 1 }],
    };

    const frozen = freezeState(state);

    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen(frozen.user)).toBe(true);
    expect(Object.isFrozen(frozen.items)).toBe(true);
    expect(Object.isFrozen(frozen.items[1])).toBe(true);
  });

  it("returns already frozen objects unchanged", () => {
    const o = Object.freeze({ x: 1 });
    const out = freezeState(o);
    expect(out).toBe(o);
  });

  it("handles cycles safely", () => {
    const a: any = {};
    a.self = a;

    const frozen = freezeState(a);
    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen(frozen.self)).toBe(true);
  });

  it("freezes symbol-keyed properties", () => {
    const sym = Symbol("k");
    const o: any = { [sym]: { inner: 1 } };

    const frozen = freezeState(o);
    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen(frozen[sym])).toBe(true);
  });

  it("skips getter/setter properties without error", () => {
    const backing: any = { x: 1 };
    const o: any = {};
    Object.defineProperty(o, "x", {
      get() {
        return backing.x;
      },
      set(v: any) {
        backing.x = v;
      },
      enumerable: true,
      configurable: true,
    });

    const frozen = freezeState(o);

    // The object is frozen; attempting to change it should not modify getter semantics
    expect(Object.isFrozen(frozen)).toBe(true);
  });
});
