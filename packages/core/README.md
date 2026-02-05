![Quo.js logo](../../assets/logo.svg)

# @quojs/core

> [ 🇲🇽 Versión en Español](https://github.com/quojs/quojs/blob/main/packages/core/README.es.md)&nbsp;
> | &nbsp;[ 🇵🇹 Versão Portuguesa](https://github.com/quojs/quojs/blob/main/packages/core/README.pt.md)&nbsp;
> | &nbsp; 👉 [ 🇺🇸 English Version](https://github.com/quojs/quojs/blob/main/packages/core/README.md)&nbsp;
> | &nbsp;[ 🇫🇷 Version française](https://github.com/quojs/quojs/blob/main/packages/core/README.fr.md)

![Bundle size](https://badgen.net/bundlephobia/min/@quojs/core)
![Bundle size](https://badgen.net/bundlephobia/minzip/@quojs/core)
![Bundle size](https://badgen.net/bundlephobia/tree-shaking/@quojs/core)
![Bundle size](https://badgen.net/bundlephobia/dependency-count/@quojs/core)
![npm version](https://badgen.net/npm/v/@quojs/core)
![npm downloads](https://badgen.net/npm/dm/@quojs/core)
![License](https://badgen.net/npm/license/@quojs/core)

**Framework-agnostic event-driven state container.**

`@quojs/core` is the foundation of Quo.js—a modern state management library that combines
**channel-based events**, **atomic subscriptions**, and **native async support** in a
lightweight, universal package.
---

## What is @quojs/core?

`@quojs/core` provides:

- **Event-driven architecture** — Events flow through channels `(channel, type, payload)`
- **FIFO event queue** — Predictable, serialized event processing with ordering guarantees
- **Async-first** — Native async middleware and effects (no thunks/sagas)
- **Atomic subscriptions** — Subscribe to exact state paths via dotted notation
- **Event subscriptions** — Subscribe to events from React components
- **Immutability** — Deep-freeze enforcement with structural change detection
- **TypeScript-first** — Excellent type inference and autocomplete

> Check the
> [State Management Library Comparison](https://github.com/quojs/quojs/blob/main/docs/en/design/state-management-library-comparison.md)
> report.

---

## Installation

```bash
npm install @quojs/core
# or
yarn add @quojs/core
# or
pnpm add @quojs/core
```

---

## Quick start guide

---

## Core Concepts

### Event-Driven Architecture

Events are first-class citizens in Quo.js. Every state change is triggered by an explicit event.

```typescript
// Events have a channel, type, and payload
await store.emit("auth", "login", { username, password });
await store.emit("analytics", "track", { event: "page_view" });
await store.emit("ui", "toast", { message: "Welcome!" });
```

**Benefits:**

- Clear intent (every action is traceable)
- Natural modularity (organize by channel)
- Audit trail (events are serializable)

Check the **[Event Queue Architecture](https://github.com/quojs/quojs/blob/main/docs/en/design/event-queue-architecture.md)**
overview document.

### Async-First

Middleware and effects are `async` by default. No external libraries needed.

```typescript
// Async middleware
const authMiddleware = async (state, event, emit) => {
  if (event.type === "login") {
    const token = await authenticateUser(event.payload);
    await emit("auth", "loginSuccess", { token });
    return false; // Cancel original event
  }
  return true;
};

// Async effects (run after reducers)
const analyticsEffect = async (event, getState, emit) => {
  if (event.channel === "analytics") {
    await sendToAnalytics(event.payload);
  }
};

const store = createStore({
  name: "App",
  reducer: {
    /* ... */
  },
  middleware: [authMiddleware],
  effects: [
    {
      events: [["analytics", "track"]],
      effect: analyticsEffect,
    },
  ],
});
```

### Fine-Grained Subscriptions

Subscribe to exact state paths using dotted notation:

```typescript
// Subscribe to nested path
store.connect({ reducer: "todos", property: "items.0.title" }, (change) => {
  console.log("First todo title changed:", change.newValue);
});

// Wildcard patterns
store.connect({ reducer: "todos", property: "items.*.completed" }, (change) => {
  console.log("A todo completion status changed");
});
```

### Immutability Guarantees

State is **deep-frozen** before committing to prevent accidental mutations:

```typescript
const state = store.getState();
state.counter.value = 999; // ❌ TypeError: Cannot assign to read-only property

// Instead, emit events:
await store.emit("counter", "set", 999); // ✅ Correct way
```

---

## Best Practices

### Application Code

#### 1. Always Await `emit()`

```typescript
// ❌ BAD: Fire and forget
emit("todo", "add", todo);
const state = store.getState(); // May not have new todo yet!

// ✅ GOOD: Wait for completion
await emit("todo", "add", todo);
const state = store.getState(); // Guaranteed to have new todo
```

#### 2. Avoid Infinite Loops

```typescript
// ❌ BAD: Infinite recursion
registerEffect({
  events: [["counter", "increment"]],
  effect: (evt, getState, emit) => {
    emit("counter", "increment", evt.payload + 1); // Infinite!
  },
});

// ✅ GOOD: Guard condition
registerEffect({
  events: [["counter", "increment"]],
  effect: (evt, getState, emit) => {
    if (evt.payload < 100) {
      // Stop at 100
      emit("counter", "increment", evt.payload + 1);
    }
  },
});
```

#### 3. Keep Reducers Fast

```typescript
// ❌ BAD: Slow reducer blocks queue
reducer: (state, event) => {
  const result = expensiveComputation(); // Blocks for seconds
  return { ...state, result };
};

// ✅ GOOD: Move to async effect
reducer: (state, event) => {
  return { ...state, loading: true };
};

registerEffect({
  events: [["data", "compute"]],
  effect: async (evt, getState, emit) => {
    const result = await computeAsync(); // Doesn't block
    emit("data", "computeComplete", result);
  },
});
```

#### 4. Handle Effect Errors

```typescript
// ❌ BAD: Unhandled effect errors
effect: async (evt, getState, emit) => {
  const data = await fetch(url); // May throw
  emit("data", "loaded", data);
};

// ✅ GOOD: Error handling with failure events
effect: async (evt, getState, emit) => {
  try {
    const data = await fetch(url);
    emit("data", "loadSuccess", data);
  } catch (error) {
    emit("data", "loadFailure", { error: error.message });
  }
};
```

#### 5. Throttle High-Frequency Events

```typescript
// ❌ BAD: Floods queue
window.addEventListener("mousemove", (e) => {
  emit("ui", "mouseMove", { x: e.clientX, y: e.clientY });
});

// ✅ GOOD: Throttle emissions
import { throttle } from "lodash-es";

const throttledEmit = throttle(
  (x, y) => emit("ui", "mouseMove", { x, y }),
  16, // ~60fps
);

window.addEventListener("mousemove", (e) => {
  throttledEmit(e.clientX, e.clientY);
});
```

---

## Advanced Features

### Dynamic Reducers

Add or remove reducers at runtime:

```typescript
// Add a new reducer dynamically
const disposeReducer = store.registerReducer("newFeature", {
  state: { enabled: false },
  events: [["features", "toggle"]],
  reducer: (state, event) => {
    return { enabled: !state.enabled };
  },
});

// Later: remove the reducer
disposeReducer();
```

### Event Deduplication

Quo.js automatically prevents duplicate event processing (React Strict Mode safe):

```typescript
// In React Strict Mode, effects fire twice in development
useEffect(() => {
  emit("analytics", "pageView", { page });
  // ↑ Fired 2x by React, but Quo.js processes it only once
}, [page]);
```

### Middleware

Middleware runs **before** reducers and can cancel events:

```typescript
const loggingMiddleware = async (state, event, emit) => {
  console.log("Event:", event.channel, event.type, event.payload);
  return true; // Allow event to continue
};

const validationMiddleware = async (state, event) => {
  if (event.type === "addTodo" && !event.payload.title) {
    console.error("Invalid todo: missing title");
    return false; // Cancel event
  }
  return true;
};
```

### Effects

Effects run **after** reducers and are great for side effects:

```typescript
const saveToLocalStorageEffect = async (event, getState) => {
  const state = getState();
  localStorage.setItem("app-state", JSON.stringify(state));
};

store.registerEffect({
  events: [
    ["todos", "add"],
    ["todos", "toggle"],
    ["todos", "delete"],
  ],
  effect: saveToLocalStorageEffect,
});
```

---

## TypeScript Support

Quo.js is TypeScript-first with excellent type inference:

```typescript
// Event map is fully typed
type AppEM = {
  counter: {
    increment: number; // Payload type
    decrement: number;
  };
};

const store = createStore<AppEM>({
  /* ... */
});

// ✅ Autocomplete works:
await store.emit("counter", "increment", 5);
// ↑ Suggests: 'increment' | 'decrement'
// ↑ Expects: number

// ❌ TypeScript catches errors:
await store.emit("counter", "increment", "five"); // Error: Expected number
await store.emit("invalid", "event", null); // Error: Unknown channel
```

---

## API Overview

### Store Creation

- `createStore(spec)` — Create a new store instance
- `store.emit(channel, type, payload)` — Emit an event (async)
- `store.getState()` — Get current state (readonly)
- `store.subscribe(listener)` — Subscribe to any state change
- `store.onEvent(channel, type, handler, phase?)` — Subscribe to Events, same as Middleware and Effects!
- `store.connect(spec, handler)` — Subscribe to specific state path

### Dynamic Registration

- `store.registerReducer(name, spec)` — Add reducer at runtime
- `store.registerMiddleware(middleware)` — Add middleware at runtime
- `store.registerEffect(spec)` — Add effect at runtime

### Hot Module Replacement

- `store.replaceReducers(reducers, opts)` — Replace all reducers (HMR)
- `store.replaceMiddleware(middleware)` — Replace all middleware (HMR)
- `store.replaceEffects(effects)` — Replace all effects (HMR)

> See the [Technical Docs](./docs/classes/Store.md)
---

## Performance

| Metric             | Value                          |
| ------------------ | ------------------------------ |
| **Bundle Size**    | ~8KB (minified + gzipped)      |
| **Tree-shakeable** | ✅ Yes (ES modules)            |
| **Dependencies**   | Zero runtime dependencies      |
| **TypeScript**     | Full type definitions included |

---

## Documentation

- **[Quick Start Guide](https://quojs.dev)** — Get started in 5 minutes
- **[TypeDoc API Reference](https://github.com/quojs/quojs/blob/main/packages/core/docs/README.md)** — Complete API documentation
- **[Event Queue Architecture](https://github.com/quojs/quojs/blob/main/docs/en/design/event-queue-architecture.md)** — Technical deep-dive
- **[Library Comparison](https://github.com/quojs/quojs/blob/main/docs/en/design/state-management-library-comparison.md)** — vs Redux, Zustand, Jotai, etc.

---

## Examples

- **[Todo App](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react)** — Full CRUD example with performance
  profiling
- **[Kinetic Logo](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-kinetic-logo)** — Physics simulation with 900
  particles
- **[Next.js Integration](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-nextjs)** — SSR + theme switcher

---

## Contributing

We welcome contributions! See:

- [Monorepo Root](https://github.com/quojs/quojs/blob/main/README.md)
- [Contributing Guide](https://github.com/quojs/quojs/blob/main/CONTRIBUTING.md)
- [Code of Conduct](https://github.com/quojs/quojs/blob/main/CODE_OF_CONDUCT.md)

---

## Status

**Release Candidate** — APIs are stable, used in production, minor changes possible before v1.0.

---

## License

**MIT** — Free to use in commercial and open-source projects.

---

Made in 🇲🇽 for the world.
