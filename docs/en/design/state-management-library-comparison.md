![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# State Management: Architectural Comparison

> [ 🇲🇽 Versión en Español](https://github.com/yoltra/yoltra/blob/main/docs/es/design/state-management-library-comparison.md)&nbsp; | &nbsp; 👉 🇺🇸 English Version

**Applies to:** `@yoltra/core` 0.6.0
**Last Updated:** August 2026

State management libraries make different **architectural bets**, and those bets decide which problems each one solves naturally and where it creates friction. This page compares them honestly, not to declare a winner, but to help you choose the right tool for your problem.

> **Full guide:** [State Management: Architectural Comparison on yoltra.dev](https://yoltra.dev/en/yoltra/docs/design/state-management-comparison/)

## Introduction

Each section below describes a library's core model, the applications where it excels, and how it differs from Yoltra. The full page on yoltra.dev has the code side by side for every library.

## Yoltra in Brief

Yoltra makes four bets: **path-level subscriptions** (components subscribe to dotted paths such as `"items.0.title"` and re-render only when that path changes); **event sourcing with a structured pipeline** (middleware that can reject, then reducers, subscribers and coarse listeners, all synchronous, then async effects; content dedup is opt-in); **channel-typed events** (`(channel, type, payload)` instead of flat action strings); and **introspection-first devtools** (time travel, event replay and precise per-event patches are first-class). It shines with many independently-updating UI elements, middleware-level authorization or validation, and anywhere the debuggability of state changes matters. It creates friction where path-level granularity is unnecessary, where bundle size must be minimal, or where a team prefers mutable updates or atoms.

```typescript
// Path subscription: re-renders only when items.0.title changes
const title = useAtomicProp({ reducer: 'todos', property: 'items.0.title' });

// Channel-typed event
await emit('todos', 'toggle', { id: '123' });
```

## Redux Toolkit

Unidirectional data flow with synchronous, pure slice reducers in a single store, Immer for immutable updates, and thunks or RTK Query for async work. It excels with large teams and established conventions, a mature middleware ecosystem and unmatched DevTools. The main difference is granularity: `useSelector` runs on every dispatch and bails out by equality, while a Yoltra path subscription fires only when its path changes, so in a list of 100 rows only the changed row's hook runs. Both keep reducers synchronous; Yoltra keeps middleware synchronous too and puts async work in effects. Yoltra's devtools render precise RFC-6902 patches, reduce timing, an event log and time travel with replay.

## Zustand

Direct state updates through a `set()` function, with state and actions in one `create()` call and no actions, reducers or middleware. It excels at simplicity (about 1KB, almost no learning curve) and gradual adoption without providers. Zustand optimizes for the least code; Yoltra optimizes for explicit, traceable transitions through named events. Zustand selectors run on every `set()` and need equality functions to be fine-grained, where Yoltra is fine-grained by default and its FIFO queue keeps events in emit order. If bundle size is the primary constraint (Yoltra core and react are about 15KB), Zustand wins clearly.

## Jotai

Distributed, atom-based state: independent atoms that derive from each other in a dependency graph, with components subscribed to specific atoms. It excels at fine-grained, component-scoped state, Suspense-first async atoms and composable derived state. Both are fine-grained, through opposite architectures: Yoltra's single tree makes global coordination and serializing the whole app state easier, while atoms make self-contained, reusable state units easier. Jotai updates are implicit, with no event log or central middleware; Yoltra events are explicit and traceable, and one middleware can intercept them all.

## MobX

Observable state with automatic dependency tracking through proxies and mutable-style updates. It excels at implicit reactivity with minimal boilerplate, OOP-friendly class stores and readable nested mutations. MobX is easier to use; Yoltra, with explicit path subscriptions, is easier to debug. Yoltra enforces immutability (state is deep-frozen in development), and its events flow through a formal pipeline with middleware, effects and committed or uncommitted phases, where MobX's `@action` batches rather than records an event trail.

## XState

Finite state machines and statecharts, with every state and transition declared upfront and an actor model for concurrent machines. It excels at complex workflows (checkouts, multi-step forms, protocols), visual modeling and actor-based concurrency. XState is built for workflow orchestration and Yoltra for data-driven application state, so they can coexist: XState for workflow logic, Yoltra for the state many UI elements subscribe to. Machine definitions are verbose by design, which is overhead for general CRUD state, and XState has no path-level subscriptions.

## Architectural Summary

| Library           | Optimizes for                                                 | Core tradeoff                                       |
| ----------------- | ------------------------------------------------------------- | --------------------------------------------------- |
| **Redux Toolkit** | Ecosystem maturity, team conventions                          | More boilerplate and setup, coarser subscriptions   |
| **Zustand**       | Minimal API surface, low ceremony                             | Less structure for complex async flows              |
| **Jotai**         | Distributed, composable atoms                                 | Harder to coordinate global state                   |
| **MobX**          | Implicit reactivity, mutable ergonomics                       | Harder to trace and debug state changes             |
| **XState**        | Workflow correctness, impossible states                       | Verbose for general data management                 |
| **Yoltra**        | Fine-grained subscriptions + event log + time-travel devtools | Larger bundle than Zustand; opinionated event model |

There is no universally "best" library. Minimal friction and a small bundle: Zustand or Jotai. A team that already knows Redux: Redux Toolkit. Reactive OOP with mutable updates: MobX. Complex workflow modeling: XState. Fine-grained reactivity _and_ an event log with real time-travel devtools, without Redux's boilerplate: Yoltra.

## Further Reading

- **[Event Pipeline Architecture](./event-queue-architecture.md)**: how the synchronous reduce and async effect pipeline works.
- **[Quick Start Guide](../QUICK_START_GUIDE.md)**: five steps to a working app.
- **[@yoltra/core](../../../packages/core/README.md)** and **[@yoltra/react](../../../packages/react/README.md)**: the store and the hooks.

> **Full guide:** [State Management: Architectural Comparison on yoltra.dev](https://yoltra.dev/en/yoltra/docs/design/state-management-comparison/)
