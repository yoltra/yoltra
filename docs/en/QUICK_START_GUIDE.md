![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# Quick Start Guide

> 👉 English &nbsp;|&nbsp; [🇲🇽 Español](../es/QUICK_START_GUIDE.md)

Three steps from install to a working, fully-typed app (`@yoltra/react` is only required when using
React). Or jump straight to
[the example app](../../examples/v0/yoltra-react-counter/README.md) · [▶ open the live demo](https://yoltra.dev/en/demos/react-counter/).

> **Full guide:** [Quick start on yoltra.dev](https://yoltra.dev/en/yoltra/docs/quick-start/)

## 1. Install

```bash
npm install @yoltra/core @yoltra/react
```

## 2. Create your store and typed hooks in one call

`createYoltra` returns the `store` **and** every hook, already typed to your state and event map.

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

// One call: store + every typed hook. No context file, no createHooks, no Provider.
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
      // `event.payload` narrows to `number` / `null` on `event.type`. No casts.
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

## 3. Use the hooks in components

The hooks default to the store you just created, so **no `<Provider>` is required**.

```tsx
// Counter.tsx
import { useAtomicProp, useEmit } from "./yoltra";

export function Counter() {
  // Object form: subscribe to the exact leaf `counter.value`.
  // Re-renders ONLY when counter.value changes. No selectors, no memo.
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

That's a complete, type-safe app: a wrong channel, type, or payload in `emit` is a compile error.

## (Optional) Scope a store with `StoreProvider`

A provider only hands a **different** store to part of the tree, such as a fresh store per test:

```tsx
import { createYoltra } from "@yoltra/react";

const { store, StoreProvider, useAtomicProp } = createYoltra({ name: "App", reducer: { counter } });

// Hand a specific instance to a subtree (defaults to the store above when omitted).
<StoreProvider store={freshStoreForThisTest}>
  <Counter />
</StoreProvider>;
```

To share one set of hooks across stores in your own React context, use `createHooks(context)`.

## What's next?

- **[@yoltra/core API](https://github.com/yoltra/yoltra/blob/main/packages/core/README.md)** (middleware, effects, `When` matchers, event subscriptions, instrumentation) and **[@yoltra/react API](https://github.com/yoltra/yoltra/blob/main/packages/react/README.md)** (`useAtomicProps`, typed accessors, wildcards, Suspense hooks)
- **[Event Pipeline Architecture](./design/event-queue-architecture.md)**: the synchronous reduce / async effect pipeline
- **[Library Comparison](./design/state-management-library-comparison.md)**: architectural comparison with Redux, Zustand, Jotai, and others
- **[Examples](https://github.com/yoltra/yoltra/blob/main/README.md#live-examples)**: todo app, kinetic logo, counter
- **[Developer Guide](./DEVELOPER_GUIDE.md)**: setting up the monorepo and contributing

> **Full guide:** [Quick start on yoltra.dev](https://yoltra.dev/en/yoltra/docs/quick-start/)
