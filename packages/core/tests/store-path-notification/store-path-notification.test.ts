import { describe, it, expect } from "vitest";

import { createStore } from "../../src/store/Store";
import type { ReducerSpec } from "../../src/types";

/**
 * What a path subscriber is actually told when a list changes shape.
 *
 * The diff behaviour has always been covered; its *consequence* for subscriptions was not, and
 * that is where the defect lived. A length change reported the array path alone, so an exact
 * subscription on `items.0.title` — the path the README leads with — was never notified and the
 * component bound to it kept rendering the previous occupant of that index.
 */

type Item = { title: string };
type ListState = { items: Item[]; index: Map<string, number> };

type Events = {
  list: {
    prepend: { title: string };
    append: { title: string };
    drop: null;
    reindex: null;
  };
};

const listSpec: ReducerSpec<ListState, Events> = {
  state: { items: [{ title: "A" }, { title: "B" }], index: new Map([["a", 1]]) },
  when: { keys: [
    ["list", "prepend"],
    ["list", "append"],
    ["list", "drop"],
    ["list", "reindex"],
  ] },
  reducer(state, event) {
    switch (event.type) {
      case "prepend":
        return { ...state, items: [{ title: (event.payload as Item).title }, ...state.items] };
      case "append":
        return { ...state, items: [...state.items, { title: (event.payload as Item).title }] };
      case "drop":
        return { ...state, items: state.items.slice(0, -1) };
      case "reindex":
        return { ...state, index: new Map([["a", 2]]) };
      default:
        return state;
    }
  },
};

function build() {
  return createStore<{ list: ListState }, Events>({ name: "List", reducer: { list: listSpec } });
}

/** Records every announcement on one path. */
function watch(store: ReturnType<typeof build>, property: string): unknown[] {
  const seen: unknown[] = [];
  store.connect({ reducer: "list", property } as never, (change) => seen.push(change));
  return seen;
}

describe("path notification when a list changes shape", () => {
  it("notifies an exact deep subscriber when a prepend shifts its value", async () => {
    const store = build();
    const zeroTitle = watch(store, "items.0.title");

    await store.emit("list", "prepend", { title: "NEW" });

    // The value at this exact path became "NEW". Silence here was the bug: no selector, no
    // memo, and a component rendering the wrong row with no way to notice.
    expect(store.getState().list.items[0]!.title).toBe("NEW");
    expect(zeroTitle).toHaveLength(1);
  });

  it("notifies the array subscriber too, since the array's own shape changed", async () => {
    const store = build();
    const items = watch(store, "items");

    await store.emit("list", "append", { title: "C" });

    expect(items).toHaveLength(1);
  });

  it("notifies a subscriber on the newly appended index", async () => {
    const store = build();
    const third = watch(store, "items.2");

    await store.emit("list", "append", { title: "C" });

    expect(third).toHaveLength(1);
  });

  it("notifies a subscriber on an index that was removed", async () => {
    const store = build();
    const second = watch(store, "items.1");

    await store.emit("list", "drop", null);

    expect(second).toHaveLength(1);
  });

  it("stays quiet on a leaf a resize did not move", async () => {
    const store = build();
    const zero = watch(store, "items.0.title");

    // Dropping the tail leaves index 0 exactly where it was: precision is preserved, so this
    // subscriber must not be woken.
    await store.emit("list", "drop", null);

    expect(zero).toHaveLength(0);
  });

  it("commits and notifies when a Map in state is replaced", async () => {
    const store = build();
    const index = watch(store, "index");

    await store.emit("list", "reindex", null);

    // Previously the entire commit was skipped: no state change, no notification, no error.
    expect(store.getState().list.index.get("a")).toBe(2);
    expect(index).toHaveLength(1);
  });
});

describe("cost of a slice nobody watches", () => {
  type BigEvents = { app: { touch: null } };
  type BigState = { deep: { a: { b: { c: number } } } };

  /** Counts how often the store reads values out of state to describe a change. */
  function buildCounting() {
    let reads = 0;
    const spec: ReducerSpec<BigState, BigEvents> = {
      state: { deep: { a: { b: { c: 0 } } } },
      when: { keys: [["app", "touch"]] } as never,
      reducer: (state) => ({ deep: { a: { b: { c: state.deep.a.b.c + 1 } } } }),
    };
    const store = createStore<{ big: BigState }, BigEvents>({
      name: "Big",
      reducer: { big: spec },
    });

    // getAtPath is the walk that describing a change requires; count calls through it.
    const original = (store as unknown as { getAtPath: (o: unknown, p: string) => unknown })
      .getAtPath;
    (store as unknown as { getAtPath: (o: unknown, p: string) => unknown }).getAtPath = function (
      obj: unknown,
      p: string,
    ) {
      reads += 1;
      return original.call(this, obj, p);
    };

    return { store, reads: () => reads };
  }

  it("reads nothing out of state when no one subscribed", async () => {
    const { store, reads } = buildCounting();

    await store.emit("app", "touch", null);

    // The change is still committed and coarse listeners still fire; what is skipped is
    // building the old/new value pair for every changed path, which walks the tree twice per
    // path to describe the change to nobody.
    expect(store.getState().big.deep.a.b.c).toBe(1);
    expect(reads()).toBe(0);
  });

  it("reads them once a subscriber exists", async () => {
    const { store, reads } = buildCounting();
    store.connect({ reducer: "big", property: "deep.a.b.c" } as never, () => undefined);

    await store.emit("app", "touch", null);

    expect(reads()).toBeGreaterThan(0);
  });
});
