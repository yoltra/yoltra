import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createStore } from "../../src/store/Store";
import type { ReducerSpec } from "../../src/types";

type EM = {
  ui: {
    ping: number;
    nested: number;
  };
};

type State = {
  counter: { value: number };
};

const reducerSpec: ReducerSpec<State["counter"], EM> = {
  state: { value: 0 },
  when: { keys: [
    ["ui", "ping"],
    ["ui", "nested"],
  ] },
  reducer(state, event) {
    if (event.channel === "ui" && event.type === "ping") {
      return { value: state.value + (event.payload as number) };
    }
    if (event.channel === "ui" && event.type === "nested") {
      return { value: state.value + (event.payload as number) };
    }
    return state;
  },
};

describe("Store - event queue and deduplication", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("processes events FIFO and prevents re-entrancy from starting multiple drains", async () => {
    const nestedLogs: string[] = [];

    const store = createStore({
      name: "QueueStore",
      reducer: {
        counter: reducerSpec,
      },
    });

    // Middleware that emits a nested event (synchronously queued for reduction)
    store.registerMiddleware((_state, event, emit) => {
      if (event.channel === "ui" && event.type === "ping") {
        nestedLogs.push("mw-before");
        emit("ui", "nested", 2);
        nestedLogs.push("mw-after");
      }
      return true;
    });

    await store.emit("ui", "ping", 1);

    const state = store.getState();
    expect(state.counter.value).toBe(3);
    expect(nestedLogs).toEqual(["mw-before", "mw-after"]);
  });

  it("tracks processed event fingerprints and clears them on interval (dedup enabled)", async () => {
    const store = createStore({
      name: "QueueStore2",
      reducer: {
        counter: reducerSpec,
      },
      dedupWindowMs: 50,
    }) as any;

    // after first emit, there should be some processed fingerprints
    await store.emit("ui", "ping", 1);
    const map: Map<string, number> = store.processedEvents;
    expect(map.size).toBeGreaterThan(0);

    // advance timers to trigger cleanup interval (5s intervals, prunes old entries)
    vi.advanceTimersByTime(10_000);

    // After cleanup, old entries should be pruned
    expect(map.size).toBe(0);
  });

  it("dispose clears the cleanup timer and processed fingerprints (dedup enabled)", () => {
    const store = createStore({
      name: "QueueStore3",
      reducer: {
        counter: reducerSpec,
      },
      dedupWindowMs: 50,
    }) as any;

    // Lazy: the timer is not running until a dedup-cached event starts it.
    expect(store.eventCleanupTimer).toBeNull();
    store.processedEvents.set("ui::increment::1", Date.now());
    store.ensureCleanupTimer();
    expect(store.eventCleanupTimer).not.toBeNull();

    store.dispose();

    expect(store.eventCleanupTimer).toBeNull();
    expect(store.processedEvents.size).toBe(0);
  });
});

describe("Store - deduplication is opt-in (C2)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does NOT drop rapid-fire identical events by default", async () => {
    const store = createStore({ name: "NoDedup", reducer: { counter: reducerSpec } });

    // Three identical emits in the same instant — all must be processed.
    await store.emit("ui", "ping", 1);
    await store.emit("ui", "ping", 1);
    await store.emit("ui", "ping", 1);

    expect(store.getState().counter.value).toBe(3);
    // Nothing is fingerprinted and no cleanup timer runs when dedup is off.
    expect((store as any).processedEvents.size).toBe(0);
    expect((store as any).eventCleanupTimer).toBeNull();
  });

  it("coalesces identical payloads within the window when dedupWindowMs > 0", async () => {
    const store = createStore({
      name: "ContentDedup",
      reducer: { counter: reducerSpec },
      dedupWindowMs: 50,
    });

    // Same payload, same instant → the second is a content duplicate.
    await store.emit("ui", "ping", 1);
    await store.emit("ui", "ping", 1);
    expect(store.getState().counter.value).toBe(1);

    // Past the window → fires again.
    vi.advanceTimersByTime(60);
    await store.emit("ui", "ping", 1);
    expect(store.getState().counter.value).toBe(2);
  });

  it("dedupKey coalesces only re-fires of the SAME keyed emit, even with content-dedup off", async () => {
    const store = createStore({ name: "KeyedDedup", reducer: { counter: reducerSpec } });

    // Same key, same instant → the re-fire is dropped (e.g. Strict Mode double-invoke).
    await store.emit("ui", "ping", 1, { dedupKey: "k" });
    await store.emit("ui", "ping", 1, { dedupKey: "k" });
    expect(store.getState().counter.value).toBe(1);

    // A different key is a distinct logical emit → fires.
    await store.emit("ui", "ping", 1, { dedupKey: "k2" });
    expect(store.getState().counter.value).toBe(2);

    // No key at all → always fires; an identical payload is never coalesced.
    await store.emit("ui", "ping", 1);
    expect(store.getState().counter.value).toBe(3);

    // Past the keyed window, the same key fires again.
    vi.advanceTimersByTime(150);
    await store.emit("ui", "ping", 1, { dedupKey: "k" });
    expect(store.getState().counter.value).toBe(4);
  });

  it("dedupKey honours the configured content window when dedupWindowMs > 0", async () => {
    const store = createStore({
      name: "KeyedWithWindow",
      reducer: { counter: reducerSpec },
      dedupWindowMs: 200,
    });

    // With content-dedup enabled, a keyed emit dedups within that same window.
    await store.emit("ui", "ping", 1, { dedupKey: "k" });
    await store.emit("ui", "ping", 1, { dedupKey: "k" });
    expect(store.getState().counter.value).toBe(1);

    // Still within 200ms → still deduped.
    vi.advanceTimersByTime(100);
    await store.emit("ui", "ping", 1, { dedupKey: "k" });
    expect(store.getState().counter.value).toBe(1);

    // Past 200ms → fires again.
    vi.advanceTimersByTime(150);
    await store.emit("ui", "ping", 1, { dedupKey: "k" });
    expect(store.getState().counter.value).toBe(2);
  });

  it("content-dedup fingerprints object, null, and non-serializable payloads", async () => {
    type FpEM = { ui: { obj: { a: number }; nul: null; bad: unknown } };
    const spec: ReducerSpec<{ n: number }, FpEM> = {
      state: { n: 0 },
      when: { keys: [
        ["ui", "obj"],
        ["ui", "nul"],
        ["ui", "bad"],
      ] },
      reducer(state) {
        return { n: state.n + 1 };
      },
    };
    const store = createStore({ name: "Fp", reducer: { s: spec }, dedupWindowMs: 50 });

    // object payload → codec fingerprint; identical within window coalesces
    await store.emit("ui", "obj", { a: 1 });
    await store.emit("ui", "obj", { a: 1 });
    expect(store.getState().s.n).toBe(1);

    // null payload → null fast-path
    await store.emit("ui", "nul", null);
    await store.emit("ui", "nul", null);
    expect(store.getState().s.n).toBe(2);

    // Circular payload now coalesces. It used to throw inside `JSON.stringify`, fall through
    // to a timestamp-plus-random fingerprint and never dedupe however identical, so this
    // asserted 4. The codec encodes a cycle as a `$yoltra: "ref"` marker, which is stable, so
    // two identical cyclic payloads are finally recognised as the same content.
    const circular: { self?: unknown } = {};
    circular.self = circular;
    await store.emit("ui", "bad", circular);
    await store.emit("ui", "bad", circular);
    expect(store.getState().s.n).toBe(3);
  });
});

describe("content dedup fingerprints through the codec", () => {
  // `JSON.stringify` collapsed a Map, a Set and every typed array to `{}`, so two distinct
  // payloads shared a fingerprint and the second event was silently swallowed - the exact
  // behaviour the README says Yoltra refuses to do by default. BigInt and cycles threw into
  // a random fallback and were never deduped at all.

  type Payloads = { ui: { send: unknown } };

  /** Emits both payloads inside one dedup window and reports how many committed. */
  async function commitsFor(a: unknown, b: unknown): Promise<number> {
    const store = createStore({
      name: "DedupCodecStore",
      dedupWindowMs: 1_000,
      reducer: {
        log: {
          state: { n: 0 },
          when: { any: true },
          reducer: (s: { n: number }) => ({ n: s.n + 1 }),
        } satisfies ReducerSpec<{ n: number }, Payloads>,
      },
    });

    const first = await store.emit("ui", "send", a as never);
    const second = await store.emit("ui", "send", b as never);
    return Number(first.committed) + Number(second.committed);
  }

  it("does not dedupe two different Maps", async () => {
    expect(
      await commitsFor(new Map([["a", 1]]), new Map([["b", 2]])),
    ).toBe(2);
  });

  it("dedupes two equal Maps", async () => {
    expect(await commitsFor(new Map([["a", 1]]), new Map([["a", 1]]))).toBe(1);
  });

  it("does not dedupe two different typed arrays", async () => {
    expect(await commitsFor(new Uint8Array([1, 2]), new Uint8Array([3, 4]))).toBe(2);
  });

  it("does not dedupe two different Sets", async () => {
    expect(await commitsFor(new Set(["a"]), new Set(["b"]))).toBe(2);
  });

  it("treats null and undefined as different events", async () => {
    // Both collapsed to `::null` before, so a "cleared" event swallowed a "missing" one.
    expect(await commitsFor(null, undefined)).toBe(2);
  });

  it("treats the number 1 and the string \"1\" as different events", async () => {
    // `String(payload)` made these identical. Same for `true` and `"true"`.
    expect(await commitsFor(1, "1")).toBe(2);
    expect(await commitsFor(true, "true")).toBe(2);
  });

  it("dedupes objects that differ only in key order", async () => {
    // Insertion order is not content.
    expect(await commitsFor({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(1);
  });

  it("does NOT dedupe arrays that differ only in order", async () => {
    // Array order is semantic. Sorting to normalise would make genuinely different payloads
    // collide, which is worse than the bug being fixed: it drops real events.
    expect(await commitsFor([1, 2], [2, 1])).toBe(2);
  });

  it("does NOT dedupe Maps whose entries differ only in insertion order", async () => {
    // A Map preserves insertion order by specification, so two orderings are two payloads.
    expect(
      await commitsFor(
        new Map([
          ["a", 1],
          ["b", 2],
        ]),
        new Map([
          ["b", 2],
          ["a", 1],
        ]),
      ),
    ).toBe(2);
  });

  it("dedupes a cyclic payload against itself", async () => {
    // Previously threw inside JSON.stringify and fell through to a random fingerprint, so a
    // cyclic payload could never be deduped however identical.
    const makeCyclic = (): Record<string, unknown> => {
      const node: Record<string, unknown> = { id: 1 };
      node.self = node;
      return node;
    };
    expect(await commitsFor(makeCyclic(), makeCyclic())).toBe(1);
  });

  it("dedupes equal BigInt payloads", async () => {
    expect(await commitsFor({ big: 1n }, { big: 1n })).toBe(1);
    expect(await commitsFor({ big: 1n }, { big: 2n })).toBe(2);
  });

  it("never dedupes a payload past the fingerprint node budget", async () => {
    // Degrading to "never dedupe" rather than "maybe wrongly dedupe": two huge payloads
    // differing only past the cutoff must not collide.
    const huge = (tail: number): Record<string, unknown> => {
      const out: Record<string, unknown> = {};
      for (let i = 0; i < 12_000; i += 1) out[`k${i}`] = i;
      out.tail = tail;
      return out;
    };
    expect(await commitsFor(huge(1), huge(1))).toBe(2);
  });

  it("never dedupes a payload the codec cannot read", async () => {
    // The codec is total over the values it knows, so the only way to throw is a getter or
    // a sanitize hook that does. Same safe direction as the truncation case: refuse to
    // dedup rather than risk collapsing two events we could not compare.
    const withAngryGetter = (): Record<string, unknown> => ({
      get boom(): never {
        throw new Error("nope");
      },
    });

    expect(await commitsFor(withAngryGetter(), withAngryGetter())).toBe(2);
  });

  it("leaves the explicit dedupKey path untouched", async () => {
    const store = createStore({
      name: "DedupKeyStore",
      reducer: {
        log: {
          state: { n: 0 },
          when: { any: true },
          reducer: (s: { n: number }) => ({ n: s.n + 1 }),
        } satisfies ReducerSpec<{ n: number }, Payloads>,
      },
    });

    // Different content, same key: the key wins and `fingerprint` is never consulted.
    const a = await store.emit("ui", "send", new Map([["a", 1]]) as never, { dedupKey: "k" });
    const b = await store.emit("ui", "send", new Map([["b", 2]]) as never, { dedupKey: "k" });

    expect(a.committed).toBe(true);
    expect(b.committed).toBe(false);
  });
});
