import { describe, it, expect, vi } from "vitest";

import { createStore } from "../../src/store/Store";
import { reducers, AppEvents, AppState } from "./support/reducers";

describe("Store - basic flow", () => {
  it("initialises state from reducer specs and deep-freezes slices", () => {
    const store = createStore({
      name: "BasicStore",
      reducer: reducers,
    });

    const state = store.getState();
    expect(state.counter.value).toBe(0);
    expect(state.todos.items[0].title).toBe("First");

    // Root is not frozen by design; slices are.
    expect(Object.isFrozen(state.counter)).toBe(true);
    expect(Object.isFrozen(state.todos)).toBe(true);
    expect(Object.isFrozen(state.todos.items)).toBe(true);
    expect(Object.isFrozen(state)).toBe(false);
  });

  it("emits events through reducers and updates state with shallow immutability", async () => {
    const store = createStore({
      name: "BasicStore",
      reducer: reducers,
    });

    const before = store.getState();
    const prevCounter = before.counter;
    const prevTodos = before.todos;

    await store.emit("ui", "increment", 1);

    const after = store.getState();
    expect(after.counter.value).toBe(1);
    expect(after.todos).toBe(prevTodos);
    expect(after).not.toBe(before);
    expect(after.counter).not.toBe(prevCounter);
  });

  it("connects to exact dotted paths and receives fine-grained changes", async () => {
    const store = createStore({
      name: "BasicStore",
      reducer: reducers,
    });

    const changes: Array<{ old: any; next: any; path?: string }> = [];

    const off = store.connect(
      { reducer: "todos", property: "items.0.title" },
      (chg) => {
        changes.push({ old: chg.oldValue, next: chg.newValue, path: chg.path });
      },
    );

    await store.emit("ui", "setTitle", { id: "1", title: "Updated" });

    off();

    expect(changes).toHaveLength(1);
    expect(changes[0].old).toBe("First");
    expect(changes[0].next).toBe("Updated");
    expect(changes[0].path).toBe("items.0.title");
  });

  it("connects with wildcard patterns via LooseEventBus", async () => {
    const store = createStore({
      name: "BasicStore",
      reducer: reducers,
    });

    const wildcardHits: string[] = [];

    const off = store.connect(
      { reducer: "todos", property: "items.*.title" },
      (chg) => {
        wildcardHits.push(`${chg.oldValue}->${chg.newValue}`);
      },
    );

    await store.emit("ui", "setTitle", { id: "1", title: "Updated" });

    off();

    expect(wildcardHits).toEqual(["First->Updated"]);
  });

  it("coarse subscribe listeners fire only when state actually changes", async () => {
    const store = createStore({
      name: "BasicStore",
      reducer: reducers,
    });

    const calls: number[] = [];
    const unsub = store.subscribe(() => {
      calls.push(Date.now());
    });

    await store.emit("ui", "increment", 1);

    // Emit an event that causes no state change (middleware or reducer behaviour)
    // For this, we temporarily replace the counter reducer with a no-op that returns the same ref.
    const noopReducers = {
      ...reducers,
      counter: {
        ...reducers.counter,
        reducer(state: any, _event: any) {
          return state; // no change
        },
      },
    };

    const store2 = createStore({
      name: "BasicStore2",
      reducer: noopReducers,
    });

    const calls2: number[] = [];
    const unsub2 = store2.subscribe(() => {
      calls2.push(Date.now());
    });

    await store2.emit("ui", "increment", 1);

    expect(calls.length).toBe(1);
    expect(calls2.length).toBe(0);

    unsub();
    unsub2();
  });
});
