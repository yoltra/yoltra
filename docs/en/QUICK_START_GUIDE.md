![Yoltra logo](../../assets/yoltra-logo.png)

# Quick Start Guide

> 👉 English &nbsp;|&nbsp; [🇲🇽 Español](../es/QUICK_START_GUIDE.md)

Five steps from install to a working app.

---

## 1. Install

```bash
npm install @yoltra/core @yoltra/react
```

(`@yoltra/react` is only required when using React.)

---

## 2. Define your event map and store

```typescript
// store.ts
import { createStore, eventKeys } from '@yoltra/core';

export type AppEM = {
  counter: {
    increment: number;
    decrement: number;
    reset: null;
  };
};

export type AppState = { counter: { value: number } };

export const store = createStore<AppState, AppEM>({
  name: 'App',
  reducer: {
    counter: {
      state: { value: 0 },
      when: { keys: eventKeys<AppEM>()([
        ['counter', 'increment'],
        ['counter', 'decrement'],
        ['counter', 'reset'],
      ])},
      reducer: (state, event) => {
        switch (event.type) {
          case 'increment': return { value: state.value + event.payload };
          case 'decrement': return { value: state.value - event.payload };
          case 'reset':     return { value: 0 };
          default:          return state;
        }
      },
    },
  },
});
```

---

## 3. Create typed hooks with `createQuoHooks`

```typescript
// hooks.ts
import { createContext } from 'react';
import { createQuoHooks } from '@yoltra/react';
import type { StoreInstance } from '@yoltra/core';
import type { AppState, AppEM } from './store';

export const AppStoreContext = createContext<
  StoreInstance<'counter', AppState, AppEM> | null
>(null);

export const {
  useAtomicProp,
  useEmit,
  useEvent,
  useSelector,
  shallowEqual,
} = createQuoHooks(AppStoreContext);
```

---

## 4. Provide the store

```tsx
// App.tsx
import { store } from './store';
import { AppStoreContext } from './hooks';

export function App() {
  return (
    <AppStoreContext.Provider value={store}>
      <Counter />
    </AppStoreContext.Provider>
  );
}
```

---

## 5. Use hooks in components

```tsx
// Counter.tsx
import { useAtomicProp, useEmit } from './hooks';

export function Counter() {
  // Only re-renders when counter.value changes
  const value = useAtomicProp({ reducer: 'counter', property: 'value' });
  const emit = useEmit();

  return (
    <div>
      <h1>Count: {value}</h1>
      <button onClick={() => emit('counter', 'increment', 1)}>+</button>
      <button onClick={() => emit('counter', 'decrement', 1)}>-</button>
      <button onClick={() => emit('counter', 'reset', null)}>Reset</button>
    </div>
  );
}
```

---

## What's next?

- **[@yoltra/core API](https://github.com/yoltra/yoltra/blob/main/packages/core/README.md)** —
  Middleware, effects, `When` matchers, event subscriptions
- **[@yoltra/react API](https://github.com/yoltra/yoltra/blob/main/packages/react/README.md)** —
  `useAtomicProps`, Suspense hooks, wildcards
- **[Event Queue Architecture](./design/event-queue-architecture.md)** —
  How the pipeline works under the hood
- **[Examples](https://github.com/yoltra/yoltra/blob/main/README.md#live-examples)** —
  Todo app, kinetic logo, Next.js integration
- **[Developer Guide](./DEVELOPER_GUIDE.md)** —
  Setting up the monorepo and contributing
