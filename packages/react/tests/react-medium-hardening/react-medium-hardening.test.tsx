import { Suspense, createContext } from "react";
import { render, act } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, it, expect, vi } from "vitest";

import type { ReducerSpec, StoreInstance } from "@yoltra/core";

import { createHooks } from "../../src/hooks/createHooks";
import { createYoltra } from "../../src/createYoltra";
import { StoreProvider } from "../../src/context/StoreProvider";
import { useSuspenseAtomicProp } from "../../src/hooks/suspense";
import { createMockStore } from "../helpers/mockStore";

describe("React medium hardening", () => {
  it("useStore throws a clear, provider-optional error when no store is in context (RX-7)", () => {
    const Ctx = createContext<StoreInstance<any, any, any> | null>(null);
    const { useStore } = createHooks(Ctx);

    function Bad() {
      useStore();
      return null;
    }

    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Bad />)).toThrow(/No store in context/);
    spy.mockRestore();
  });

  it("useSuspenseAtomicProp does not suspend during SSR — returns the current value (RX-4)", () => {
    type RootState = { todos: { items: Array<{ title: string }> } };
    const { store } = createMockStore<RootState>({ todos: { items: [{ title: "srv" }] } });

    function View() {
      const v = useSuspenseAtomicProp<"todos", RootState, string>(
        { reducer: "todos", property: "items.0.title" },
        { load: async () => "loaded-on-client" },
      );
      return <span>{v}</span>;
    }

    // renderToString invokes getServerSnapshot. Before RX-4 it threw a promise
    // (crash); now it returns the current value at the path without loading.
    const html = renderToString(
      <StoreProvider store={store}>
        <Suspense fallback={<span>loading</span>}>
          <View />
        </Suspense>
      </StoreProvider>,
    );

    expect(html).toContain("srv");
    expect(html).not.toContain("loading");
  });

  it("useAtomicProps handles an undefined selection through the equality cache (RX-6)", async () => {
    type EM = { ui: { setName: string } };
    type AppState = { user: { name?: string } };

    const userSpec: ReducerSpec<AppState["user"], EM> = {
      state: {},
      events: [["ui", "setName"]],
      reducer: (s, e) => (e.type === "setName" ? { name: e.payload as string } : s),
    };

    const { store, useAtomicProps } = createYoltra({ name: "U", reducer: { user: userSpec } });

    function View() {
      const name = useAtomicProps([{ reducer: "user", property: "name" }], (st) => st.user.name);
      return <span data-testid="n">{name ?? "(none)"}</span>;
    }

    const { getByTestId } = render(<View />);
    // An undefined selection renders and does not thrash (the presence flag, not
    // the value being undefined, marks "no value yet").
    expect(getByTestId("n").textContent).toBe("(none)");

    await act(async () => {
      await store.emit("ui", "setName", "Ada");
    });
    expect(getByTestId("n").textContent).toBe("Ada");
  });
});
