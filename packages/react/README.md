# @quojs/react

> [ 🇲🇽 Versión en Español](./README.es.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](./README.pt.md)&nbsp; | &nbsp; 👉
> [ 🇺🇸 English Version](./README.md)&nbsp; | &nbsp;[ 🇫🇷 Version française](./README.fr.md)

![Bundle size](https://badgen.net/bundlephobia/min/@quojs/react)
![Bundle size](https://badgen.net/bundlephobia/minzip/@quojs/react)
![Bundle size](https://badgen.net/bundlephobia/tree-shaking/@quojs/react)
![Bundle size](https://badgen.net/bundlephobia/dependency-count/@quojs/react)
![npm version](https://badgen.net/npm/v/@quojs/react)
![npm downloads](https://badgen.net/npm/dm/@quojs/react)
![License](https://badgen.net/npm/license/@quojs/react)

**React bindings for Quo.js with atomic subscriptions.**

`@quojs/react` provides React hooks and components for Quo.js, featuring **fine-grained re-render control**, **Suspense support**, and **Concurrent Mode compatibility**.

**Zero unnecessary re-renders by default.**

---

## What is @quojs/react?

Official React companion for **[@quojs/core](https://github.com/quojs/quojs/blob/main/packages/core/README.md)**—an event-driven state container with:

- **Atomic subscriptions** — Subscribe to exact state paths, only re-render when they change
- **Native async support** — Built-in middleware and effects, no thunks/sagas
- **Channel-based events** — Organize events by channel to prevent naming collisions
- **Immutability guarantees** — Deep-freeze enforcement with precise change detection

---

## Key Features

- 🎯 **Atomic Props** — `useAtomicProp` subscribes to exact paths (`'todos.items.0.title'`)
- ⚡ **Zero Wasted Renders** — Only re-renders when subscribed paths actually change
- 🔮 **Suspense Ready** — `useSuspenseAtomicProp` for data-fetching patterns
- 🧩 **Concurrent Mode** — Fully compatible with React 18+ concurrent features
- 🛡️ **TypeScript-First** — Excellent type inference and autocomplete
- 📌 **Lightweight** — ~7KB (minified + gzipped)

---

## Installation

```bash
npm install @quojs/core @quojs/react
# or
yarn add @quojs/core @quojs/react
# or
pnpm add @quojs/core @quojs/react
```

**Peer dependencies:** React 18+ (tested with React 18 and 19)

---

## Quick Start

### 1. Create Your Store

```typescript
// store.ts
import { createStore } from '@quojs/core';

export type AppEM = {
  counter: {
    increment: number;
    decrement: number;
    reset: null;
  };
};

export const store = createStore({
  name: 'App',
  reducer: {
    counter: {
      state: { value: 0 },
      events: [
        ['counter', 'increment'],
        ['counter', 'decrement'],
        ['counter', 'reset']
      ],
      reducer: (state, event) => {
        switch (event.type) {
          case 'increment':
            return { value: state.value + event.payload };
          case 'decrement':
            return { value: state.value - event.payload };
          case 'reset':
            return { value: 0 };
          default:
            return state;
        }
      }
    }
  }
});

export type AppStore = typeof store;
```

### 2. Create Store Context

```typescript
// StoreContext.ts
import { createContext } from 'react';
import type { AppStore } from './store';

export const StoreContext = createContext<AppStore | null>(null);
```

### 3. Create Typed Hooks

```typescript
// hooks.ts
import { createQuoHooks } from '@quojs/react';
import { StoreContext } from './StoreContext';
import type { AppEM } from './store';

export const {
  useStore,
  useEmit,
  useSelector,
  useAtomicProp,
  useAtomicProps,
  shallowEqual,
} = createQuoHooks<'counter', AppState, AppEM>(StoreContext);
```

### 4. Provide the Store

```tsx
// App.tsx
import { StoreProvider } from '@quojs/react';
import { store } from './store';
import { Counter } from './Counter';

export function App() {
  return (
    <StoreProvider store={store}>
      <Counter />
    </StoreProvider>
  );
}
```

### 5. Use Hooks in Components

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

## API Reference

### Components

#### `<StoreProvider>`

Provides Quo.js store to React components via context.

```tsx
import { StoreProvider } from '@quojs/react';
import { store } from './store';

function App() {
  return (
    <StoreProvider store={store}>
      <YourApp />
    </StoreProvider>
  );
}
```

---

### Hooks

#### `useStore()`

Returns the store instance.

```tsx
const store = useStore();
const state = store.getState();
```

---

#### `useEmit()`

Returns the typed `emit` function.

```tsx
const emit = useEmit();

// Emit events (fully typed)
await emit('counter', 'increment', 1);
await emit('todos', 'add', { id: '1', title: 'Buy milk' });
```

**Replaces:** `useDispatch()` (removed in v0.5.0+)

---

#### `useSelector(selector, isEqual?)`

Selects derived state via a selector function.

```tsx
const count = useSelector((state) => state.counter.value);

// With custom equality
import { shallowEqual } from './hooks';

const todos = useSelector(
  (state) => state.todos.items,
  shallowEqual
);
```

**Re-renders:** When selected value changes (per `isEqual`)

---

#### `useAtomicProp({ reducer, property })`

**The killer feature.** Subscribes to a specific state path—only re-renders when that exact path changes.

```tsx
// Only re-renders when items[0].title changes
const title = useAtomicProp({ 
  reducer: 'todos', 
  property: 'items.0.title' 
});

// With mapper function
const count = useAtomicProp(
  { reducer: 'todos', property: 'items' },
  (items) => items.length
);

// Wildcard patterns
const allTitles = useAtomicProp(
  { reducer: 'todos', property: 'items.*.title' },
  (state) => state.items.map(t => t.title)
);
```

**Benefits:**
- ✅ Zero unnecessary re-renders
- ✅ No manual optimization required
- ✅ Works with deep paths and wildcards

---

#### `useAtomicProps(specs, selector, isEqual?)`

Subscribes to multiple paths, re-computes selector when any change.

```tsx
const filtered = useAtomicProps(
  [
    { reducer: 'todos', property: 'items.**' },
    { reducer: 'todos', property: 'filter' }
  ],
  (state) => {
    return state.todos.items.filter(
      item => item.status === state.todos.filter
    );
  },
  shallowEqual
);
```

**Use case:** Derived state that depends on multiple slices

---

#### `useSuspenseAtomicProp({ reducer, property }, options)`

Suspense-enabled version of `useAtomicProp`.

```tsx
const user = useSuspenseAtomicProp(
  { reducer: 'user', property: 'profile' },
  {
    load: async (profile) => {
      if (!profile) {
        const res = await fetch('/api/user');
        return res.json();
      }
      return profile;
    },
    staleTime: 60000, // 1 minute
  }
);

// Component suspends while loading
```

**Features:**
- Automatic cache management
- Configurable stale time
- Works with `<Suspense>` boundaries

---

#### `useSuspenseAtomicProps(specs, options)`

Suspense-enabled version of `useAtomicProps`.

```tsx
const data = useSuspenseAtomicProps(
  [
    { reducer: 'user', property: 'id' },
    { reducer: 'posts', property: 'list' }
  ],
  {
    load: async (state) => {
      const res = await fetch(`/api/posts?user=${state.user.id}`);
      return res.json();
    }
  }
);
```

---

### Suspense Utilities

#### `invalidateAtomicProp(reducer, property, key?)`

Invalidates cache for a specific property.

```tsx
import { invalidateAtomicProp } from '@quojs/react';

// After mutation
await emit('user', 'update', newData);
invalidateAtomicProp('user', 'profile');
```

---

#### `invalidateAtomicPropsByReducer(reducer)`

Invalidates all cache entries for a reducer.

```tsx
import { invalidateAtomicPropsByReducer } from '@quojs/react';

invalidateAtomicPropsByReducer('todos');
```

---

#### `clearSuspenseCache()`

Clears the entire Suspense cache.

```tsx
import { clearSuspenseCache } from '@quojs/react';

clearSuspenseCache();
```

---

## Performance Comparison

### Redux / Zustand (Coarse-grained)

```tsx
// ❌ Re-renders when ANY todo changes
const todos = useSelector(state => state.todos.items);

return <div>{todos.map(todo => ...)}</div>;
```

**Problem:** Entire component tree re-renders on every todo change.

### Quo.js (Fine-grained)

```tsx
// ✅ Only re-renders when THIS specific todo changes
function TodoItem({ id }) {
  const title = useAtomicProp({ 
    reducer: 'todos', 
    property: `items.${id}.title` 
  });
  
  return <div>{title}</div>;
}
```

**Result:** Zero wasted renders.

[See flamegraph comparison →](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.md)

---

## TypeScript Support

Quo.js React hooks are fully typed:

```typescript
type AppEM = {
  todos: {
    add: { id: string; title: string };
    toggle: { id: string };
  };
};

const emit = useEmit<AppEM>();

// ✅ Autocomplete works
await emit('todos', 'add', { 
  id: '1',
  title: 'Buy milk'
});

// ❌ TypeScript catches errors
await emit('todos', 'add', { id: 1 }); // Error: id must be string
await emit('invalid', 'event', null);  // Error: Unknown channel
```

---

## React 18+ Features

### Concurrent Mode

Quo.js is fully compatible with React 18's concurrent rendering:

```tsx
import { startTransition } from 'react';

function Search() {
  const emit = useEmit();
  
  const handleSearch = (query) => {
    startTransition(() => {
      emit('search', 'query', query);
    });
  };
  
  return <input onChange={(e) => handleSearch(e.target.value)} />;
}
```

### Suspense

```tsx
import { Suspense } from 'react';

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <UserProfile />
    </Suspense>
  );
}

function UserProfile() {
  const user = useSuspenseAtomicProp(
    { reducer: 'user', property: 'profile' },
    {
      load: async () => {
        const res = await fetch('/api/user');
        return res.json();
      }
    }
  );
  
  return <div>Welcome, {user.name}!</div>;
}
```

---

## Migrating from v0.4.x

### Hook Name Changes (v0.5.0+)

| Old (v0.4.x)     | New (v0.5.0+)      | Status                            |
|------------------|--------------------| ----------------------------------|
| `useDispatch()`  | `useEmit()`        | ❌ Removed (use `useEmit()`)      |
| `useSliceProp()` | `useAtomicProp()`  | ❌ Removed (use `useAtomicProp()`) |
| `useSliceProps()`| `useAtomicProps()` | ❌ Removed (use `useAtomicProps()`) |

### Migration Example

```tsx
// BEFORE (v0.4.x)
import { useDispatch, useSliceProp } from '@quojs/react';

function Counter() {
  const value = useSliceProp({ reducer: 'counter', property: 'value' });
  const dispatch = useDispatch();

  return (
    <button onClick={() => dispatch('counter', 'increment', 1)}>
      {value}
    </button>
  );
}

// AFTER (v0.5.0+)
import { useEmit, useAtomicProp } from '@quojs/react';

function Counter() {
  const value = useAtomicProp({ reducer: 'counter', property: 'value' });
  const emit = useEmit();

  return (
    <button onClick={() => emit('counter', 'increment', 1)}>
      {value}
    </button>
  );
}
```

**Note:** All deprecated hooks have been removed. If you're upgrading from v0.4.x, you must update your code to use the new hook names.

---

## Examples

- **[Todo App](../../examples/v0/quojs-in-react)** — Full CRUD with performance profiling
- **[Kinetic Logo](../../examples/v0/quojs-kinetic-logo)** — 900 SVG circles + physics simulation
- **[Next.js 15](../../examples/v0/quojs-in-nextjs)** — SSR + theme switcher

---

## Documentation

- **[Quick Start Guide](https://quojs.dev)** — Get started in 5 minutes
- **[TypeDoc API Reference](./docs/README.md)** — Complete API documentation
- **[Library Comparison](../../docs/library-comparison.md)** — vs Redux, Zustand, Jotai, etc.

---

## Contributing

See:
- [Monorepo Root](../../)
- [Contributing Guide](../../CONTRIBUTING.md)
- [Code of Conduct](../../CODE_OF_CONDUCT.md)

---

## Status

**Release Candidate** — APIs are stable, used in production, minor changes possible before v1.0.

---

## License

**MIT** — Free to use in commercial and open-source projects.

---

Made in 🇲🇽 for the world.