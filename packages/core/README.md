![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# @yoltra/core

> [ 🇲🇽 Versión en Español](./README.es.md)&nbsp;
> | &nbsp; 👉 🇺🇸 English Version

![npm downloads](https://badgen.net/npm/dm/@yoltra/core)
![License](https://badgen.net/npm/license/@yoltra/core)

**Framework-agnostic event-driven state container with fine-grained path subscriptions.**

`@yoltra/core` is the foundation of
[yoltra](../../README.md). It provides the store, event
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
  ├─ 0. Dedup (opt-in) ─── Skip a duplicate only when dedupWindowMs > 0 or a dedupKey is given
  │
  │  ══ SYNCHRONOUS reduce phase — runs before emit() returns ══
  ├─ 1. Middleware ─── Synchronous pre-reducer hooks (return false to reject → "uncommitted" event)
  ├─ 2. Reducers ─── Synchronous state updates, fine-grained path change detection
  ├─ 3. Event subscribers ─── Committed/uncommitted event notifications
  ├─ 4. Coarse subscribers ─── External store listeners (useSyncExternalStore, etc.), if state changed
  │
  └─ 5. Effects ─── ASYNC side-effects, one independent task per event (keyed for O(1) lookup)
```

The reduce phase (1–4) is **synchronous**, so `getState()` is correct the instant `emit()` returns
— even with middleware. Effects (5) run afterward as an independent async task; the promise from
`emit()` resolves when that event's effects finish. Every stage is hook-able, and
`store.instrument()` exposes the whole flow — changed leaf paths, reduce timing, committed/rejected
phase — to the DevTools with no `as any`. See the
[Event Pipeline Architecture](../../docs/en/design/event-queue-architecture.md) for the full model.

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

### Slices that hold a single value

A slice does not have to be an object. A primitive, a `Map`, a `Set` or a `Date` is a valid
slice state, and it commits like any other:

```typescript
const store = createStore({
  name: "session",
  reducer: {
    token: {
      state: null as string | null,
      when: { keys: [["auth", "login"]] },
      reducer: (_state, event) => event.payload.token,
    },
  },
});

await store.emit("auth", "login", { token: "abc123" });
store.getState().token; // "abc123"
```

Such a slice has no property beneath it, so its changes are reported at the **slice root** —
the empty path. Subscribe to it with `property: ""`:

```typescript
store.connect({ reducer: "token", property: "" }, (change) =>
  console.log("token:", change.oldValue, " --> ", change.newValue),
);
```

The types know the difference. `property` on a root-value slice accepts `""` and nothing else —
there is no key to address — and the value comes back correctly typed:

```typescript
const token = useAtomicProp({ reducer: "token", property: "" }); // string | null
```

### `""` versus `"**"` — watching a whole slice

Two subscriptions sound alike and are not:

| Pattern | Fires when |
|---|---|
| `""` | the slice's **whole value** is replaced — a primitive changes, a `Map` is rebuilt, an object slice becomes `null` |
| `"**"` | **anything** in the slice changes, at any depth. Matches the root too, since `**` matches zero segments |
| `"*"` | one level down, exactly. Never matches the root |

**`"**"` is the whole-slice subscription, and it works for every slice regardless of shape.**
Reach for `""` only when you mean the root value itself; on an object slice it stays quiet,
because such a slice reports its changes at their leaves.

`Map` and `Set` are compared by reference, not by entry: a reducer returning a new `Map` is a
change, mutating one in place is not. That follows from the immutability contract rather than
being a special case — build a new collection instead of mutating the stored one. It is also why
they have no paths beneath them: `"byId"` is subscribable, `"byId.get"` is not, and the types
say so.

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

Middleware runs **synchronously, before** reducers and can cancel event propagation (return
`false` to reject → "uncommitted" event). Async work belongs in effects, not middleware. Supports
both raw functions (legacy) and `MiddlewareSpec` objects with targeting:

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

// Global middleware — runs for all events (synchronous: return a boolean, never a Promise)
const logger = (state, event) => {
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
const off = store.registerMiddleware((state, event) => {
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

## Event Deduplication (opt-in)

Deduplication is **off by default** — Yoltra never silently drops legitimate rapid-fire identical
events (double-clicks, repeated `+1`). Opt in only when you actually want coalescing:

```typescript
// Content-based: coalesce identical (channel, type, payload) within a window.
const store = createStore({
  name: "Yoltra_Rocks",
  reducer: {
    /* ... */
  },
  dedupWindowMs: 100, // default: 0 (disabled)
});

// Identity-based: dedupe by an explicit key — e.g. a React Strict Mode double-invoke in an effect.
await store.emit("analytics", "pageView", { page }, { dedupKey: `pageView:${page}` });
```

---

## Cascade protection (on by default)

Two consumers wired into each other — a subscriber that emits what its own reducer answers, or
two slices that answer each other's events — produce an event chain with no end. The reduce queue
drains **synchronously**, so that is not a slow program: it is a frozen tab, or a pinned core,
with no error and no stack to point at.

Every event therefore carries its causal position, and the store refuses to extend a chain past a
ceiling:

```typescript
const store = createStore({
  name: "app",
  reducer: { ... },

  // Defaults to 64. Bounded whether or not you configure it — a failure mode this bad
  // should not require configuration to avoid. Set Infinity to opt out and own it.
  maxReduceDepth: 64,

  onCascade: ({ event, depth, chain }) => {
    report(`cascade at ${event.channel}/${event.type}, depth ${depth}`, chain);
  },
});
```

An event emitted while another is being handled is one deeper than its cause, and carries
`parentId` and `depth` so the cycle is legible after the fact:

```typescript
store.onEvent("plan", "patch", (event) => {
  event.depth;     // 0 for an event emitted by application code
  event.parentId;  // undefined at depth 0; the causing event's id below it
});
```

Both fields are **absent** on a root event rather than present as `0`/`undefined`, so events your
application emits stay byte-identical to before this existed.

Breaching does not throw. The offending emit is refused, everything already committed stands, and
`onCascade` (plus a console error) names it — a throw would surface in whichever subscriber or
effect happened to be emitting, which is the same unattributable failure the ceiling exists to
prevent.

**A wide burst is not a cascade.** One event whose subscriber fans out to five hundred siblings
is a legitimate shape; depth is what separates it from a cycle, and a plain loop of `store.emit`
never accumulates depth at all — each call drains to completion before the next, so every one is
a root. `maxTransitionsPerDrain` bounds burst *width* and is off by default for that reason; the
event that starts a drain is never refused by it.

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

### State is synchronous; `await` only for effects

The reduce phase is synchronous, so state reflects your event the moment `emit()` returns — no
`await` needed to read it back. Await `emit()` when you also want _this event's_ effects to have
finished:

```typescript
emit("todo", "add", todo);
store.getState(); // Already reflects the new todo — no await required

await emit("todo", "save", todo); // resolves once save's effects complete
```

### Keep reducers fast

Reducers are synchronous and run in the same tick as `emit()`. Move expensive work to effects:

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

## Saving and restoring state

Two functions, because the halves happen on opposite sides of the store's existence.
`hydrate` produces *initial slice state*, so the store is born with it:

```ts
import { createStore, createWebStorageAdapter, hydrate, persist, withHydration } from '@yoltra/core';

const adapter = createWebStorageAdapter(localStorage);
const hydration = await hydrate({ key: 'app', adapter, version: 3 });

const store = createStore({
  name: 'App',
  reducer: withHydration({ todos: todosSpec, ui: uiSpec }, hydration),
});

const stop = persist(store, { key: 'app', adapter, version: 3, slices: ['todos'] });
```

Restoring *after* construction is the obvious alternative and the wrong one: applying a
snapshot to a live store emits a change across every path, which on boot is a flash, a burst
of instrumentation entries describing changes nobody made, and effects observing a transition
that never happened.

**Nothing throws on boot.** A missing, unparseable or unmigratable payload falls back to your
declared defaults and reports through `onError`. A store that will not start because storage
holds stale JSON is worse than one that starts fresh — and a full disk should not take down a
page, so write failures are reported the same way rather than raised.

**Version mismatches are refused, not trusted.** Reducers change, and a snapshot written
against an older shape may not be valid state for this build at all. Supply `migrate` to
upgrade it, or it is discarded.

Writes are driven by instrumentation, so a change confined to a slice you are not persisting
costs nothing, and a burst is coalesced into one write. `Map`, `Set`, `Date`, `BigInt`,
`undefined` and circular references all survive the round trip: `JSON.stringify` does not fail
on those, it silently destroys them.

For a server render, `dehydrate(store, { version })` produces the payload and
`hydrate({ source, version })` consumes it.

## Lists that reorder

Path notification is positional for arrays. `items.0.title` names a *slot*, not a thing, so
`unshift`, `splice(0, 1)` and `sort` move nearly every element into a different slot — and the
diff correctly reports that nearly every leaf changed. Inserting one row at the front of a
thousand wakes a thousand subscribers.

That is honest rather than noisy: with positional paths the value at almost every index really
did change. The remedy is the shape of the state, not a diff that stays quiet.

```ts
import { createEntityAdapter } from '@yoltra/core';

const todos = createEntityAdapter<Todo>();

// state is { ids: [...], entities: { abc: {...} } }
todos.updateOne(state, { id: 'abc', changes: { done: true } });

// and the adapter hands out the paths, so they are never typed by hand
todos.pathTo('abc', 'title');  // "entities.abc.title"
todos.idsPath;                 // "ids"
```

`entities.abc.title` survives insert, remove and reorder. A list container subscribes to `ids`
and reorders its children; rows subscribe to their own entity and stay asleep through a sort.

`ids` is still an array, so a reorder still reports `ids.0`, `ids.1` and so on — that cost is
confined, not removed. What you get is cost proportional to what actually changed.

For a small list that only ever grows at the end, `items.0.title` is fine and simpler. The
adapter is for collections that reorder, or that are large enough for the difference to show.

### What it costs, measured

At 1000 rows, diffing after an insert at the front costs 1200 µs for an array and 371 µs
normalised, and the array reports roughly a thousand changed paths against two. That is the
case the adapter is for.

A single-field update runs the other way: 20 µs for the array against 470 µs normalised.
`detectChangedProps` indexes an array but enumerates an object's keys — building two key
arrays and a `Set` per comparison — so a wide entity map is more expensive to walk even when
almost nothing in it moved. The numbers are in `benchmarks/`, and closing that gap is tracked
work rather than a property of normalising as such.

So: normalise collections that reorder or churn. A large collection that only ever has
individual fields edited is better off as an array today.

## Performance

| Metric             | Value                                     |
| ------------------ | ----------------------------------------- |
| **Bundle size**    | 6.7 KB for the store (minified + gzipped) |
| **Tree-shakeable** | Yes (ES modules)                          |
| **Dependencies**   | Zero                                      |
| **TypeScript**     | Full type definitions included            |

Bundle size is checked, not asserted: `rush size` bundles the package the way a consumer
would — tree-shaken, minified, gzipped — and fails when it exceeds the budget declared in
`package.json`.

The number that matters is what you import, not what the package exports:

| Import                              | Size   |
| ----------------------------------- | ------ |
| `{ createStore }`                   | 6.7 KB |
| `{ createStore, hydrate, persist }` | 8.2 KB |
| everything                          | 9.5 KB |

Persistence and the entity adapter cost nothing to anyone who does not import them — the
first row has not moved as either was added, which is the tree-shaking claim being checked
rather than repeated. The last row is a growth tripwire; `import * as all` is not something
anybody writes.

---

## Documentation

- **[yoltra Root README](../../README.md)** — Overview and
  quick start
- **[@yoltra/react](../react/README.md)** —
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
  CRUD with performance profiling · [▶ Open the live demo](https://yoltra.dev/en/demos/in-react)
- **[Kinetic Logo](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-kinetic-logo)**
  — 3000 circles with physics simulation · [▶ Open the live demo](https://yoltra.dev/en/demos/kinetic-logo)
- **[Next.js Integration](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-in-nextjs)**
  — Pages Router, client-side state + theme switcher · [▶ Open the live demo](https://yoltra.dev/en/demos/in-nextjs)

---

## Contributing

- [Monorepo Root](../../README.md)
- [Contributing Guide](https://github.com/yoltra/yoltra/blob/main/CONTRIBUTING.md)

---

## Status

**Release Candidate** — APIs are stable, used in production, minor changes possible before v1.0.

---

## License

**MIT** — Free to use in commercial and open-source projects.
