![yoltra logo](../../assets/yoltra-logo.png)

# @yoltra/core

> [ 🇲🇽 Versión en Español](https://github.com/yoltra/yoltra/blob/main/packages/core/README.es.md)&nbsp;
> | &nbsp; 👉
> [ 🇺🇸 English Version](https://github.com/yoltra/yoltra/blob/main/packages/core/README.md)&nbsp;

![npm downloads](https://badgen.net/npm/dm/@yoltra/core)
![License](https://badgen.net/npm/license/@yoltra/core)

**Framework-agnostic event-driven state container with fine-grained path subscriptions.**

`@yoltra/core` is the foundation of
[yoltra](https://github.com/yoltra/yoltra/blob/main/README.md). It provides the store, event
pipeline, middleware, effects, and the `connect()` subscription system. Zero framework
dependencies.

---

## Installation

```bash
npm install @yoltra/core
```

---

## The Event Pipeline

Every `emit()` call flows through a deterministic pipeline:

```
emit(channel, type, payload)
  │
  ├─ 1. Dedup ─── Skip if identical fingerprint within time window
  │
  ├─ 2. Middleware ─── Pre-reducer hooks (can reject → "uncommitted" event)
  │
  ├─ 3. Reducers ─── Synchronous state updates, fine-grained path change detection
  │
  ├─ 4. Event subscribers ─── Committed/uncommitted event notifications
  │
  ├─ 5. Effects ─── Async side-effects (post-reducer, keyed for O(1) lookup)
  │
  └─ 6. Coarse subscribers ─── External store listeners (useSyncExternalStore, etc.)
```

Every stage is hook-able. Middleware can cancel events, creating "uncommitted" events that the
UI can still react to. Effects run after reducers and see the final state.

---

## Core Concepts

### Channel-based events

Events are `(channel, type, payload)` tuples. Channels provide natural namespacing that scales
in large codebases:

```typescript
await store.emit("auth", "login", credentials);
await store.emit("analytics", "track", { event: "page_view" });
await store.emit("ui", "toast", { message: "Saved!" });
```

### Fine-grained subscriptions via `connect()`

Subscribe to exact state paths using dotted notation. Supports `*` (one segment) and `**` (zero
or more segments) wildcards:

```typescript
// Exact path — fires when items[0].title changes
store.connect({ reducer: "todos", property: "items.0.title" }, (change) =>
  console.log("title:", change.oldValue, "→", change.newValue),
);

// Single-segment wildcard — fires when ANY item's title changes
store.connect({ reducer: "todos", property: "items.*.title" }, (change) =>
  console.log("some title changed at", change.path),
);

// Deep wildcard — fires when anything under items changes
store.connect({ reducer: "todos", property: "items.**" }, (change) =>
  console.log("items tree changed at", change.path),
);
```

### Immutability

State is deep-frozen before committing. Mutations throw in strict mode:

```typescript
const state = store.getState();
state.counter.value = 999; // TypeError: Cannot assign to read-only property
```

---

## Event Targeting with `When` Matchers

Reducers, effects, and middleware use a unified `When` matcher to declare which events they
respond to:

```typescript
import { createStore, eventKeys } from "@yoltra/core";

type AppEM = {
  ui: { increment: number; decrement: number; reset: void };
  admin: { setCounter: number };
  system: { init: void; shutdown: void };
};

// Match specific event keys (recommended — preserves type correlation)
const counterReducer = {
  state: { value: 0 },
  when: {
    keys: eventKeys<AppEM>()([
      ["ui", "increment"],
      ["ui", "decrement"],
    ]),
  },
  reducer: (state, event) => {
    if (event.type === "increment") return { value: state.value + event.payload };
    if (event.type === "decrement") return { value: state.value - event.payload };
    return state;
  },
};

// Match all events in a channel
const uiLogger = {
  when: { channel: "ui" },
  effect: (event) => console.log("UI event:", event.type),
};

// Match events across multiple channels
const auditTrail = {
  when: { channels: ["ui", "admin"] },
  effect: (event) => logToAuditTrail(event),
};

// Match ALL events
const globalLogger = {
  when: { any: true },
  middleware: (state, event) => {
    console.log(`[${event.channel}] ${event.type}`);
    return true;
  },
};
```

---

## Middleware

Middleware runs **before** reducers and can cancel event propagation. Supports both raw
functions (legacy) and `MiddlewareSpec` objects with targeting:

```typescript
import type { MiddlewareSpec } from "@yoltra/core";

// Targeted middleware — only runs for admin channel events
const adminGuard: MiddlewareSpec<AppState, AppEM> = {
  when: { channel: "admin" },
  middleware: (state, event) => {
    if (!state.auth.isAdmin) return false; // Reject → creates "uncommitted" event
    return true;
  },
  meta: { type: "middleware", name: "adminGuard" },
};

// Global middleware — runs for all events
const logger = async (state, event, emit) => {
  console.log("Event:", event.channel, event.type);
  return true;
};

const store = createStore({
  name: "App",
  reducer: {
    /* ... */
  },
  middleware: [adminGuard, logger],
});
```

### Dynamic middleware

```typescript
const off = store.registerMiddleware(async (state, event) => {
  return event.type !== "forbidden";
});
off(); // Remove later
```

---

## Effects

Effects run **after** reducers and see the final state. They are keyed by event for O(1) lookup:

```typescript
// Via store spec
const store = createStore({
  name: "App",
  reducer: {
    /* ... */
  },
  effects: [
    {
      when: {
        keys: eventKeys<AppEM>()([
          ["todos", "add"],
          ["todos", "delete"],
        ]),
      },
      effect: async (event, getState, emit) => {
        await saveToServer(getState());
      },
      meta: { type: "effect", name: "syncToServer" },
    },
  ],
});

// Dynamic registration
const off = store.registerEffect({
  when: { channel: "analytics" },
  effect: async (event) => sendToAnalytics(event),
});

// Convenience helper for single event
const off2 = store.onEffect("ui", "save", async (payload, getState, emit) => {
  await saveToCloud(payload);
});
```

---

## Event Subscriptions

Subscribe to events (not state) from the view layer. Useful for notifications, animations, and
responding to rejected events:

```typescript
// Committed events (default) — events that passed middleware
const off = store.onEvent("ui", "save", (event, getState, emit, phase) => {
  console.log("Save committed:", event.payload);
});

// Uncommitted events — events rejected by middleware
store.onEvent(
  "ui",
  "delete",
  (event, getState, emit, phase) => {
    console.log("Delete was rejected");
  },
  "uncommitted",
);

// All events — both committed and uncommitted
store.onEvent(
  "ui",
  "action",
  (event, getState, emit, phase) => {
    console.log(`Action ${phase}:`, event.type);
  },
  "all",
);
```

---

## Event Deduplication

Yoltra automatically deduplicates identical events within a configurable time window. This
prevents double-processing in React Strict Mode:

```typescript
const store = createStore({
  name: "Yoltra_Rocks",
  reducer: {
    /* ... */
  },
  dedupWindowMs: 100, // default: 50ms dev, 100ms prod
});
```

---

## Dynamic Reducers

Add or remove reducer slices at runtime:

```typescript
const dispose = store.registerReducer("filters", {
  state: { q: "" },
  when: { keys: eventKeys<AppEM>()([["ui", "setQuery"]]) },
  reducer: (state, event) => (event.type === "setQuery" ? { q: event.payload } : state),
});

// Later: remove the slice and its state
dispose();
```

---

## Hot Module Replacement

```typescript
if (import.meta.hot) {
  import.meta.hot.accept("./reducers", (mod) => {
    store.replaceReducers(mod.reducers, { preserveState: true });
  });

  import.meta.hot.accept("./middleware", (mod) => {
    store.replaceMiddleware(mod.middleware);
  });

  import.meta.hot.accept("./effects", (mod) => {
    store.replaceEffects(mod.effects);
  });

  // Or replace everything at once
  store.hotReplace({
    reducer: newReducers,
    middleware: newMiddleware,
    effects: newEffects,
    preserveState: true,
  });
}
```

---

## Best Practices

### Always await `emit()`

```typescript
await emit("todo", "add", todo);
const state = store.getState(); // Guaranteed to reflect the new todo
```

### Keep reducers fast

Reducers are synchronous and block the event queue. Move expensive work to effects:

```typescript
// Reducer: just set a loading flag
reducer: ((state, event) => ({ ...state, loading: true }),
  // Effect: do the heavy lifting
  store.onEffect("data", "compute", async (payload, getState, emit) => {
    const result = await computeAsync();
    await emit("data", "computeComplete", result);
  }));
```

### Handle effect errors

```typescript
store.registerEffect({
  when: { channel: "data" },
  effect: async (event, getState, emit) => {
    try {
      const data = await fetch(url);
      await emit("data", "loadSuccess", data);
    } catch (error) {
      await emit("data", "loadFailure", { error: error.message });
    }
  },
});
```

---

## API Overview

### Store Creation

| API                                             | Description                                    |
| ----------------------------------------------- | ---------------------------------------------- |
| `createStore(spec)`                             | Create a store (types inferred from reducers)  |
| `createStore<S, EM>(spec)`                      | Create a store with explicit state/event types |
| `store.emit(channel, type, payload)`            | Emit an event (returns a promise)              |
| `store.getState()`                              | Get current readonly state snapshot            |
| `store.subscribe(listener)`                     | Coarse subscription (any state change)         |
| `store.connect(spec, handler)`                  | Fine-grained path subscription with wildcards  |
| `store.onEvent(channel, type, handler, phase?)` | Event subscription (committed/uncommitted/all) |
| `store.onEffect(channel, type, handler)`        | Single-event effect shorthand                  |
| `store.dispose()`                               | Cleanup timers and resources                   |

### Dynamic Registration

| API                                 | Description               |
| ----------------------------------- | ------------------------- |
| `store.registerReducer(name, spec)` | Add a slice at runtime    |
| `store.registerMiddleware(fn)`      | Add middleware at runtime |
| `store.registerEffect(spec)`        | Add an effect at runtime  |

### HMR

| API                                     | Description                |
| --------------------------------------- | -------------------------- |
| `store.replaceReducers(reducers, opts)` | Replace all reducers       |
| `store.replaceMiddleware(middleware)`   | Replace all middleware     |
| `store.replaceEffects(effects)`         | Replace all effects        |
| `store.hotReplace(partial)`             | Replace any subset at once |

### Helpers

| API                      | Description                                   |
| ------------------------ | --------------------------------------------- |
| `eventKeys<EM>()([...])` | Type-safe event key arrays without `as const` |

---

## Performance

| Metric             | Value                          |
| ------------------ | ------------------------------ |
| **Bundle size**    | ~8KB (minified + gzipped)      |
| **Tree-shakeable** | Yes (ES modules)               |
| **Dependencies**   | Zero                           |
| **TypeScript**     | Full type definitions included |

---

## Documentation

- **[yoltra Root README](https://github.com/yoltra/yoltra/blob/main/README.md)** — Overview and
  quick start
- **[@yoltra/react](https://github.com/yoltra/yoltra/blob/main/packages/react/README.md)** —
  React hooks and Suspense
- **[Quick Start Guide](https://github.com/yoltra/yoltra/blob/main/docs/en/QUICK_START_GUIDE.md)**
  — Five steps to a working app
- **[Event Queue Architecture](https://github.com/yoltra/yoltra/blob/main/docs/en/design/event-queue-architecture.md)**
  — Technical deep-dive
- **[Library Comparison](https://github.com/yoltra/yoltra/blob/main/docs/en/design/state-management-library-comparison.md)**
  — Architectural comparison

---

## Examples

- **[Todo App](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-in-react)** — Full
  CRUD with performance profiling
- **[Kinetic Logo](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-kinetic-logo)**
  — 1000+ SVG circles with physics simulation
- **[Next.js Integration](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-in-nextjs)**
  — SSR + App Router + theme switcher

---

## Contributing

- [Monorepo Root](https://github.com/yoltra/yoltra/blob/main/README.md)
- [Contributing Guide](https://github.com/yoltra/yoltra/blob/main/CONTRIBUTING.md)

---

## Status

**Release Candidate** — APIs are stable, used in production, minor changes possible before v1.0.

---

## License

**MIT** — Free to use in commercial and open-source projects.
