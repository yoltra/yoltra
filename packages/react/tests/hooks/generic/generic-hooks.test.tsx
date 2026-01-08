import { useRef } from "react";
import { render, screen } from "@testing-library/react";
import { act } from "react";
import { describe, it, expect, vi } from "vitest";

import {
  useStore,
  useEmit,
  useSelector,
  useAtomicProp,
  useAtomicProps,
  shallowEqual,
  useDispatch,
} from "../../../src/hooks/hooks";
import { StoreProvider } from "../../../src/context/StoreProvider";
import { createMockStore } from "../../helpers/mockStore";

describe("shallowEqual", () => {
  it("returns true for the same object reference", () => {
    const obj = { a: 1 };
    expect(shallowEqual(obj, obj)).toBe(true);
  });

  it("returns true for different objects with same shape and values", () => {
    expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
  });

  it("returns false when keys differ", () => {
    expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it("returns false when values differ", () => {
    expect(shallowEqual({ a: 1 }, { a: 2 })).toBe(false);
  });

  it("returns false when either side is null/undefined", () => {
    expect(shallowEqual({ a: 1 }, null as any)).toBe(false);
    expect(shallowEqual(null as any, { a: 1 })).toBe(false);
  });
});

describe("useStore", () => {
  it("returns the StoreInstance from context", () => {
    const { store } = createMockStore({ counter: { value: 123 } });

    function Test() {
      const s = useStore<any, "counter", { counter: { value: number } }>();
      return <span data-testid="value">{s.getState().counter.value}</span>;
    }

    render(
      <StoreProvider store={store}>
        <Test />
      </StoreProvider>,
    );

    expect(screen.getByTestId("value").textContent).toBe("123");
  });
});

describe("useEmit / useDispatch", () => {
  it("useEmit returns the store.emit function and calls it", () => {
    const { store } = createMockStore({});

    function Test() {
      const emit = useEmit<any>();
      return (
        <button
          data-testid="btn"
          onClick={() => {
            emit("ui" as any, "ping" as any, 1 as any);
          }}
        >
          click
        </button>
      );
    }

    render(
      <StoreProvider store={store}>
        <Test />
      </StoreProvider>,
    );

    const btn = screen.getByTestId("btn");
    act(() => {
      btn.click();
    });

    expect(store.emit).toHaveBeenCalledTimes(1);
    expect(store.emit).toHaveBeenCalledWith("ui", "ping", 1);
  });

  it("useDispatch is a deprecated alias of useEmit", () => {
    const { store } = createMockStore({});

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    function Test() {
      const dispatch = useDispatch<any>();
      return (
        <button
          data-testid="btn"
          onClick={() => {
            dispatch("ui" as any, "legacy" as any, 2 as any);
          }}
        >
          click
        </button>
      );
    }

    render(
      <StoreProvider store={store}>
        <Test />
      </StoreProvider>,
    );

    act(() => {
      screen.getByTestId("btn").click();
    });

    expect(store.emit).toHaveBeenCalledWith("ui", "legacy", 2);
    // We only care a warning happened at least once.
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});

describe("useSelector", () => {
  it("selects a derived value and updates when it changes", () => {
    type State = { app: { value: number; other: number } };
    const { store } = createMockStore<State>({ app: { value: 0, other: 0 } });

    function Test() {
      const selected = useSelector<State, number>((s) => s.app.value);
      const renderCount = useRef(0);
      renderCount.current += 1;

      return (
        <>
          <span data-testid="value">{selected}</span>
          <span data-testid="renders">{renderCount.current}</span>
        </>
      );
    }

    render(
      <StoreProvider store={store}>
        <Test />
      </StoreProvider>,
    );

    expect(screen.getByTestId("value").textContent).toBe("0");
    expect(screen.getByTestId("renders").textContent).toBe("1");

    act(() => {
      store.setState((prev) => ({ app: { ...prev.app, value: 1 } }));
      store.notifyAll();
    });

    expect(screen.getByTestId("value").textContent).toBe("1");
    expect(screen.getByTestId("renders").textContent).toBe("2");

    // Update unrelated field: selector should not trigger new render
    act(() => {
      store.setState((prev) => ({ app: { ...prev.app, other: 999 } }));
      store.notifyAll();
    });

    expect(screen.getByTestId("value").textContent).toBe("1");
    expect(screen.getByTestId("renders").textContent).toBe("2");
  });

  it("respects custom isEqual comparator", () => {
    type State = { app: { arr: number[] } };
    const { store } = createMockStore<State>({ app: { arr: [1, 2] } });

    const isEqual = (a: number[], b: number[]) => a.length === b.length;

    function Test() {
      const arr = useSelector<State, number[]>((s) => s.app.arr, isEqual);
      const renderCount = useRef(0);
      renderCount.current += 1;

      return (
        <>
          <span data-testid="len">{arr.length}</span>
          <span data-testid="renders">{renderCount.current}</span>
        </>
      );
    }

    render(
      <StoreProvider store={store}>
        <Test />
      </StoreProvider>,
    );

    expect(screen.getByTestId("len").textContent).toBe("2");
    expect(screen.getByTestId("renders").textContent).toBe("1");

    // Change array but keep same length: no extra render
    act(() => {
      store.setState({ app: { arr: [3, 4] } });
      store.notifyAll();
    });

    expect(screen.getByTestId("len").textContent).toBe("2");
    expect(screen.getByTestId("renders").textContent).toBe("1");

    // Change length -> causes re-render
    act(() => {
      store.setState({ app: { arr: [3, 4, 5] } });
      store.notifyAll();
    });

    expect(screen.getByTestId("len").textContent).toBe("3");
    expect(screen.getByTestId("renders").textContent).toBe("2");
  });
});

describe("useAtomicProp", () => {
  type Slice = { items: Array<{ id: string; title: string }> };
  type RootState = { todos: Slice };

  it("subscribes to a single dotted path and updates when that path changes", () => {
    const { store } = createMockStore<RootState>({
      todos: { items: [{ id: "a", title: "first" }] },
    });

    function Test() {
      const title = useAtomicProp<"todos", RootState, "todos", "items.0.title">({
        reducer: "todos",
        property: "items.0.title",
      });
      return <span data-testid="title">{title}</span>;
    }

    render(
      <StoreProvider store={store}>
        <Test />
      </StoreProvider>,
    );

    expect(screen.getByTestId("title").textContent).toBe("first");

    act(() => {
      store.setState({
        todos: { items: [{ id: "a", title: "updated" }] },
      });
      // Implementation normalizes to "items.0.title"
      store.notifyPath("todos", "items.0.title");
    });

    expect(screen.getByTestId("title").textContent).toBe("updated");
  });

  it("normalizes a leading dot in the property before connecting", () => {
    const { store } = createMockStore<RootState>({
      todos: { items: [{ id: "a", title: "first" }] },
    });

    function Test() {
      const title = useAtomicProp<"todos", RootState, "todos", ".items.0.title">({
        reducer: "todos",
        property: ".items.0.title" as any,
      });
      return <span data-testid="title">{title}</span>;
    }

    render(
      <StoreProvider store={store}>
        <Test />
      </StoreProvider>,
    );

    const connections = store.getConnections();
    expect(connections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reducer: "todos",
          property: "items.0.title",
        }),
      ]),
    );
  });

  it("supports a mapping function and custom isEqual", () => {
    type RS = { todos: { items: number[] } };
    const { store } = createMockStore<RS>({
      todos: { items: [1, 2, 3] },
    });

    const map = (items: number[]) => items.reduce((sum, x) => sum + x, 0);
    const isEqual = (a: number, b: number) => a === b;

    function Test() {
      const sum = useAtomicProp<"todos", RS, "todos", "items", number>(
        { reducer: "todos", property: "items" },
        map,
        isEqual,
      );
      const renderCount = useRef(0);
      renderCount.current += 1;

      return (
        <>
          <span data-testid="sum">{sum}</span>
          <span data-testid="renders">{renderCount.current}</span>
        </>
      );
    }

    render(
      <StoreProvider store={store}>
        <Test />
      </StoreProvider>,
    );

    expect(screen.getByTestId("sum").textContent).toBe("6");
    expect(screen.getByTestId("renders").textContent).toBe("1");

    // Change items but keep same sum => no new render
    act(() => {
      store.setState({ todos: { items: [3, 3] } }); // sum still 6
      store.notifyPath("todos", "items");
    });

    expect(screen.getByTestId("sum").textContent).toBe("6");
    expect(screen.getByTestId("renders").textContent).toBe("1");

    // Change sum => re-render
    act(() => {
      store.setState({ todos: { items: [3, 3, 3] } }); // sum 9
      store.notifyPath("todos", "items");
    });

    expect(screen.getByTestId("sum").textContent).toBe("9");
    expect(screen.getByTestId("renders").textContent).toBe("2");
  });

  it("forces _useAtomicPropImpl when using a wildcard", () => {
    type RS = { todos: { items: number[] } };
    const { store } = createMockStore<RS>({
      todos: { items: [1, 2, 3] },
    });

    const map = (slice: any) => slice.items.length;

    function Test() {
      const len = useAtomicProp<"todos", RS, "todos", "items.*", number>(
        { reducer: "todos", property: "items.*" as any },
        map,
      );
      return <span data-testid="len">{len}</span>;
    }

    render(
      <StoreProvider store={store}>
        <Test />
      </StoreProvider>,
    );

    expect(screen.getByTestId("len").textContent).toBe("3");
  });
});

describe("useAtomicProps", () => {
  type RootState = {
    todos: { items: Array<{ title: string }> };
    filter: { q: string };
  };

  it("subscribes to multiple paths and recomputes derived selector", () => {
    const { store } = createMockStore<RootState>({
      todos: {
        items: [
          { title: "a" },
          { title: "b" },
          { title: "aa" },
        ],
      },
      filter: { q: "a" },
    });

    function Test() {
      const total = useAtomicProps<keyof RootState, RootState, number>(
        [
          { reducer: "todos", property: "items.**" },
          { reducer: "filter", property: "q" },
        ],
        (s) =>
          s.todos.items.filter((x) =>
            x.title.includes(s.filter.q),
          ).length,
      );

      return <span data-testid="total">{total}</span>;
    }

    render(
      <StoreProvider store={store}>
        <Test />
      </StoreProvider>,
    );

    expect(screen.getByTestId("total").textContent).toBe("2");

    act(() => {
      store.setState({
        todos: {
          items: [
            { title: "a" },
            { title: "b" },
            { title: "aa" },
            { title: "ab" },
          ],
        },
        filter: { q: "a" },
      });
      // We normalize to "items.**"
      store.notifyPath("todos", "items.**");
    });

    expect(screen.getByTestId("total").textContent).toBe("3");

    act(() => {
      store.setState((prev) => ({
        ...prev,
        filter: { q: "b" },
      }));
      store.notifyPath("filter", "q");
    });

    expect(screen.getByTestId("total").textContent).toBe("2");
  });

  it("supports property arrays and uses normalized paths", () => {
    type RS = { a: { foo: number; bar: number } };
    const { store } = createMockStore<RS>({ a: { foo: 1, bar: 2 } });

    function Test() {
      const sum = useAtomicProps<"a", RS, number>(
        [{ reducer: "a", property: [".foo", ".bar"] }],
        (s) => s.a.foo + s.a.bar,
      );
      return <span data-testid="sum">{sum}</span>;
    }

    render(
      <StoreProvider store={store}>
        <Test />
      </StoreProvider>,
    );

    const connections = store.getConnections();
    expect(connections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ reducer: "a", property: "foo" }),
        expect.objectContaining({ reducer: "a", property: "bar" }),
      ]),
    );
  });
});
