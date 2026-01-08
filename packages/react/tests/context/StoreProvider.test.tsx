// file: quojs/packages/react/tests/context/StoreProvider.test.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { StoreProvider } from "../../src/context/StoreProvider";
import { useStore } from "../../src/hooks/hooks";
import { createMockStore } from "../helpers/mockStore";

describe("StoreProvider / StoreContext integration", () => {
  it("renders children and provides store via useStore()", () => {
    const { store } = createMockStore({ counter: { value: 1 } });

    function TestComponent() {
      const s = useStore<any, "counter", { counter: { value: number } }>();
      return <div data-testid="value">{s.getState().counter.value}</div>;
    }

    render(
      <StoreProvider store={store}>
        <TestComponent />
      </StoreProvider>,
    );

    expect(screen.getByTestId("value").textContent).toBe("1");
  });

  it("throws a descriptive error when useStore() is used outside StoreProvider", () => {
    function BadComponent() {
      // This should throw because there is no StoreProvider above.
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useStore<any, any, any>();
      return null;
    }

    // Rendering should throw synchronously.
    expect(() => render(<BadComponent />)).toThrowError(
      "useStore must be used inside <StoreProvider>",
    );
  });
});
