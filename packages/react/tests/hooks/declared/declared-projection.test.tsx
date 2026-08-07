import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StoreProvider } from "../../../src/context/StoreProvider";
import { useAtomicProps } from "../../../src/hooks/hooks";
import {
  expandPattern,
  projectDeclared,
} from "../../../src/utils/declaredProjection";
import { createMockStore } from "../../helpers/mockStore";

interface RootState {
  todo: {
    data: Record<string, { id: string; title: string; done: boolean }>;
    filter: { selectedCategory: string; selectedStatus: string };
    items: Array<{ id: string; title: string; done: boolean }>;
  };
  other: { untouched: number };
}

const initial = (): RootState => ({
  todo: {
    data: { a: { id: "a", title: "first", done: false } },
    filter: { selectedCategory: "", selectedStatus: "ALL" },
    items: [
      { id: "a", title: "first", done: false },
      { id: "b", title: "second", done: true },
    ],
  },
  other: { untouched: 1 },
});

/** Renders a component whose selector the test supplies. */
function renderWith(
  specs: Array<{ reducer: keyof RootState & string; property: string }>,
  selector: (state: never) => unknown,
) {
  const { store } = createMockStore<RootState>(initial());

  function Probe() {
    const value = useAtomicProps(specs as never, selector as never);
    return <span data-testid="out">{JSON.stringify(value ?? null)}</span>;
  }

  return render(
    <StoreProvider store={store}>
      <Probe />
    </StoreProvider>,
  );
}

describe("the selector sees what was declared, and nothing else", () => {
  it("hands over a declared path", () => {
    renderWith(
      [{ reducer: "todo", property: "filter" }],
      ({ todo }: RootState) => todo.filter.selectedStatus,
    );
    expect(screen.getByTestId("out").textContent).toBe('"ALL"');
  });

  it("throws, naming the path, when the selector reads something it did not declare", () => {
    // This is the bug that shipped in this repository's own example: subscribed to
    // `todo.filter`, reading `todo.data`, working only because adding a todo also rewrote
    // `filter.categories`.
    const boom = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() =>
      renderWith(
        [{ reducer: "todo", property: "filter" }],
        ({ todo }: RootState) => Object.keys(todo.data),
      ),
    ).toThrow(/read "todo\.data", which it did not subscribe to/);

    boom.mockRestore();
  });

  it("names the declarations it does have, so the fix is obvious", () => {
    const boom = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() =>
      renderWith(
        [{ reducer: "todo", property: "filter" }],
        ({ todo }: RootState) => todo.data,
      ),
    ).toThrow(/Declared: \[\{ reducer: "todo", property: "filter" \}\]/);
    boom.mockRestore();
  });

  it("refuses a whole reducer that was never declared", () => {
    const boom = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() =>
      renderWith(
        [{ reducer: "todo", property: "filter" }],
        ({ other }: RootState) => other.untouched,
      ),
    ).toThrow(/read "other"/);
    boom.mockRestore();
  });

  it("yields undefined in production, not the real value", () => {
    // The structural half of the fix, and the half that matters. The development guard makes
    // the mistake loud; this makes it *impossible* to read state you did not subscribe to,
    // in the build where nobody is watching. Without this the projection would be advisory.
    vi.stubEnv("NODE_ENV", "production");
    try {
      renderWith(
        [{ reducer: "todo", property: "filter" }],
        ({ todo }: RootState) => todo.data ?? "absent",
      );
      expect(screen.getByTestId("out").textContent).toBe('"absent"');
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("allows several declarations together", () => {
    renderWith(
      [
        { reducer: "todo", property: "data" },
        { reducer: "todo", property: "filter" },
      ],
      ({ todo }: RootState) => ({
        count: Object.keys(todo.data).length,
        status: todo.filter.selectedStatus,
      }),
    );
    expect(screen.getByTestId("out").textContent).toBe('{"count":1,"status":"ALL"}');
  });
});

describe("the projection itself", () => {
  const declared = (reducer: string, property: string) => [{ reducer, property }];

  it("copies leaves by reference, so downstream memoization still works", () => {
    const state = initial();
    const projected = projectDeclared(state, declared("todo", "data"));
    expect((projected.todo as RootState["todo"]).data).toBe(state.todo.data);
  });

  it("records a declared path that is absent, so it reads undefined rather than throwing", () => {
    const projected = projectDeclared(initial(), declared("todo", "filter.missing"));
    const filter = (projected.todo as { filter: Record<string, unknown> }).filter;
    expect("missing" in filter).toBe(true);
    expect(filter.missing).toBeUndefined();
  });

  it("keeps an array an array when a declared path runs through one", () => {
    // Otherwise `items` would arrive as an object with a "0" key and behave differently from
    // real state under `map` and `Object.values` for no reason the caller could see.
    const projected = projectDeclared(initial(), declared("todo", "items.0.title"));
    const items = (projected.todo as { items: unknown[] }).items;
    expect(Array.isArray(items)).toBe(true);
    expect((items[0] as { title: string }).title).toBe("first");
  });

  it("gives the whole slice when the whole slice is declared", () => {
    const state = initial();
    const projected = projectDeclared(state, declared("todo", ""));
    expect(projected.todo).toBe(state.todo);
  });
});

describe("wildcards expand to what they actually match", () => {
  it("expands one segment", () => {
    expect(expandPattern(initial().todo, "items.*.done").sort()).toEqual([
      "items.0.done",
      "items.1.done",
    ]);
  });

  it("expands any depth", () => {
    expect(expandPattern({ a: { b: { c: 1 } } }, "**.c")).toEqual(["a.b.c"]);
  });

  it("matches nothing when the path is not there", () => {
    expect(expandPattern(initial().todo, "nope.*.done")).toEqual([]);
  });

  it("does not smuggle in siblings under the pattern", () => {
    // The reason patterns are expanded rather than approximated by their static prefix:
    // handing over all of `items` would let a component subscribed to `items.*.done` read
    // `items.0.title`, which is the same bug one level down.
    const projected = projectDeclared(initial(), [
      { reducer: "todo", property: "items.*.done" },
    ]);
    const first = (projected.todo as { items: Array<Record<string, unknown>> }).items[0]!;
    expect("done" in first).toBe(true);
    expect("title" in first).toBe(false);
  });
});
