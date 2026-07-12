![Yoltra logo](../../../assets/yoltra-logo.png)

# State Management: Architectural Comparison

> [ 🇲🇽 Versión en Español](https://github.com/yoltra/yoltra/blob/main/docs/es/design/state-management-library-comparison.md)&nbsp; | &nbsp; 👉 🇺🇸 English Version

**Version:** 0.8.0
**Last Updated:** July 2026

## Introduction

State management libraries make different **architectural bets**. Those bets determine which problems each library solves most naturally and where it creates friction. This document examines those architectural differences honestly — not to declare a winner, but to help you choose the right tool for your specific problem.

Each section describes a library's core model, explains the class of applications where that model excels, and highlights how it differs from Yoltra's approach.

---

## Yoltra in Brief

Yoltra is built on four architectural bets:

1. **Path-level subscriptions** — Components subscribe to dotted paths (`"items.0.title"`, `"items.*.done"`), via a typed accessor or a string, and re-render only when that exact path changes.
2. **Event sourcing with a structured pipeline** — Events flow through a formal, hookable pipeline: middleware (can reject) → reducers → event subscribers → coarse listeners, all **synchronous**, then async effects. Content dedup is opt-in.
3. **Channel-typed events** — Events are `(channel, type, payload)` tuples instead of flat action strings.
4. **Introspection-first devtools** — The store exposes a typed instrumentation seam, so time-travel, event replay, and precise per-event patches are first-class rather than bolted on.

```typescript
// Path subscription: re-renders only when items.0.title changes
const title = useAtomicProp({ reducer: 'todos', property: 'items.0.title' });

// Channel-typed event
await emit('todos', 'toggle', { id: '123' });
```

**Where this architecture shines:** Applications with many independently-updating UI elements (dashboards, collaborative editors, data grids, particle systems), applications that need event authorization/validation at the middleware layer, and any app where debuggability of state changes matters (an event log with time-travel comes for free).

**Where it creates friction:** Simple apps where path-level granularity is unnecessary overhead, or where bundle size must be minimal. Projects where the team prefers mutable-style updates or distributed atom-based state.

---

## Redux Toolkit

### Architecture

Redux Toolkit (RTK) is built on **unidirectional data flow with synchronous, pure reducers**. State lives in a single store. Updates happen through dispatched actions that are processed by slice reducers. Immer provides ergonomic immutable updates. Async logic is handled by thunks or RTK Query.

```typescript
const todosSlice = createSlice({
  name: 'todos',
  initialState: { items: [] },
  reducers: {
    addTodo: (state, action) => {
      state.items.push(action.payload); // Immer-powered mutation syntax
    },
  },
});

dispatch(addTodo({ id: '1', title: 'Buy milk' }));
```

### Where Redux Toolkit excels

**Large teams with established patterns.** Redux is the most battle-tested state management solution in React. Its strict conventions (actions, reducers, selectors) create consistency across large codebases. RTK Query provides a complete data-fetching solution with automatic caching and refetching. The DevTools ecosystem is unmatched.

**Apps that need extensive middleware.** Redux's middleware model is mature and has thousands of community solutions for logging, analytics, persistence, and error tracking.

### Architectural differences from Yoltra

**Subscription granularity.** Redux subscriptions operate at the store level — `useSelector` runs on every dispatch and relies on reference equality to bail out. Yoltra subscriptions operate at the path level and only fire when the subscribed path actually changes.

```typescript
// Redux: selector runs on EVERY dispatch, bails out via equality check
const title = useSelector(state => state.todos.items[0]?.title);

// Yoltra: subscription only fires when items.0.title changes
const title = useAtomicProp({
  reducer: 'todos',
  property: 'items.0.title',
});
```

This difference matters most in UIs with many independently-updating elements. In a list of 100 items, a Redux `useSelector` in each row runs 100 times on every dispatch. A Yoltra `useAtomicProp` in each row fires only for the specific row that changed.

**Event model.** Redux actions are flat strings (`"todos/addTodo"`). Yoltra events are channel-typed tuples (`('todos', 'add', payload)`). Both approaches work; channels provide natural namespacing at scale, while flat strings integrate better with Redux DevTools and middleware ecosystem.

**Sync vs. async layers.** Both keep reducers synchronous. Redux puts async work in thunks / RTK Query. Yoltra keeps **middleware synchronous too** — so `getState()` is correct the instant `emit()` returns — and puts async work in effects: a comparable split, built into the core pipeline.

**DevTools.** Redux's devtools are the most mature in the ecosystem and a major reason teams stay. Yoltra closes most of that gap from a different angle: because the store reports the exact changed leaf paths per event, its devtools render precise RFC-6902 patches, real reduce timing, an event log with committed/rejected phases, and time-travel + event replay — while keeping the fine-grained reactivity and one-call setup Redux lacks.

---

## Zustand

### Architecture

Zustand is built on **direct state mutation via a `set()` function**. State and actions coexist in a single `create()` call. There are no actions, no reducers, no middleware — just functions that call `set()`. Subscriptions use selector functions.

```typescript
const useStore = create((set) => ({
  todos: [],
  addTodo: (todo) => set((state) => ({
    todos: [...state.todos, todo],
  })),
}));

const todos = useStore(state => state.todos);
```

### Where Zustand excels

**Small-to-medium apps that value simplicity.** Zustand has the lowest ceremony of any state library. It weighs approximately 1KB. There's almost no learning curve — if you understand `useState`, you understand Zustand. It's ideal for adding shared state to an app without architectural commitment.

**Gradual adoption.** Zustand doesn't require providers, context, or restructuring. You can add it to any component tree incrementally.

### Architectural differences from Yoltra

**Explicitness vs. minimalism.** Zustand optimizes for the least code to get state working. Yoltra optimizes for explicit, traceable state transitions via events. These are fundamentally different values — Zustand trusts developers to keep things simple; Yoltra provides structure that scales.

```typescript
// Zustand: direct update — minimal but implicit
set((state) => ({ count: state.count + 1 }));

// Yoltra: named event — more ceremony but traceable
await emit('counter', 'increment', 1);
```

**Subscription model.** Zustand selectors are functions that run on every `set()` call. Optimizing for fine-grained updates requires manual equality functions. Yoltra path subscriptions are fine-grained by default.

```typescript
// Zustand: needs custom equality to avoid unnecessary re-renders
const title = useStore(
  state => state.todos[0]?.title,
  (a, b) => a === b,
);

// Yoltra: fine-grained by default
const title = useAtomicProp({
  reducer: 'todos',
  property: 'items.0.title',
});
```

**Event ordering.** Zustand's `set()` calls are immediate and synchronous. Multiple `set()` calls from different async operations can interleave unpredictably. Yoltra's FIFO event queue guarantees strict ordering — events always process in the order they were emitted.

**Bundle size.** Zustand is approximately 1KB. Yoltra (`@yoltra/core` + `@yoltra/react`) is approximately 15KB. If bundle size is the primary constraint, Zustand wins clearly.

---

## Jotai

### Architecture

Jotai uses **distributed, atom-based state**. Instead of a central store, state is spread across independent atoms. Atoms can derive from other atoms, forming a dependency graph. Components subscribe to specific atoms and re-render only when those atoms change.

```typescript
const countAtom = atom(0);
const todosAtom = atom([]);
const completedCountAtom = atom(
  (get) => get(todosAtom).filter(t => t.completed).length,
);

const [count, setCount] = useAtom(countAtom);
```

### Where Jotai excels

**Fine-grained, component-scoped state.** Jotai's atom model is inherently granular. Each atom is an independent unit of state, and components only re-render when their specific atoms change. This makes Jotai excellent for UIs where state is naturally distributed (form fields, toggles, independent widgets).

**Suspense-first architecture.** Jotai was designed for React Suspense from the start. Async atoms integrate naturally with `<Suspense>` boundaries.

**Composable derived state.** Atoms that derive from other atoms create a reactive graph. This is powerful for applications where computed values depend on multiple independent state sources.

### Architectural differences from Yoltra

**Centralized vs. distributed.** Yoltra maintains a single state tree that you subscribe to at specific paths. Jotai distributes state across independent atoms. Both achieve fine-grained reactivity, but through opposite architectures.

The centralized approach (Yoltra) makes it easier to reason about global state, coordinate cross-cutting updates, and serialize/restore entire app state. The distributed approach (Jotai) makes it easier to create self-contained, reusable state units and avoids the need for a provider in simple cases.

```typescript
// Jotai: state is distributed across atoms
const titleAtom = atom('');
const doneAtom = atom(false);

// Yoltra: state lives in a tree, subscribed by path
const title = useAtomicProp({ reducer: 'todos', property: 'items.0.title' });
const done = useAtomicProp({ reducer: 'todos', property: 'items.0.done' });
```

**Event traceability.** Jotai atom updates are implicit — you call `setCount(count + 1)` and state changes. There's no event log, no middleware interception point, no audit trail. Yoltra events are explicit and traceable through the entire pipeline. This matters when you need authorization checks, undo/redo, or analytics on state transitions.

**Middleware and cross-cutting concerns.** Jotai handles cross-cutting concerns (logging, persistence, validation) via atom middleware or wrapper atoms — per-atom configuration. Yoltra handles them centrally via the event pipeline — one middleware function can intercept all events.

---

## MobX

### Architecture

MobX uses **observable state with automatic dependency tracking**. State is wrapped in proxies that track which properties each component reads. When an observable property changes, only the components that read it re-render. Updates are mutable-style — you modify state directly, and MobX tracks the mutation.

```typescript
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

const App = observer(() => {
  return <div>{store.completedCount}</div>; // Auto-updates
});
```

### Where MobX excels

**Implicit reactivity with minimal boilerplate.** MobX automatically tracks which properties a component reads and re-renders only when those properties change. You don't write selectors, subscriptions, or equality comparisons — it just works. This is powerful for developers who want fine-grained reactivity without thinking about it.

**OOP-friendly applications.** MobX's class-based stores with decorators fit naturally into object-oriented architectures. If your team thinks in classes, computed properties, and encapsulated state, MobX feels native.

**Mutable-style updates.** MobX lets you write `this.todos.push(todo)` instead of `{ ...state, todos: [...state.todos, todo] }`. For complex nested updates, this is significantly more readable.

### Architectural differences from Yoltra

**Implicit vs. explicit.** MobX tracks dependencies automatically via proxies — components re-render "magically" when observables they read change. Yoltra requires explicit path subscriptions — you declare what you're watching. MobX is easier to use; Yoltra is easier to debug when things go wrong.

**Mutability.** MobX allows (and encourages) direct mutation of state objects. Yoltra enforces immutability — state is deep-frozen in development. Both approaches have tradeoffs: mutation is ergonomic but can cause subtle bugs when references are shared; immutability is safer but requires more ceremony for nested updates.

**Event flow.** MobX has no concept of events or actions as first-class entities (decorating with `@action` is for batching, not for creating an event trail). Yoltra events flow through a formal pipeline with middleware, effects, and committed/uncommitted phases. If you need to intercept, validate, or audit state changes, Yoltra provides the infrastructure; MobX requires building it yourself.

---

## XState

### Architecture

XState models state as **finite state machines and statecharts**. State transitions are explicit and governed by machine definitions. Every possible state and transition is declared upfront. The actor model enables concurrent, isolated state machines that communicate via messages.

```typescript
const todoMachine = createMachine({
  id: 'todo',
  initial: 'idle',
  states: {
    idle: { on: { FETCH: 'loading' } },
    loading: {
      invoke: {
        src: 'fetchTodos',
        onDone: { target: 'success', actions: 'assignTodos' },
        onError: 'failure',
      },
    },
    success: { /* ... */ },
    failure: { /* ... */ },
  },
});
```

### Where XState excels

**Complex, stateful workflows.** XState is purpose-built for processes with many states and conditional transitions — checkout flows, multi-step forms, game logic, protocol implementations. The machine definition guarantees that invalid state transitions are impossible.

**Visual modeling and documentation.** XState machines can be visualized as diagrams, making them excellent living documentation. The Stately visual editor lets non-engineers understand and validate state logic.

**Actor-based concurrency.** XState's actor model is genuine concurrent computation — multiple machines running independently, communicating via messages. This is powerful for applications with independent, parallel processes.

### Architectural differences from Yoltra

**Scope.** XState is designed for **workflow orchestration** — modeling processes that move through distinct phases. Yoltra is designed for **data-driven state management** — managing application state that many UI elements subscribe to. They solve different problems and can coexist in the same application (XState for workflow logic, Yoltra for application state).

**Boilerplate.** XState machine definitions are verbose by design — every state and transition is explicit. This is a feature, not a bug, for workflows where explicitness prevents errors. But for general CRUD state management, this ceremony is overhead.

```typescript
// XState: explicit machine for a counter
const machine = createMachine({
  id: 'counter',
  initial: 'active',
  context: { count: 0 },
  states: {
    active: {
      on: {
        INCREMENT: { actions: assign({ count: (ctx) => ctx.count + 1 }) },
        DECREMENT: { actions: assign({ count: (ctx) => ctx.count - 1 }) },
      },
    },
  },
});

// Yoltra: reducer for a counter
const counterReducer = (state, event) => {
  switch (event.type) {
    case 'increment': return { count: state.count + 1 };
    case 'decrement': return { count: state.count - 1 };
    default: return state;
  }
};
```

**Subscription model.** XState doesn't have path-level subscriptions — you subscribe to the machine's state and select from it. Yoltra's path subscriptions are more granular for UI state management.

---

## Architectural Summary

Each library optimizes for a different dimension:

| Library | Optimizes for | Core tradeoff |
|---------|---------------|---------------|
| **Redux Toolkit** | Ecosystem maturity, team conventions | More boilerplate and setup, coarser subscriptions |
| **Zustand** | Minimal API surface, low ceremony | Less structure for complex async flows |
| **Jotai** | Distributed, composable atoms | Harder to coordinate global state |
| **MobX** | Implicit reactivity, mutable ergonomics | Harder to trace and debug state changes |
| **XState** | Workflow correctness, impossible states | Verbose for general data management |
| **Yoltra** | Fine-grained subscriptions + event log + time-travel devtools | Larger bundle than Zustand; opinionated event model |

There is no universally "best" library. The right choice depends on what your application needs most:

- **Minimal friction and small bundle?** Zustand or Jotai.
- **Team already knows Redux?** Redux Toolkit.
- **Reactive OOP with mutable updates?** MobX.
- **Complex workflow modeling?** XState.
- **Fine-grained reactivity _and_ an event log with real time-travel devtools, without Redux's boilerplate?** Yoltra.

---

## Further Reading

- **[Event Pipeline Architecture](./event-queue-architecture.md)** — How Yoltra's synchronous reduce / async effect pipeline works under the hood
- **[Quick Start Guide](https://github.com/yoltra/yoltra/blob/main/docs/en/QUICK_START_GUIDE.md)** — Five steps to a working app
- **[@yoltra/core API](https://github.com/yoltra/yoltra/blob/main/packages/core/README.md)** — Store, middleware, effects, `When` matchers
- **[@yoltra/react API](https://github.com/yoltra/yoltra/blob/main/packages/react/README.md)** — Hooks with fine-grained subscriptions

---

**License:** MIT
**Repository:** https://github.com/yoltra/yoltra
