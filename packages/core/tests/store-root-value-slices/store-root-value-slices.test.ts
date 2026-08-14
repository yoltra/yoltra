import { describe, it, expect, vi } from "vitest";

import { createStore } from "../../src/store/Store";
import type { Change, InstrumentedEvent, ReducerSpec } from "../../src/types";

// A slice whose state IS one value — no keys to walk below it. `detectChangedProps` reports a
// change to such a slice at the empty path `""`, and the write path used to drop that as falsy:
// the reducer ran, returned the new value, and the store kept the old one without a word.
//
// Every case here is a regression guard for that silence. The falsy TARGETS matter as much as
// the falsy paths: a fix that special-cases "the new value is truthy" re-breaks `1 -> 0`.

type EM = {
  x: {
    set: unknown;
  };
};

/**
 * A slice that replaces its whole value with whatever the event carries.
 *
 * Object payloads are copied rather than stored by reference — the store warns about the
 * aliasing otherwise, and it is right to: the emitter still holds that `Map`, and the freeze
 * is deep and in place. Copying here keeps the test asserting the write path rather than the
 * diagnostic.
 */
function rootSpec<S>(initial: S): ReducerSpec<S, EM> {
  return {
    state: initial,
    when: { any: true },
    reducer: (_state, event) => copy(event.payload) as S,
  };
}

function copy(value: unknown): unknown {
  if (value instanceof Map) return new Map(value);
  if (value instanceof Set) return new Set(value);
  if (value instanceof Date) return new Date(value.getTime());
  return value;
}

function storeWith<S>(initial: S) {
  return createStore<{ value: S }, EM>({
    name: "root-value",
    reducer: { value: rootSpec(initial) },
  });
}

describe("slices whose state is a single root value", () => {
  describe("commits", () => {
    // The table from the bug report, plus the three shapes it did not reach. Every one of these
    // returned the initial value before the fix.
    const cases: Array<[label: string, initial: unknown, next: unknown]> = [
      ["number", 0, 1],
      ["string", "a", "b"],
      ["boolean", false, true],
      ["null -> value", null, "tok"],
      ["value -> null", "tok", null],
      ["Map", new Map<string, number>(), new Map([["a", 1]])],
      ["Set", new Set<number>(), new Set([1])],
      ["Date", new Date(0), new Date(5)],
    ];

    it.each(cases)("commits a %s slice", async (_label, initial, next) => {
      const store = storeWith(initial);
      await store.emit("x", "set", next);
      expect(store.getState().value).toEqual(next);
    });

    // Separated from the table because these are the ones a "did it become truthy?" fix loses.
    const toFalsy: Array<[label: string, initial: unknown, next: unknown]> = [
      ["number -> 0", 1, 0],
      ["string -> ''", "b", ""],
      ["boolean -> false", true, false],
      ["value -> null", "tok", null],
    ];

    it.each(toFalsy)("commits when the NEW value is falsy (%s)", async (_l, initial, next) => {
      const store = storeWith(initial);
      await store.emit("x", "set", next);
      expect(store.getState().value).toEqual(next);
    });

    it("is still a no-op when the reducer returns an equal value", async () => {
      const store = storeWith(7);
      const listener = vi.fn();
      store.subscribe(listener);

      await store.emit("x", "set", 7);

      expect(store.getState().value).toBe(7);
      expect(listener).not.toHaveBeenCalled();
    });

    it("notifies coarse subscribers exactly once per committing emit", async () => {
      const store = storeWith(0);
      const listener = vi.fn();
      store.subscribe(listener);

      await store.emit("x", "set", 1);
      expect(listener).toHaveBeenCalledTimes(1);

      await store.emit("x", "set", 2);
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it("gives the root a new top-level state reference, as a nested change does", async () => {
      const store = storeWith(0);
      const before = store.getState();

      await store.emit("x", "set", 1);

      expect(store.getState()).not.toBe(before);
    });
  });

  describe("fine-grained notification", () => {
    it("emits the root path to an exact `''` subscription", async () => {
      const store = storeWith(0);
      const seen: Change[] = [];
      store.connect({ reducer: "value", property: "" }, (c) => seen.push(c));

      await store.emit("x", "set", 1);

      expect(seen).toEqual([{ oldValue: 0, newValue: 1, path: "" }]);
    });

    it("reaches a `**` pattern, which matches zero segments", async () => {
      const store = storeWith("a");
      const seen: Change[] = [];
      store.connect({ reducer: "value", property: "**" }, (c) => seen.push(c));

      await store.emit("x", "set", "b");

      expect(seen).toEqual([{ oldValue: "a", newValue: "b", path: "" }]);
    });

    it("does NOT reach a `*` pattern, which demands exactly one segment", async () => {
      const store = storeWith("a");
      const seen: Change[] = [];
      store.connect({ reducer: "value", property: "*" }, (c) => seen.push(c));

      await store.emit("x", "set", "b");

      expect(seen).toEqual([]);
    });

    // Pins the chosen semantics: `""` means "the root value itself changed", NOT "this slice
    // committed". An object slice reports its leaves and nothing at the root, exactly as before
    // — so no existing `**` subscriber gained a notification from this fix.
    it("emits no root path for an object slice", async () => {
      const store = createStore<{ obj: { a: number } }, EM>({
        name: "object-slice",
        reducer: {
          obj: {
            state: { a: 0 },
            when: { any: true },
            reducer: (_s, event) => ({ a: event.payload as number }),
          },
        },
      });
      // `Change['path']` is optional in the type, so this collects the union rather than
      // asserting it away — an emit that somehow arrived without a path would show up here as
      // `undefined` instead of being coerced into looking like a root notification.
      const paths: Array<string | undefined> = [];
      store.connect({ reducer: "obj", property: "**" }, (c) => paths.push(c.path));

      await store.emit("x", "set", 1);

      expect(paths).toEqual(["a"]);
    });
  });

  describe("instrumentation", () => {
    it("reports the slice name as the changed path, with old and new values", async () => {
      const store = storeWith(0);
      const seen: InstrumentedEvent<EM>[] = [];
      store.instrument((info) => seen.push(info));

      await store.emit("x", "set", 1);

      expect(seen).toHaveLength(1);
      expect(seen[0]!.committed).toBe(true);
      expect(seen[0]!.changedPaths).toEqual(["value"]);
      expect(seen[0]!.prevValues).toEqual({ value: 0 });
      expect(seen[0]!.nextValues).toEqual({ value: 1 });
    });
  });

  describe("time travel", () => {
    it("emits the root path when an external snapshot replaces a root value", () => {
      const store = createStore<{ value: number }, EM>({
        name: "time-travel",
        reducer: { value: rootSpec(0) },
        devtools: { allowReplay: true },
      });
      const seen: Change[] = [];
      store.connect({ reducer: "value", property: "" }, (c) => seen.push(c));

      store.__applyExternalState({ value: 42 });

      expect(store.getState().value).toBe(42);
      expect(seen).toEqual([{ oldValue: 0, newValue: 42, path: "" }]);
    });
  });
});
