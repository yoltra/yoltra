import { render, screen, waitFor } from "@testing-library/react";
import { Suspense } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ReducerSpec } from "@yoltra/core";

import { createYoltra } from "../../../src/createYoltra";
import { StoreProvider } from "../../../src/context/StoreProvider";
import {
  clearSuspenseCache,
  invalidateAtomicProp,
  suspenseCache,
  useSuspenseAtomicProp,
} from "../../../src/hooks/suspense";

/**
 * Which context each family of Suspense hooks reads, and which cache entry each store gets.
 *
 * @remarks
 * `createYoltra` builds a private context and returns hooks bound to it. Its set used to stop
 * short of Suspense, so reaching for `useSuspenseAtomicProp` meant reaching for the package-level
 * export — which reads the package-level context that `createYoltra` never fills. The result was
 * a runtime throw with no compile-time signal, because the two are identical in shape. The
 * mission-control example fell into it for real.
 *
 * Both halves are pinned here: the returned hook works with no provider, and entries are keyed
 * per store so two stores with the same reducer and path cannot serve each other's values.
 */

type EM = { ui: { bump: number } };
type CounterState = { value: number };

const counterSpec = (initial: number): ReducerSpec<CounterState, EM> => ({
  state: { value: initial },
  when: { keys: [["ui", "bump"]] },
  reducer(state, event) {
    return event.type === "bump" ? { value: state.value + (event.payload as number) } : state;
  },
});

function build(initial = 1) {
  return createYoltra({ name: "Ctx", reducer: { counter: counterSpec(initial) } });
}

afterEach(() => clearSuspenseCache());

describe("Suspense hooks returned by createYoltra", () => {
  it("resolve with no StoreProvider, like the rest of the set", async () => {
    const { useSuspenseAtomicProp: useBound } = build(21);

    function Reader() {
      const doubled = useBound(
        { reducer: "counter", property: "value" },
        { load: (value) => Promise.resolve((value as number) * 2) },
      );
      return <span data-testid="out">{doubled}</span>;
    }

    render(
      <Suspense fallback="loading">
        <Reader />
      </Suspense>,
    );

    await waitFor(() => expect(screen.getByTestId("out").textContent).toBe("42"));
  });

  it("re-load when the subscribed path changes", async () => {
    const { store, useSuspenseAtomicProp: useBound } = build(1);

    function Reader() {
      const doubled = useBound(
        { reducer: "counter", property: "value" },
        { load: (value) => Promise.resolve((value as number) * 2) },
      );
      return <span data-testid="out">{doubled}</span>;
    }

    render(
      <Suspense fallback="loading">
        <Reader />
      </Suspense>,
    );
    await waitFor(() => expect(screen.getByTestId("out").textContent).toBe("2"));

    await store.emit("ui", "bump", 4);
    await waitFor(() => expect(screen.getByTestId("out").textContent).toBe("10"));
  });

  it("cover the multi-path form too, which is the other half of the set", async () => {
    const { store, useSuspenseAtomicProps: useBoundMany } = build(2);

    function Reader() {
      const summary = useBoundMany(
        [{ reducer: "counter", property: "value" }],
        { load: (state) => Promise.resolve(`v=${state.counter.value}`) },
      );
      return <span data-testid="out">{summary}</span>;
    }

    render(
      <Suspense fallback="loading">
        <Reader />
      </Suspense>,
    );
    await waitFor(() => expect(screen.getByTestId("out").textContent).toBe("v=2"));

    await store.emit("ui", "bump", 3);
    await waitFor(() => expect(screen.getByTestId("out").textContent).toBe("v=5"));
  });

  it("do not share cache entries with another store on the same reducer and path", async () => {
    // Same reducer name, same path, different data: the values must not cross.
    const a = build(1);
    const b = build(100);

    const reader = (hook: typeof a.useSuspenseAtomicProp, id: string) => {
      function Reader() {
        const value = hook(
          { reducer: "counter", property: "value" },
          { load: (v) => Promise.resolve(`${id}:${v as number}`) },
        );
        return <span data-testid={id}>{value}</span>;
      }
      return <Reader />;
    };

    render(
      <Suspense fallback="loading">
        {reader(a.useSuspenseAtomicProp, "a")}
        {reader(b.useSuspenseAtomicProp, "b")}
      </Suspense>,
    );

    await waitFor(() => expect(screen.getByTestId("a").textContent).toBe("a:1"));
    expect(screen.getByTestId("b").textContent).toBe("b:100");
    expect(suspenseCache.size).toBe(2);
  });

  it("are reachable by the un-scoped invalidate helpers", async () => {
    // `invalidateAtomicProp` names a path and no store, so it has to clear that path
    // wherever it was loaded — including entries a bound hook created.
    const { useSuspenseAtomicProp: useBound } = build(3);
    let loads = 0;

    function Reader() {
      const value = useBound(
        { reducer: "counter", property: "value" },
        {
          load: (v) => {
            loads++;
            return Promise.resolve(v as number);
          },
        },
      );
      return <span data-testid="out">{value}</span>;
    }

    const { rerender } = render(
      <Suspense fallback="loading">
        <Reader />
      </Suspense>,
    );
    await waitFor(() => expect(screen.getByTestId("out").textContent).toBe("3"));
    expect(loads).toBe(1);

    invalidateAtomicProp("counter", "value");
    expect(suspenseCache.size).toBe(0);

    rerender(
      <Suspense fallback="loading">
        <Reader key="again" />
      </Suspense>,
    );
    await waitFor(() => expect(loads).toBe(2));
  });
});

describe("the package-level Suspense hooks still read the package-level context", () => {
  function BarrelReader() {
    const doubled = useSuspenseAtomicProp<"counter", { counter: CounterState }, number>(
      { reducer: "counter", property: "value" },
      { load: (value) => Promise.resolve((value as number) * 2) },
    );
    return <span data-testid="out">{doubled}</span>;
  }

  it("throw without a StoreProvider, which is why createYoltra returns its own", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
    build();

    expect(() =>
      render(
        <Suspense fallback="loading">
          <BarrelReader />
        </Suspense>,
      ),
    ).toThrow(/StoreProvider/);

    errors.mockRestore();
  });

  it("work once the same store is put into that context", async () => {
    const { store } = build();

    render(
      <StoreProvider store={store as never}>
        <Suspense fallback="loading">
          <BarrelReader />
        </Suspense>
      </StoreProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("out").textContent).toBe("2"));
  });
});
