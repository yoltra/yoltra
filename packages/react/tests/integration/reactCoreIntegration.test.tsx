import { render, screen, fireEvent } from "@testing-library/react";
import { act } from "react";
import { describe, it, expect } from "vitest";

import { createHooks, StoreContext, StoreProvider } from "../../src";
import { createStore } from "@yoltra/core";

// The atomic hooks come from `createHooks` — the one way to get them since the standalone
// explicit-generic flavor was removed. Binding to the library's own StoreContext is what
// `StoreProvider` populates.
const { useAtomicProp, useEmit } = createHooks(StoreContext);

describe("React + @yoltra/core integration", () => {
  it("wires StoreProvider, useAtomicProp and useEmit together with a real store", async () => {
    // Using the same configuration pattern as documented in StoreProvider JSDoc.
    const store = (createStore as any)({
      name: "App",
      reducer: {
        counter: {
          state: { value: 0 },
          when: { keys: [["ui", "increment"]] },
          reducer(state: { value: number }, event: any) {
            if (event.type === "increment") {
              return { value: state.value + (event.payload ?? 1) };
            }
            return state;
          },
        },
      },
    });

    type RootState = { counter: { value: number } };

    function Counter() {
      const value = useAtomicProp({ reducer: "counter", property: "value" });
      const emit = useEmit();

      return (
        <div>
          <span data-testid="value">{value}</span>
          <button
            data-testid="inc"
            onClick={() => emit("ui", "increment", 1)}
          >
            +
          </button>
        </div>
      );
    }

    render(
      <StoreProvider store={store}>
        <Counter />
      </StoreProvider>,
    );

    expect(screen.getByTestId("value").textContent).toBe("0");

    const btn = screen.getByTestId("inc");
    await act(async () => {
      fireEvent.click(btn);
      // emit may be async
      await Promise.resolve();
    });

    expect(screen.getByTestId("value").textContent).toBe("1");
  });
});
