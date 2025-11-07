import React, { PropsWithChildren } from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import { createStore, type ReducerSpec, type ReducerFunction, type ActionUnion, type ActionPair } from "@quojs/core";
import { StoreContext } from "../../src/context/StoreContext";
import { createQuoHooks } from "../../src/hooks/createQuoHooks";

type Slice = { n: number };
type S = { math: Slice };
type AM = { math: { inc: {} } };

const reducer: ReducerFunction<Slice, AM> = (s = { n: 0 }, a: ActionUnion<AM>) =>
  a.channel === "math" && a.event === "inc" ? { n: s.n + 1 } : s;
const ACTIONS = [["math", "inc"]] as const satisfies readonly ActionPair<AM>[];

const makeStore = () => createStore({
  name: "t",
  reducer: { math: { actions: [...ACTIONS], state: { n: 0 }, reducer } as ReducerSpec<Slice, AM> },
  middleware: [],
}) as any;

function Provider({ children, store }: PropsWithChildren<{ store: any }>) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

describe("createQuoHooks factory", () => {
  afterEach(() => cleanup());

  it("binds hooks to context and selects a path", async () => {
    const store = makeStore();
    const { useDispatch, useSliceProp: legacy, useSliceProps: legacyMany, shallowEqual } =
      createQuoHooks<"math", S, AM>(StoreContext);

    const Comp = () => {
      const d = useDispatch();
      const n = legacy({ reducer: "math", property: "n" });
      // @ts-expect-error that is why we are passing the shallowEqual
      const derived = legacyMany([{ reducer: "math", property: "n" }], s => s.math.n, shallowEqual);

      return (
        <div>
          <button data-testid="btn" onClick={() => d("math", "inc", {})}>inc</button>
          <div data-testid="n">{String(n)}</div>
          <div data-testid="d">{String(derived)}</div>
        </div>
      );
    };

    const rr = render(<Provider store={store}><Comp /></Provider>);
    expect(rr.getByTestId("n").textContent).toBe("0");
    expect(rr.getByTestId("d").textContent).toBe("0");

    await act(async () => { rr.getByTestId("btn").dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    expect(rr.getByTestId("n").textContent).toBe("1");
    expect(rr.getByTestId("d").textContent).toBe("1");
  });
});
