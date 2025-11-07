import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";

import { StoreContext } from "../../src/context/StoreContext";
import {
  createStore,
  type ReducerSpec,
  type ReducerFunction,
  type ActionUnion,
  type ActionPair,
} from "@quojs/core";
import { useSliceProp, useSliceProps } from "../../src/hooks/hooks";
import * as Warn from "../../src/utils/warnOnce";

type S = { todo: { a: number; b: number } };
type AM = { todo: { incA: {}; incB: {} } };

const reducer: ReducerFunction<S["todo"], AM> = (s = { a: 0, b: 0 }, a: ActionUnion<AM>) => {
  if (a.channel !== "todo") return s;
  if (a.event === "incA") return { ...s, a: s.a + 1 };
  if (a.event === "incB") return { ...s, b: s.b + 1 };
  return s;
};
const ACTIONS = [["todo", "incA"], ["todo", "incB"]] as const satisfies readonly ActionPair<AM>[];

const makeStore = () => createStore({
  name: "t",
  reducer: { todo: { actions: [...ACTIONS], state: { a: 0, b: 0 }, reducer } as ReducerSpec<S["todo"], AM> },
  middleware: [],
}) as any;

function Provider({ children, store }: { children: React.ReactNode; store: any }) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

describe("deprecated wrappers warn once and work", () => {
  afterEach(() => cleanup());

  it("useSliceProp warns once and returns value", async () => {
    const spy = vi.spyOn(Warn, "warnOnce");
    const store = makeStore();

    const Comp = () => {
      const a = useSliceProp<"todo", S, "a">({ reducer: "todo", property: "a" });
      return <div data-testid="a">{String(a)}</div>;
    };

    const rr = render(<Provider store={store}><Comp /></Provider>);
    expect(rr.getByTestId("a").textContent).toBe("0");

    await act(async () => { store.dispatch("todo", "incA", {}); });
    expect(rr.getByTestId("a").textContent).toBe("1");

    // called once with our deprecation key
    expect(spy).toHaveBeenCalled();

    const keys = spy.mock.calls.map(c => c[0]);
    expect(keys.some(k => String(k).includes("quo:useSliceProp"))).toBe(true);
  });

  it("useSliceProps warns and recomputes", async () => {
    const spy = vi.spyOn(Warn, "warnOnce");
    const store = makeStore();
    const Comp = () => {
      const s = useSliceProps<"todo", S, string>(
        [{ reducer: "todo", property: ["a", "b"] }],
        (state) => `${state.todo.a}:${state.todo.b}`
      );

      return <div data-testid="s">{s}</div>;
    };

    const rr = render(<Provider store={store}><Comp /></Provider>);
    expect(rr.getByTestId("s").textContent).toBe("0:0");

    await act(async () => { store.dispatch("todo", "incA", {}); });
    await act(async () => { store.dispatch("todo", "incB", {}); });
    
    expect(rr.getByTestId("s").textContent).toBe("1:1");
    expect(spy).toHaveBeenCalled();
  });
});
