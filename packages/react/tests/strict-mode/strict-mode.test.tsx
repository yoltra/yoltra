import { StrictMode } from "react";
import { render, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import type { ReducerSpec } from "@yoltra/core";

import { useAtomicProp } from "../../src/hooks/hooks";
import { StoreProvider } from "../../src/context/StoreProvider";
import { createYoltra } from "../../src/createYoltra";
import { createMockStore } from "../helpers/mockStore";

/**
 * StrictMode + `useSyncExternalStore` safety (TEST-1).
 *
 * StrictMode double-invokes subscribe/effect setup in dev (setup → cleanup →
 * setup). A store binding must (a) tear down every subscription it opens so the
 * net count is stable and unmount leaves nothing behind, and (b) keep a stable
 * snapshot reference for an unchanged leaf so unrelated changes don't re-render
 * (and `useSyncExternalStore` doesn't detect a phantom tear).
 */
describe("StrictMode / useSyncExternalStore safety (TEST-1)", () => {
  it("subscribes and cleans up symmetrically under StrictMode (no leaked connections)", () => {
    type RootState = { counter: { value: number } };
    const { store } = createMockStore<RootState>({ counter: { value: 0 } });

    function Value() {
      const v = useAtomicProp<"counter", RootState>({ reducer: "counter", property: "value" });
      return <span>{String(v)}</span>;
    }

    const { unmount } = render(
      <StrictMode>
        <StoreProvider store={store}>
          <Value />
        </StoreProvider>
      </StrictMode>,
    );

    // Despite StrictMode's subscribe → cleanup → subscribe cycle, exactly one
    // connection remains active — cleanup is symmetric, nothing leaks.
    expect(store.getConnections()).toEqual([{ reducer: "counter", property: "value" }]);

    unmount();
    // Unmount tears down every subscription.
    expect(store.getConnections()).toHaveLength(0);
  });

  it("keeps a stable snapshot for an unchanged leaf under StrictMode (no phantom re-render)", async () => {
    type EM = { ui: { bumpA: number; bumpB: number } };
    type AppState = { a: { x: number }; b: { y: number } };

    const aSpec: ReducerSpec<AppState["a"], EM> = {
      state: { x: 0 },
      events: [["ui", "bumpA"]],
      reducer: (s, e) => (e.type === "bumpA" ? { x: s.x + (e.payload as number) } : s),
    };
    const bSpec: ReducerSpec<AppState["b"], EM> = {
      state: { y: 0 },
      events: [["ui", "bumpB"]],
      reducer: (s, e) => (e.type === "bumpB" ? { y: s.y + (e.payload as number) } : s),
    };

    const { store, useAtomicProp: useProp } = createYoltra({
      name: "Strict",
      reducer: { a: aSpec, b: bSpec },
    });

    let aRenders = 0;
    function AView() {
      aRenders++;
      const x = useProp({ reducer: "a", property: "x" });
      return <span data-testid="a">{x}</span>;
    }

    const { getByTestId } = render(
      <StrictMode>
        <AView />
      </StrictMode>,
    );
    expect(getByTestId("a").textContent).toBe("0");
    const baseline = aRenders;

    // Changing b.y must NOT re-render AView — its leaf a.x is unchanged and its
    // snapshot reference is stable.
    await act(async () => {
      await store.emit("ui", "bumpB", 1);
    });
    expect(aRenders).toBe(baseline);
    expect(getByTestId("a").textContent).toBe("0");

    // Changing a.x DOES re-render AView.
    await act(async () => {
      await store.emit("ui", "bumpA", 1);
    });
    expect(getByTestId("a").textContent).toBe("1");
    expect(aRenders).toBeGreaterThan(baseline);
  });
});
