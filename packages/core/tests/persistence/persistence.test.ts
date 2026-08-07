import { describe, expect, it, vi } from "vitest";

import {
  createMemoryAdapter,
  createStore,
  dehydrate,
  hydrate,
  persist,
  withHydration,
} from "../../src/index";
import type { PersistenceAdapter, ReducerSpec } from "../../src/index";

type EM = { app: { set: number; other: number } };

const counter: ReducerSpec<{ value: number }, EM> = {
  state: { value: 0 },
  when: { keys: [["app", "set"]] as never },
  reducer: (state, event) => ({ value: (event.payload as number) ?? state.value }),
};

const other: ReducerSpec<{ n: number }, EM> = {
  state: { n: 0 },
  when: { keys: [["app", "other"]] as never },
  reducer: (state, event) => ({ n: (event.payload as number) ?? state.n }),
};

const build = (reducers: { counter: typeof counter; other: typeof other }) =>
  createStore({ name: "App", reducer: reducers });

describe("hydration seeds the store rather than patching it", () => {
  it("starts from what was persisted", async () => {
    const adapter = createMemoryAdapter();
    await adapter.write("app", JSON.stringify({ version: 1, slices: { counter: { value: 7 } } }));

    const hydration = await hydrate({ key: "app", adapter, version: 1 });
    const store = build(withHydration({ counter, other }, hydration));

    expect(hydration.restored).toBe(true);
    expect(store.getState().counter.value).toBe(7);
  });

  it("restores by substituting initial state, never by applying a snapshot", async () => {
    // The mechanism is the point. Applying a whole-state snapshot to a live store emits a
    // change across every path: on boot that is a flash, a burst of instrumentation entries
    // describing changes nobody made, and effects observing a transition that never happened.
    //
    // Asserted on `withHydration` and on `__applyExternalState`, because an observer attached
    // after construction cannot see construction-time events and so would pass either way.
    const adapter = createMemoryAdapter();
    await adapter.write("app", JSON.stringify({ version: 1, slices: { counter: { value: 7 } } }));

    const hydration = await hydrate({ key: "app", adapter, version: 1 });
    const hydrated = withHydration({ counter, other }, hydration);

    // The restored value arrives as the reducer's declared initial state.
    expect(hydrated.counter.state).toEqual({ value: 7 });
    // And the original spec is left alone, so a second store does not inherit the first's.
    expect(counter.state).toEqual({ value: 0 });

    const store = build(hydrated);
    const applyExternal = vi.spyOn(
      store as unknown as { __applyExternalState: (n: unknown) => void },
      "__applyExternalState",
    );

    expect(store.getState().counter.value).toBe(7);
    expect(applyExternal).not.toHaveBeenCalled();
  });

  it("keeps declared defaults for slices the payload does not mention", async () => {
    // Adding a reducer must not invalidate everything written before it existed.
    const adapter = createMemoryAdapter({
      app: JSON.stringify({ version: 1, slices: { counter: { value: 3 } } }),
    });

    const store = build(
      withHydration({ counter, other }, await hydrate({ key: "app", adapter, version: 1 })),
    );

    expect(store.getState().counter.value).toBe(3);
    expect(store.getState().other.n).toBe(0);
  });
});

describe("a bad payload never stops a store from starting", () => {
  const cases: Array<[string, string]> = [
    ["unparseable", "{not json"],
    ["not an envelope", JSON.stringify({ nope: true })],
  ];

  for (const [name, payload] of cases) {
    it(`falls back to defaults when the payload is ${name}`, async () => {
      const onError = vi.fn();
      const adapter = createMemoryAdapter({ app: payload });

      const hydration = await hydrate({ key: "app", adapter, version: 1, onError });
      const store = build(withHydration({ counter, other }, hydration));

      expect(hydration.restored).toBe(false);
      expect(store.getState().counter.value).toBe(0);
      expect(onError).toHaveBeenCalled();
    });
  }

  it("refuses a version it cannot migrate, rather than trusting it", async () => {
    // A snapshot written against older reducers is not merely stale; it may not be valid
    // state for this build at all.
    const onError = vi.fn();
    const adapter = createMemoryAdapter({
      app: JSON.stringify({ version: 1, slices: { counter: { value: 9 } } }),
    });

    const hydration = await hydrate({ key: "app", adapter, version: 2, onError });

    expect(hydration.restored).toBe(false);
    expect(onError).toHaveBeenCalledWith(expect.any(Error), "migrate");
  });

  it("uses migrate when one is supplied", async () => {
    const adapter = createMemoryAdapter({
      app: JSON.stringify({ version: 1, slices: { counter: { count: 9 } } }),
    });

    const hydration = await hydrate({
      key: "app",
      adapter,
      version: 2,
      migrate: (persisted) => ({
        counter: { value: (persisted as { counter: { count: number } }).counter.count },
      }),
    });

    expect(hydration.slices).toEqual({ counter: { value: 9 } });
  });

  it("starts fresh when migrate declines", async () => {
    const adapter = createMemoryAdapter({
      app: JSON.stringify({ version: 1, slices: { counter: { value: 9 } } }),
    });

    const hydration = await hydrate({ key: "app", adapter, version: 2, migrate: () => null });
    expect(hydration.restored).toBe(false);
  });

  it("survives an adapter that throws on read", async () => {
    const onError = vi.fn();
    const adapter: PersistenceAdapter = {
      read: () => {
        throw new Error("storage unavailable");
      },
      write: () => undefined,
      remove: () => undefined,
    };

    expect((await hydrate({ key: "app", adapter, version: 1, onError })).restored).toBe(false);
    expect(onError).toHaveBeenCalledWith(expect.any(Error), "read");
  });
});

describe("writing", () => {
  it("writes what changed, and round trips", async () => {
    const adapter = createMemoryAdapter();
    const store = build({ counter, other });

    const stop = persist(store as never, { key: "app", adapter, version: 1, throttleMs: 0 });
    await store.emit("app", "set", 42);
    stop();

    const restored = await hydrate({ key: "app", adapter, version: 1 });
    expect((restored.slices.counter as { value: number }).value).toBe(42);
  });

  it("stays quiet when only an unwatched slice changes", async () => {
    const writes: string[] = [];
    const adapter: PersistenceAdapter = {
      read: () => null,
      write: (_k, v) => {
        writes.push(v);
      },
      remove: () => undefined,
    };
    const store = build({ counter, other });

    const stop = persist(store as never, {
      key: "app",
      adapter,
      version: 1,
      throttleMs: 0,
      slices: ["counter"],
    });

    await store.emit("app", "other", 5);
    expect(writes).toHaveLength(0);

    await store.emit("app", "set", 5);
    expect(writes).toHaveLength(1);
    stop();
  });

  it("does not let a failing adapter reach the application", async () => {
    const onError = vi.fn();
    const adapter: PersistenceAdapter = {
      read: () => null,
      write: () => {
        throw new Error("quota exceeded");
      },
      remove: () => undefined,
    };
    const store = build({ counter, other });

    const stop = persist(store as never, { key: "app", adapter, version: 1, throttleMs: 0, onError });
    await expect(store.emit("app", "set", 1)).resolves.toBeUndefined();
    stop();

    expect(onError).toHaveBeenCalledWith(expect.any(Error), "write");
  });

  it("coalesces a burst into one write and flushes on stop", async () => {
    vi.useFakeTimers();
    const writes: string[] = [];
    const adapter: PersistenceAdapter = {
      read: () => null,
      write: (_k, v) => {
        writes.push(v);
      },
      remove: () => undefined,
    };
    const store = build({ counter, other });
    const stop = persist(store as never, { key: "app", adapter, version: 1, throttleMs: 50 });

    for (let i = 1; i <= 5; i++) await store.emit("app", "set", i);
    expect(writes).toHaveLength(0);

    vi.advanceTimersByTime(50);
    expect(writes).toHaveLength(1);
    stop();
    vi.useRealTimers();
  });
});

describe("exotic values survive the trip", () => {
  it("round trips what JSON alone would destroy", async () => {
    // The reason this reuses the devtools codec instead of JSON.stringify: a Map does not
    // fail to serialize, it silently becomes {}.
    const adapter = createMemoryAdapter();
    const rich = {
      state: {
        index: new Map([["a", 1]]),
        tags: new Set(["x"]),
        when: new Date("2026-01-01T00:00:00.000Z"),
        big: 10n,
        missing: undefined,
      },
      when: { any: true } as never,
      reducer: (s: unknown) => s,
    } as never;

    const store = createStore({ name: "Rich", reducer: { rich } });
    const stop = persist(store as never, { key: "r", adapter, version: 1, throttleMs: 0 });
    await store.emit("app" as never, "set" as never, 1 as never);
    stop();

    const back = (await hydrate({ key: "r", adapter, version: 1 })).slices.rich as {
      index: Map<string, number>;
      tags: Set<string>;
      when: Date;
      big: bigint;
    };

    expect(back.index).toBeInstanceOf(Map);
    expect(back.index.get("a")).toBe(1);
    expect(back.tags).toBeInstanceOf(Set);
    expect(back.when).toBeInstanceOf(Date);
    expect(back.big).toBe(10n);
  });
});

describe("server handoff", () => {
  it("dehydrates and rehydrates without sharing references", async () => {
    // The classic SSR leak: two requests ending up with the same object.
    const server = build({ counter, other });
    await server.emit("app", "set", 5);

    const payload = dehydrate(server as never, { version: 1 });
    const first = build(withHydration({ counter, other }, await hydrate({ key: "", adapter: createMemoryAdapter(), version: 1, source: payload })));
    const second = build(withHydration({ counter, other }, await hydrate({ key: "", adapter: createMemoryAdapter(), version: 1, source: payload })));

    expect(first.getState().counter.value).toBe(5);
    expect(second.getState().counter.value).toBe(5);
    expect(first.getState().counter).not.toBe(second.getState().counter);
  });
});
