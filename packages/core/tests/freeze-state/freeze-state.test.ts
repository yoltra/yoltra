/**
 * Dev-mode freezing's descriptor edges: accessors are skipped rather than invoked — reading a
 * getter to freeze its result would run application code at freeze time — and symbol-keyed
 * values freeze like string-keyed ones.
 */

import { describe, expect, it } from "vitest";

import { freezeState } from "../../src/index";

describe("freezeState", () => {
  it("freezes string- and symbol-keyed values alike", () => {
    const sym = Symbol("payload");
    const target: Record<PropertyKey, unknown> = {
      plain: { nested: true },
      [sym]: { nested: true },
    };

    const frozen = freezeState(target) as Record<PropertyKey, unknown>;

    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen(frozen["plain"])).toBe(true);
    expect(Object.isFrozen(frozen[sym as unknown as string])).toBe(true);
  });

  it("skips accessors instead of invoking them", () => {
    let reads = 0;
    const sym = Symbol("computed");
    const target = {};
    Object.defineProperty(target, "computed", {
      get() {
        reads += 1;
        return { escaped: true };
      },
      enumerable: true,
      configurable: true,
    });
    Object.defineProperty(target, sym, {
      get() {
        reads += 1;
        return { escaped: true };
      },
      enumerable: true,
      configurable: true,
    });

    freezeState(target);

    // Freezing never ran the getters: their values are the application's business.
    expect(reads).toBe(0);
  });
});
