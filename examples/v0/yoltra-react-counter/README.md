# yoltra-react-counter

> [🇲🇽 Versión en Español](./README.es.md) &nbsp;|&nbsp; 👉 🇺🇸 English Version

A minimal counter app demonstrating the core patterns of [Yoltra](https://github.com/yoltra/yoltra) with React 19. This is the example referenced in the [Quick Start Guide](https://github.com/yoltra/yoltra/blob/main/docs/en/QUICK_START_GUIDE.md).

---

## What this example shows

| Concept | Where |
|---|---|
| One-call setup with `createYoltra` (store + typed hooks) | [src/state/yoltra.ts](./src/state/yoltra.ts) |
| Event map (`AppEM`) for type-safe events | [src/state/yoltra.ts](./src/state/yoltra.ts) |
| Fine-grained subscription with a typed accessor | [src/components/Counter.tsx](./src/components/Counter.tsx) |
| Dispatching events with `useEmit` | [src/components/Counter.tsx](./src/components/Counter.tsx) |
| No Provider needed — hooks default to the store | [src/App.tsx](./src/App.tsx) |

---

## Stack

- **React** 19
- **Vite** 7
- **TypeScript** 5.9
- **@yoltra/core** — store, reducers, event pipeline
- **@yoltra/react** — React hooks and `createYoltra`

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

### 1. Define the event map

```ts
// src/state/yoltra.ts
export type AppEM = {
  counter: {
    increment: number;   // payload: amount to add
    decrement: number;   // payload: amount to subtract
    reset: null;         // no payload
  };
};
```

The **event map** (`AppEM`) maps every `(channel, type)` pair to its payload type. Yoltra uses it to make `emit` and the hooks fully type-safe.

### 2. Create the store and hooks in one call

```ts
// src/state/yoltra.ts
export const { store, useAtomicProp, useEmit } = createYoltra({
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
      // `event.payload` narrows to number / null on `event.type` — no casts.
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

`createYoltra` returns the store **and** every typed hook in one call — no separate context file, no `createHooks`, and no `<Provider>` (the hooks default to this store). `eventKeys` narrows which events trigger the reducer, keeping it focused and efficient.

### 3. Subscribe and emit in a component

```tsx
// src/components/Counter.tsx
export function Counter() {
  // Typed accessor — `s` autocompletes the slice, `value` is inferred as number.
  // Re-renders ONLY when counter.value changes; no selectors, no memo.
  const value = useAtomicProp("counter", (s) => s.value);
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

The typed accessor `s => s.value` subscribes to the exact leaf `counter.value`. If any other part of the state changes, this component will **not** re-render. There are no selectors, no memoization — the path subscription _is_ the optimization. For dynamic or wildcard paths (e.g. `items.*.done`), the string form `useAtomicProp({ reducer, property })` is still available.

---

## Next steps

- Add synchronous middleware (e.g. logging, authorization) or async effects — see [@yoltra/core docs](https://github.com/yoltra/yoltra/blob/main/packages/core/README.md)
- React to blocked events with `useEvent(..., "uncommitted")` — see the [main README](https://github.com/yoltra/yoltra/blob/main/README.md)
- Explore fine-grained wildcard paths like `"items.*.done"` — see the [Todo App example](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-in-react/README.md)

---

## License

MIT
