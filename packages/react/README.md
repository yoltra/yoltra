![yoltra logo](../../assets/yoltra-logo.png)

# @yoltra/react

> [ 🇲🇽 Versión en Español](./README.es.md)&nbsp;
> | &nbsp; 👉 🇺🇸 English Version

![npm downloads](https://badgen.net/npm/dm/@yoltra/react)
![License](https://badgen.net/npm/license/@yoltra/react)

**React hooks for [yoltra](../../README.md) with
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

## Setup with `createYoltra` (recommended)

`createYoltra` creates the store **and** every fully-typed hook in one call — no separate context
file, no `createHooks` wiring, no required provider. All type parameters are inferred from your
reducer, so components need no explicit generics.

### 1. Create the store and hooks

```tsx
// yoltra.ts
import { eventKeys } from "@yoltra/core";
import { createYoltra } from "@yoltra/react";

export type AppEM = {
  counter: { increment: number; decrement: number; reset: null };
};

export const { store, useAtomicProp, useEmit, StoreProvider } = createYoltra({
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

### 2. Use the hooks — no provider required

The hooks default to the store above, so you can render components directly. Subscribe with a
**`{ reducer, property }`** spec: the dotted `property` names the exact path to read.

```tsx
// Counter.tsx
import { useAtomicProp, useEmit } from "./yoltra";

export function Counter() {
  // Object form — re-renders only when counter.value changes. No selectors, no memo.
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

A `<StoreProvider>` is only needed to scope a **different** store instance to a subtree (e.g. a
fresh store per test) — `createYoltra` returns one for exactly that.

---

## Advanced: manual wiring with `createHooks`

When you need one set of hooks shared across several store instances through your own React
context, bind them yourself with `createHooks(context)`. `createYoltra` is this same wiring
collapsed into a single call.

```typescript
// hooks.ts
import { createContext } from "react";
import { createHooks } from "@yoltra/react";
import type { StoreInstance } from "@yoltra/core";
import type { AppState, AppEM } from "./store";

export const AppStoreContext = createContext<StoreInstance<"counter", AppState, AppEM> | null>(
  null,
);

export const { useStore, useEmit, useSelector, useAtomicProp, useAtomicProps, useEvent, shallowEqual } =
  createHooks(AppStoreContext);
```

Provide the store with `<AppStoreContext.Provider value={store}>` at your root.

---

## Hooks API

### `useAtomicProp({ reducer, property }, map?, isEqual?)`

Fine-grained single-path selector. Re-renders only when the specified leaf changes. The dotted
`property` names the exact path — including dynamic (`` `items.${id}.title` ``) and wildcard paths.

```tsx
// Object form (recommended) — subscribe to the exact path
const title = useAtomicProp({ reducer: "todos", property: "items.0.title" });

// Dynamic path — interpolate the key
const byId = useAtomicProp({ reducer: "todos", property: `items.${id}.title` });

// With mapper — derive a value from the path
const count = useAtomicProp({ reducer: "todos", property: "items" }, (items) => items.length);

// Wildcard pattern — re-renders when any item changes
const allTitles = useAtomicProp(
  { reducer: "todos", property: "items.**" },
  (state) => state.items.map((t) => t.title),
  shallowEqual,
);
```

> A typed-accessor overload — `useAtomicProp("todos", (s) => s.items[0].title)` — is also available
> for static paths; it autocompletes the state shape and infers the return type.

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
- **[Next.js (Pages Router)](../../examples/v0/yoltra-in-nextjs)** — client-side state + theme switcher

---

## Documentation

- **[yoltra Root README](../../README.md)** — Overview and
  quick start
- **[@yoltra/core API](../core/README.md)** —
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
