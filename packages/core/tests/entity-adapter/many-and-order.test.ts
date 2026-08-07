/**
 * The batch variants and the ordering contract: `addMany`/`setMany`/`updateMany`/`upsertMany`
 * are the loops the singular forms delegate to, and `sortComparer` must keep the `ids` array
 * reference stable when an update does not change the order — that identity is what keeps a
 * sorted list container from re-rendering for nothing.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { createEntityAdapter } from "../../src/index";

type Todo = { id: string; title: string; rank: number };

const t = (id: string, rank: number, title = id): Todo => ({ id, title, rank });

describe("batch variants", () => {
  const todos = createEntityAdapter<Todo>();

  it("addMany inserts new ids and ignores ones already present", () => {
    let state = todos.getInitialState();
    state = todos.addMany(state, [t("a", 1), t("b", 2)]);
    state = todos.addMany(state, [t("a", 9, "shadow"), t("c", 3)]);

    expect(state.ids).toEqual(["a", "b", "c"]);
    // `add` refuses to overwrite: the shadow write never landed.
    expect(todos.selectById(state, "a")?.title).toBe("a");
  });

  it("setMany overwrites what exists and inserts what does not", () => {
    let state = todos.getInitialState();
    state = todos.addMany(state, [t("a", 1)]);
    state = todos.setMany(state, [t("a", 9, "rewritten"), t("b", 2)]);

    expect(todos.selectById(state, "a")?.title).toBe("rewritten");
    expect(state.ids).toEqual(["a", "b"]);
  });

  it("updateMany patches existing entities and skips unknown ids", () => {
    let state = todos.getInitialState();
    state = todos.addMany(state, [t("a", 1), t("b", 2)]);
    state = todos.updateMany(state, [
      { id: "a", changes: { title: "patched" } },
      { id: "ghost", changes: { title: "never" } },
    ]);

    expect(todos.selectById(state, "a")?.title).toBe("patched");
    expect(state.ids).toEqual(["a", "b"]);
  });

  it("upsertMany merges over what exists and inserts the rest", () => {
    let state = todos.getInitialState();
    state = todos.addMany(state, [t("a", 1)]);
    state = todos.upsertMany(state, [t("a", 5), t("b", 2)]);

    expect(todos.selectById(state, "a")?.rank).toBe(5);
    expect(state.ids).toEqual(["a", "b"]);
  });

  it("selectEntities exposes the record itself", () => {
    let state = todos.getInitialState();
    state = todos.addOne(state, t("a", 1));
    expect(todos.selectEntities(state)).toBe(state.entities);
  });
});

describe("sortComparer and the ids identity", () => {
  const sorted = createEntityAdapter<Todo>({ sortComparer: (a, b) => a.rank - b.rank });

  it("keeps ids ordered by the comparer on insert", () => {
    let state = sorted.getInitialState();
    state = sorted.addMany(state, [t("c", 3), t("a", 1), t("b", 2)]);
    expect(state.ids).toEqual(["a", "b", "c"]);
  });

  it("keeps the ids reference when an update does not change the order", () => {
    let state = sorted.getInitialState();
    state = sorted.addMany(state, [t("a", 1), t("b", 2)]);
    const before = state.ids;

    state = sorted.updateOne(state, { id: "a", changes: { title: "renamed" } });

    // Not merely equal — identical, so `ids` never shows up as a changed path.
    expect(state.ids).toBe(before);
  });

  it("produces a new ids array when the order actually moves", () => {
    let state = sorted.getInitialState();
    state = sorted.addMany(state, [t("a", 1), t("b", 2)]);
    const before = state.ids;

    state = sorted.updateOne(state, { id: "a", changes: { rank: 9 } });

    expect(state.ids).not.toBe(before);
    expect(state.ids).toEqual(["b", "a"]);
  });
});

describe("dotted ids", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("warns once per id, because the path grammar cannot tell a dot apart", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const todos = createEntityAdapter<Todo>();

    let state = todos.getInitialState();
    state = todos.addOne(state, t("a.b", 1));
    state = todos.setOne(state, t("a.b", 2));

    const dotted = warn.mock.calls.filter(([message]) => String(message).includes("a.b"));
    expect(dotted).toHaveLength(1);
  });
});
