![Quo.js logo](https://quojs.dev/assets/logo.svg)

# Quo.js

> [ 🇲🇽 Versión en Español](https://github.com/quojs/quojs/blob/main/docs/es/README.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](https://github.com/quojs/quojs/blob/main/docs/pt/README.md)&nbsp;
> | &nbsp; 👉 [ 🇺🇸 English Version](https://github.com/quojs/quojs/blob/main/README.md)&nbsp; |
> &nbsp;[ 🇫🇷 Version française](https://github.com/quojs/quojs/blob/main/docs/fr/README.md)

![Bundle size](https://img.shields.io/bundlephobia/min/@quojs/core)
![Bundle size](https://img.shields.io/bundlephobia/minzip/@quojs/core)
![npm unpacked size](https://img.shields.io/npm/unpacked-size/@quojs/core)
![npm downloads](https://badgen.net/npm/dm/@quojs/core)
![License](https://img.shields.io/npm/l/@quojs/core)

**Fine-grained reactive state for event-driven applications.**

![Kinetic Logo Demo](https://quojs.dev/assets/examples/quojs-dots.gif)

> 1000+ SVG circles, each subscribing to its own position via `useAtomicProp`. Every circle re-renders independently — the rest of the tree is untouched. [See the demo source.](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-kinetic-logo/README.md)

---

## The 30-second pitch

```tsx
import { useAtomicProp, useEmit } from './hooks';

function TodoTitle({ index }: { index: number }) {
  // Subscribes to items[index].title — re-renders ONLY when it changes.
  const title = useAtomicProp({
    reducer: 'todos',
    property: `items.${index}.title`,
  });
  const emit = useEmit();

  return (
    <span onClick={() => emit('todos', 'edit', { index, title: 'New title' })}>
      {title}
    </span>
  );
}
```

No selectors. No memoization. No manual optimization. The subscription *is* the optimization.

---

## Why Quo.js?

### 1. Fine-grained path subscriptions with wildcards

Subscribe to `"items.0.title"` or `"items.*.done"` and only re-render when that exact path changes. This works over a full state tree — including nested objects, arrays, and dynamic keys.

```tsx
// Exact path — re-renders when items[0].title changes
const title = useAtomicProp({ reducer: 'todos', property: 'items.0.title' });

// Wildcard — re-renders when ANY item's 'done' flag changes
const allDone = useAtomicProp(
  { reducer: 'todos', property: 'items.*.done' },
  (state) => state.items.every(i => i.done),
);
```

[See the flamegraph comparison (Redux vs Quo.js).](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.md)

### 2. Structured event pipeline

Events flow through a formal pipeline where every stage is hookable:

```
emit() → dedup → middleware (can reject) → reducers → event subscribers → effects → coarse subscribers
```

Middleware rejection creates **uncommitted events** that the UI can react to — useful for authorization, validation, and optimistic UI patterns:

```tsx
// Show a warning when middleware blocks a delete
useEvent('ui', 'delete', (event) => {
  showToast('Delete was blocked by permissions');
}, 'uncommitted');
```

### 3. Channel-based event organization

Events are `(channel, type, payload)` tuples — natural namespacing that scales without collisions:

```typescript
await emit('auth', 'login', credentials);
await emit('analytics', 'track', event);
await emit('ui', 'toast', { message: 'Saved!' });
```
---

## Packages

| Package | Description |
|---------|-------------|
| **[@quojs/core](https://github.com/quojs/quojs/blob/main/packages/core/README.md)** | Framework-agnostic store, reducers, middleware, effects |
| **[@quojs/react](https://github.com/quojs/quojs/blob/main/packages/react/README.md)** | React hooks with fine-grained subscriptions and Suspense support |

---

## Quick Setup (React)

### 1. Install

```bash
npm install @quojs/core @quojs/react
```

### 2. Define your event map

```typescript
// types.ts
export type AppEM = {
  todos: {
    add: { id: string; title: string };
    toggle: { id: string };
    delete: { id: string };
  };
};
```

### 3. Create the store

```typescript
// store.ts
import { createStore, eventKeys } from '@quojs/core';
import type { AppEM } from './types';

export type AppState = {
  todos: { items: Array<{ id: string; title: string; done: boolean }> };
};

export const store = createStore<AppState, AppEM>({
  name: 'App',
  reducer: {
    todos: {
      state: { items: [] },
      when: { keys: eventKeys<AppEM>()([
        ['todos', 'add'],
        ['todos', 'toggle'],
        ['todos', 'delete'],
      ])},
      reducer: (state, event) => {
        switch (event.type) {
          case 'add':
            return { items: [...state.items, { ...event.payload, done: false }] };
          case 'toggle':
            return {
              items: state.items.map(i =>
                i.id === event.payload.id ? { ...i, done: !i.done } : i
              ),
            };
          case 'delete':
            return { items: state.items.filter(i => i.id !== event.payload.id) };
          default:
            return state;
        }
      },
    },
  },
});
```

### 4. Create typed hooks with `createQuoHooks`

```typescript
// hooks.ts
import { createContext } from 'react';
import { createQuoHooks } from '@quojs/react';
import type { StoreInstance } from '@quojs/core';
import type { AppState, AppEM } from './types';

export const AppStoreContext = createContext<
  StoreInstance<'todos', AppState, AppEM> | null
>(null);

export const {
  useAtomicProp,
  useAtomicProps,
  useEmit,
  useEvent,
  useSelector,
  shallowEqual,
} = createQuoHooks(AppStoreContext);
```

### 5. Provide and use

```tsx
// App.tsx
import { StoreProvider } from '@quojs/react';
import { store } from './store';
import { AppStoreContext } from './hooks';

export function App() {
  return (
    <AppStoreContext.Provider value={store}>
      <TodoList />
    </AppStoreContext.Provider>
  );
}
```

---

## Live Examples

| Example | Description |
|---------|-------------|
| **[Kinetic Logo (1000+ particles)](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-kinetic-logo/README.md)** | Physics simulation with independent path subscriptions per circle |
| **[Todo App with Profiler](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/README.md)** | Side-by-side flamegraph comparison with Redux ([profiler results](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.md)) |
| **[Next.js 15 App Router](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-nextjs/README.md)** | SSR + App Router compatibility with theme switching |

---

## Documentation

- **[Quick Start Guide](https://github.com/quojs/quojs/blob/main/docs/en/QUICK_START_GUIDE.md)** — Five steps to a working app
- **[@quojs/core API](https://github.com/quojs/quojs/blob/main/packages/core/README.md)** — Store, middleware, effects, `When` matchers
- **[@quojs/react API](https://github.com/quojs/quojs/blob/main/packages/react/README.md)** — Hooks, Suspense, `createQuoHooks`
- **[Event Queue Architecture](https://github.com/quojs/quojs/blob/main/docs/en/design/event-queue-architecture.md)** — Technical deep-dive into the pipeline
- **[Library Comparison](https://github.com/quojs/quojs/blob/main/docs/en/design/state-management-library-comparison.md)** — Architectural comparison with Redux, Zustand, Jotai, and others

---

## Contributing

We welcome contributions! Please read:

- [Contributing Guide](https://github.com/quojs/quojs/blob/main/CONTRIBUTING.md)
- [Code of Conduct](https://github.com/quojs/quojs/blob/main/CODE_OF_CONDUCT.md)
- [Governance](https://github.com/quojs/quojs/blob/main/GOVERNANCE.md)
- [Maintainers](https://github.com/quojs/quojs/blob/main/MAINTAINERS.md)
- [Security Policy](https://github.com/quojs/quojs/blob/main/SECURITY.md)

---

## Development (Monorepo)

```bash
npm i -g @microsoft/rush
rush install
rush build
rush test
```

See the **[Developer Guide](https://github.com/quojs/quojs/blob/main/docs/en/DEVELOPER_GUIDE.md)** for more details.

---

## Status

Quo.js is in **Release Candidate** stage (v0.7.0+):
- APIs are stable and used in production applications
- TypeScript types are strict and comprehensive
- Minor APIs may still evolve before v1.0

Feedback and PRs are welcome.

---

## License

**MIT** — Free to use in commercial and open-source projects.

See [LICENSE](https://github.com/quojs/quojs/blob/main/LICENSE) for details.

---

## Community
- **Website:** [quojs.dev](https://quojs.dev)
- **Twitter/X:** [@quojs_dev](https://twitter.com/quojs_dev)
- **GitHub Discussions:** [Join the conversation](https://github.com/quojs/quojs/discussions)
- **Issues:** [Report bugs or request features](https://github.com/quojs/quojs/issues)
