import { runInNewContext } from "node:vm";

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

describe("binary values", () => {
  // Before the binary tag, `Object.entries` flattened a typed array into `{"0":1,"1":2}` and
  // an ArrayBuffer into `{}`. Neither was reported, so a persisted buffer came back a plain
  // object and the only clue was the bug it caused later.

  const KINDS = [
    Int8Array,
    Uint8Array,
    Uint8ClampedArray,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array,
  ] as const;

  it.each(KINDS.map((C) => [C.name, C] as const))(
    "round-trips %s with its constructor and bytes intact",
    (_name, Ctor) => {
      const original = new Ctor([1, 2, 3, 4]);
      const restored = decodeState(encodeState(original).value);

      // Constructor identity, not just length: a Float64Array that came back as a
      // Uint8Array would have the same byte count and completely different values.
      expect(restored).toBeInstanceOf(Ctor);
      expect(Array.from(restored as ArrayLike<number>)).toEqual(Array.from(original));
    },
  );

  it.each([
    ["BigInt64Array", BigInt64Array],
    ["BigUint64Array", BigUint64Array],
  ] as const)("round-trips %s", (_name, Ctor) => {
    const original = new Ctor([1n, 2n]);
    const restored = decodeState(encodeState(original).value);
    expect(restored).toBeInstanceOf(Ctor);
    expect(Array.from(restored as ArrayLike<bigint>)).toEqual([1n, 2n]);
  });

  it("round-trips an ArrayBuffer", () => {
    const original = new Uint8Array([9, 8, 7]).buffer;
    const restored = decodeState(encodeState(original).value);

    expect(restored).toBeInstanceOf(ArrayBuffer);
    expect(Array.from(new Uint8Array(restored as ArrayBuffer))).toEqual([9, 8, 7]);
  });

  it("round-trips a DataView", () => {
    const original = new DataView(new Uint8Array([1, 2, 3, 4]).buffer);
    const restored = decodeState(encodeState(original).value) as DataView;

    expect(restored).toBeInstanceOf(DataView);
    expect(restored.byteLength).toBe(4);
    expect(restored.getUint8(2)).toBe(3);
  });

  it("encodes only the view's own window, not the whole backing buffer", () => {
    // A view over the middle of a larger buffer must come back as its own bytes. Encoding
    // the backing buffer would leak its siblings' data and inflate every frame.
    const backing = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]).buffer;
    const middle = new Uint8Array(backing, 2, 3);

    const restored = decodeState(encodeState(middle).value) as Uint8Array;

    expect(Array.from(restored)).toEqual([2, 3, 4]);
    expect(restored.byteLength).toBe(3);
  });

  it("does not report binary values as unsupported", () => {
    const { report } = encodeState({ bytes: new Uint8Array([1, 2]) });
    expect(report.unsupported).toEqual([]);
  });

  it("handles a buffer far past the fromCharCode argument limit", () => {
    // `String.fromCharCode.apply` throws RangeError somewhere above ~64K arguments, which a
    // state tree reaches without trying. The encoder chunks for this reason.
    const big = new Uint8Array(300_000);
    for (let i = 0; i < big.length; i += 1) big[i] = i % 256;

    const restored = decodeState(encodeState(big, { maxNodes: 1_000_000 }).value) as Uint8Array;

    expect(restored).toBeInstanceOf(Uint8Array);
    expect(restored.byteLength).toBe(300_000);
    expect(restored[0]).toBe(0);
    expect(restored[255]).toBe(255);
    expect(restored[299_999]).toBe(299_999 % 256);
  });

  it.each(["Function", "constructor", "toString", "valueOf", "__proto__", "hasOwnProperty"])(
    "decodes the hostile binary kind %o to undefined",
    (kind) => {
      // `kind` arrives from a devtools socket or out of storage, so it is attacker-influenced.
      // `globalThis[kind]` would obviously be an injection vector - but so is a frozen object
      // *literal*, because freezing stops writes and not inherited reads: `"constructor"`
      // resolved to `Object.prototype.constructor` and `new Object(buffer)` handed the buffer
      // straight back. The allow-list has a null prototype and is read through `hasOwn`.
      expect(decodeState({ $yoltra: "binary", kind, b64: "AAA=" })).toBeUndefined();
    },
  );
});

describe("exotic prototypes", () => {
  class Money {
    constructor(
      public amount: number,
      public currency: string,
    ) {}
    format(): string {
      return `${this.amount} ${this.currency}`;
    }
  }

  it("reports a class instance and names its constructor", () => {
    const { value, report } = encodeState({ price: new Money(10, "MXN") });

    expect(report.unsupported).toEqual(["/price"]);
    expect((value as any).price.$yoltra).toBe("unsupported");
    expect((value as any).price.kind).toBe("Money");
  });

  it("still decodes a class instance to its own properties", () => {
    // Deliberately *not* `undefined`. Before the guard existed, a class instance round-tripped
    // as a plain object carrying its props - lossy, but often good enough for persistence.
    // Turning that into `undefined` would make a data-loss fix more destructive than the bug.
    const restored = decodeState(encodeState({ price: new Money(10, "MXN") }).value) as {
      price: { amount: number; currency: string };
    };

    expect(restored.price).toEqual({ amount: 10, currency: "MXN" });
    expect(restored.price).not.toBeInstanceOf(Money);
  });

  it("walks nested values inside an unsupported exotic", () => {
    const restored = decodeState(
      encodeState({ wrapper: Object.assign(new Money(1, "USD"), { when: new Date(0) }) }).value,
    ) as { wrapper: { when: Date } };

    expect(restored.wrapper.when).toBeInstanceOf(Date);
  });

  it("leaves a null-prototype object as an ordinary plain object", () => {
    const bare = Object.create(null) as Record<string, unknown>;
    bare.a = 1;

    const { value, report } = encodeState({ bare });

    expect(report.unsupported).toEqual([]);
    expect((value as any).bare).toEqual({ a: 1 });
  });

  it("does not report a genuinely cross-realm plain object", () => {
    // An object from an iframe, a worker or a `vm` context has a *different*
    // `Object.prototype`, so the prototype check alone would report it unsupported for the
    // crime of being ordinary. A real realm rather than a hand-built impostor, because the
    // impostor is exactly as likely to be wrong as the code it is testing.
    const foreign = runInNewContext("({ a: 1, nested: { b: 2 } })") as Record<string, unknown>;

    expect(Object.getPrototypeOf(foreign)).not.toBe(Object.prototype);

    const { value, report } = encodeState({ foreign });

    expect(report.unsupported).toEqual([]);
    expect((value as any).foreign).toEqual({ a: 1, nested: { b: 2 } });
  });

  it("still escapes a plain object that carries the marker key", () => {
    // Regression guard for the new branch order: the prototype check now sits in front of
    // the generic-object branch, and the escape wrap must still be reachable.
    const restored = decodeState(encodeState({ odd: { $yoltra: "not-a-tag", n: 1 } }).value);
    expect(restored).toEqual({ odd: { $yoltra: "not-a-tag", n: 1 } });
  });
});

describe("base64 without Buffer (the browser path)", () => {
  // Node has `Buffer`, so the fast path is the only one the rest of this suite ever runs -
  // which left the branch that actually executes in a browser completely unexercised.
  function withoutBuffer<T>(fn: () => T): T {
    const g = globalThis as { Buffer?: unknown };
    const saved = g.Buffer;
    delete g.Buffer;
    try {
      return fn();
    } finally {
      g.Buffer = saved;
    }
  }

  it("round-trips a typed array through btoa/atob", () => {
    const restored = withoutBuffer(() => {
      const encoded = encodeState({ bytes: new Uint8Array([0, 1, 254, 255]) }).value;
      return decodeState(encoded) as { bytes: Uint8Array };
    });

    expect(restored.bytes).toBeInstanceOf(Uint8Array);
    expect(Array.from(restored.bytes)).toEqual([0, 1, 254, 255]);
  });

  it("chunks past the fromCharCode argument limit without Buffer", () => {
    // The RangeError this guards against only exists on this path: the Buffer fast path
    // never calls `String.fromCharCode`.
    const big = new Uint8Array(200_000);
    for (let i = 0; i < big.length; i += 1) big[i] = i % 256;

    const restored = withoutBuffer(() => {
      const encoded = encodeState(big, { maxNodes: 1_000_000 }).value;
      return decodeState(encoded) as Uint8Array;
    });

    expect(restored.byteLength).toBe(200_000);
    expect(restored[199_999]).toBe(199_999 % 256);
  });

  it("agrees with the Buffer path byte for byte", () => {
    const bytes = new Uint8Array([3, 14, 15, 92, 65, 35]);
    const viaBuffer = JSON.stringify(encodeState(bytes).value);
    const viaBtoa = withoutBuffer(() => JSON.stringify(encodeState(bytes).value));

    expect(viaBtoa).toBe(viaBuffer);
  });
});

describe("binary subclasses and exotic views", () => {
  // `Buffer` is a `Uint8Array` subclass and is everywhere in Node. Resolving the tag by
  // `constructor.name` gave it `kind: "Buffer"`, which is not in the decoder's allow-list,
  // so it decoded to `undefined` - reported nowhere, through `persist` as much as through
  // time travel. A silent total loss, which is the failure this module exists to prevent.

  it("round-trips a Buffer's bytes, as its base type", () => {
    const original = Buffer.from([1, 2, 250]);
    const restored = decodeState(encodeState(original).value) as Uint8Array;

    expect(restored).toBeInstanceOf(Uint8Array);
    expect(Array.from(restored)).toEqual([1, 2, 250]);
  });

  it("reports the subclass as lossy, because it is", () => {
    // The bytes survive; the subclass does not. `Buffer.toString()` and `Buffer.equals()`
    // are not `Uint8Array`'s, so silence here would be its own kind of lie.
    const { report } = encodeState({ b: Buffer.from([1]) });
    expect(report.unsupported).toEqual(["/b"]);
  });

  it("says nothing when the view is exactly its declared kind", () => {
    const { report } = encodeState({ b: new Uint8Array([1]) });
    expect(report.unsupported).toEqual([]);
  });

  it("resolves a DataView subclass to its base rather than a kind the decoder rejects", () => {
    // `DataView` is generic in the current lib, so subclass it through a helper rather than
    // `class X extends DataView {}`, which does not typecheck here.
    const OddView = class extends DataView<ArrayBuffer> {};
    const { value, report } = encodeState({ v: new OddView(new ArrayBuffer(4)) });

    expect((value as any).v.$yoltra).toBe("binary");
    expect((value as any).v.kind).toBe("DataView");
    expect(report.unsupported).toEqual(["/v"]);
  });
});
