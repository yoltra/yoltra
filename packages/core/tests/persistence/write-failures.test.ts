/**
 * The write path's failure containment: persistence never throws into the application it is
 * persisting, whether the adapter fails synchronously or a beat later in a promise — and the
 * disposer flushes what was still pending so the last write is not lost with the timer.
 */

import { describe, expect, it, vi } from "vitest";

import { createStore, persist } from "../../src/index";
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
