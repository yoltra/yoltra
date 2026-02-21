import { render, screen } from "@testing-library/react";
import { act, createContext } from "react";
import { describe, expect, it } from "vitest";

import type { EventMapBase, StoreInstance } from "@yoltra/core";
import { createHooks } from "../../../src/hooks/createHooks";
import { createMockStore } from "../../helpers/mockStore";

describe("createHooks", () => {
  type RootState = { counter: { value: number } };
  type R = "counter";
  type EM = EventMapBase;

  it("binds hooks to a specific StoreContext", () => {
    const CustomContext = createContext<StoreInstance<R, RootState, EM> | null>(null);
    const { useStore, useEmit, useSelector, useAtomicProp, useAtomicProps } = createHooks<
      R,
      RootState,
      EM
    >(CustomContext);

    const { store } = createMockStore<RootState>({ counter: { value: 0 } });

    function Test() {
      const s = useStore();
      const emit = useEmit();
      const value = useSelector((st) => st.counter.value);

      const doubled = useAtomicProp({
        reducer: "counter",
        property: "value",
      });

      const total = useAtomicProps(
        [{ reducer: "counter", property: "value" }],
        (st) => st.counter.value,
      );

      return (
        <>
          <span data-testid='store-ok'>{s === store ? "yes" : "no"}</span>
          <span data-testid='emit-eq'>{emit === store.emit ? "yes" : "no"}</span>
          <span data-testid='value'>{value}</span>
          <span data-testid='doubled'>{doubled * 2}</span>
          <span data-testid='total'>{total}</span>
        </>
      );
    }

    render(
      <CustomContext.Provider value={store as any}>
        <Test />
      </CustomContext.Provider>,
    );

    expect(screen.getByTestId("store-ok").textContent).toBe("yes");
    expect(screen.getByTestId("emit-eq").textContent).toBe("yes");
    expect(screen.getByTestId("value").textContent).toBe("0");

    act(() => {
      store.setState({ counter: { value: 5 } });
      store.notifyAll();
    });

    expect(screen.getByTestId("value").textContent).toBe("5");
    expect(screen.getByTestId("total").textContent).toBe("5");
  });
});
