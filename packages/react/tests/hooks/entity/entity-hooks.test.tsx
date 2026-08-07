import { render, screen } from "@testing-library/react";
import { act } from "react";
import { describe, expect, it } from "vitest";

import { createEntityAdapter } from "@yoltra/core";
import type { EntityState } from "@yoltra/core";

import { StoreProvider } from "../../../src/context/StoreProvider";
import { useEntity, useEntityField, useEntityIds } from "../../../src/entity/useEntity";
import { createMockStore } from "../../helpers/mockStore";

interface Todo {
  id: string;
  title: string;
  done: boolean;
}

const todos = createEntityAdapter<Todo>();

type RootState = { todos: EntityState<Todo> };

function seeded() {
  const initial = todos.setAll(todos.getInitialState(), [
    { id: "a", title: "first", done: false },
    { id: "b", title: "second", done: false },
  ]);
  return createMockStore<RootState>({ todos: initial });
}

describe("entity hooks subscribe to what the adapter names", () => {
  it("useEntityIds reads the order", () => {
    const { store } = seeded();

    function List() {
      return <span data-testid="ids">{useEntityIds("todos", todos).join(",")}</span>;
    }

    render(
      <StoreProvider store={store}>
        <List />
      </StoreProvider>,
    );

    expect(screen.getByTestId("ids").textContent).toBe("a,b");
  });

  it("useEntityField subscribes to one field of one entity", () => {
    const { store } = seeded();

    function Row({ id }: { id: string }) {
      return <span data-testid={id}>{useEntityField("todos", todos, id, "title")}</span>;
    }

    render(
      <StoreProvider store={store}>
        <Row id="a" />
      </StoreProvider>,
    );

    expect(screen.getByTestId("a").textContent).toBe("first");
    // The path is the adapter's, not a string typed into the component.
    expect(store.getConnections()).toContainEqual({
      reducer: "todos",
      property: todos.pathTo("a", "title"),
    });
  });

  it("useEntity returns undefined once its entity is gone", () => {
    // A row outliving its data for one render is normal; throwing there would be worse.
    const { store } = seeded();

    function Row() {
      return <span data-testid="row">{useEntity("todos", todos, "a")?.title ?? "gone"}</span>;
    }

    render(
      <StoreProvider store={store}>
        <Row />
      </StoreProvider>,
    );
    expect(screen.getByTestId("row").textContent).toBe("first");

    act(() => {
      store.setState((prev) => ({ todos: todos.removeOne(prev.todos, "a") }));
      store.notifyPath("todos", todos.pathTo("a"));
    });

    expect(screen.getByTestId("row").textContent).toBe("gone");
  });

  it("a row does not wake when a different entity changes", () => {
    // The whole point of the shape: editing one row leaves the others alone.
    const { store } = seeded();
    let rowARenders = 0;

    function Row({ id }: { id: string }) {
      if (id === "a") rowARenders += 1;
      return <span data-testid={id}>{useEntityField("todos", todos, id, "title")}</span>;
    }

    render(
      <StoreProvider store={store}>
        <Row id="a" />
        <Row id="b" />
      </StoreProvider>,
    );
    const before = rowARenders;

    act(() => {
      store.setState((prev) => ({
        todos: todos.updateOne(prev.todos, { id: "b", changes: { title: "edited" } }),
      }));
      store.notifyPath("todos", todos.pathTo("b", "title"));
    });

    expect(screen.getByTestId("b").textContent).toBe("edited");
    expect(rowARenders).toBe(before);
  });
});
