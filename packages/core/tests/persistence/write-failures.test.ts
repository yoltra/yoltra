/**
 * The write path's failure containment: persistence never throws into the application it is
 * persisting, whether the adapter fails synchronously or a beat later in a promise — and the
 * disposer flushes what was still pending so the last write is not lost with the timer.
 */

import { describe, expect, it, vi } from "vitest";

import { createStore, hydrate, persist } from "../../src/index";
import type { PersistenceAdapter, ReducerSpec } from "../../src/index";

type EM = { ui: { poke: null } };

const spec: ReducerSpec<{ n: number }, EM> = {
  state: { n: 0 },
  when: { keys: [["ui", "poke"]] },
  reducer: (s) => ({ n: s.n + 1 }),
};

const build = () => createStore<{ counter: { n: number } }, EM>({ name: "p", reducer: { counter: spec } });

describe("write failures stay contained", () => {
  it("reports an async adapter rejection through onError and keeps running", async () => {
    const onError = vi.fn();
    const adapter: PersistenceAdapter = {
      read: () => null,
      write: () => Promise.reject(new Error("disk full, eventually")),
      remove: () => undefined,
    };
    const store = build();
    const stop = persist(store as never, { key: "app", adapter, version: 1, throttleMs: 0, onError });

    await store.emit("ui", "poke", null);
    // The rejection lands on a later microtask; give it one.
    await Promise.resolve();
    await Promise.resolve();

    expect(onError).toHaveBeenCalledWith(expect.any(Error), "write");
    stop();
  });

  it("flushes the pending write on dispose instead of losing it with the timer", async () => {
    const writes: string[] = [];
    const adapter: PersistenceAdapter = {
      read: () => null,
      write: (_key, value) => {
        writes.push(value);
      },
      remove: () => undefined,
    };
    const store = build();
    const stop = persist(store as never, { key: "app", adapter, version: 1, throttleMs: 60_000 });

    await store.emit("ui", "poke", null);
    // Throttled a minute out: nothing has been written yet.
    expect(writes).toHaveLength(0);

    stop();

    // The disposer cancelled the timer and flushed synchronously — the state survived.
    expect(writes).toHaveLength(1);
    expect(writes[0]).toContain('"n":1');
  });
});

describe("encode losses are reported, not swallowed", () => {
  // The report used to be dropped on the floor at the point of encoding, so a value the
  // codec could not represent was written as a lossy stand-in and nothing anywhere said so.
  // The loss surfaced much later, as a slice that came back wrong.

  class Money {
    constructor(public amount: number) {}
  }

  function adapterSpy(): { adapter: PersistenceAdapter; written: string[] } {
    const written: string[] = [];
    return {
      written,
      adapter: {
        read: () => null,
        write: (_k, v) => {
          written.push(v);
        },
        remove: () => {},
      },
    };
  }

  it("reports an unsupported value under the 'encode' phase, naming its path", async () => {
    const { adapter } = adapterSpy();
    const onError = vi.fn();

    const store = createStore({
      name: "EncodeLossStore",
      reducer: {
        wallet: {
          // Introduced by the reducer, not declared as initial state: `structuredClone`
          // runs over initial state at construction and already flattens a class instance
          // to a plain object, so the loss this test is about can only arrive at runtime.
          state: { price: null as Money | null },
          when: { any: true },
          reducer: (s: { price: Money | null }) => ({ ...s, price: new Money(10) }),
        } satisfies ReducerSpec<{ price: Money | null }, EM>,
      },
    });

    const stop = persist(store, { key: "k", adapter, version: 1, throttleMs: 0, onError });
    await store.emit("ui", "poke", null);
    await stop();

    const encodeCalls = onError.mock.calls.filter(([, phase]) => phase === "encode");
    expect(encodeCalls.length).toBeGreaterThan(0);
    // A distinct phase from "write": a serialization loss and a full disk need different
    // responses, and telling them apart is what onError exists for.
    expect(String(encodeCalls[0]?.[0])).toContain("/slices/wallet/price");
  });

  it("still writes: a partial payload beats none", async () => {
    const { adapter, written } = adapterSpy();

    const store = createStore({
      name: "EncodeLossStillWrites",
      reducer: {
        wallet: {
          state: { price: null as Money | null, label: "ok" },
          when: { any: true },
          reducer: (s: { price: Money | null; label: string }) => ({
            ...s,
            price: new Money(10),
          }),
        } satisfies ReducerSpec<{ price: Money | null; label: string }, EM>,
      },
    });

    const stop = persist(store, { key: "k", adapter, version: 1, throttleMs: 0 });
    await store.emit("ui", "poke", null);
    await stop();

    expect(written.length).toBeGreaterThan(0);
    expect(written[written.length - 1]).toContain("ok");
  });

  it("says nothing when the state encodes cleanly", async () => {
    const { adapter } = adapterSpy();
    const onError = vi.fn();

    const store = createStore({
      name: "CleanEncodeStore",
      reducer: {
        wallet: {
          state: { amount: 10, tags: new Set(["a"]), bytes: new Uint8Array([1, 2]), n: 0 },
          when: { any: true },
          reducer: (s: {
            amount: number;
            tags: Set<string>;
            bytes: Uint8Array;
            n: number;
          }) => ({ ...s, n: s.n + 1 }),
        } satisfies ReducerSpec<
          { amount: number; tags: Set<string>; bytes: Uint8Array; n: number },
          EM
        >,
      },
    });

    const stop = persist(store, { key: "k", adapter, version: 1, throttleMs: 0, onError });
    await store.emit("ui", "poke", null);
    await stop();

    // A Set and a typed array are both faithfully representable, so neither is a loss.
    expect(onError.mock.calls.filter(([, phase]) => phase === "encode")).toEqual([]);
  });

  it("round-trips a persisted typed array through hydrate", async () => {
    // The headline case: before the binary tag this came back as `{"0":1,"1":2}`.
    const { adapter, written } = adapterSpy();

    const store = createStore({
      name: "BinaryPersistStore",
      reducer: {
        blob: {
          state: { bytes: new Uint8Array([1, 2, 3]), n: 0 },
          when: { any: true },
          reducer: (s: { bytes: Uint8Array; n: number }) => ({ ...s, n: s.n + 1 }),
        } satisfies ReducerSpec<{ bytes: Uint8Array; n: number }, EM>,
      },
    });

    const stop = persist(store, { key: "k", adapter, version: 1, throttleMs: 0 });
    await store.emit("ui", "poke", null);
    await stop();

    const restored = await hydrate({
      key: "k",
      adapter,
      version: 1,
      source: written[written.length - 1],
    });

    const bytes = (restored.slices.blob as { bytes: Uint8Array }).bytes;
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(Array.from(bytes)).toEqual([1, 2, 3]);
  });
});

describe("an encode that is both truncated and lossy", () => {
  it("reports the paths as well as the truncation", async () => {
    // A ternary reported only the truncation and threw the paths away, which are the
    // actionable half: "too large" says retry with less, a named path says which value to
    // change.
    class Money {
      constructor(public amount: number) {}
    }
    const written: string[] = [];
    const adapter: PersistenceAdapter = {
      read: () => null,
      write: (_k, v) => {
        written.push(v);
      },
      remove: () => {},
    };
    const onError = vi.fn();

    const store = createStore({
      name: "BothLossesStore",
      reducer: {
        big: {
          state: { price: null as Money | null, rows: [] as number[] },
          when: { any: true },
          reducer: (s: { price: Money | null; rows: number[] }) => ({
            price: new Money(1),
            rows: Array.from({ length: 50_000 }, (_, i) => i),
          }),
        } satisfies ReducerSpec<{ price: Money | null; rows: number[] }, EM>,
      },
    });

    const stop = persist(store, { key: "k", adapter, version: 1, throttleMs: 0, onError });
    await store.emit("ui", "poke", null);
    await stop();

    const encodeErrors = onError.mock.calls
      .filter(([, phase]) => phase === "encode")
      .map(([e]) => String(e));
    expect(encodeErrors.length).toBeGreaterThan(0);
    expect(encodeErrors[0]).toContain("/slices/big/price");
  });
});
