import { describe, expect, it, vi } from "vitest";

import { createEntityAdapter } from "../../src/index";
import { detectChangedProps } from "../../src/utils/detectChangedProps";
import type { EntityState } from "../../src/index";

interface Todo {
  id: string;
  title: string;
  done: boolean;
  order: number;
}

const todo = (id: string, order = 0): Todo => ({ id, title: `todo ${id}`, done: false, order });

const adapter = createEntityAdapter<Todo>();

/** A collection of `count` entities, keyed `e0`…`e{count-1}`. */
function populated(count: number): EntityState<Todo> {
  return adapter.setAll(adapter.getInitialState(), Array.from({ length: count }, (_, i) => todo(`e${i}`, i)));
}

describe("the claim this module exists for", () => {
  it("reports exactly one changed path when one of ten thousand entities is updated", () => {
    // The update case reports one leaf. What normalising buys over an array is the *other*
    // cases: an insert or a sort into a positional array moves nearly every element into a
    // different slot and reports nearly every index. Those are asserted below.
    const before = populated(10_000);
    const after = adapter.updateOne(before, { id: "e5000", changes: { done: true } });

    const changed = detectChangedProps(before, after);

    expect(changed).toEqual(["entities.e5000.done"]);
  });

  it("keeps every untouched entity's reference, which is what makes that possible", () => {
    // The failure mode this guards is cost, not correctness, which is why it needs its own
    // assertion: `detectChangedProps` short-circuits on `oldState === newState`, so an
    // untouched entity that kept its reference is skipped in constant time. An implementation
    // that rebuilt every entity would still report exactly one changed path — the clones are
    // structurally identical, so the walk finds nothing — while making the diff descend into
    // all ten thousand of them on every update. Every other test here would still pass.
    const before = populated(1000);
    const after = adapter.updateOne(before, { id: "e500", changes: { done: true } });

    expect(after.entities.e500).not.toBe(before.entities.e500);
    for (const id of ["e0", "e499", "e501", "e999"]) {
      expect(after.entities[id]).toBe(before.entities[id]);
    }
  });

  it("confines a reorder to the order array", () => {
    const before = populated(500);
    const reversed = adapter.setAll(before, [...adapter.selectAll(before)].reverse());

    const changed = detectChangedProps(before, reversed);

    // Every changed path is under `ids`; not one entity is reported.
    expect(changed.length).toBeGreaterThan(0);
    expect(changed.every((p) => p === "ids" || p.startsWith("ids."))).toBe(true);
  });

  it("reports an insert as the order plus the one new entity", () => {
    const before = populated(100);
    const after = adapter.addOne(before, todo("new", 100));

    const changed = detectChangedProps(before, after);

    expect(changed).toContain("entities.new");
    expect(changed.filter((p) => p.startsWith("entities.")).length).toBe(1);
  });

  it("reports a removal as the order plus the one gone entity", () => {
    const before = populated(100);
    const after = adapter.removeOne(before, "e50");

    const changed = detectChangedProps(before, after);

    expect(changed).toContain("entities.e50");
    expect(changed.filter((p) => p.startsWith("entities.")).length).toBe(1);
  });
});

describe("adding and setting", () => {
  it("addOne ignores an id already present", () => {
    const state = adapter.addOne(adapter.getInitialState(), todo("a"));
    const again = adapter.addOne(state, { ...todo("a"), title: "changed" });

    // Unchanged, and the same reference: nothing to diff at all.
    expect(again).toBe(state);
    expect(again.entities.a!.title).toBe("todo a");
  });

  it("setOne replaces wholesale", () => {
    const state = adapter.addOne(adapter.getInitialState(), todo("a"));
    const next = adapter.setOne(state, { id: "a", title: "replaced", done: true, order: 9 });

    expect(next.entities.a).toEqual({ id: "a", title: "replaced", done: true, order: 9 });
    expect(next.ids).toEqual(["a"]);
  });

  it("upsertOne merges into an existing entity and adds a missing one", () => {
    const state = adapter.addOne(adapter.getInitialState(), todo("a"));
    const merged = adapter.upsertOne(state, { id: "a", done: true } as Todo);

    expect(merged.entities.a).toEqual({ id: "a", title: "todo a", done: true, order: 0 });
    expect(adapter.upsertOne(merged, todo("b")).ids).toEqual(["a", "b"]);
  });

  it("setAll replaces the collection and dedupes by id", () => {
    const state = adapter.setAll(populated(3), [todo("x"), todo("y"), { ...todo("x"), title: "last" }]);

    expect(state.ids).toEqual(["x", "y"]);
    expect(state.entities.x!.title).toBe("last");
  });

  it("returns the same state when nothing matched", () => {
    const state = populated(3);
    expect(adapter.updateOne(state, { id: "missing", changes: { done: true } })).toBe(state);
    expect(adapter.removeOne(state, "missing")).toBe(state);
    const empty = adapter.getInitialState();
    expect(adapter.removeAll(empty)).toBe(empty);
  });
});

describe("removal", () => {
  it("removeMany drops several and keeps order among the rest", () => {
    const next = adapter.removeMany(populated(5), ["e1", "e3"]);
    expect(next.ids).toEqual(["e0", "e2", "e4"]);
    expect(next.entities.e1).toBeUndefined();
  });

  it("removeAll empties both halves", () => {
    const next = adapter.removeAll(populated(5));
    expect(next.ids).toEqual([]);
    expect(adapter.selectTotal(next)).toBe(0);
  });
});

describe("sorting", () => {
  const sorted = createEntityAdapter<Todo>({ sortComparer: (a, b) => a.order - b.order });

  it("inserts in order", () => {
    let state = sorted.getInitialState();
    for (const order of [3, 1, 2]) state = sorted.addOne(state, todo(`e${order}`, order));

    expect(state.ids).toEqual(["e1", "e2", "e3"]);
  });

  it("re-sorts when an update moves an entity", () => {
    let state = sorted.setAll(sorted.getInitialState(), [todo("a", 1), todo("b", 2)]);
    state = sorted.updateOne(state, { id: "a", changes: { order: 9 } });

    expect(state.ids).toEqual(["b", "a"]);
  });

  it("keeps the same order array when the order did not move", () => {
    // Reusing the array is what keeps `ids` out of the changed paths; without it every update
    // to a sorted collection would wake the list container for nothing.
    const state = sorted.setAll(sorted.getInitialState(), [todo("a", 1), todo("b", 2)]);
    const next = sorted.updateOne(state, { id: "a", changes: { title: "renamed" } });

    expect(next.ids).toBe(state.ids);
    expect(detectChangedProps(state, next)).toEqual(["entities.a.title"]);
  });
});

describe("selectors and paths", () => {
  it("selects", () => {
    const state = populated(3);
    expect(adapter.selectIds(state)).toEqual(["e0", "e1", "e2"]);
    expect(adapter.selectAll(state).map((t) => t.id)).toEqual(["e0", "e1", "e2"]);
    expect(adapter.selectById(state, "e1")!.title).toBe("todo e1");
    expect(adapter.selectById(state, "nope")).toBeUndefined();
    expect(adapter.selectTotal(state)).toBe(3);
  });

  it("hands out the subscription paths, which is the point of the shape", () => {
    expect(adapter.idsPath).toBe("ids");
    expect(adapter.pathTo("abc")).toBe("entities.abc");
    expect(adapter.pathTo("abc", "title")).toBe("entities.abc.title");
    expect(adapter.anyField("title")).toBe("entities.*.title");
  });

  it("those paths address what the diff actually reports", () => {
    // A path helper that produced strings the diff never emits would be worse than none.
    const before = populated(10);
    const after = adapter.updateOne(before, { id: "e3", changes: { title: "renamed" } });

    expect(detectChangedProps(before, after)).toEqual([adapter.pathTo("e3", "title")]);
  });

  it("warns about an id that would collide with a nested path", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    createEntityAdapter<Todo>().addOne(adapter.getInitialState(), todo("a.b"));

    expect(warn).toHaveBeenCalledWith(expect.stringContaining("contains a dot"));
    warn.mockRestore();
  });
});

describe("extra slice fields", () => {
  it("carries them through every helper", () => {
    const withFilter = adapter.getInitialState({ filter: "all" as const });
    const next = adapter.addOne(withFilter, todo("a"));

    expect(next.filter).toBe("all");
    expect(adapter.removeAll(next).filter).toBe("all");
  });
});
