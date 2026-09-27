/**
 * The chainable React surface: a hook set that grows with the store.
 *
 * @remarks
 * `createHooks` allocates fresh function objects per call, so a widened hook set is a
 * *different* set of functions reading the *same* context and therefore the same store. The
 * properties worth pinning are the ones that make that safe: one store, one context object,
 * one Suspense cache, and providers that interoperate across views.
 */

import { render, screen, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { createYoltra, withEffect, withMiddleware, withSlice } from "../../src/createYoltra";
import { defineSlice } from "@yoltra/core";
import type { ReducerSpec } from "@yoltra/core";

type AppEM = { ui: { increment: number } };
type LateEM = { late: { touched: null } };

function makeApp() {
  return createYoltra({
    name: "DecoratedApp",
    reducer: {
      counter: {
        state: { value: 0 },
        when: { keys: [["ui", "increment"]] },
        reducer: (s: { value: number }, e) =>
          e.type === "increment" ? { value: s.value + (e.payload as number) } : s,
      } as ReducerSpec<{ value: number }, AppEM>,
    },
  });
}

const lateSlice = defineSlice<LateEM>()({
  state: { hits: 0, nested: { deep: "x" } },
  when: { keys: [["late", "touched"]] },
  reducer: (s: { hits: number; nested: { deep: string } }) => ({ ...s, hits: s.hits + 1 }),
});

describe("withSlice on a Yoltra", () => {
  it("keeps the same store and the same context object", () => {
    const app = makeApp();
    const widened = app.withSlice("late", lateSlice);

    // Type-level growth, runtime identity. A wrapper or a copy here would detach every
    // existing subscription.
    expect(widened.store).toBe(app.store);
    expect(widened.StoreContext).toBe(app.StoreContext);
    // But a genuinely new hook set, which is why this must run at module scope, once.
    expect(widened.useAtomicProp).not.toBe(app.useAtomicProp);
  });

  it("renders a slice mounted after creation", () => {
    const app = makeApp();
    const widened = app.withSlice("late", lateSlice);

    function Probe() {
      const hits = widened.useAtomicProp({ reducer: "late", property: "hits" });
      return <span data-testid="hits">{String(hits)}</span>;
    }
    render(<Probe />);
    expect(screen.getByTestId("hits").textContent).toBe("0");

    act(() => {
      void widened.store.emit("late", "touched", null);
    });
    expect(screen.getByTestId("hits").textContent).toBe("1");
  });

  it("lets the original hook set keep working on the same tree", () => {
    const app = makeApp();
    const widened = app.withSlice("late", lateSlice);

    function Probe() {
      const value = app.useAtomicProp({ reducer: "counter", property: "value" });
      const hits = widened.useAtomicProp({ reducer: "late", property: "hits" });
      return <span data-testid="both">{`${value}/${hits}`}</span>;
    }
    render(<Probe />);
    expect(screen.getByTestId("both").textContent).toBe("0/0");

    act(() => {
      void app.store.emit("ui", "increment", 2);
    });
    expect(screen.getByTestId("both").textContent).toBe("2/0");
  });

  it("serves widened hooks through the original view's provider", () => {
    // The context is re-typed, not recreated, so providers interoperate in both directions.
    const app = makeApp();
    const widened = app.withSlice("late", lateSlice);

    function Probe() {
      const hits = widened.useAtomicProp({ reducer: "late", property: "hits" });
      return <span data-testid="hits">{String(hits)}</span>;
    }

    render(
      <app.StoreProvider>
        <Probe />
      </app.StoreProvider>,
    );
    expect(screen.getByTestId("hits").textContent).toBe("0");
  });

  it("chains through middleware without losing the earlier widening", () => {
    const app = makeApp();
    const chained = app
      .withSlice("late", lateSlice)
      .withMiddleware(() => true)
      .withEffect({ when: { keys: [["ui", "increment"]] }, effect: async () => {} });

    function Probe() {
      const hits = chained.useAtomicProp({ reducer: "late", property: "hits" });
      const value = chained.useAtomicProp({ reducer: "counter", property: "value" });
      return <span data-testid="both">{`${value}/${hits}`}</span>;
    }
    render(<Probe />);
    expect(screen.getByTestId("both").textContent).toBe("0/0");
  });

  it("shares one Suspense cache across views, because it keys on the store", () => {
    const app = makeApp();
    const widened = app.withSlice("late", lateSlice);

    // Not a behavioural assertion so much as a structural one: the cache is keyed by store
    // identity through a WeakMap, and both views hold the same store.
    expect(widened.store).toBe(app.store);
    expect(typeof widened.useSuspenseAtomicProp).toBe("function");
  });
});

describe("the free-function forms", () => {
  // For a library handed a `Yoltra` it did not create, which reads better than reaching for
  // a method on someone else's object. Identical behaviour to the methods.

  it("withSlice(yoltra, ...) mounts and widens like the method", () => {
    const app = makeApp();
    const widened = withSlice(app, "late", lateSlice, { owner: "@scope/late" });

    expect(widened.store).toBe(app.store);

    function Probe() {
      const hits = widened.useAtomicProp({ reducer: "late", property: "hits" });
      return <span data-testid="hits">{String(hits)}</span>;
    }
    render(<Probe />);
    expect(screen.getByTestId("hits").textContent).toBe("0");

    // The owner reaches introspection, where a panel can use it.
    const mounted = app.store
      .__devtoolsIntrospect()
      .reducers.find((r) => r.name === "late");
    expect(mounted?.owner).toBe("@scope/late");
    expect(mounted?.origin).toBe("dynamic");
  });

  it("withMiddleware(yoltra, ...) and withEffect(yoltra, ...) register on the same store", async () => {
    const app = makeApp();
    const calls: string[] = [];

    const a = withMiddleware(app, () => {
      calls.push("mw");
      return true;
    });
    const b = withEffect(a, {
      when: { keys: [["ui", "increment"]] },
      effect: async () => {
        calls.push("fx");
      },
    });

    expect(b.store).toBe(app.store);

    await app.store.emit("ui", "increment", 1);
    expect(calls).toEqual(["mw", "fx"]);
  });
});
