![Yoltra logo](../../assets/yoltra-logo.png)

# Quick Start Guide

> 👉 English &nbsp;|&nbsp; [🇲🇽 Español](../es/QUICK_START_GUIDE.md)

Three steps from install to a working, fully-typed app. Or jump straight to
[the example app](../../examples/v0/yoltra-react-counter/README.md) — [▶ open the live demo](https://yoltra.dev/en/demos/react-counter).

---

## 1. Install

```bash
npm install @yoltra/core @yoltra/react
```

(`@yoltra/react` is only required when using React.)

---

## 2. Create your store and typed hooks in one call

`createYoltra` collapses the store, the React context, `createHooks`, and the provider into a
single call. It returns the `store` **and** every hook, already typed to your state and event map.

```tsx
// yoltra.ts
import { eventKeys } from "@yoltra/core";
import { createYoltra } from "@yoltra/react";

// 1. Describe your events: channel -> type -> payload type.
type AppEM = {
  counter: {
    increment: number;
    decrement: number;
    reset: null;
  };
};

// One call — store + every typed hook. No context file, no createHooks, no Provider.
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
      // `event.payload` narrows to `number` / `null` on `event.type` — no casts.
      reducer: (state, event) => {
        switch (event.type) {
          case "increment":
            return { value: state.value + event.payload };
          case "decrement":
            return { value: state.value - event.payload };
          case "reset":
            return { value: 0 };
          default:
            return state;
        }
      },
    },
  },
});
```

---

## 3. Use the hooks in components

The hooks default to the store you just created, so **no `<Provider>` is required**. Subscribe to
a leaf with a typed accessor — the component re-renders only when that exact leaf changes.

```tsx
// Counter.tsx
import { useAtomicProp, useEmit } from "./yoltra";

export function Counter() {
  // Object form: subscribe to the exact leaf `counter.value`.
  // Re-renders ONLY when counter.value changes — no selectors, no memo.
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

That's a complete, type-safe app. `emit("counter", "increment", 1)` is checked against your event
map — a wrong channel, type, or payload is a compile error.

---

## (Optional) Scope a store with `StoreProvider`

You only need a provider to hand a **different** store instance to part of the tree — for example a
fresh store per test, or two independent instances of the same app. `createYoltra` also returns a
`StoreProvider` for exactly that:

```tsx
import { createYoltra } from "@yoltra/react";

const { store, StoreProvider, useAtomicProp } = createYoltra({ name: "App", reducer: { counter } });

// Hand a specific instance to a subtree (defaults to the store above when omitted).
<StoreProvider store={freshStoreForThisTest}>
  <Counter />
</StoreProvider>;
```

For advanced cases — sharing one set of hooks across several stores wired through your own React
context — the lower-level `createHooks(context)` API is still available.

---

## What's next?

- **[@yoltra/core API](https://github.com/yoltra/yoltra/blob/main/packages/core/README.md)** —
  Middleware, effects, `When` matchers, event subscriptions, instrumentation
- **[@yoltra/react API](https://github.com/yoltra/yoltra/blob/main/packages/react/README.md)** —
  `useAtomicProps`, typed accessors, wildcards, Suspense hooks
- **[Event Pipeline Architecture](./design/event-queue-architecture.md)** — how the synchronous
  reduce / async effect pipeline works under the hood
- **[Library Comparison](./design/state-management-library-comparison.md)** — honest architectural
  comparison with Redux, Zustand, Jotai, and others
- **[Examples](https://github.com/yoltra/yoltra/blob/main/README.md#live-examples)** — todo app,
  kinetic logo, counter
- **[Developer Guide](./DEVELOPER_GUIDE.md)** — setting up the monorepo and contributing
