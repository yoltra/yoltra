/**
 * The `"channel::type"` key, and the collision it can hide.
 *
 * @remarks
 * The store joins channel and type into one key and dispatches, deduplicates and introspects on it.
 * Two different pairs can produce the same key — `("a::b", "c")` and `("a", "b::c")` both join to
 * `"a::b::c"` — so a subscriber for one is invoked for the other, and with a dedup window one
 * silently drops the other. That was demonstrable against the published package.
 *
 * The warning is on the collision, not on `::`. A consuming runtime asserted the store
 * "structurally forbids `::` in a local channel name"; it does not, and must not, because `::` is
 * how a federated peer's channel is namespaced. Warning on the separator would fire for correct
 * code, and a warning nobody can act on is one everybody mutes.
 */

import { describe, it, expect, vi, afterEach } from "vitest";

import { createStore } from "../../src/store/Store";
import { createKeyCollisionCheck } from "../../src/utils/reservedSeparator";

type EM = {
  "a::b": { c: null };
  a: { "b::c": null };
  "bb::plan": { go: null };
  plain: { go: null };
};
type State = { s: { n: number } };

function store(name: string) {
  return createStore<State, EM>({
    name,
    reducer: { s: { state: { n: 0 }, when: { any: true }, reducer: (x) => x } },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("a colliding key warns", () => {
  it("names both pairs, because either alone looks blameless", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const s = store("CollideBoth");

    await s.emit("a::b", "c", null);
    await s.emit("a", "b::c", null);

    expect(warn).toHaveBeenCalledTimes(1);
    const message = String(warn.mock.calls[0]![0]);
    expect(message).toContain('("a::b", "c")');
    expect(message).toContain('("a", "b::c")');
    expect(message).toContain('"a::b::c"');
    s.dispose();
  });

  it("warns once per colliding key, not once per event", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const s = store("CollideOnce");

    await s.emit("a::b", "c", null);
    await s.emit("a", "b::c", null);
    await s.emit("a::b", "c", null);
    await s.emit("a", "b::c", null);

    expect(warn).toHaveBeenCalledTimes(1);
    s.dispose();
  });

  it("stays silent for a namespaced channel that collides with nothing", async () => {
    // The case that must not warn. `alias::channel` is how a federated peer's channel is
    // namespaced, so a store bridging peers is full of legitimate `::`.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const s = store("NamespacedQuiet");

    await s.emit("bb::plan", "go", null);
    await s.emit("bb::plan", "go", null);

    expect(warn).not.toHaveBeenCalled();
    s.dispose();
  });

  it("stays silent when no separator is involved at all", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const s = store("PlainQuiet");

    await s.emit("plain", "go", null);

    expect(warn).not.toHaveBeenCalled();
    s.dispose();
  });
});

describe("the record is per store", () => {
  /**
   * The keys only collide inside one store's maps. A process-wide record got both directions
   * wrong: a second store with the same collision stayed silent because the first had already
   * reported it, and two stores each using one of the pairs, which cannot interfere, were
   * reported as colliding.
   */
  it("names the store whose keys collide", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const s = store("Orders");

    await s.emit("a::b", "c", null);
    await s.emit("a", "b::c", null);

    expect(String(warn.mock.calls[0]![0])).toContain('Store "Orders"');
    s.dispose();
  });

  it("warns for a second store with the same collision", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const first = store("First");
    const second = store("Second");

    for (const s of [first, second]) {
      await s.emit("a::b", "c", null);
      await s.emit("a", "b::c", null);
    }

    expect(warn).toHaveBeenCalledTimes(2);
    expect(String(warn.mock.calls[0]![0])).toContain('Store "First"');
    expect(String(warn.mock.calls[1]![0])).toContain('Store "Second"');
    first.dispose();
    second.dispose();
  });

  it("stays silent when the two pairs are in different stores", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const left = store("Left");
    const right = store("Right");

    await left.emit("a::b", "c", null);
    await right.emit("a", "b::c", null);

    expect(warn).not.toHaveBeenCalled();
    left.dispose();
    right.dispose();
  });

  it("stays silent in production", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "production");
    try {
      const check = createKeyCollisionCheck("Prod");
      check("a::b", "c");
      check("a", "b::c");
    } finally {
      vi.unstubAllEnvs();
    }
    expect(warn).not.toHaveBeenCalled();
  });
});

describe("introspection survives a channel that contains the separator", () => {
  it("reports the channel whole rather than its first segment", () => {
    // The read-back paths split on the first separator, so an effect on ("bb::plan", "go") was
    // reported as channel "bb", type "plan" — a registration on a channel that does not exist,
    // and the real one missing. Splitting on the last separator is correct because a type never
    // contains one in any path the store controls.
    const s = store("SplitIntrospect");

    s.onEffect("bb::plan", "go", () => {});

    const found = s.__devtoolsIntrospect().effects.find((e) => e.type === "go");
    expect(found).toBeDefined();
    expect(found!.channel).toBe("bb::plan");

    s.dispose();
  });
});
