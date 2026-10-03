![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# Testing Guide

> 👉 English &nbsp;|&nbsp; [🇲🇽 Español](../es/TESTING_GUIDE.md)

Yoltra is unusually easy to test: reducers are **pure**, the reduce phase is **synchronous** (so
`getState()` is correct the instant `emit()` returns), and the store runs with **zero framework
dependencies**. Examples use [Vitest](https://vitest.dev), but Jest works the same way.

> **Full guide:** [Testing on yoltra.dev](https://yoltra.dev/en/yoltra/docs/testing/)

## Testing the store (no React)

Build a fresh store per test with a `makeStore()` factory that calls `createStore({...})`, emit
events, and assert on `getState()`. Call `store.dispose()` in `afterEach`.

```ts
it("reduces increment synchronously", () => {
  const store = makeStore();
  store.emit("counter", "increment", 5);
  // No await needed: the reduce phase is synchronous.
  expect(store.getState().counter.value).toBe(5);
});
```

## Testing reducers as pure functions

A reducer is just `(state, event) => nextState`, so you can test it with no store at all:

```ts
const reducer = counterSpec.reducer;
expect(reducer({ value: 0 }, { type: "increment", payload: 2, channel: "counter" } as any))
  .toEqual({ value: 2 });
```

## Testing effects (async)

Mock the I/O, emit the trigger, and `await` the `emit`: the returned promise resolves once _that
event's_ effects finish.

```ts
await store.emit("todos", "fetch", null); // resolves after the effect completes
expect(api.getTodos).toHaveBeenCalledOnce();
expect(store.getState().todos.items).toHaveLength(1);
```

Test the failure path the same way. For cancellation, unregister the effect (or `store.dispose()`)
while it is pending: `ctx.signal` aborts with `"effect unregistered"` (or `"store disposed"`).

## Testing components

Give each test its own store through `<StoreProvider store={...}>` (the hooks prefer the context
store over the module default), with [@testing-library/react](https://testing-library.com/):

```tsx
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

## Controlling time

A store reads the time through `clock` and arms its timers through `scheduler`, so a test can own
both without faking globals. `vi.useFakeTimers()` works too, even installed after the store was
built. The same `scheduler` drives the idle timeout of `store.call()`.

## More on yoltra.dev

- [Testing middleware](https://yoltra.dev/en/yoltra/docs/testing/#testing-middleware-rejection): only an explicit `false` rejects; observe it with `onEvent(..., "uncommitted")` and test the allow path too.
- [Fine-grained subscriptions](https://yoltra.dev/en/yoltra/docs/testing/#testing-fine-grained-subscriptions) with `store.connect`, and [asserting re-renders](https://yoltra.dev/en/yoltra/docs/testing/#asserting-fine-grained-re-renders) by counting them.
- [Tips](https://yoltra.dev/en/yoltra/docs/testing/#tips): dedup is off by default, `warnOnLargeValues` with a throwing `warn`, prefer store-level tests.

## Next steps

- [Migration Guide](./MIGRATION_GUIDE.md): coming from Redux / Zustand / Jotai
- [Next.js Guide](./NEXTJS_GUIDE.md): client-side usage in Pages and App Router
- [@yoltra/core API](../../packages/core/README.md) · [@yoltra/react API](../../packages/react/README.md)

> **Full guide:** [Testing on yoltra.dev](https://yoltra.dev/en/yoltra/docs/testing/)
