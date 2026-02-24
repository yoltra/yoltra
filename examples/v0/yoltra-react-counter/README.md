# yoltra-react-counter

> [🇲🇽 Versión en Español](./README.es.md) &nbsp;|&nbsp; 👉 🇺🇸 English Version

A minimal counter app demonstrating the core patterns of [Yoltra](https://github.com/yoltra/yoltra) with React 19. This is the example referenced in the [Quick Start Guide](https://github.com/yoltra/yoltra/blob/main/docs/en/QUICK_START_GUIDE.md).

---

## What this example shows

| Concept | Where |
|---|---|
| Typed store with `createStore` | [src/state/store.ts](./src/state/store.ts) |
| Event map (`AppEM`) for type-safe events | [src/state/store.ts](./src/state/store.ts) |
| Scoped hooks with `createHooks` | [src/state/hooks.ts](./src/state/hooks.ts) |
| Fine-grained subscription with `useAtomicProp` | [src/components/Counter.tsx](./src/components/Counter.tsx) |
| Dispatching events with `useEmit` | [src/components/Counter.tsx](./src/components/Counter.tsx) |
| Providing the store via React context | [src/App.tsx](./src/App.tsx) |

---

## Stack

- **React** 19
- **Vite** 7
- **TypeScript** 5.9
- **@yoltra/core** — store, reducers, event pipeline
- **@yoltra/react** — React hooks and context integration

---

## Running the example

```bash
# From the monorepo root
rush install
rush build

# Then start the dev server
cd examples/v0/yoltra-react-counter
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Code walkthrough

### 1. Define state shape and event map

```ts
// src/state/store.ts
export type AppEM = {
  counter: {
    increment: number;   // payload: amount to add
    decrement: number;   // payload: amount to subtract
    reset: null;         // no payload
  };
};

export type AppState = { counter: { value: number } };
```

The **event map** (`AppEM`) is a plain TypeScript type that maps every `(channel, type)` pair to its payload type. Yoltra uses it to make `emit` and `useEvent` fully type-safe.

### 2. Create the store

```ts
// src/state/store.ts
export const store = createStore<AppState, AppEM>({
  name: "App",
  reducer: {
    counter: {
      state: { value: 0 },
      when: {
        keys: eventKeys<AppEM>()([
          ["counter", "increment"],
          ["counter", "decrement"],
          ["counter", "reset"],
        ]),
      },
      reducer: (state, event) => {
        switch (event.type) {
          case "increment": return { value: state.value + event.payload };
          case "decrement": return { value: state.value - event.payload };
          case "reset":     return { value: 0 };
          default:          return state;
        }
      },
    },
  },
});
```

`eventKeys` narrows which events trigger this reducer — only the three listed keys will cause it to run, keeping your reducers focused and efficient.

### 3. Scope hooks to the store context

```ts
// src/state/hooks.ts
export const AppStoreContext = createContext<StoreInstance<...> | null>(null);

export const { useAtomicProp, useEmit, useEvent, useSelector, shallowEqual } =
  createHooks(AppStoreContext);
```

`createHooks` binds every hook to your specific context, so there is no ambiguity when multiple stores coexist in the same application.

### 4. Provide the store

```tsx
// src/App.tsx
function App() {
  return (
    <AppStoreContext.Provider value={store}>
      <Counter />
    </AppStoreContext.Provider>
  );
}
```

### 5. Subscribe and emit in a component

```tsx
// src/components/Counter.tsx
export function Counter() {
  // Re-renders ONLY when counter.value changes — nothing else
  const value = useAtomicProp({ reducer: "counter", property: "value" });
  const emit = useEmit();

  return (
    <div>
      <h1>Count: {value}</h1>
      <button onClick={() => emit("counter", "increment", 1)}>+</button>
      <button onClick={() => emit("counter", "decrement", 1)}>-</button>
      <button onClick={() => emit("counter", "reset", null)}>Reset</button>
    </div>
  );
}
```

`useAtomicProp` subscribes to the exact path `counter.value`. If any other part of the state changes, this component will **not** re-render. There are no selectors, no memoization — the path subscription _is_ the optimization.

---

## Next steps

- Add middleware (e.g. logging, validation) — see [@yoltra/core docs](https://github.com/yoltra/yoltra/blob/main/packages/core/README.md)
- React to blocked events with `useEvent(..., "uncommitted")` — see the [main README](https://github.com/yoltra/yoltra/blob/main/README.md)
- Explore fine-grained wildcard paths like `"items.*.done"` — see the [Todo App example](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-in-react/README.md)

---

## License

MIT
