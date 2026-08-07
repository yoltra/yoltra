/**
 * The bound flavors that the barrel pruning made the only flavors: `useEvent` and the
 * array-property form of `useAtomicProps`, exercised through `createHooks` the way an
 * application reaches them.
 */

import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { act } from "react";
import { createContext } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createStore } from "@yoltra/core";
import type { ReducerSpec, StoreInstance } from "@yoltra/core";

import { createHooks } from "../../src/hooks/createHooks";

afterEach(cleanup);

type EM = { ui: { increment: number; note: string } };
type AppState = { counter: { value: number; label: string } };

const counterSpec: ReducerSpec<AppState["counter"], EM> = {
  state: { value: 0, label: "zero" },
  when: { keys: [["ui", "increment"]] },
  reducer: (s, e) => (e.type === "increment" ? { ...s, value: s.value + (e.payload as number) } : s),
};

const Ctx = createContext<StoreInstance<"counter", AppState, EM> | null>(null);
const { useAtomicProps, useEvent, useEmit } = createHooks(Ctx);

const build = () =>
  createStore<AppState, EM>({ name: "bound", reducer: { counter: counterSpec } });

describe("the bound useEvent", () => {
  it("runs the handler on a committed event and stops on unmount", async () => {
    const store = build();
    const heard = vi.fn();

    function Listener() {
      useEvent("ui", "increment", (event) => {
        heard(event.payload);
      });
      return null;
    }

    const view = render(
      <Ctx.Provider value={store}>
        <Listener />
      </Ctx.Provider>,
    );

    await act(async () => {
      await store.emit("ui", "increment", 5);
    });
    expect(heard).toHaveBeenCalledWith(5);

    view.unmount();
    await act(async () => {
      await store.emit("ui", "increment", 1);
    });
    expect(heard).toHaveBeenCalledTimes(1);
  });
});

describe("the bound useAtomicProps with array properties", () => {
  it("subscribes to several paths per spec and derives across them", async () => {
    const store = build();

    function Summary() {
      const emit = useEmit();
      const summary = useAtomicProps(
        [{ reducer: "counter", property: ["value", "label"] as const }],
        (state) => `${state.counter.label}:${state.counter.value}`,
      );
      return (
        <button onClick={() => void emit("ui", "increment", 2)}>{summary}</button>
      );
    }

    render(
      <Ctx.Provider value={store}>
        <Summary />
      </Ctx.Provider>,
    );

    expect(screen.getByRole("button").textContent).toBe("zero:0");

    await act(async () => {
      await store.emit("ui", "increment", 2);
    });
    await waitFor(() => {
      expect(screen.getByRole("button").textContent).toBe("zero:2");
    });
  });
});
