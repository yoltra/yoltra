![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

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
import { createStore, eventKeys } from "@yoltra/core";

type AppEM = { counter: { increment: number; reset: null } };

function makeStore() {
  return createStore({
    name: "test",
    reducer: {
      counter: {
        state: { value: 0 },
        when: { keys: eventKeys<AppEM>()([["counter", "increment"], ["counter", "reset"]]) },
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
        when: { keys: [["todos", "loaded"]] },
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

To test cancellation, unregister the effect (or `store.dispose()`) while its work is pending and
assert on `ctx.signal`: it aborts with `"effect unregistered"` (or `"store disposed"`), and an
effect that checks `ctx.signal.aborted` emits nothing afterwards.

---

## Testing middleware (rejection)

Middleware is synchronous. **Only an explicit `false` rejects** the event (state
does not change), producing an **uncommitted** event you can observe with
`onEvent(..., "uncommitted")`. Returning `true`, or returning nothing at all,
allows it, so middleware that only logs or measures needs no `return`.

Test the allow path as well as the veto. A guard that stops rejecting is a
silent failure, and so is one that rejects everything.

```ts
it("rejects boost below the battery threshold", () => {
  const store = createStore({
    name: "test",
    reducer: {
      sat: {
        state: { battery: 10, boosting: false },
        when: { keys: [["command", "boost"]] },
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
  const value = useAtomicProp({ reducer: "counter", property: "value" });
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
  const v = useAtomicProp({ reducer: "counter", property: "value" });
  return <span>{v}</span>;
}
// emit an unrelated event → assert `renders` did NOT increase
```

---

## Controlling time

A store reads the time through `clock` and arms its timers through `scheduler`, so a test can own
both without faking globals:

```ts
let now = 1_000;
const timers: Array<{ run: () => void; delayMs: number }> = [];

const store = createStore({
  name: "test",
  reducer: { counter },
  dedupWindowMs: 50,
  clock: { now: () => now },
  scheduler: {
    setTimeout: (run, delayMs) => timers.push({ run, delayMs }) - 1,
    clearTimeout: () => undefined,
  },
});

await store.emit("ui", "increment", 1);
await store.emit("ui", "increment", 1); // inside the window: coalesced
now += 60;
await store.emit("ui", "increment", 1); // past it: counted
expect(store.getState().counter.value).toBe(2);
```

`vi.useFakeTimers()` works too, even installed after the store was built, because the defaults
look `Date.now` and the global timers up each time they are used. The same `scheduler` drives the
idle timeout of `store.call()`, so a timeout test can fire it instead of waiting.

---

## Tips

- **`dispose()` in `afterEach`** to release the store's timers and subscriptions.
- **Dedup / timing:** dedup is off by default, so identical rapid emits are *not*
  coalesced — no fake timers needed unless you set `dedupWindowMs`. If you do,
  inject a `clock` or use `vi.useFakeTimers()` (see [Controlling time](#controlling-time)).
- **No `await` for reads:** only `await emit()` when you need the event's effects
  to have finished; `getState()` is already up to date for reducer results.
- **Prefer store-level tests** for logic and reserve component tests for wiring —
  they're faster and don't need a DOM.

---

## Next steps

- [Migration Guide](./MIGRATION_GUIDE.md) — coming from Redux / Zustand / Jotai
- [Next.js Guide](./NEXTJS_GUIDE.md) — client-side usage in Pages and App Router
- [@yoltra/core API](../../packages/core/README.md) · [@yoltra/react API](../../packages/react/README.md)
