import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { createStore } from "../../src/store/Store";
import type { ReducerSpec } from "../../src/types";

/**
 * A throwing reducer, whichever way its slice is targeted.
 *
 * The same bug used to produce two different outcomes. A **keyed** reducer ran through the
 * reducer bus, whose handler loop caught and logged: the event committed and its effects ran as
 * if nothing had happened. A **pattern** reducer was called straight from the drain, so its
 * throw escaped, aborted the commit, and notified nobody — not even the uncommitted subscribers
 * a middleware veto would have reached. Neither case was observable through a hook.
 */

type Events = {
  app: { boom: null; fine: null };
};

type State = { n: number };

/** Throws on `boom`, counts `fine`. */
function explodingSpec(targeting: "keyed" | "pattern"): ReducerSpec<State, Events> {
  return {
    state: { n: 0 },
    ...(targeting === "keyed"
      ? { when: { keys: [["app", "boom"], ["app", "fine"]] } as never }
      : { when: { channel: "app" } as never }),
    reducer(state, event) {
      if (event.type === "boom") throw new Error("reducer exploded");
      return { n: state.n + 1 };
    },
  };
}

/** A second, healthy slice so isolation is observable. */
const bystanderSpec: ReducerSpec<State, Events> = {
  state: { n: 0 },
  when: { keys: [["app", "boom"], ["app", "fine"]] } as never,
  reducer: (state) => ({ n: state.n + 1 }),
};

// Braces matter here. A concise arrow body returns the spy, and Vitest treats a function
// returned from `beforeEach` as a per-test cleanup callback — one it runs *after* `afterEach`
// has already restored the mock. The spy then fires with no arguments, falls through to the
// real `console.error`, and prints a blank line per test.
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe.each(["keyed", "pattern"] as const)("a %s reducer that throws", (targeting) => {
  function build(onReducerError?: (e: unknown, ev: unknown, slice: string) => void) {
    return createStore<{ boom: State; bystander: State }, Events>({
      name: "Errors",
      reducer: { boom: explodingSpec(targeting), bystander: bystanderSpec },
      ...(onReducerError !== undefined ? { onReducerError: onReducerError as never } : {}),
    });
  }

  it("does not reject the emit", async () => {
    const store = build();
    await expect(store.emit("app", "boom", null)).resolves.toBeUndefined();
  });

  it("leaves its own slice untouched", async () => {
    const store = build();
    await store.emit("app", "boom", null);
    expect(store.getState().boom.n).toBe(0);
  });

  it("lets every other slice reduce", async () => {
    const store = build();
    await store.emit("app", "boom", null);

    // Isolation, not rollback: fine-grained subscribers are notified as each slice commits, so
    // an event that reverted afterwards would have already announced a value that no longer
    // exists. The healthy slice keeps its result.
    expect(store.getState().bystander.n).toBe(1);
  });

  it("reports through onReducerError, naming the slice", async () => {
    const seen: Array<{ message: string; slice: string }> = [];
    const store = build((error, _event, slice) => {
      seen.push({ message: (error as Error).message, slice });
    });

    await store.emit("app", "boom", null);

    expect(seen).toEqual([{ message: "reducer exploded", slice: "boom" }]);
  });

  it("keeps working on the next event", async () => {
    const store = build();
    await store.emit("app", "boom", null);
    await store.emit("app", "fine", null);

    // A single bad event must not poison the pipeline.
    expect(store.getState().boom.n).toBe(1);
    expect(store.getState().bystander.n).toBe(2);
  });

  it("still runs effects, because the event committed", async () => {
    const ran = vi.fn();
    const store = createStore<{ boom: State; bystander: State }, Events>({
      name: "Errors",
      reducer: { boom: explodingSpec(targeting), bystander: bystanderSpec },
      effects: [{ when: { keys: [["app", "boom"]] } as never, effect: async () => void ran() }],
    });

    await store.emit("app", "boom", null);

    // The bystander slice genuinely changed, so the event is a commit. Skipping effects here
    // would make one slice's bug silently cancel unrelated work.
    expect(ran).toHaveBeenCalledOnce();
  });
});

describe("payload stored by reference", () => {
  type AliasEvents = { app: { store: { title: string } } };
  type AliasState = { items: Array<{ title: string }> };

  /** Keeps the payload object itself, which is the anti-pattern under test. */
  const keepsRef: ReducerSpec<AliasState, AliasEvents> = {
    state: { items: [] },
    when: { keys: [["app", "store"]] } as never,
    reducer: (state, event) => ({ items: [...state.items, event.payload as { title: string }] }),
  };

  /** Copies it, which is what a reducer should do. */
  const copies: ReducerSpec<AliasState, AliasEvents> = {
    state: { items: [] },
    when: { keys: [["app", "store"]] } as never,
    reducer: (state, event) => ({
      items: [...state.items, { ...(event.payload as { title: string }) }],
    }),
  };

  it("warns once, naming the slice and the event", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const store = createStore<{ kept: AliasState }, AliasEvents>({
      name: "Alias",
      reducer: { kept: keepsRef },
    });

    await store.emit("app", "store", { title: "A" });
    await store.emit("app", "store", { title: "B" });

    // Once per slice and event: the point is to name the pattern, not to fill the console.
    expect(warn).toHaveBeenCalledTimes(1);
    const message = warn.mock.calls[0]![0] as string;
    expect(message).toContain('"kept"');
    expect(message).toContain("app/store");
  });

  it("stays quiet when the reducer copies the payload", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const store = createStore<{ copied: AliasState }, AliasEvents>({
      name: "Alias",
      reducer: { copied: copies },
    });

    await store.emit("app", "store", { title: "A" });

    expect(warn).not.toHaveBeenCalled();
    expect(store.getState().copied.items[0]!.title).toBe("A");
  });

  it("warns again for a store built after the first one was disposed", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const build = () =>
      createStore<{ kept: AliasState }, AliasEvents>({ name: "Alias", reducer: { kept: keepsRef } });

    const first = build();
    await first.emit("app", "store", { title: "A" });
    expect(warn).toHaveBeenCalledTimes(1);

    first.dispose();

    // The latch is per-store and has to be released with it. Left set, a per-route store, an
    // HMR cycle or a test building one store per case inherits the suppression — and the code
    // that never got warned is exactly the code that needed it.
    const second = build();
    await second.emit("app", "store", { title: "B" });
    expect(warn).toHaveBeenCalledTimes(2);
  });
});

describe("middleware that returns a promise", () => {
  type MwEvents = { app: { act: null } };
  type MwState = { n: number };

  const spec: ReducerSpec<MwState, MwEvents> = {
    state: { n: 0 },
    when: { keys: [["app", "act"]] } as never,
    reducer: (state) => ({ n: state.n + 1 }),
  };

  it("reports that the veto inside it can never fire", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const store = createStore<{ s: MwState }, MwEvents>({
      name: "Mw",
      reducer: { s: spec },
      // The shape the TSDoc used to demonstrate. A Promise is truthy, so the event is allowed
      // without waiting and the `false` this resolves to is never consulted.
      middleware: [(async () => false) as never],
    });

    await store.emit("app", "act", null);

    expect(store.getState().s.n).toBe(1); // allowed, exactly as the truthiness implies
    const message = error.mock.calls.map((c) => String(c[0])).find((m) => m.includes("Promise"));
    expect(message).toContain("app/act");
    expect(message).toContain("can never veto");
  });

  it("says nothing for an ordinary synchronous middleware", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const store = createStore<{ s: MwState }, MwEvents>({
      name: "Mw",
      reducer: { s: spec },
      middleware: [(() => true) as never],
    });

    await store.emit("app", "act", null);

    expect(error).not.toHaveBeenCalled();
  });

  it("still vetoes when a synchronous middleware returns false", async () => {
    const store = createStore<{ s: MwState }, MwEvents>({
      name: "Mw",
      reducer: { s: spec },
      middleware: [(() => false) as never],
    });

    await store.emit("app", "act", null);

    expect(store.getState().s.n).toBe(0);
  });
});
