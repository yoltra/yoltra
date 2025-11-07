import React, { PropsWithChildren } from "react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";

import { StoreContext } from "../../src/context/StoreContext";
import {
  createStore,
  type ActionPair,
  type ReducerFunction,
  type ReducerSpec,
  type ActionUnion,
  type StoreInstance,
} from "@quojs/core";
import { useAtomicProp, useAtomicProps, shallowEqual } from "../../src/hooks/hooks";

type Todo = { id: string; title: string; done: boolean };
type TodoState = {
  data: Record<string, Todo>;
  filter: { status: "ALL" | "OPEN" | "DONE"; category: string };
};
type AppState = { todo: TodoState };

type TodoAM = {
  todo: {
    add: Todo;
    title: { id: string; title: string };
    status: TodoState["filter"]["status"];
    category: string;
  };
};

const initial: TodoState = { data: {}, filter: { status: "ALL", category: "" } };

const reducer: ReducerFunction<TodoState, TodoAM> = (state = initial, action: ActionUnion<TodoAM>) => {
  if (action.channel !== "todo") return state;
  switch (action.event) {
    case "add": {
      const t = action.payload;

      if (state.data[t.id]) return state;

      return { ...state, data: { ...state.data, [t.id]: t } };
    }

    case "title": {
      const { id, title } = action.payload;
      const cur = state.data[id];

      if (!cur || cur.title === title) return state;

      return { ...state, data: { ...state.data, [id]: { ...cur, title } } };
    }
    case "status": {
      const status = action.payload;

      if (state.filter.status === status) return state;

      return { ...state, filter: { ...state.filter, status } };
    }
    case "category": {
      const category = action.payload;

      if (state.filter.category === category) return state;

      return { ...state, filter: { ...state.filter, category } };
    }
    default:
      return state;
  }
};

const TODO_ACTIONS = [
  ["todo", "add"],
  ["todo", "title"],
  ["todo", "status"],
  ["todo", "category"],
] as const satisfies readonly ActionPair<TodoAM>[];

function makeStore() {
  const store = createStore({
    name: "test",
    reducer: {
      todo: { actions: [...TODO_ACTIONS], state: initial, reducer } satisfies ReducerSpec<TodoState, TodoAM>,
    },
    middleware: [],
  });
  const typed: StoreInstance<"todo", AppState, TodoAM> = store;

  return typed;
}

function Provider({ children, store }: PropsWithChildren<{ store: StoreInstance<"todo", AppState, TodoAM> }>) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

describe("useAtomicProp / useAtomicProps", () => {
  let store: StoreInstance<"todo", AppState, TodoAM>;

  afterEach(() => cleanup());
  beforeEach(() => { store = makeStore(); });

  it("reads exact deep path and updates on change", async () => {
    const Comp = () => {
      const title = useAtomicProp<"todo", AppState, "data.a1.title">(
        { reducer: "todo", property: "data.a1.title" }
      );

      return <div data-testid="title">{String(title ?? "")}</div>;
    };

    const rr = render(<Provider store={store}><Comp /></Provider>);
    expect(rr.getByTestId("title").textContent).toBe("");

    await act(async () => { store.dispatch("todo", "add", { id: "a1", title: "X", done: false }); });
    await act(async () => { store.dispatch("todo", "title", { id: "a1", title: "Y" }); });
    expect(rr.getByTestId("title").textContent).toBe("Y");
  });

  it("normalizes leading dot in path", async () => {
    const Comp = () => {
      const title = useAtomicProp<"todo", AppState, "data.b2.title">(
        // @ts-expect-error runtime path may start with dot; typing enforced by overload in real usage
        { reducer: "todo", property: ".data.b2.title" }
      );

      return <div data-testid="title">{String(title ?? "")}</div>;
    };

    const rr = render(<Provider store={store}><Comp /></Provider>);
    await act(async () => {
      store.dispatch("todo", "add", { id: "b2", title: "Z", done: false });
      store.dispatch("todo", "title", { id: "b2", title: "ZZ" });
    });

    expect(rr.getByTestId("title").textContent).toBe("ZZ");
  });

  it("supports wildcard + map and respects custom isEqual (uses shallowEqual)", async () => {
    const Comp = () => {
      const titles = useAtomicProp<"todo", AppState, "data.**", string[]>(
        { reducer: "todo", property: "data.**" },
        (s: TodoState) => Object.values(s.data).map(t => t.title),
        shallowEqual
      );

      return <div data-testid="count">{String(titles.length)}</div>;
    };
    const rr = render(<Provider store={store}><Comp /></Provider>);
    expect(rr.getByTestId("count").textContent).toBe("0");

    await act(async () => { store.dispatch("todo", "add", { id: "c3", title: "A", done: false }); });
    await act(async () => { store.dispatch("todo", "add", { id: "d4", title: "B", done: false }); });
    expect(rr.getByTestId("count").textContent).toBe("2");
  });

  it("useAtomicProps subscribes to multiple paths and recomputes", async () => {
    const Comp = () => {
      const sel = useAtomicProps<"todo", AppState, string>(
        [{ reducer: "todo", property: ["filter.status", "filter.category"] }],
        (s) => `${s.todo.filter.status}:${s.todo.filter.category}`
      );

      return <div data-testid="sel">{sel}</div>;
    };
    
    const rr = render(<Provider store={store}><Comp /></Provider>);
    expect(rr.getByTestId("sel").textContent).toBe("ALL:");

    await act(async () => { store.dispatch("todo", "status", "DONE"); });
    expect(rr.getByTestId("sel").textContent).toBe("DONE:");

    await act(async () => { store.dispatch("todo", "category", "work"); });
    expect(rr.getByTestId("sel").textContent).toBe("DONE:work");
  });
});
