import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StoreProvider } from "../../../src/context/StoreProvider";
import { useAtomicProps } from "../../../src/hooks/hooks";
import { createMockStore } from "../../helpers/mockStore";

/**
 * The development guard against undeclared reads, over state that has been frozen.
 *
 * @remarks
 * Freezing is the normal case rather than an edge one. Immer's `produce` auto-freezes what it
 * returns unless `setAutoFreeze(false)` is called, and `@yoltra/core` ships a `deepFreeze` for
 * exactly this purpose, so any reducer written the ordinary way hands the store frozen objects.
 *
 * It matters here because of a proxy invariant that is easy to miss: when a target has an own
 * data property that is **non-writable and non-configurable**, which is what `Object.freeze`
 * produces, a `get` trap must return that exact value. Returning a wrapper — even a transparent
 * one — is a `TypeError` raised by the engine, not by any code one can see.
 *
 * Every test in `declared-projection.test.tsx` builds its state with a plain object literal and
 * never freezes it, which is why the guard looked correct for as long as it did.
 */

interface RootState {
  todo: {
    filter: {
      selectedCategory: string;
      /** The nested object. A primitive would not trip the invariant; an object does. */
      categories: Record<string, number>;
    };
  };
}

/** Frozen all the way down, the way a reducer using `produce` or `deepFreeze` would leave it. */
function frozenState(): RootState {
  return Object.freeze({
    todo: Object.freeze({
      filter: Object.freeze({
        selectedCategory: "",
        categories: Object.freeze({ home: 2, work: 5 }),
      }),
    }),
  }) as RootState;
}

function renderReading(read: (filter: RootState["todo"]["filter"]) => string) {
  const { store } = createMockStore<RootState>(frozenState());

  function Probe() {
    const { filter } = useAtomicProps([{ reducer: "todo", property: "filter" }] as never, (
      { todo }: RootState,
    ) => ({ filter: todo.filter }));
    return <span data-testid="out">{read(filter)}</span>;
  }

  return render(
    <StoreProvider store={store}>
      <Probe />
    </StoreProvider>,
  );
}

describe("a projection over frozen state", () => {
  it("reads a nested object without tripping the proxy invariant", () => {
    // The failure this pins: `'get' on proxy: property 'categories' is a read-only and
    // non-configurable data property on the proxy target but the proxy did not return its
    // actual value`. Thrown by the engine before any application code runs, which is why the
    // stack trace pointed at the component and named nothing in this package.
    renderReading((filter) => Object.keys(filter.categories).join(","));
    expect(screen.getByTestId("out").textContent).toBe("home,work");
  });

  it("reads a primitive beside it, which never tripped the invariant", () => {
    renderReading((filter) => `[${filter.selectedCategory}]`);
    expect(screen.getByTestId("out").textContent).toBe("[]");
  });

  it("still refuses an undeclared read one level down", () => {
    // The guard has to keep working over frozen state, not merely stop crashing on it.
    expect(() =>
      renderReading((filter) => String((filter as { missing?: unknown }).missing)),
    ).toThrow(/did not subscribe to/);
  });

  it("still refuses an undeclared read inside a frozen nested object", () => {
    expect(() =>
      renderReading((filter) =>
        String((filter.categories as Record<string, unknown>).nope ?? "x") === "x"
          ? "unreachable"
          : "unreachable",
      ),
    ).toThrow(/did not subscribe to/);
  });
});
