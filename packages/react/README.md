![yoltra logo](../../assets/yoltra-logo.png)

# @yoltra/react

> [ 🇲🇽 Versión en Español](https://github.com/yoltra/yoltra/blob/main/packages/react/README.es.md)&nbsp;
> | &nbsp; 👉 🇺🇸 English Version

![npm downloads](https://badgen.net/npm/dm/@yoltra/react)
![License](https://badgen.net/npm/license/@yoltra/react)

**React hooks for [yoltra](https://github.com/yoltra/yoltra/blob/main/README.md) with
fine-grained path subscriptions.**

Subscribe to `"items.0.title"` or `"items.*.done"` — the component re-renders only when that
exact path changes. No selectors, no memoization, no manual optimization.

[See the flamegraph comparison (Redux vs yoltra).](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-in-react/redux-yoltra-profiler.md)

---

## Installation

```bash
npm install @yoltra/core @yoltra/react
```

**Peer dependencies:** React 18+

---

## Setup with `createHooks` (recommended)

`createHooks` binds fully-typed hooks to your store context. All type parameters are inferred —
no explicit generics needed in components.

### 1. Define types and store

```typescript
// store.ts
import { createStore, eventKeys } from "@yoltra/core";

export type AppEM = {
  counter: { increment: number; decrement: number; reset: null };
};

export type AppState = { counter: { value: number } };

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

### 2. Create typed hooks

```typescript
// hooks.ts
import { createContext } from "react";

import { createHooks } from "@yoltra/react";
import type { StoreInstance } from "@yoltra/core";

import type { AppState, AppEM } from "./store";

export const AppStoreContext = createContext<StoreInstance<"counter", AppState, AppEM> | null>(
  null,
);

export const {
  useStore,
  useEmit,
  useSelector,
  useAtomicProp,
  useAtomicProps,
  useEvent,
  shallowEqual,
} = createHooks(AppStoreContext);
```

### 3. Provide and use

```tsx
// App.tsx
import { store } from "./store";
import { AppStoreContext, useAtomicProp, useEmit } from "./hooks";

function Counter() {
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

export function App() {
  return (
    <AppStoreContext.Provider value={store}>
      <Counter />
    </AppStoreContext.Provider>
  );
}
```

---

## Hooks API

### `useAtomicProp({ reducer, property }, map?, isEqual?)`

Fine-grained single-path selector. Re-renders only when the specified path changes.

```tsx
// Exact path — re-renders when items[0].title changes
const title = useAtomicProp({
  reducer: "todos",
  property: "items.0.title",
});

// With mapper — derive a value from the path
const count = useAtomicProp({ reducer: "todos", property: "items" }, (items) => items.length);

// Wildcard pattern — re-renders when any item changes
const allTitles = useAtomicProp(
  { reducer: "todos", property: "items.**" },
  (state) => state.items.map((t) => t.title),
  shallowEqual,
);
```

**Supported patterns:**

- `"items.0.title"` — exact path (including numeric array indices)
- `"items.*.title"` — `*` matches one segment
- `"items.**"` — `**` matches zero or more segments

---

### `useAtomicProps(specs, selector, isEqual?)`

Multi-path selector. Subscribes to several paths and recomputes when any change.

```tsx
const filtered = useAtomicProps(
  [
    { reducer: "todos", property: "items.**" },
    { reducer: "filter", property: "q" },
  ],
  (state) => state.todos.items.filter((item) => item.title.includes(state.filter.q)),
  shallowEqual,
);
```

---

### `useEvent(channel, type, handler, phase?)`

Subscribe to store events from a component. Does not affect event flow — fire-and-forget.

```tsx
// Committed events (default) — events that passed middleware
useEvent("ui", "save", (event) => {
  showToast("Saved!");
});

// Uncommitted events — events rejected by middleware
useEvent(
  "ui",
  "delete",
  (event) => {
    showToast("Delete was blocked by permissions");
  },
  "uncommitted",
);

// All events — distinguish by phase
useEvent(
  "ui",
  "action",
  (event, getState, emit, phase) => {
    console.log(`Action ${phase}:`, event.type);
  },
  "all",
);
```

**Phases:**

- `'committed'` (default) — events that passed middleware and reached reducers
- `'uncommitted'` — events rejected by middleware
- `'all'` — both, with `phase` parameter to distinguish

---

### `useEmit()`

Returns the store's typed `emit` function (stable reference).

```tsx
const emit = useEmit();
await emit("counter", "increment", 1);
```

---

### `useSelector(selector, isEqual?)`

Coarse-grained selector via `useSyncExternalStore`. Re-renders when the selected value changes.

```tsx
const count = useSelector((state) => state.counter.value);
```

---

### `useStore()`

Returns the store instance. Throws if called outside a provider.

```tsx
const store = useStore();
const state = store.getState();
```

---

## Suspense Hooks

### `useSuspenseAtomicProp(spec, options)`

Suspense-compatible version of `useAtomicProp`. Throws a promise while loading, caught by the
nearest `<Suspense>` boundary.

```tsx
function UserName({ userId }: { userId: string }) {
  const name = useSuspenseAtomicProp(
    { reducer: "users", property: `byId.${userId}.name` },
    {
      load: async (name, slice) => name ?? (await fetchUser(userId)).name,
      staleTime: 30_000,
    },
  );
  return <span>{name}</span>;
}

// Usage
<Suspense fallback={<Spinner />}>
  <UserName userId='123' />
</Suspense>;
```

### `useSuspenseAtomicProps(specs, options)`

Multi-path Suspense selector.

```tsx
const stats = useSuspenseAtomicProps(
  [
    { reducer: "orders", property: "items.**" },
    { reducer: "users", property: "active" },
  ],
  { load: async (state) => computeDashboardStats(state) },
);
```

### Cache utilities

```typescript
import {
  invalidateAtomicProp,
  invalidateAtomicPropsByReducer,
  clearSuspenseCache,
} from "@yoltra/react";

// Invalidate a specific path's cache
invalidateAtomicProp("users", "byId.123.name");

// Invalidate all cache entries for a reducer
invalidateAtomicPropsByReducer("users");

// Clear everything
clearSuspenseCache();
```

---

## `shallowEqual`

Shallow object equality comparator. Use as the `isEqual` argument when your derived value is a
plain object:

```tsx
const todos = useAtomicProp(
  { reducer: "todos", property: "items.**" },
  (state) => state.items.map((t) => ({ id: t.id, title: t.title })),
  shallowEqual,
);
```

---

## Performance: Before and After

### Before (coarse-grained)

```tsx
// Every TodoItem re-renders when ANY todo changes
function TodoList() {
  const todos = useSelector((state) => state.todos.items);
  return todos.map((todo) => <TodoItem key={todo.id} todo={todo} />);
}
```

### After (fine-grained with yoltra)

```tsx
// Each TodoItem re-renders ONLY when its own data changes
function TodoItem({ index }: { index: number }) {
  const title = useAtomicProp({
    reducer: "todos",
    property: `items.${index}.title`,
  });
  const done = useAtomicProp({
    reducer: "todos",
    property: `items.${index}.done`,
  });
  return <div className={done ? "done" : ""}>{title}</div>;
}
```

[See the full flamegraph comparison.](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-in-react/redux-yoltra-profiler.md)

---

## React 18+ Compatibility

- **Concurrent Mode:** Fully compatible. All hooks use `useSyncExternalStore`.
- **Strict Mode:** Event deduplication prevents double-processing.
- **Suspense:** `useSuspenseAtomicProp` and `useSuspenseAtomicProps` throw promises for
  `<Suspense>` boundaries.

---

## Examples

- **[Todo App with Profiler](../../examples/v0/yoltra-in-react)** — Full CRUD with flamegraph
  comparison
- **[Kinetic Logo (3000 particles)](../../examples/v0/yoltra-kinetic-logo)** — Independent
  subscriptions per circle
- **[Next.js 15 App Router](../../examples/v0/yoltra-in-nextjs)** — SSR + theme switcher

---

## Documentation

- **[yoltra Root README](https://github.com/yoltra/yoltra/blob/main/README.md)** — Overview and
  quick start
- **[@yoltra/core API](https://github.com/yoltra/yoltra/blob/main/packages/core/README.md)** —
  Store, middleware, effects, `When` matchers
- **[Quick Start Guide](https://github.com/yoltra/yoltra/blob/main/docs/en/QUICK_START_GUIDE.md)**
  — Five steps to a working app
- **[Library Comparison](https://github.com/yoltra/yoltra/blob/main/docs/en/design/state-management-library-comparison.md)**
  — Architectural comparison

---

## Contributing

- [Monorepo Root](../../)
- [Contributing Guide](../../CONTRIBUTING.md)

---

## Status

**Release Candidate** — APIs are stable, used in production, minor changes possible before
v1.0.0.

---

## License

**MIT** — Free to use in commercial and open-source projects.
