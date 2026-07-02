import { describe, it, expect } from "vitest";
import { act, render } from "@testing-library/react";

import type { ReducerSpec } from "@yoltra/core";

import { createYoltra } from "../../src/createYoltra";

type EM = { ui: { increment: number } };
type CounterState = { value: number };

const counterSpec: ReducerSpec<CounterState, EM> = {
  state: { value: 0 },
  events: [["ui", "increment"]],
  reducer(state, event) {
    if (event.type === "increment") return { value: state.value + (event.payload as number) };
    return state;
  },
};

describe("createYoltra", () => {
  it("hooks work without a Provider (context defaults to the store) and re-render on change", async () => {
    const { store, useAtomicProp, useEmit } = createYoltra({
      name: "AppNoProvider",
      reducer: { counter: counterSpec },
    });

    function Counter() {
      const value = useAtomicProp({ reducer: "counter", property: "value" });
      const emit = useEmit();
      return (
        <button data-testid="btn" onClick={() => emit("ui", "increment", 1)}>
          {value}
        </button>
      );
    }

    const { getByTestId } = render(<Counter />); // no <StoreProvider>
    expect(getByTestId("btn").textContent).toBe("0");

    await act(async () => {
      await store.emit("ui", "increment", 5);
    });
    expect(getByTestId("btn").textContent).toBe("5");
  });

  it("StoreProvider scopes a different store instance to a subtree", async () => {
    const app = createYoltra({ name: "AppProvided", reducer: { counter: counterSpec } });
    const scoped = createYoltra({ name: "Scoped", reducer: { counter: counterSpec } });

    // Give the scoped store a distinct value.
    await scoped.store.emit("ui", "increment", 9);

    function Counter() {
      const value = app.useAtomicProp({ reducer: "counter", property: "value" });
      return <span data-testid="v">{value}</span>;
    }

    const { getByTestId } = render(
      <app.StoreProvider store={scoped.store}>
        <Counter />
      </app.StoreProvider>,
    );

    // Reads from the scoped store (9), not app.store (still 0).
    expect(getByTestId("v").textContent).toBe("9");
    expect(app.store.getState().counter.value).toBe(0);
  });

  it("StoreProvider without a store prop falls back to the created store", async () => {
    const app = createYoltra({ name: "AppDefaultProvider", reducer: { counter: counterSpec } });

    function Counter() {
      const value = app.useAtomicProp({ reducer: "counter", property: "value" });
      return <span data-testid="v2">{value}</span>;
    }

    const { getByTestId } = render(
      <app.StoreProvider>
        <Counter />
      </app.StoreProvider>,
    );

    expect(getByTestId("v2").textContent).toBe("0");
    await act(async () => {
      await app.store.emit("ui", "increment", 3);
    });
    expect(getByTestId("v2").textContent).toBe("3");
  });
});
