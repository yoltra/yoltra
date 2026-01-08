![Quo.js logo](https://quojs.dev/assets/logo.svg)

# Quo.js

> [ 🇲🇽 Versión en Español](https://github.com/quojs/quojs/blob/main/docs/es/README.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](https://github.com/quojs/quojs/blob/main/docs/pt/README.md)&nbsp;
> | &nbsp; 👉 [ 🇺🇸 English Version](https://github.com/quojs/quojs/blob/main/README.md)&nbsp; |
> &nbsp;[ 🇫🇷 Version française](https://github.com/quojs/quojs/blob/main/docs/fr/README.md)

![Bundle size](https://badgen.net/bundlephobia/min/@quojs/core)
![Bundle size](https://badgen.net/bundlephobia/minzip/@quojs/core)
![Bundle size](https://badgen.net/bundlephobia/tree-shaking/@quojs/core)
![Bundle size](https://badgen.net/bundlephobia/dependency-count/@quojs/core)
![npm downloads](https://badgen.net/npm/dm/@quojs/core)
![License](https://img.shields.io/npm/l/@quojs/core)

**Event-driven state management with atomic subscriptions.**  
Quo.js is a modern, async-first state container that combines **channel-based events**, **fine-grained reactivity**, and **native async support**—without the complexity of Redux Toolkit or the implicit magic of MobX.

---

## What is Quo.js?

Quo.js is an **event-driven, async-first state container** designed to solve three core problems:

### 1. **Performance: Zero Unnecessary Re-renders**

Traditional state libraries re-render components when *any* part of subscribed state changes. Quo.js uses **atomic path subscriptions** to eliminate this waste.

```tsx
// ❌ Redux/Zustand: Re-renders when ANY todo changes
const todos = useSelector(state => state.todos);

// ✅ Quo.js: Only re-renders when THIS specific todo's title changes
const title = useAtomicProp({ 
  reducer: 'todos', 
  property: 'items.0.title' 
});
```

[See flamegraph comparison →](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.md)

### 2. **Async Complexity: Built-in, Not Bolted-on**

Quo.js treats async as a first-class concern. Middleware and effects are `async` by default—no thunks, no sagas, no ceremony.

```typescript
// Built-in async middleware
const middleware = async (state, event, emit) => {
  if (event.type === 'fetchUser') {
    const user = await fetch('/api/user').then(r => r.json());
    await emit('user', 'loaded', user);
  }
  return true;
};
```

### 3. **Organization: Channel-based Events**

Events are namespaced by channel `(channel, type, payload)`, preventing naming collisions in large apps.

```typescript
emit('auth', 'login', credentials);     // Auth events
emit('analytics', 'track', event);      // Analytics events
emit('ui', 'toast', message);           // UI events
```

---

## Key Features

- 🎯 **Atomic Subscriptions** — Subscribe to exact state paths; only re-render when they change
- ⚡ **Async-First** — Native async middleware + effects; no thunks/sagas required
- 🗪 **Event-Driven** — Channel-based events with FIFO ordering guarantees
- 🛡️ **TypeScript-First** — Excellent type inference and autocomplete
- 🧩 **Dynamic Reducers** — Add/remove state slices at runtime
- 🌍 **Framework-agnostic** — We support React now, and we will support others in the future
- 📌 **Lightweight** — ~15KB total (@quojs/core + @quojs/react)

---

## Packages

- **[@quojs/core](https://github.com/quojs/quojs/blob/main/packages/core/README.md)** — Core store, reducers, middleware, effects (framework-agnostic)
- **[@quojs/react](https://github.com/quojs/quojs/blob/main/packages/react/README.md)** — React hooks and provider (Suspense/Concurrent-ready)

---

## Quick Start Guide

- [@quojs/core quick start guide](https://github.com/quojs/quojs/blob/main/docs/en/QUICK_START_GUIDE.md).

---

## Live Examples

| Example | Description | Screenshot |
|---------|-------------|------------|
| **[Todo App with Profiler](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/README.md)** | Todo app comparing Redux vs Quo.js performance ([flamegraphs](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.md)) | ![Profiler](https://quojs.dev/assets/examples/profiler-quojs-frame-15.png) |
| **[Kinetic Logo (900 particles)](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-kinetic-logo/README.md)** | ~1500 SVG circles driven by physics simulation + Quo.js state | ![Logo](https://quojs.dev/assets/examples/quojs-dots.gif) |
| **[Next.js 15 Theme Switcher](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-nextjs/README.md)** | Theme switcher in Next.js 15 App Router (React 19 + Quo.js) | ![Theme](https://quojs.dev/assets/examples/quojs-in-nextjs--theme-switcher.png) |

---

## How Does Quo.js Compare?

Quo.js occupies a unique space between Redux's structure and Zustand's simplicity:

| Library | Architecture | Async Support | Subscriptions | Bundle Size |
|---------|-------------|---------------|---------------|-------------|
| **Redux Toolkit** | Centralized | Thunks/RTK Query | Slice-level | ~45KB |
| **Zustand** | Centralized | Manual | Selector-level | ~1KB |
| **Jotai** | Distributed (atoms) | Manual | Atom-level | ~3KB |
| **MobX** | Observable | `runInAction` | Observable-level | ~16KB |
| **XState** | State Machines | Built-in | State-level | ~30KB |
| **Quo.js** | Event-driven | **Built-in** | **Path-level** | ~15KB |

**Key Differentiators:**
- ✅ Fine-grained subscriptions **by default** (no manual optimization)
- ✅ Native async pipeline (middleware + effects)
- ✅ Event ordering guarantees (FIFO queue)

👉 **[Read the full comparison →](https://github.com/quojs/quojs/blob/main/docs/en/design/state-management-library-comparison.md)**

---

## When Should You Use Quo.js?

### ✅ Great For

- Apps where **performance** (re-render optimization) is critical
- Projects that need **native async patterns** (no thunks/sagas)
- **Large codebases** where channel organization prevents collisions
- Teams that want **explicit event flow** for debugging

### ⚠️ Consider Alternatives If

- You need **minimal bundle size** (<5KB) → Try Zustand
- Your team is **heavily invested in Redux** → Try Redux Toolkit
- You prefer **atom-based state** → Try Jotai
- You're modeling **complex workflows** → Try XState

---

## Installation & Setup

### 1. Install Packages

```bash
npm install @quojs/core @quojs/react
# or
yarn add @quojs/core @quojs/react
# or
pnpm add @quojs/core @quojs/react
```

### 2. Define Your Event Map

```typescript
// types.ts
export type AppEM = {
  todos: {
    add: { id: string; title: string };
    toggle: { id: string };
    delete: { id: string };
  };
  ui: {
    setTheme: 'light' | 'dark';
  };
};
```

### 3. Create the Store

```typescript
// store.ts
import { createStore } from '@quojs/core';
import type { AppEM } from './types';

export const store = createStore({
  name: 'MyApp',
  reducer: {
    todos: {
      state: { items: [] },
      events: [
        ['todos', 'add'],
        ['todos', 'toggle'],
        ['todos', 'delete']
      ],
      reducer: (state, event) => {
        // Your reducer logic
      }
    }
  }
});
```

### 4. Use in React

```tsx
// App.tsx
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

## Documentation

- **[Quick Start Guide](https://github.com/quojs/quojs/blob/main/docs/en/QUICK_START_GUIDE.md)** — Get started in 5 minutes
- **[API Reference (@quojs/core)](https://github.com/quojs/quojs/blob/main/packages/core/docs/README.md)** — TypeDoc for core package
- **[API Reference (@quojs/react)](https://github.com/quojs/quojs/blob/main/packages/react/docs/README.md)** — TypeDoc for React hooks
- **[Library Comparison](https://github.com/quojs/quojs/blob/main/docs/en/design/state-management-library-comparison.md)** — How Quo.js compares to Redux, Zustand, Jotai, etc.
- **[Event Queue Architecture](https://github.com/quojs/quojs/blob/main/docs/en/design/event-queue-architecture.md)** — Technical deep-dive

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
# Install Rush globally
npm i -g @microsoft/rush

# Install dependencies
rush install

# Build all packages
rush build

# Run tests
rush test

# Build specific package
rush build --to @quojs/core

# Build from specific package
rush build --from @quojs/react
```

See the **[Developer Guide](https://github.com/quojs/quojs/blob/main/docs/en/DEVELOPER_GUIDE.md)** for more details.

---

## Status

Quo.js is in **Release Candidate** stage:
- ✅ APIs are stable (v0.5.0 terminology finalized)
- ✅ TypeScript types are strict and comprehensive
- ✅ Used in production applications
- ⚠️ Minor APIs may still evolve before v1.0

**Feedback and PRs are welcome!**

---

## License

**MIT** — Free to use in commercial and open-source projects.

See [LICENSE](https://github.com/quojs/quojs/blob/main/LICENSE) for details.

---

## Community
- Visit the **[official Quo.js Website](https://quojs.dev)**
- **Twitter/X:** [@quojs_dev](https://twitter.com/quojs_dev)
- **GitHub Discussions:** [Join the conversation](https://github.com/quojs/quojs/discussions)
- **Issues:** [Report bugs or request features](https://github.com/quojs/quojs/issues)

---

Made in 🇲🇽 for the world.