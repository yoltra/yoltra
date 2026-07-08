![Yoltra logo](../../assets/yoltra-logo.png)

# Testing Guide

> 👉 English &nbsp;|&nbsp; [🇲🇽 Español](../es/TESTING_GUIDE.md)

Yoltra is unusually easy to test: reducers are **pure**, the reduce phase is
**synchronous** (so `getState()` is correct the instant `emit()` returns), and
the store runs with **zero framework dependencies** — most of your logic can be
tested with no React at all. Examples use [Vitest](https://vitest.dev), but Jest
works the same way.

---

## Testing the store (no React)

Create a fresh store per test, emit events, and assert on `getState()`.

```ts
import { afterEach, describe, expect, it } from "vitest";
import { createStore } from "@yoltra/core";

type AppEM = { counter: { increment: number; reset: null } };

function makeStore() {
  return createStore({
    name: "test",
    reducer: {
      counter: {
        state: { value: 0 },
        events: [["counter", "increment"], ["counter", "reset"]],
        reducer: (s, e) =>
          e.type === "increment" ? { value: s.value + e.payload }
          : e.type === "reset"   ? { value: 0 }
          : s,
      },
    },
  });
}

describe("counter", () => {
  let store: ReturnType<typeof makeStore>;
  afterEach(() => store?.dispose()); // clean up timers/resources

  it("reduces increment synchronously", () => {
    store = makeStore();
    store.emit("counter", "increment", 5);
    // No await needed — the reduce phase is synchronous.
    expect(store.getState().counter.value).toBe(5);
  });

  it("resets", () => {
    store = makeStore();
    store.emit("counter", "increment", 3);
    store.emit("counter", "reset", null);
    expect(store.getState().counter.value).toBe(0);
  });
});
```

A `makeStore()` factory keeps every test isolated and doubles as the store you
pass to component tests below.

---

## Testing reducers as pure functions

Because a reducer is just `(state, event) => nextState`, you can test it with no
store at all:

```ts
const reducer = counterSpec.reducer;
expect(reducer({ value: 0 }, { type: "increment", payload: 2, channel: "counter" } as any))
  .toEqual({ value: 2 });
```

Prefer the store-level test above when you want the real event typing; drop to
the raw function for exhaustive branch coverage.

---

## Testing effects (async)

Effects are the async layer. Mock the I/O, emit the trigger, and `await` the
`emit` — the returned promise resolves once *that event's* effects finish.

```ts
import { vi } from "vitest";

it("loads todos and reduces the result", async () => {
  const api = { getTodos: vi.fn().mockResolvedValue([{ id: 1, title: "a" }]) };

  const store = createStore({
    name: "test",
    reducer: {
      todos: {
        state: { items: [] as { id: number; title: string }[] },
        events: [["todos", "loaded"]],
        reducer: (s, e) => (e.type === "loaded" ? { items: e.payload } : s),
      },
    },
    effects: [
      {
        when: { keys: [["todos", "fetch"]] },
        effect: async (_e, _get, emit) => emit("todos", "loaded", await api.getTodos()),
      },
    ],
  });

  await store.emit("todos", "fetch", null); // resolves after the effect completes
  expect(api.getTodos).toHaveBeenCalledOnce();
  expect(store.getState().todos.items).toHaveLength(1);
});
```

Test the **failure** path the same way — have the effect emit a `loadFailure`
event and assert the reduced error state.

---

## Testing middleware (rejection)

Middleware is synchronous and returns a boolean. A `false` return rejects the
event (state does not change) and produces an **uncommitted** event, which you
can observe with `onEvent(..., "uncommitted")`.

```ts
it("rejects boost below the battery threshold", () => {
  const store = createStore({
    name: "test",
    reducer: {
      sat: {
        state: { battery: 10, boosting: false },
        events: [["command", "boost"]],
        reducer: (s, e) => (e.type === "boost" ? { ...s, boosting: true } : s),
      },
    },
    middleware: [
      { when: { keys: [["command", "boost"]] }, middleware: (s) => s.sat.battery >= 20 },
    ],
  });

  const rejected = vi.fn();
  store.onEvent("command", "boost", rejected, "uncommitted");

  store.emit("command", "boost", null);

  expect(store.getState().sat.boosting).toBe(false); // reducer never ran
  expect(rejected).toHaveBeenCalledOnce();            // surfaced as uncommitted
});
```

---

## Testing fine-grained subscriptions

Assert that a path subscription fires with the right leaf, and — just as
important — that unrelated changes **don't** fire it:

```ts
it("notifies only the changed leaf", () => {
  const store = makeStore();
  const onValue = vi.fn();
  store.connect({ reducer: "counter", property: "value" }, onValue);

  store.emit("counter", "increment", 1);
  expect(onValue).toHaveBeenCalledTimes(1);

  store.emit("counter", "reset", null); // value 1 → 0, still a change
  expect(onValue).toHaveBeenCalledTimes(2);
});
```

---

## Testing components

Give each test its own store and provide it with `<StoreProvider store={...}>`
(the hooks prefer the context store over the module default). Uses
[@testing-library/react](https://testing-library.com/).

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { StoreProvider, useAtomicProp, useEmit } from "@/state/yoltra";
import { makeStore } from "@/state/makeStore";

function Counter() {
  const value = useAtomicProp("counter", (s) => s.value);
  const emit = useEmit();
  return <button onClick={() => emit("counter", "increment", 1)}>{value}</button>;
}

it("increments on click", () => {
  const store = makeStore(); // fresh, isolated store
  render(
    <StoreProvider store={store}>
      <Counter />
    </StoreProvider>,
  );

  expect(screen.getByRole("button")).toHaveTextContent("0");
  fireEvent.click(screen.getByRole("button"));
  expect(screen.getByRole("button")).toHaveTextContent("1");
});
```

Export a `makeStore()` from your app (the same factory used above) so app code
and tests build the store the same way.

### Asserting fine-grained re-renders

To prove only the right component re-rendered, count renders:

```tsx
let renders = 0;
function Value() {
  renders++;
  const v = useAtomicProp("counter", (s) => s.value);
  return <span>{v}</span>;
}
// emit an unrelated event → assert `renders` did NOT increase
```

---

## Tips

- **`dispose()` in `afterEach`** to release the store's timers and subscriptions.
- **Dedup / timing:** dedup is off by default, so identical rapid emits are *not*
  coalesced — no fake timers needed unless you set `dedupWindowMs`. If you do,
  use `vi.useFakeTimers()`.
- **No `await` for reads:** only `await emit()` when you need the event's effects
  to have finished; `getState()` is already up to date for reducer results.
- **Prefer store-level tests** for logic and reserve component tests for wiring —
  they're faster and don't need a DOM.

---

## Next steps

- [Migration Guide](./MIGRATION_GUIDE.md) — coming from Redux / Zustand / Jotai
- [Next.js Guide](./NEXTJS_GUIDE.md) — client-side usage in Pages and App Router
- [@yoltra/core API](../../packages/core/README.md) · [@yoltra/react API](../../packages/react/README.md)
