import { describe, it, expect } from "vitest";

import { createStore } from "../../src/store/Store";
import type { ReducerSpec } from "../../src/types";

// A slice with several independent nested objects, so we can assert that
// changing ONE leaf preserves the identity of untouched siblings — the
// regression guard for dropping the per-event structuredClone (C1).
type Item = { id: string; title: string; meta: { views: number } };
type BoardState = { items: Item[]; filter: { q: string } };

type Events = {
  board: {
    rename: { id: string; title: string };
  };
};

const boardSpec: ReducerSpec<BoardState, Events> = {
  state: {
    items: [
      { id: "a", title: "A", meta: { views: 0 } },
      { id: "b", title: "B", meta: { views: 0 } },
    ],
    filter: { q: "" },
  },
  events: [["board", "rename"]],
  reducer(state, event) {
    if (event.channel === "board" && event.type === "rename") {
      const { id, title } = event.payload as { id: string; title: string };
      return {
        ...state,
        items: state.items.map((it) => (it.id === id ? { ...it, title } : it)),
      };
    }
    return state;
  },
};

describe("Store - write path (C1)", () => {
  it("preserves the identity of untouched siblings (structural sharing, no deep clone)", async () => {
    const store = createStore({ name: "Board", reducer: { board: boardSpec } });

    const before = store.getState();
    const prevItemB = before.board.items[1];
    const prevFilter = before.board.filter;
    const prevMetaA = before.board.items[0].meta;

    await store.emit("board", "rename", { id: "a", title: "A2" });

    const after = store.getState();

    // The targeted leaf changed...
    expect(after.board.items[0].title).toBe("A2");

    // ...but every untouched subtree keeps its EXACT reference. A deep clone on
    // every write would break all of these identities.
    expect(after.board.items[1]).toBe(prevItemB);
    expect(after.board.filter).toBe(prevFilter);
    // The unchanged nested object of the *changed* item is shared too, because
    // the reducer only replaced `title`.
    expect(after.board.items[0].meta).toBe(prevMetaA);

    // The changed slice + root are new references (shallow immutability).
    expect(after.board).not.toBe(before.board);
    expect(after).not.toBe(before);
  });

  it("still deep-freezes committed slices in development", async () => {
    const store = createStore({ name: "Board", reducer: { board: boardSpec } });

    await store.emit("board", "rename", { id: "b", title: "B2" });
    const s = store.getState();

    expect(Object.isFrozen(s.board)).toBe(true);
    expect(Object.isFrozen(s.board.items)).toBe(true);
    expect(Object.isFrozen(s.board.items[0])).toBe(true);
    expect(Object.isFrozen(s.board.items[1])).toBe(true);
  });

  it("skips deep-freezing in production (freeze is a dev-only guard)", async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const store = createStore({ name: "BoardProd", reducer: { board: boardSpec } });

      // Initial state is not frozen under production.
      expect(Object.isFrozen(store.getState().board)).toBe(false);

      await store.emit("board", "rename", { id: "a", title: "A2" });
      const s = store.getState();

      // Reducer still ran and state updated with structural sharing intact...
      expect(s.board.items[0].title).toBe("A2");
      expect(s.board.items[1]).toBe(store.getState().board.items[1]);
      // ...but the committed slice is not deep-frozen (freeze skipped in prod).
      expect(Object.isFrozen(s.board)).toBe(false);
    } finally {
      process.env.NODE_ENV = prev;
    }
  });
});
