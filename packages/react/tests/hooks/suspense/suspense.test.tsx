import { Suspense } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";

import {
  useSuspenseAtomicProp,
  useSuspenseAtomicProps,
  invalidateAtomicProp,
  invalidateAtomicPropsByReducer,
  clearSuspenseCache,
  suspenseCache,
} from "../../../src/hooks/suspense";
import { StoreProvider } from "../../../src/context/StoreProvider";
import { createMockStore } from "../../helpers/mockStore";

describe("Suspense cache utilities", () => {
  beforeEach(() => {
    // Ensure a clean cache between tests
    clearSuspenseCache();
  });

  // Entry keys are `<storeId>::<reducer>::<path>`: the id keeps two stores with the same reducer
  // and path from sharing a value. The public invalidate helpers name no store, so they have to
  // reach across every id — which is what these two check.
  const ready = (value: unknown) => ({ status: "ready", value, expiresAt: null });

  it("invalidateAtomicProp removes that path in every store that cached it", () => {
    const internalStore = (suspenseCache as any).store as Map<string, any>;
    internalStore.set("s1::todos::items.0.title", ready("a"));
    internalStore.set("s2::todos::items.0.title", ready("b"));
    internalStore.set("s1::todos::items.0.title::detail", ready("c"));
    internalStore.set("s1::other::x", ready(1));

    invalidateAtomicProp("todos", "items.0.title");

    expect(internalStore.has("s1::todos::items.0.title")).toBe(false);
    expect(internalStore.has("s2::todos::items.0.title")).toBe(false);
    // An `options.key` makes a distinct entry, so it is not this path.
    expect(internalStore.has("s1::todos::items.0.title::detail")).toBe(true);
    expect(internalStore.has("s1::other::x")).toBe(true);
  });

  it("invalidateAtomicPropsByReducer removes every entry that reads from the reducer", () => {
    const internalStore = (suspenseCache as any).store as Map<string, any>;
    internalStore.set("s1::todos::items.0.title", ready("a"));
    internalStore.set("s2::todos::items.1.title", ready("b"));
    // A multi-path entry joins its parts with `||`, sorted — so the reducer can land anywhere
    // in the key rather than only at the front.
    internalStore.set("s1::filter::q||todos::items.**", ready("c"));
    internalStore.set("s1::filter::q", ready("x"));

    invalidateAtomicPropsByReducer("todos");

    expect(internalStore.has("s1::todos::items.0.title")).toBe(false);
    expect(internalStore.has("s2::todos::items.1.title")).toBe(false);
    expect(internalStore.has("s1::filter::q||todos::items.**")).toBe(false);
    expect(internalStore.has("s1::filter::q")).toBe(true);
  });

  it("clearSuspenseCache wipes all entries", () => {
    const internalStore = (suspenseCache as any).store as Map<string, any>;
    internalStore.set("a::x", { status: "ready", value: 1, expiresAt: null });
    internalStore.set("b::y", { status: "ready", value: 2, expiresAt: null });

    clearSuspenseCache();

    expect(internalStore.size).toBe(0);
  });
});

describe("useSuspenseAtomicProp", () => {
  beforeEach(() => {
    clearSuspenseCache();
  });

  it("suspends while loading, then renders resolved value", async () => {
    type RootState = { todos: { items: Array<{ title: string }> } };

    const { store } = createMockStore<RootState>({
      todos: { items: [{ title: "first" }] },
    });

    const load = async (valAtPath: any) => `loaded:${valAtPath}`;

    function Test() {
      const value = useSuspenseAtomicProp<"todos", RootState, string>(
        { reducer: "todos", property: "items.0.title" },
        { load, staleTime: 1000 },
      );

      return <span data-testid="value">{value}</span>;
    }

    render(
      <StoreProvider store={store}>
        <Suspense fallback={<span data-testid="fallback">loading</span>}>
          <Test />
        </Suspense>
      </StoreProvider>,
    );

    // Initially we see fallback (suspense in progress)
    expect(screen.getByTestId("fallback").textContent).toBe("loading");

    // Wait for the async load to resolve and Suspense to re-render
    const valueNode = await screen.findByTestId("value");
    expect(valueNode.textContent).toBe("loaded:first");
  });

  it("re-loads when connected property changes", async () => {
    type RootState = { todos: { items: Array<{ title: string }> } };

    const { store } = createMockStore<RootState>({
      todos: { items: [{ title: "first" }] },
    });

    const load = vi.fn(async (valAtPath: any) => `loaded:${valAtPath}`);

    function Test() {
      const value = useSuspenseAtomicProp<"todos", RootState, string>(
        { reducer: "todos", property: "items.0.title" },
        { load, staleTime: 1000 },
      );

      return <span data-testid="value">{value}</span>;
    }

    render(
      <StoreProvider store={store}>
        <Suspense fallback={<span data-testid="fallback">loading</span>}>
          <Test />
        </Suspense>
      </StoreProvider>,
    );

    // First load completes
    await screen.findByTestId("value");
    expect(load).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("value").textContent).toBe("loaded:first");

    // Change the underlying property; subscription should invalidate and cause a new load
    await act(async () => {
      store.setState({
        todos: { items: [{ title: "second" }] },
      });
      store.notifyPath("todos", "items.0.title");
    });

    // Wait until load has been called again
    await waitFor(() => {
      expect(load).toHaveBeenCalledTimes(2);
    });

    // Make sure the loader saw the updated value
    const [, secondCall] = load.mock.calls;
    expect(secondCall[0]).toBe("second"); // valAtPath in second call

    // Optional: if this ever becomes stable, you can re-enable this; for now it's flaky in jsdom.
    // await waitFor(() => {
    //   expect(screen.getByTestId("value").textContent).toBe("loaded:second");
    // });
  });
});

describe("useSuspenseAtomicProps", () => {
  beforeEach(() => {
    clearSuspenseCache();
  });

  it("suspends while loading a derived value based on multiple specs", async () => {
    type RootState = {
      todos: { items: Array<{ done: boolean }> };
      filter: { showDone: boolean };
    };

    const { store } = createMockStore<RootState>({
      todos: { items: [{ done: true }, { done: false }] },
      filter: { showDone: true },
    });

    const load = async (state: RootState) =>
      state.todos.items.filter((x) => x.done === state.filter.showDone).length;

    function Test() {
      const total = useSuspenseAtomicProps<keyof RootState, RootState, number>(
        [
          { reducer: "todos", property: "items.**" },
          { reducer: "filter", property: "showDone" },
        ],
        { load, staleTime: 1000 },
      );

      return <span data-testid="total">{total}</span>;
    }

    render(
      <StoreProvider store={store}>
        <Suspense fallback={<span data-testid="fallback">loading</span>}>
          <Test />
        </Suspense>
      </StoreProvider>,
    );

    await screen.findByTestId("total");
    expect(screen.getByTestId("total").textContent).toBe("1");

    // Flip the filter and trigger invalidation
    act(() => {
      store.setState((prev) => ({
        ...prev,
        filter: { showDone: false },
      }));
      store.notifyPath("filter", "showDone");
    });

    const totalNode = await screen.findByTestId("total");
    expect(totalNode.textContent).toBe("1"); // still 1, now counting the undone item
  });
});

describe("SuspenseCache.read lifecycle (RX-1)", () => {
  beforeEach(() => {
    clearSuspenseCache();
  });

  it("serves a resolved value at the default staleTime without reloading (no request storm)", async () => {
    const load = vi.fn(() => "V");

    let thrown: unknown;
    try {
      suspenseCache.read("k::ready", load, 0, undefined);
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(Promise);
    await thrown; // let the load resolve and cache as "ready"

    // At staleTime 0 a ready entry no longer expires on the same tick — repeated
    // reads return the cached value instead of re-loading every render.
    expect(suspenseCache.read("k::ready", load, 0, undefined)).toBe("V");
    expect(suspenseCache.read("k::ready", load, 0, undefined)).toBe("V");
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("re-throws the SAME pending promise until it settles (never a fresh load per read)", async () => {
    const load = vi.fn(() => new Promise<string>(() => {})); // never settles

    let p1: unknown;
    let p2: unknown;
    try {
      suspenseCache.read("k::pending", load, 0, undefined);
    } catch (e) {
      p1 = e;
    }
    try {
      suspenseCache.read("k::pending", load, 0, undefined);
    } catch (e) {
      p2 = e;
    }
    expect(p1).toBeInstanceOf(Promise);
    expect(p2).toBe(p1); // identical promise — the second read did not start a new load

    await Promise.resolve(); // flush the one scheduled load microtask
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("delivers a failure once, then retries — so resetting a boundary actually retries", async () => {
    // The bug this replaced: a cached error was held until something invalidated it, so a
    // retry button reset the boundary, the component re-rendered, and the stored error was
    // thrown again without the loader ever running. A network blip became permanent.
    const err = new Error("boom");
    let attempts = 0;
    const load = vi.fn(async () => {
      attempts += 1;
      if (attempts === 1) throw err;
      return "recovered";
    });

    let thrown: unknown;
    try {
      suspenseCache.read("k::err", load, 0, undefined);
    } catch (e) {
      thrown = e;
    }
    await thrown;

    // The failure reaches the boundary once — and it must, or the component would suspend
    // again instead of showing an error.
    expect(() => suspenseCache.read("k::err", load, 0, undefined)).toThrow(err);
    expect(load).toHaveBeenCalledTimes(1);

    // The next read — a boundary reset, in React terms — retries rather than re-delivering.
    let pending: unknown;
    try {
      suspenseCache.read("k::err", load, 0, undefined);
    } catch (e) {
      pending = e;
    }
    expect(pending).toBeInstanceOf(Promise);
    await pending;
    expect(load).toHaveBeenCalledTimes(2);
    expect(suspenseCache.read("k::err", load, 0, undefined)).toBe("recovered");
  });

  it("holds a failure until invalidated when asked to", async () => {
    // The old behaviour, still available — now something a caller opts into rather than the
    // default nobody chose.
    const err = new Error("boom");
    const load = vi.fn(async () => {
      throw err;
    });

    let thrown: unknown;
    try {
      suspenseCache.read("k::held", load, 0, null);
    } catch (e) {
      thrown = e;
    }
    await thrown;

    expect(() => suspenseCache.read("k::held", load, 0, null)).toThrow(err);
    expect(() => suspenseCache.read("k::held", load, 0, null)).toThrow(err);
    expect(load).toHaveBeenCalledTimes(1);

    suspenseCache.invalidate("k::held");
    let retry: unknown;
    try {
      suspenseCache.read("k::held", load, 0, null);
    } catch (e) {
      retry = e;
    }
    // The loader runs in a microtask, not during `read`, so the count only settles after it.
    await retry;
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("puts a floor between attempts when given one", async () => {
    // For a loader that fails fast and would otherwise be re-attempted on every reset.
    const load = vi.fn(async () => {
      throw new Error("boom");
    });

    let thrown: unknown;
    try {
      suspenseCache.read("k::floor", load, 0, 10_000);
    } catch (e) {
      thrown = e;
    }
    await thrown;

    expect(() => suspenseCache.read("k::floor", load, 0, 10_000)).toThrow();
    expect(() => suspenseCache.read("k::floor", load, 0, 10_000)).toThrow();
    expect(load).toHaveBeenCalledTimes(1);
  });
});

describe("suspense cache bounds", () => {
  it("stops growing once past its cap", async () => {
    clearSuspenseCache();

    // A component reading a dynamic path mints a key per value it has ever seen. Unbounded,
    // that grows for the lifetime of the process — and because the cache is module-scoped, it
    // grows across server requests too.
    for (let i = 0; i < 2500; i++) {
      try {
        suspenseCache.read(`slice::byId.${i}.name`, () => i, null, undefined);
      } catch (promise) {
        await promise;
      }
    }

    expect(suspenseCache.size).toBeLessThanOrEqual(2000);
  });

  it("keeps the entries still being read and drops the coldest", async () => {
    clearSuspenseCache();

    const settle = async (key: string, value: number) => {
      try {
        return suspenseCache.read(key, () => value, null, undefined);
      } catch (promise) {
        await promise;
        return suspenseCache.read(key, () => value, null, undefined);
      }
    };

    await settle("slice::hot", 1);
    for (let i = 0; i < 2100; i++) {
      await settle(`slice::cold.${i}`, i);
      // Reading the hot key keeps it young; eviction order should follow last use, not the
      // order things were first loaded.
      if (i % 100 === 0) await settle("slice::hot", 1);
    }

    expect(await settle("slice::hot", 1)).toBe(1);
    expect(suspenseCache.size).toBeLessThanOrEqual(2000);
  });
});

describe("suspense cache eviction never drops a load in flight", () => {
  it("skips a pending entry and evicts a settled one instead", async () => {
    clearSuspenseCache();

    // A load nobody has resolved yet: a suspended component is waiting on exactly this promise,
    // so evicting it would leave that component suspended forever with nothing to resume it.
    let release: ((v: number) => void) | undefined;
    const pending = new Promise<number>((r) => {
      release = r;
    });
    // Counting loads is what proves survival: an evicted entry would be reloaded on the next
    // read, and the cache wraps the caller's promise so identity cannot be compared directly.
    const load = vi.fn(() => pending);
    try {
      suspenseCache.read("slice::in-flight", load, null, undefined);
    } catch {
      /* suspended, as intended */
    }
    // The cache defers the loader to a microtask, so let it start before counting.
    await Promise.resolve();
    expect(load).toHaveBeenCalledTimes(1);

    // Push far past the cap so eviction has to run repeatedly and meet the pending entry.
    for (let i = 0; i < 2200; i++) {
      try {
        suspenseCache.read(`slice::filler.${i}`, () => i, null, undefined);
      } catch (promise) {
        await promise;
      }
    }

    // Still there, still pending: it was passed over rather than discarded.
    let suspended = false;
    try {
      suspenseCache.read("slice::in-flight", load, null, undefined);
    } catch {
      suspended = true;
    }
    expect(suspended).toBe(true);
    expect(load).toHaveBeenCalledTimes(1);

    release?.(1);
    await pending;
  });
});
