/**
 * The twin suite: one set of behavioral expectations, two state engines.
 *
 * @remarks
 * This example exists to compare a Redux Toolkit implementation with a Yoltra one, so its
 * tests are written once against a driver interface and run against both. Where the twins had
 * quietly drifted — a fetch that never left `Loading`, a clear that forgot its own default —
 * writing this suite is what surfaced it, which is the argument for its existence.
 *
 * Both drivers build fresh stores from the same reducer specs and slices the app composes;
 * neither touches the DOM, the devtools, or the network — `fetch` is stubbed.
 */

import { configureStore } from "@reduxjs/toolkit";
import { createStore } from "@yoltra/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import reduxTodoReducer, {
  addTodo,
  clearFilters,
  deleteTodo,
  fetchTodos,
  setCategoryFilter,
  setStatusFilter,
  setTodoCategory,
  setTodoStatus,
  setTodoTitle,
} from "../src/state/redux/reducer/todo/todo.slice";
import { todoFetchEffect } from "../src/state/yoltra/effects/todo.effect";
import { todoSpec } from "../src/state/yoltra/reducer/todo/todo.reducer";
import type { RootReducerState, tAppEM } from "../src/state/yoltra/types";
import { eReducerStatus, eTodoStatus } from "../src/types";
import type { iTodoSpec, iTodoState, iTypiTodo } from "../src/types";

/** What both engines must be able to do — the app's vocabulary, engine-neutral. */
interface TodoDriver {
  state(): iTodoState;
  add(spec: iTodoSpec): Promise<void>;
  remove(id: string): Promise<void>;
  setTitle(id: string, title: string): Promise<void>;
  setCategory(id: string, category: string): Promise<void>;
  setStatus(id: string, status: eTodoStatus): Promise<void>;
  setStatusFilter(by: eTodoStatus): Promise<void>;
  setCategoryFilter(by: string): Promise<void>;
  clearFilters(): Promise<void>;
  /** Resolves once the whole fetch lifecycle has landed, success or failure. */
  fetchAll(url: string): Promise<void>;
}

function reduxDriver(): TodoDriver {
  const store = configureStore({ reducer: { todo: reduxTodoReducer } });
  return {
    state: () => store.getState().todo,
    add: async (spec) => void store.dispatch(addTodo(spec)),
    remove: async (id) => void store.dispatch(deleteTodo({ id })),
    setTitle: async (id, title) => void store.dispatch(setTodoTitle({ id, title })),
    setCategory: async (id, category) => void store.dispatch(setTodoCategory({ id, category })),
    setStatus: async (id, status) => void store.dispatch(setTodoStatus({ id, status })),
    setStatusFilter: async (by) => void store.dispatch(setStatusFilter({ by })),
    setCategoryFilter: async (by) => void store.dispatch(setCategoryFilter({ by })),
    clearFilters: async () => void store.dispatch(clearFilters()),
    fetchAll: async (url) => {
      await store.dispatch(fetchTodos({ url }));
    },
  };
}

function yoltraDriver(): TodoDriver {
  const store = createStore<RootReducerState, tAppEM>({
    name: "todo-parity",
    reducer: { todo: todoSpec },
    effects: [todoFetchEffect],
  });
  return {
    state: () => store.getState().todo as iTodoState,
    add: async (spec) => void (await store.emit("todo", "addTodo", spec)),
    remove: async (id) => void (await store.emit("todo", "deleteTodo", { id })),
    setTitle: async (id, title) => void (await store.emit("todo", "setTodoTitle", { id, title })),
    setCategory: async (id, category) =>
      void (await store.emit("todo", "setTodoCategory", { id, category })),
    setStatus: async (id, status) =>
      void (await store.emit("todo", "setTodoStatus", { id, status })),
    setStatusFilter: async (by) => void (await store.emit("todo", "setStatusFilter", { by })),
    setCategoryFilter: async (by) =>
      void (await store.emit("todo", "setCategoryFilter", { by })),
    clearFilters: async () => void (await store.emit("todo", "clearFilters", null)),
    // `emit` resolves once the effects it started are done, so awaiting it awaits the whole
    // loading → success/failure lifecycle.
    fetchAll: async (url) =>
      void (await store.emit("todo", "fetchTodos", { url, offset: 0, limit: 10 })),
  };
}

const FETCHED: iTypiTodo[] = [
  { userId: 1, id: 1, title: "buy milk", completed: false },
  { userId: 1, id: 2, title: "ship it", completed: true },
];

const stubFetch = (respond: () => Response): void => {
  vi.stubGlobal("fetch", vi.fn(async () => respond()));
};

afterEach(() => {
  vi.unstubAllGlobals();
});

const spec = (id: string, category: string, over: Partial<iTodoSpec> = {}): iTodoSpec => ({
  id,
  title: `todo ${id}`,
  category,
  status: eTodoStatus.Pending,
  ...over,
});

describe.each([
  ["redux", reduxDriver],
  ["yoltra", yoltraDriver],
] as const)("the %s twin", (_name, build) => {
  it("adds todos under their ids and counts their categories", async () => {
    const driver = build();
    await driver.add(spec("a", "home"));
    await driver.add(spec("b", "home"));
    await driver.add(spec("c", "work"));

    expect(Object.keys(driver.state().data).sort()).toEqual(["a", "b", "c"]);
    expect(driver.state().data["a"].title).toBe("todo a");
    expect(driver.state().filter.categories).toEqual({ home: 2, work: 1 });
  });

  it("generates an id when none is provided", async () => {
    const driver = build();
    await driver.add(spec("ignored", "home", { id: undefined }));

    const keys = Object.keys(driver.state().data);
    expect(keys).toHaveLength(1);
    expect(driver.state().data[keys[0]].id).toBe(keys[0]);
  });

  it("deletes a todo and drops its category at zero", async () => {
    const driver = build();
    await driver.add(spec("a", "home"));
    await driver.add(spec("b", "work"));
    await driver.remove("a");

    expect(driver.state().data["a"]).toBeUndefined();
    // `home` reached zero and disappears rather than lingering at 0.
    expect(driver.state().filter.categories).toEqual({ work: 1 });
  });

  it("moves a todo between categories, keeping the counts honest", async () => {
    const driver = build();
    await driver.add(spec("a", "home"));
    await driver.add(spec("b", "work"));
    await driver.setCategory("a", "work");

    expect(driver.state().data["a"].category).toBe("work");
    expect(driver.state().filter.categories).toEqual({ work: 2 });
  });

  it("edits title and status in place", async () => {
    const driver = build();
    await driver.add(spec("a", "home"));
    await driver.setTitle("a", "renamed");
    await driver.setStatus("a", eTodoStatus.Complete);

    expect(driver.state().data["a"].title).toBe("renamed");
    expect(driver.state().data["a"].status).toBe(eTodoStatus.Complete);
  });

  it("sets filters and clears them back to the defaults", async () => {
    const driver = build();
    await driver.setStatusFilter(eTodoStatus.Complete);
    await driver.setCategoryFilter("work");
    expect(driver.state().filter.selectedStatus).toBe(eTodoStatus.Complete);
    expect(driver.state().filter.selectedCategory).toBe("work");

    await driver.clearFilters();
    expect(driver.state().filter.selectedStatus).toBe("ALL");
    expect(driver.state().filter.selectedCategory).toBe("");
  });

  it("merges a successful fetch under the fetched category and lands on Success", async () => {
    stubFetch(() => new Response(JSON.stringify(FETCHED)));
    const driver = build();
    await driver.add(spec("mine", "home"));

    await driver.fetchAll("https://example.test/todos");

    const state = driver.state();
    expect(state.status).toBe(eReducerStatus.Success);
    // Fetched todos are keyed by their upstream id; what was already there survives.
    expect(state.data["1"]).toMatchObject({ category: "fetched", status: eTodoStatus.Pending });
    expect(state.data["2"]).toMatchObject({ category: "fetched", status: eTodoStatus.Complete });
    expect(state.data["mine"]).toBeDefined();
    expect(state.filter.categories["fetched"]).toBe(2);
  });

  it("lands on Failure when the server refuses, keeping existing data", async () => {
    stubFetch(() => new Response("", { status: 500, statusText: "Server Error" }));
    const driver = build();
    await driver.add(spec("mine", "home"));

    await driver.fetchAll("https://example.test/todos");

    expect(driver.state().status).toBe(eReducerStatus.Failure);
    expect(driver.state().data["mine"]).toBeDefined();
  });
});

it("the two engines converge on identical state for the same script", async () => {
  const script = async (driver: TodoDriver): Promise<void> => {
    await driver.add(spec("a", "home"));
    await driver.add(spec("b", "work"));
    await driver.add(spec("c", "work", { status: eTodoStatus.Complete }));
    await driver.setCategory("a", "work");
    await driver.setTitle("b", "renamed");
    await driver.setStatus("b", eTodoStatus.Canceled);
    await driver.remove("c");
    await driver.setStatusFilter(eTodoStatus.Complete);
    await driver.setCategoryFilter("work");
    await driver.clearFilters();
  };

  const redux = reduxDriver();
  const yoltra = yoltraDriver();
  await script(redux);
  await script(yoltra);

  expect(yoltra.state().data).toEqual(redux.state().data);
  expect(yoltra.state().filter).toEqual(redux.state().filter);
});
