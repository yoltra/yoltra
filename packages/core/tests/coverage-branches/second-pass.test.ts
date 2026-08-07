/**
 * Second pass to the floor: `emitWith`'s lazy-payload delivery has the same containment
 * duties as `emit`, a scoped `slices` list must ignore writes to slices it does not watch,
 * and a hot-replace must mount a slice it has never seen.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { createStore, persist } from "../../src/index";
import type { PersistenceAdapter, ReducerSpec } from "../../src/index";
import { LooseEventBus } from "../../src/eventBus/LooseEventBus";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("emitWith", () => {
  it("delivers the made payload once per handler and contains a throw", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const bus = new LooseEventBus<string, string, unknown>();
    const seen: unknown[] = [];
    let made = 0;

    const both = (p: unknown): void => {
      seen.push(p);
    };
    // Subscribed exactly AND via a matching pattern: the dedupe set must deliver once.
    bus.on("state", "todos.1", both);
    bus.on("state", "todos.*", both);
    bus.on("state", "todos.*", () => {
      throw new Error("contained");
    });

    bus.emitWith("state", "todos.1", () => {
      made += 1;
      return { fresh: true };
    });

    expect(made).toBe(1);
    expect(seen).toEqual([{ fresh: true }]);
    expect(error).toHaveBeenCalled();
  });
});

describe("persist with a slices scope", () => {
  type EM = { ui: { pokeA: null; pokeB: null } };
  const a: ReducerSpec<{ n: number }, EM> = {
    state: { n: 0 },
    when: { keys: [["ui", "pokeA"]] },
    reducer: (s) => ({ n: s.n + 1 }),
  };
  const b: ReducerSpec<{ n: number }, EM> = {
    state: { n: 0 },
    when: { keys: [["ui", "pokeB"]] },
    reducer: (s) => ({ n: s.n + 1 }),
  };

  it("ignores changes outside the watched slices and projects only them into the envelope", async () => {
    const writes: string[] = [];
    const adapter: PersistenceAdapter = {
      read: () => null,
      write: (_key, value) => {
        writes.push(value);
      },
      remove: () => undefined,
    };
    const store = createStore<{ a: { n: number }; b: { n: number } }, EM>({
      name: "scoped",
      reducer: { a, b },
    });
    // No throttleMs: the default applies, and the disposer's flush is what writes.
    const stop = persist(store as never, { key: "app", adapter, version: 1, slices: ["a"] });

    await store.emit("ui", "pokeB", null);
    stop();
    // Only the unwatched slice changed: nothing was worth writing.
    expect(writes).toHaveLength(0);

    const again = persist(store as never, { key: "app", adapter, version: 1, slices: ["a"] });
    await store.emit("ui", "pokeA", null);
    again();

    expect(writes).toHaveLength(1);
    // The envelope carries the watched slice and not its neighbour.
    expect(writes[0]).toContain('"a"');
    expect(writes[0]).not.toContain('"b"');
  });
});

describe("hotReplace with a slice the store has never seen", () => {
  type EM = { ui: { poke: null } };
  const counter: ReducerSpec<{ n: number }, EM> = {
    state: { n: 0 },
    when: { keys: [["ui", "poke"]] },
    reducer: (s) => ({ n: s.n + 1 }),
  };

  it("keeps the existing slice's state and mounts the newcomer fresh", async () => {
    const store = createStore<{ counter: { n: number } }, EM>({
      name: "hot",
      reducer: { counter },
    });
    await store.emit("ui", "poke", null);
    expect(store.getState().counter.n).toBe(1);

    const late: ReducerSpec<{ tag: string }, EM> = {
      state: { tag: "fresh" },
      when: { keys: [["ui", "poke"]] },
      reducer: (s) => s,
    };
    store.hotReplace({
      reducer: { counter, late } as never,
      preserveState: true,
    });

    const state = store.getState() as { counter: { n: number }; late: { tag: string } };
    // The survivor kept its state; the newcomer starts from its own initial.
    expect(state.counter.n).toBe(1);
    expect(state.late.tag).toBe("fresh");
  });
});
