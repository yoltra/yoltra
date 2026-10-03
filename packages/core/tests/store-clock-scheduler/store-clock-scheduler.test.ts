import { afterEach, describe, expect, it, vi } from "vitest";

import { createStore, persist } from "../../src/index";
import type { Clock, InstrumentedEvent, PersistenceAdapter, ReducerSpec, Scheduler, TimerHandle } from "../../src/index";
import { CallTimeoutError } from "../../src/store/call";

/**
 * The store's time and timers come from two ports, `clock` and `scheduler`.
 *
 * Every place the store reads the time or arms a timer goes through them: the deduplication window
 * and its cache prune, the idle timeout of `call()`, and the timestamp on instrumented events.
 * `persist` takes a scheduler of its own. The defaults look the globals up at each use, so fake
 * timers installed after a store was built still drive it.
 */

type EM = {
  ui: { ping: number; big: unknown };
  rpc: { ask: null; answer: null };
};

const counter: ReducerSpec<{ n: number }, EM> = {
  state: { n: 0 },
  when: { keys: [["ui", "ping"], ["ui", "big"]] },
  reducer: (s) => ({ n: s.n + 1 }),
};

/** A clock that moves only when told to. */
function manualClock(start = 1_000): Clock & { advance(ms: number): void } {
  let t = start;
  return {
    now: () => t,
    advance(ms) {
      t += ms;
    },
  };
}

/** A scheduler that records timers and fires them only when told to. */
function manualScheduler() {
  let next = 1;
  const pending = new Map<number, { callback: () => void; delayMs: number }>();
  const cleared: TimerHandle[] = [];
  const scheduler: Scheduler = {
    setTimeout(callback, delayMs) {
      const handle = next++;
      pending.set(handle, { callback, delayMs });
      return handle;
    },
    clearTimeout(handle) {
      cleared.push(handle);
      pending.delete(handle as number);
    },
  };
  return {
    scheduler,
    pending,
    cleared,
    /** Fires every timer armed with `delayMs`, as if that much time had passed. */
    fire(delayMs: number) {
      for (const [handle, timer] of [...pending]) {
        if (timer.delayMs !== delayMs) continue;
        pending.delete(handle);
        timer.callback();
      }
    },
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("the deduplication window reads the injected clock", () => {
  it("coalesces within the window and lets the event through once the clock has moved past it", async () => {
    const clock = manualClock();
    const { scheduler } = manualScheduler();
    const store = createStore({ name: "Dedup", reducer: { c: counter }, dedupWindowMs: 50, clock, scheduler });

    await store.emit("ui", "ping", 1);
    await store.emit("ui", "ping", 1);
    expect(store.getState().c.n).toBe(1);

    // No real time passes in this test: only the injected clock decides.
    clock.advance(60);
    await store.emit("ui", "ping", 1);
    expect(store.getState().c.n).toBe(2);
    store.dispose();
  });
});

describe("the deduplication cache prune is armed on the injected scheduler", () => {
  it("arms one prune, empties the cache when it fires, and does not re-arm an empty cache", async () => {
    const clock = manualClock();
    const timers = manualScheduler();
    const store = createStore({
      name: "Prune",
      reducer: { c: counter },
      dedupWindowMs: 50,
      clock,
      scheduler: timers.scheduler,
    });

    await store.emit("ui", "ping", 1);
    await store.emit("ui", "ping", 2);
    expect([...timers.pending.values()].map((t) => t.delayMs)).toEqual([5000]);

    clock.advance(5000);
    timers.fire(5000);

    expect((store as unknown as { processedEvents: Map<string, number> }).processedEvents.size).toBe(0);
    expect(timers.pending.size).toBe(0);
    store.dispose();
  });

  it("re-arms while entries remain that are still inside their window", async () => {
    const clock = manualClock();
    const timers = manualScheduler();
    const store = createStore({
      name: "Rearm",
      reducer: { c: counter },
      dedupWindowMs: 10_000,
      clock,
      scheduler: timers.scheduler,
    });

    await store.emit("ui", "ping", 1);
    clock.advance(5000);
    timers.fire(5000);

    // The entry is younger than twice the window, so it stays, and so does a prune for it.
    expect((store as unknown as { processedEvents: Map<string, number> }).processedEvents.size).toBe(1);
    expect([...timers.pending.values()].map((t) => t.delayMs)).toEqual([5000]);
    store.dispose();
  });

  it("clears the pending prune through the scheduler on dispose", async () => {
    const timers = manualScheduler();
    const store = createStore({
      name: "Dispose",
      reducer: { c: counter },
      dedupWindowMs: 50,
      clock: manualClock(),
      scheduler: timers.scheduler,
    });
    await store.emit("ui", "ping", 1);
    const [handle] = [...timers.pending.keys()];

    store.dispose();

    expect(timers.cleared).toEqual([handle]);
    expect(timers.pending.size).toBe(0);
  });
});

describe("a call's idle timeout is armed on the injected scheduler", () => {
  it("rejects with CallTimeoutError when the scheduler fires it, with no real time passing", async () => {
    const timers = manualScheduler();
    const store = createStore<Record<string, never>, EM>({ name: "Call", scheduler: timers.scheduler });

    const reply = store.call("rpc", "ask", null, { reply: ["rpc", "answer"], timeoutMs: 1234 });
    expect([...timers.pending.values()].map((t) => t.delayMs)).toContain(1234);

    timers.fire(1234);

    await expect(reply).rejects.toBeInstanceOf(CallTimeoutError);
  });

  it("clears the timeout through the scheduler when the reply arrives", async () => {
    const timers = manualScheduler();
    const store = createStore<Record<string, never>, EM>({ name: "Call", scheduler: timers.scheduler });
    store.registerEffect({
      when: { keys: [["rpc", "ask"]] },
      effect: async (_event, _get, emit) => {
        await emit("rpc", "answer", null);
      },
    });

    await store.call("rpc", "ask", null, { reply: ["rpc", "answer"], timeoutMs: 1234 });

    expect(timers.cleared.length).toBeGreaterThan(0);
    expect([...timers.pending.values()].filter((t) => t.delayMs === 1234)).toHaveLength(0);
  });
});

describe("persist arms its coalescing timer on the scheduler it is given", () => {
  it("writes when that scheduler fires, and clears the timer when stopped", async () => {
    const timers = manualScheduler();
    const write = vi.fn();
    const adapter: PersistenceAdapter = { read: () => null, write, remove: () => undefined };
    const store = createStore({ name: "Persist", reducer: { c: counter } });
    const stop = persist(store as never, { key: "k", adapter, version: 1, throttleMs: 300, scheduler: timers.scheduler });

    await store.emit("ui", "ping", 1);
    expect(write).not.toHaveBeenCalled();
    expect([...timers.pending.values()].map((t) => t.delayMs)).toEqual([300]);

    timers.fire(300);
    expect(write).toHaveBeenCalledOnce();

    await store.emit("ui", "ping", 2);
    const [handle] = [...timers.pending.keys()];
    stop();
    expect(timers.cleared).toEqual([handle]);
    // Stopping flushes what was pending, so the last change is not lost with the timer.
    expect(write).toHaveBeenCalledTimes(2);
  });
});

describe("ports are called as methods", () => {
  it("keeps `this` for a clock and a scheduler written as classes", async () => {
    class OffsetClock implements Clock {
      #offset = 5_000;
      now(): number {
        return this.#offset;
      }
    }
    class CountingScheduler implements Scheduler {
      #armed = 0;
      get armed(): number {
        return this.#armed;
      }
      setTimeout(_callback: () => void, _delayMs: number): TimerHandle {
        this.#armed++;
        return { id: this.#armed };
      }
      clearTimeout(_handle: TimerHandle): void {
        this.#armed--;
      }
    }
    const clock = new OffsetClock();
    const scheduler = new CountingScheduler();
    const store = createStore({ name: "Classes", reducer: { c: counter }, dedupWindowMs: 50, clock, scheduler });
    const seen: InstrumentedEvent[] = [];
    store.instrument((info) => seen.push(info));

    await store.emit("ui", "ping", 1);

    expect(seen[0]!.at).toBe(5_000);
    expect(scheduler.armed).toBe(1);
    store.dispose();
    expect(scheduler.armed).toBe(0);
  });
});

describe("the defaults follow fake timers installed after the store was built", () => {
  it("dedups against the faked clock and prunes on the faked timers", async () => {
    const store = createStore({ name: "Late", reducer: { c: counter }, dedupWindowMs: 50 });
    vi.useFakeTimers();

    await store.emit("ui", "ping", 1);
    await store.emit("ui", "ping", 1);
    expect(store.getState().c.n).toBe(1);

    vi.advanceTimersByTime(60);
    await store.emit("ui", "ping", 1);
    expect(store.getState().c.n).toBe(2);

    vi.advanceTimersByTime(10_000);
    expect((store as unknown as { processedEvents: Map<string, number> }).processedEvents.size).toBe(0);
    store.dispose();
  });

  it("times a call out on the faked timers", async () => {
    const store = createStore<Record<string, never>, EM>({ name: "LateCall" });
    vi.useFakeTimers();

    const reply = store.call("rpc", "ask", null, { reply: ["rpc", "answer"], timeoutMs: 500 });
    const settled = expect(reply).rejects.toBeInstanceOf(CallTimeoutError);
    vi.advanceTimersByTime(500);

    await settled;
  });
});

describe("instrumented events carry a time and their causal position", () => {
  it("stamps `at` from the injected clock", async () => {
    const clock = manualClock(42_000);
    const store = createStore({ name: "At", reducer: { c: counter }, clock });
    const seen: InstrumentedEvent[] = [];
    store.instrument((info) => seen.push(info));

    await store.emit("ui", "ping", 1);
    clock.advance(7);
    await store.emit("ui", "ping", 2);

    expect(seen.map((info) => info.at)).toEqual([42_000, 42_007]);
  });

  it("carries parentId and depth for a caused event, and neither for a root event", async () => {
    const store = createStore({ name: "Causal", reducer: { c: counter } });
    store.registerEffect({
      when: { keys: [["rpc", "ask"]] },
      effect: async (_event, _get, emit) => {
        await emit("rpc", "answer", null);
      },
    });
    const seen: InstrumentedEvent[] = [];
    store.instrument((info) => seen.push(info));

    await store.emit("rpc", "ask", null);

    const [root, caused] = seen;
    expect(root!.event).not.toHaveProperty("parentId");
    expect(root!.event).not.toHaveProperty("depth");
    expect(caused!.event.parentId).toBe(root!.event.id);
    expect(caused!.event.depth).toBe(1);
  });
});

describe("a payload too large to fingerprint", () => {
  it("is never deduplicated, and leaves nothing in the dedup cache", async () => {
    const store = createStore({ name: "Big", reducer: { c: counter }, dedupWindowMs: 1_000 });
    const huge = { items: Array.from({ length: 20_000 }, (_, i) => ({ i })) };

    await store.emit("ui", "big", huge);
    await store.emit("ui", "big", huge);

    expect(store.getState().c.n).toBe(2);
    // The old never-dedupe fingerprint was a unique timestamp-and-random string, cached like any
    // other and matched by nothing.
    expect((store as unknown as { processedEvents: Map<string, number> }).processedEvents.size).toBe(0);
    store.dispose();
  });
});
