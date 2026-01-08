# State Management Library Comparison

> [ 🇲🇽 Versión en Español](https://github.com/quojs/quojs/blob/main/docs/es/design/state-management-library-comparison.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](https://github.com/quojs/quojs/blob/main/docs/pt/design/state-management-library-comparison.md)&nbsp; |
> &nbsp; 👉 [ 🇺🇸 English Version](https://github.com/quojs/quojs/blob/main/docs/en/design/state-management-library-comparison.md)&nbsp; |
> &nbsp;[ 🇫🇷 Version française](https://github.com/quojs/quojs/blob/main/docs/fr/design/state-management-library-comparison.md)

**Version:** 0.5.0
**Last Updated:** January 2026

## Overview

This document provides an honest, technical comparison of Quo.js against popular state management libraries. Each comparison explores architectural differences, use-case fit, performance characteristics, and developer experience.

---

## What is Quo.js?

**Quo.js is an event-driven, async-first state container with atomic subscriptions.**

### Core Architecture

```typescript
// Event-driven: Events flow through channels
emit('todo', 'addItem', { title: 'Buy milk' });

// Async-first: Built-in async middleware and effects
const middleware = async (state, event, emit) => {
 await trackAnalytics(event);
 return true;
};

// Atomic subscriptions: Subscribe to exact state paths
useAtomicProp({ reducer: 'todos', property: 'items.0.title' });
// ↑ Only re-renders when items[0].title changes
```

### Key Characteristics

| Aspect | Description |
|--------|-------------|
| **Architectural Pattern** | Event-driven architecture with channel-based routing |
| **State Model** | Centralized store with namespaced slices |
| **Event Model** | FIFO queue with `(channel, type, payload)` events |
| **Subscription Model** | Fine-grained atomic subscriptions via dotted paths |
| **Async Model** | Native Promise-based emit + async middleware + effects |
| **Execution Model** | Serialized event processing (one at a time, in order) |
| **Runtime** | Universal (browser + Node.js + Deno + Bun) |

### What Problems Does Quo.js Solve?

1. **Performance**: Eliminates unnecessary re-renders via atomic path subscriptions
2. **Complexity**: Native async support without thunks/sagas/observables
3. **Organization**: Channel-based events prevent action type naming collisions
4. **Predictability**: Strict event ordering guarantees deterministic state transitions
5. **Flexibility**: Works in web apps, Node servers, CLI tools, microservices

---

## Redux Toolkit

### Conceptual Model

**Redux Toolkit (RTK)** is the official, opinionated Redux toolset that reduces boilerplate while maintaining Redux's core principles: unidirectional data flow, immutable updates, and pure reducers.

```typescript
// Redux Toolkit approach
const todosSlice = createSlice({
 name: 'todos',
 initialState: { items: [] },
 reducers: {
  addTodo: (state, action) => {
   state.items.push(action.payload); // Immer-powered mutation
  }
 }
});

// Async via thunks
const fetchTodos = createAsyncThunk('todos/fetch', async (url) => {
 const res = await fetch(url);
 return res.json();
});

// Usage
dispatch(addTodo({ id: 1, title: 'Buy milk' }));
dispatch(fetchTodos('/api/todos'));
```

**Architecture:**
- Single store with slice reducers
- Flat action types (`'todos/addTodo'`)
- Synchronous reducers (Immer for immutability)
- Async via thunks or RTK Query
- Coarse subscriptions (re-render on any slice change unless manually optimized)

### When Redux Toolkit Excels

✅ **Large teams with established Redux patterns** 
Redux is battle-tested at scale. If your team already knows Redux, RTK is the obvious upgrade path.

✅ **Data fetching via RTK Query** 
RTK Query provides automatic caching, refetching, and optimistic updates—a complete data-fetching solution.

✅ **DevTools ecosystem** 
Redux DevTools is mature, widely adopted, and has extensive third-party integrations.

✅ **Ecosystem maturity** 
Thousands of middleware, enhancers, and tools available. Solutions exist for every edge case.

### When Quo.js Excels

✅ **Fine-grained performance optimization** 
Quo.js's atomic subscriptions eliminate re-renders by default. RTK requires manual `useSelector` optimization.

**Example:**
```typescript
// RTK: Entire component re-renders when ANY todo changes
const todos = useSelector(state => state.todos.items);

// Quo.js: Only re-renders when THIS specific todo's title changes
const title = useAtomicProp({ 
 reducer: 'todos', 
 property: 'items.0.title' 
});
```

✅ **Built-in async patterns** 
Quo.js middleware and effects are async by default. No thunks, no RTK Query setup.

**Example:**
```typescript
// Quo.js: Async middleware built-in
const middleware = async (state, event, emit) => {
 if (event.type === 'fetchTodos') {
  const data = await fetch('/api/todos').then(r => r.json());
  await emit('todos', 'loadSuccess', data);
  return false; // Cancel original event
 }
 return true;
};

// RTK: Requires thunk/RTK Query
const fetchTodos = createAsyncThunk('todos/fetch', async () => {
 return fetch('/api/todos').then(r => r.json());
});
```

✅ **Channel-based organization** 
Quo.js events are namespaced by channel, preventing naming collisions in large apps.

**Example:**
```typescript
// Quo.js: Clear namespacing
emit('user', 'update', data);
emit('analytics', 'track', event);
emit('api', 'request', config);

// RTK: Flat action types require careful naming
dispatch({ type: 'user/update' });
dispatch({ type: 'analytics/track' });
dispatch({ type: 'api/request' });
```

✅ **Universal runtime** 
Quo.js has no DOM dependencies. Use it in Node.js servers, CLI tools, or microservices.

### Performance Comparison

| Metric | Redux Toolkit | Quo.js |
|--------|---------------|--------|
| **Subscription Granularity** | Slice-level (manual optimization) | Path-level (automatic) |
| **Re-render Frequency** | High (without optimization) | Minimal (atomic by default) |
| **Async Overhead** | Thunk layer + action creators | Built-in async pipeline |
| **Bundle Size** | ~45KB (RTK + React-Redux) | ~15KB (@quojs/core + @quojs/react) |
| **Memory Footprint** | Higher (full state tree subscriptions) | Lower (path-specific subscriptions) |

### Migration Path: RTK → Quo.js

```typescript
// BEFORE (Redux Toolkit)
const todosSlice = createSlice({
 name: 'todos',
 initialState: { items: [], filter: 'all' },
 reducers: {
  addTodo: (state, action) => {
   state.items.push(action.payload);
  },
  toggleTodo: (state, action) => {
   const todo = state.items.find(t => t.id === action.payload);
   if (todo) todo.completed = !todo.completed;
  }
 }
});

// AFTER (Quo.js v0.5.0)
import { withImmer } from './withImmer';

const todosReducer = withImmer<TodoState, AppEM>((draft, event) => {
 switch (event.type) {
  case 'addTodo':
   draft.items.push(event.payload);
   return;
  case 'toggleTodo':
   const todo = draft.items.find(t => t.id === event.payload);
   if (todo) todo.completed = !todo.completed;
   return;
 }
});

const todosSpec: ReducerSpec<TodoState, AppEM> = {
 state: { items: [], filter: 'all' },
 events: [
  ['todos', 'addTodo'],
  ['todos', 'toggleTodo']
 ],
 reducer: todosReducer
};
```

### Verdict

**Choose Redux Toolkit if:**
- Your team is already proficient in Redux
- You need RTK Query's data-fetching capabilities
- You rely heavily on the Redux ecosystem
- You prefer opinionated, batteries-included solutions

**Choose Quo.js if:**
- Performance (re-render optimization) is critical
- You want native async support without layers
- You're building universal apps (web + Node.js)
- You prefer explicit, minimal APIs

---

## Zustand

### Conceptual Model

**Zustand** is a minimalist state management library built on React hooks. It eschews Redux's boilerplate for a simple `create` + `set` API.

```typescript
// Zustand approach
const useStore = create((set) => ({
 todos: [],
 addTodo: (todo) => set((state) => ({ 
  todos: [...state.todos, todo] 
 })),
 toggleTodo: (id) => set((state) => ({
  todos: state.todos.map(t => 
   t.id === id ? { ...t, completed: !t.completed } : t
  )
 }))
}));

// Usage
const todos = useStore(state => state.todos);
const addTodo = useStore(state => state.addTodo);
```

**Architecture:**
- Single store with direct state updates
- No actions or events (just functions)
- Synchronous by default
- Subscriptions via selector functions
- Minimal API surface (~1KB)

### When Zustand Excels

✅ **Minimal boilerplate** 
Zustand has the lowest ceremony of any state library. Define state + actions in one place.

✅ **Small bundle size** 
~1KB makes Zustand ideal for size-constrained apps.

✅ **Simple mental model** 
No events, no reducers, no middleware—just functions that call `set()`.

✅ **Gradual adoption** 
Easy to add to existing projects without major refactoring.

### When Quo.js Excels

✅ **Async complexity** 
Quo.js handles async workflows natively. Zustand requires manual orchestration.

**Example:**
```typescript
// Zustand: Manual async handling
const useStore = create((set) => ({
 todos: [],
 loading: false,
 fetchTodos: async () => {
  set({ loading: true });
  try {
   const res = await fetch('/api/todos');
   const todos = await res.json();
   set({ todos, loading: false });
  } catch (error) {
   set({ loading: false, error });
  }
 }
}));

// Quo.js: Built-in async pipeline
const middleware = async (state, event, emit) => {
 if (event.type === 'fetchTodos') {
  await emit('todos', 'loading', true);
  try {
   const res = await fetch('/api/todos');
   const todos = await res.json();
   await emit('todos', 'loadSuccess', todos);
  } catch (error) {
   await emit('todos', 'loadFailure', error);
  }
  return false;
 }
 return true;
};
```

✅ **Event ordering guarantees** 
Quo.js's FIFO queue ensures deterministic state transitions. Zustand's `set()` calls can interleave unpredictably.

✅ **Fine-grained subscriptions** 
Zustand requires manual selector optimization. Quo.js atomic subscriptions are built-in.

**Example:**
```typescript
// Zustand: Re-renders when ANY todo changes (without optimization)
const todos = useStore(state => state.todos);

// Zustand optimized: Manual selector
const firstTodo = useStore(
 state => state.todos[0],
 (a, b) => a?.id === b?.id // Custom equality
);

// Quo.js: Automatic fine-grained subscription
const firstTodo = useAtomicProp({ 
 reducer: 'todos', 
 property: 'items.0' 
});
```

✅ **Structured event history** 
Quo.js events are first-class, making time-travel debugging and analytics easier.

### Performance Comparison

| Metric | Zustand | Quo.js |
|--------|---------|--------|
| **Subscription Granularity** | Selector-level (manual) | Path-level (automatic) |
| **Re-render Frequency** | Medium (with optimization) | Minimal (atomic by default) |
| **Bundle Size** | ~1KB | ~15KB |
| **Setup Complexity** | Minimal | Moderate |
| **Async Patterns** | Manual | Built-in |

### Migration Path: Zustand → Quo.js

```typescript
// BEFORE (Zustand)
const useStore = create((set) => ({
 count: 0,
 increment: () => set((state) => ({ count: state.count + 1 })),
 decrement: () => set((state) => ({ count: state.count - 1 }))
}));

// AFTER (Quo.js v0.5.0)
const counterReducer = (state: CounterState, event: EventUnion<AppEM>) => {
 switch (event.type) {
  case 'increment':
   return { count: state.count + 1 };
  case 'decrement':
   return { count: state.count - 1 };
  default:
   return state;
 }
};

const store = createStore({
 name: 'App',
 reducer: {
  counter: {
   state: { count: 0 },
   events: [['counter', 'increment'], ['counter', 'decrement']],
   reducer: counterReducer
  }
 }
});

// Usage
const emit = useEmit();
emit('counter', 'increment', null);
```

### Verdict

**Choose Zustand if:**
- Bundle size is critical (<5KB total)
- You want the simplest possible API
- Your app has minimal async complexity
- You're building a small-to-medium app

**Choose Quo.js if:**
- You need robust async patterns
- Performance optimization is critical
- You want event ordering guarantees
- You're building a large, complex app

---

## Jotai

### Conceptual Model

**Jotai** takes an atom-based approach inspired by Recoil. State is distributed across atoms instead of centralized.

```typescript
// Jotai approach
const countAtom = atom(0);
const todosAtom = atom([]);

// Derived atoms
const completedCountAtom = atom(
 (get) => get(todosAtom).filter(t => t.completed).length
);

// Usage
const [count, setCount] = useAtom(countAtom);
const todos = useAtomValue(todosAtom);
```

**Architecture:**
- Distributed state (atoms)
- Bottom-up composition
- Atomic updates (fine-grained by design)
- Suspense-first
- No central store

### When Jotai Excels

✅ **Fine-grained reactivity** 
Atoms are inherently granular. Re-renders are minimal by design.

✅ **Suspense integration** 
Jotai was built for Suspense from day one.

✅ **Composable state** 
Atoms can depend on other atoms, creating derived state graphs.

✅ **No global store** 
Great for component-level or feature-scoped state.

### When Quo.js Excels

✅ **Centralized state model** 
Quo.js maintains a single source of truth. Easier to reason about for large apps.

✅ **Event-driven architecture** 
Quo.js events create an audit trail. Jotai's atom updates are implicit.

**Example:**
```typescript
// Jotai: Implicit updates
setCount(count + 1); // Where did this come from? Who triggered it?

// Quo.js: Explicit events
emit('counter', 'increment', 1); // Clear intent, traceable
```

✅ **Middleware and effects** 
Quo.js has a central async pipeline. Jotai requires per-atom effect management.

✅ **Global state coordination** 
Quo.js excels when state updates must coordinate across multiple slices (e.g., auth affecting UI state).

### Performance Comparison

| Metric | Jotai | Quo.js |
|--------|-------|--------|
| **Subscription Granularity** | Atom-level (fine by design) | Path-level (fine by design) |
| **Re-render Frequency** | Minimal | Minimal |
| **Bundle Size** | ~3KB | ~15KB |
| **Setup Complexity** | Low | Moderate |
| **Mental Model** | Bottom-up (atoms) | Top-down (events) |

### Verdict

**Choose Jotai if:**
- You prefer distributed, atom-based state
- You're building a Suspense-first app
- You want minimal boilerplate
- State is mostly component-scoped

**Choose Quo.js if:**
- You prefer centralized state
- You need event-driven architecture
- You want middleware/effects for cross-cutting concerns
- State coordination across features is critical

---

## MobX

### Conceptual Model

**MobX** uses reactive programming with observables. State changes automatically trigger updates via proxies.

```typescript
// MobX approach
class TodoStore {
 @observable todos = [];
 
 @action
 addTodo(todo) {
  this.todos.push(todo); // MobX tracks this mutation
 }
 
 @computed
 get completedCount() {
  return this.todos.filter(t => t.completed).length;
 }
}

// Usage
const store = new TodoStore();
const App = observer(() => {
 return <div>{store.completedCount}</div>; // Auto-updates
});
```

**Architecture:**
- Observable state (proxies)
- Automatic dependency tracking
- Mutable updates (tracked via proxies)
- Class-based or functional
- Fine-grained by default

### When MobX Excels

✅ **Implicit reactivity** 
MobX automatically tracks dependencies. No manual subscriptions.

✅ **Mutable-style updates** 
Feels like plain JavaScript. No need for immutable patterns.

✅ **Fine-grained by default** 
Components only re-render when their specific observables change.

✅ **OOP-friendly** 
Natural fit for class-based architectures.

### When Quo.js Excels

✅ **Explicit event flow** 
Quo.js events are traceable. MobX's reactivity is "magic" (harder to debug).

✅ **Immutability guarantees** 
Quo.js enforces immutable updates. MobX allows mutation (error-prone).

✅ **Time-travel debugging** 
Quo.js events create a replay-able history. MobX mutations are harder to track.

✅ **Async pipeline** 
Quo.js has a structured async flow. MobX requires manual `runInAction` management.

**Example:**
```typescript
// MobX: Manual async handling
class Store {
 @observable loading = false;
 @observable data = null;
 
 @action
 async fetchData() {
  this.loading = true; // Must wrap in action
  const res = await fetch('/api/data');
  runInAction(() => { // Must wrap async continuation
   this.data = await res.json();
   this.loading = false;
  });
 }
}

// Quo.js: Built-in async pipeline
const middleware = async (state, event, emit) => {
 if (event.type === 'fetchData') {
  await emit('data', 'loading', true);
  const res = await fetch('/api/data');
  const data = await res.json();
  await emit('data', 'loaded', data);
  return false;
 }
 return true;
};
```

### Performance Comparison

| Metric | MobX | Quo.js |
|--------|------|--------|
| **Subscription Granularity** | Observable-level (fine) | Path-level (fine) |
| **Re-render Frequency** | Minimal | Minimal |
| **Bundle Size** | ~16KB | ~15KB |
| **Learning Curve** | Moderate (reactivity model) | Moderate (event model) |
| **Debugging** | Harder (implicit) | Easier (explicit events) |

### Verdict

**Choose MobX if:**
- You prefer reactive programming
- You like mutable-style updates
- You're building an OOP-heavy app
- You want minimal boilerplate

**Choose Quo.js if:**
- You prefer explicit event flow
- You want immutability guarantees
- You need time-travel debugging
- You want structured async patterns

---

## XState

### Conceptual Model

**XState** models state as finite state machines (FSMs). State transitions are explicit and governed by machine definitions.

```typescript
// XState approach
const todoMachine = createMachine({
 id: 'todo',
 initial: 'idle',
 states: {
  idle: {
   on: {
    FETCH: 'loading'
   }
  },
  loading: {
   invoke: {
    src: 'fetchTodos',
    onDone: {
     target: 'success',
     actions: 'assignTodos'
    },
    onError: 'failure'
   }
  },
  success: { /* ... */ },
  failure: { /* ... */ }
 }
});

const [state, send] = useMachine(todoMachine);
```

**Architecture:**
- State machines
- Explicit state transitions
- Actor model (mailboxes for messages)
- Visual diagrams
- Complex async orchestration

### When XState Excels

✅ **Complex state machines** 
XState excels when state transitions are numerous and conditional (e.g., checkout flows, multi-step forms).

✅ **Visual modeling** 
XState machines can be visualized as diagrams, making them excellent documentation.

✅ **Impossible states prevention** 
XState makes invalid state transitions impossible by design.

✅ **Actor model** 
Great for coordinating multiple concurrent processes.

### When Quo.js Excels

✅ **Simpler mental model** 
Quo.js's event-driven approach is easier to understand for typical apps. XState's FSMs have a steep learning curve.

✅ **General-purpose state** 
Quo.js is better for CRUD apps where state isn't strictly a "machine." XState is overkill for simple data management.

✅ **Less boilerplate** 
XState machines are verbose. Quo.js events and reducers are more concise.

**Example:**
```typescript
// XState: Verbose machine definition
const machine = createMachine({
 id: 'counter',
 initial: 'active',
 context: { count: 0 },
 states: {
  active: {
   on: {
    INCREMENT: {
     actions: assign({ count: (ctx) => ctx.count + 1 })
    },
    DECREMENT: {
     actions: assign({ count: (ctx) => ctx.count - 1 })
    }
   }
  }
 }
});

// Quo.js: Concise reducer
const counterReducer = (state, event) => {
 switch (event.type) {
  case 'increment':
   return { count: state.count + 1 };
  case 'decrement':
   return { count: state.count - 1 };
  default:
   return state;
 }
};
```

### Performance Comparison

| Metric | XState | Quo.js |
|--------|--------|--------|
| **Use Case Fit** | Complex workflows | General state management |
| **Bundle Size** | ~30KB | ~15KB |
| **Learning Curve** | Steep (FSM concepts) | Moderate (event model) |
| **Boilerplate** | High (machine definitions) | Low (reducers) |
| **Visualization** | Excellent (diagrams) | None (events only) |

### Verdict

**Choose XState if:**
- You're modeling complex workflows (checkout, wizards, games)
- You need visual state diagrams
- You want to eliminate impossible states
- You're comfortable with state machine concepts

**Choose Quo.js if:**
- You're building typical CRUD apps
- You want a simpler mental model
- You need general-purpose state management
- You want less boilerplate

---

## Summary Table

| Feature | Redux Toolkit | Zustand | Jotai | MobX | XState | Quo.js |
|---------|---------------|---------|-------|------|--------|--------|
| **Architecture** | Centralized | Centralized | Distributed | Observable | FSM | Centralized + Events |
| **Async Support** | Thunks/RTK Query | Manual | Manual | `runInAction` | Built-in | Built-in |
| **Subscriptions** | Slice-level | Selector-level | Atom-level | Observable-level | State-level | Path-level |
| **Bundle Size** | ~45KB | ~1KB | ~3KB | ~16KB | ~30KB | ~15KB |
| **Learning Curve** | Moderate | Low | Low-Moderate | Moderate | Steep | Moderate |
| **Boilerplate** | Medium | Minimal | Minimal | Minimal | High | Low-Medium |
| **DevTools** | Excellent | Good | Good | Good | Excellent | Good |
| **TypeScript** | Excellent | Good | Excellent | Good | Excellent | Excellent |
| **Immutability** | Enforced (Immer) | Manual | Enforced | Optional (proxies) | Enforced | Enforced |
| **Event Ordering** | Sync | None | None | None | Explicit | FIFO Queue |
| **Node.js Support** | Yes | No | No | Yes | Yes | Yes |

---

## Decision Matrix

### Choose Quo.js if you need:

✅ **Fine-grained performance** without manual optimization 
✅ **Native async support** without external libraries 
✅ **Event-driven architecture** with ordering guarantees 
✅ **Universal runtime** (web + Node.js + Deno + Bun) 
✅ **Explicit, traceable events** for debugging 
✅ **Channel-based organization** for large apps 

### Choose Redux Toolkit if you need:

✅ Mature ecosystem with extensive tooling 
✅ RTK Query for data fetching 
✅ Team familiarity with Redux patterns 
✅ Time-travel debugging with Redux DevTools 

### Choose Zustand if you need:

✅ Minimal bundle size (<5KB total) 
✅ Simple API with zero boilerplate 
✅ Gradual adoption in existing apps 

### Choose Jotai if you need:

✅ Atom-based, distributed state 
✅ Suspense-first architecture 
✅ Bottom-up state composition 

### Choose MobX if you need:

✅ Reactive programming model 
✅ Mutable-style updates 
✅ Class-based architecture 

### Choose XState if you need:

✅ Finite state machines 
✅ Complex workflow modeling 
✅ Visual state diagrams 

---

## Conclusion

Quo.js occupies a unique position in the state management landscape:

- **More structured than Zustand** (events + channels vs. direct updates)
- **More performant than Redux** (atomic subscriptions by default)
- **More explicit than Jotai** (centralized store vs. distributed atoms)
- **More debuggable than MobX** (explicit events vs. implicit reactivity)
- **More approachable than XState** (general-purpose vs. state machines)

If you value **explicit event flow**, **fine-grained performance**, **native async support**, and **universal runtime compatibility**, Quo.js is worth evaluating.

---

**Further Reading:**
- [Event Queue Architecture](./event-queue-architecture.md) - Technical deep-dive into Quo.js's async queue
- [Quick Start Guide](https://quojs.dev) - Get started in 5 minutes
- [API Reference](https://github.com/quojs/quojs/blob/main/packages/core/docs/README.md) - Full TypeDoc documentation

---

**Revision History**

| Version | Date | Changes |
|---------|------|---------|
| 0.5.0 | 2026-01 | Initial comprehensive comparison |

---

**License:** MIT 
**Repository:** https://github.com/quojs/quo 
**Website:** https://quojs.dev