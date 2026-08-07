import { describe, it, expect } from "vitest";

import { encodeState, encodeStateBounded, decodeState } from "../../src/serialize/codec";

/**
 * The round trip that matters: state → JSON → state.
 *
 * `JSON.stringify` does not fail on the values it cannot represent, it destroys them. That is
 * how a `Map` in application state reached the panel as `{}` — and, far worse, how time-travel
 * sent that `{}` back and applied it to the running store, replacing a live `Map` with an empty
 * object inside the user's own program.
 */
function roundTrip(value: unknown): unknown {
  const { value: encoded } = encodeState(value);
  return decodeState(JSON.parse(JSON.stringify(encoded)));
}

describe("values JSON cannot carry", () => {
  it("restores a Map, which used to arrive as an empty object", () => {
    const original = new Map<string, unknown>([
      ["a", 1],
      ["b", { nested: true }],
    ]);

    const result = roundTrip(original) as Map<string, unknown>;

    expect(result).toBeInstanceOf(Map);
    expect(result.get("a")).toBe(1);
    expect(result.get("b")).toEqual({ nested: true });
  });

  it("restores a Set", () => {
    const result = roundTrip(new Set([1, "two"])) as Set<unknown>;
    expect(result).toBeInstanceOf(Set);
    expect([...result]).toEqual([1, "two"]);
  });

  it("restores a Date as a Date, not the string it stringifies to", () => {
    const result = roundTrip(new Date(0)) as Date;
    expect(result).toBeInstanceOf(Date);
    expect(result.getTime()).toBe(0);
  });

  it("carries a BigInt instead of throwing", () => {
    // `JSON.stringify` throws on BigInt, from inside a handler nobody awaits — so the snapshot
    // never arrived and the panel retried forever.
    expect(roundTrip({ big: 9007199254740993n })).toEqual({ big: 9007199254740993n });
  });

  it("keeps an explicit undefined, which JSON drops from objects", () => {
    const result = roundTrip({ present: 1, absent: undefined }) as Record<string, unknown>;
    expect("absent" in result).toBe(true);
    expect(result.absent).toBeUndefined();
  });

  it("keeps NaN and the infinities, which JSON turns into null", () => {
    expect(roundTrip({ a: NaN, b: Infinity, c: -Infinity })).toEqual({
      a: NaN,
      b: Infinity,
      c: -Infinity,
    });
  });

  it("restores RegExp and Error", () => {
    const result = roundTrip({ re: /ab+/gi, err: new TypeError("bad") }) as {
      re: RegExp;
      err: Error;
    };
    expect(result.re).toBeInstanceOf(RegExp);
    expect(result.re.source).toBe("ab+");
    expect(result.re.flags).toBe("gi");
    expect(result.err.name).toBe("TypeError");
    expect(result.err.message).toBe("bad");
  });
});

describe("structures JSON cannot express", () => {
  it("survives a cycle instead of throwing", () => {
    const node: Record<string, unknown> = { name: "root" };
    node.self = node;

    const result = roundTrip(node) as Record<string, unknown>;

    expect(result.name).toBe("root");
    expect(result.self).toBe(result); // the cycle is restored, not flattened
  });

  it("preserves shared references rather than duplicating them", () => {
    const shared = { id: 1 };
    const result = roundTrip({ a: shared, b: shared }) as Record<string, { id: number }>;

    // Two keys pointing at one object is meaningful: expanding it into copies would make the
    // panel show a structure the application does not have.
    expect(result.a).toBe(result.b);
  });

  it("handles a cycle through an array", () => {
    const arr: unknown[] = [1];
    arr.push(arr);

    const result = roundTrip(arr) as unknown[];
    expect(result[0]).toBe(1);
    expect(result[1]).toBe(result);
  });
});

describe("values with no faithful representation", () => {
  it("marks a function and reports its path", () => {
    const { value, report } = encodeState({ ok: 1, fn: () => undefined });

    expect(report.unsupported).toEqual(["/fn"]);
    // Decodes to undefined rather than a placeholder that pretends to be the function.
    expect((decodeState(value) as Record<string, unknown>).fn).toBeUndefined();
  });

  it("does not mistake application data for its own markers", () => {
    // An object that happens to carry the marker key must come back unchanged rather than
    // being decoded as whatever tag it appears to name.
    const original = { $yoltra: "map", entries: [["not", "a map"]] };
    expect(roundTrip(original)).toEqual(original);
  });
});

describe("bounds and redaction", () => {
  it("truncates visibly rather than producing a frame the hub will reject", () => {
    const wide = Array.from({ length: 50 }, (_, i) => ({ i }));
    const { report } = encodeState(wide, { maxNodes: 10 });

    // A snapshot over the frame cap is dropped outright, which reads as a panel that hangs.
    // Truncating says where it stopped instead.
    expect(report.truncated).toBe(true);
  });

  it("redacts through the sanitizer before anything leaves the process", () => {
    const { value } = encodeState(
      { user: "ada", token: "secret-value" },
      { sanitize: (path, v) => (path === "/token" ? "[redacted]" : v) },
    );

    expect(decodeState(value)).toEqual({ user: "ada", token: "[redacted]" });
  });
});

describe("ordinary values", () => {
  it("leaves JSON-native data untouched", () => {
    const plain = { s: "x", n: 1, b: true, nil: null, arr: [1, 2], deep: { a: { b: 2 } } };
    expect(roundTrip(plain)).toEqual(plain);
  });
});

describe("fitting a snapshot into the transport", () => {
  it("sends a large state whole when it fits", () => {
    const state = { rows: Array.from({ length: 50 }, (_, i) => ({ i })) };

    const result = encodeStateBounded(state, 1_000_000);

    expect(result.truncated).toBe(false);
    expect(decodeState(result.value)).toEqual(state);
  });

  it("shrinks a state that does not fit, and says so", () => {
    // A frame over the hub's cap is rejected and the connection dropped, so the client
    // reconnects, asks again, is refused again — and the panel waits through a loop with
    // nothing on screen to explain it.
    const state = { rows: Array.from({ length: 5000 }, (_, i) => ({ i, label: `row ${i}` })) };

    const result = encodeStateBounded(state, 2_000);

    expect(result.truncated).toBe(true);
    expect(JSON.stringify(result.value).length).toBeLessThanOrEqual(2_000);
    expect(result.note).toBeDefined();
  });

  it("measures bytes rather than counting nodes", () => {
    // Few nodes, enormous content: a node budget alone would call this small and let it through
    // to be refused by the transport.
    const state = { blob: "x".repeat(100_000) };

    const result = encodeStateBounded(state, 5_000);

    expect(result.truncated).toBe(true);
    expect(JSON.stringify(result.value).length).toBeLessThanOrEqual(5_000);
  });

  it("gives up honestly when nothing fits", () => {
    const result = encodeStateBounded({ blob: "x".repeat(10_000) }, 10);

    expect(result.truncated).toBe(true);
    expect(result.note).toContain("could not be reduced");
    // Decodes to undefined rather than to a partial tree presented as the state.
    expect(decodeState(result.value)).toBeUndefined();
  });

  it("still redacts while shrinking", () => {
    const result = encodeStateBounded(
      { token: "secret", rows: Array.from({ length: 2000 }, (_, i) => i) },
      500,
      { sanitize: (path, v) => (path === "/token" ? "[redacted]" : v) },
    );

    expect(JSON.stringify(result.value)).not.toContain("secret");
  });
});
