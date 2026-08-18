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
  ├─ 2. Reducers ─── Every matching slice staged, then all committed under one root
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

// Written events — state actually changed. Fires after the commit, so getState() is current.
store.onEvent(
  "plan",
  "patch",
  (event, getState) => {
    console.log("applied:", getState().plan);
  },
  "written",
);

// All events — both committed and uncommitted (not written; see below)
store.onEvent(
  "ui",
  "action",
  (event, getState, emit, phase) => {
    console.log(`Action ${phase}:`, event.type);
  },
  "all",
);
```

`committed` means **not vetoed**, and always has: it fires for every event middleware let through,
whether or not a reducer wrote anything — including every event in a store with no reducers at
all. `written` is the stricter fact, added rather than substituted, so toasts and analytics keep
working unchanged. `all` stays `committed | uncommitted`; folding `written` in would hand existing
subscribers a second notification per event.

---

## Commits are atomic across slices

An event that touches several slices writes all of them, then notifies. Nothing observes a
half-applied event — a subscriber to one slice reading `getState()` sees every other slice of the
same event already applied.

That matters most where a change is used as a signal to re-read, which is what the React hooks do.

---

## Refusing a write

A reducer returns `Rejected(reason)` instead of state to decline. **The whole event is rejected**:
no slice writes, no change notification fires, and the caller is told why.

```typescript
import { createStore, Rejected } from "@yoltra/core";

const store = createStore({
  name: "plan",
  reducer: {
    plan: {
      state: { steps: [], version: 1 },
      when: { keys: [["plan", "patch"]] },
      reducer: (state, event) =>
        event.payload.expectedVersion === state.version
          ? { ...state, steps: event.payload.steps, version: state.version + 1 }
          : Rejected(`stale write: expected v${event.payload.expectedVersion}, have v${state.version}`),
    },
  },
  onRejected: (rejection, event, slice) => metrics.increment("write.refused", { slice }),
});

const result = await store.emit("plan", "patch", { steps, expectedVersion: 1 });

result.committed; // true — middleware allowed it
result.written; // false — but nothing was written
result.rejected?.reason; // "stale write: expected v1, have v3"
```

Refusing is **not** the same as returning the state unchanged, which is indistinguishable from
"this event did not concern me". It is also not the same as throwing: a reducer that throws has a
bug, so its slice is isolated and every other slice still commits, while a reducer that refuses
has made a decision and the whole event yields to it.

`emit` resolves to an `EmitResult` once effects have run:

| | |
|---|---|
| `committed` | middleware did not veto |
| `written` | a reducer actually changed state |
| `rejected` | present when a reducer refused, carrying `reason` |

---

## Request and reply — `store.call()`

Every event-bus consumer eventually writes request/reply by hand: mint an id, subscribe, match,
time out, unsubscribe. It is about eighty lines and it has the same two bugs every time — the
subscription outlives the call, and a responder that forgets to echo the id produces a timeout
with nothing to point at.

```typescript
const res = await store.call("rpc", "ask", { q: "who?" }, { reply: ["rpc", "answer"] });
res.payload.text;
```

The responder does nothing special. It replies through the `emit` it was handed, and the store's
causal stamp correlates the two — **there is no id to mint, echo, or forget**:

```typescript
store.registerEffect({
  when: { keys: [["rpc", "ask"]] },
  effect: async (event, _get, emit) => {
    await emit("rpc", "answer", await lookup(event.payload.q));
  },
});
```

### A call resolves to the event, not the payload

Because a caller often cannot know *which* reply it will get. `reply` names the **terminal**
types, and the event carries the discriminant:

```typescript
const res = await store.call("rpc", "ask", { q }, { reply: ["rpc", ["answer", "error"]] });

switch (res.type) {
  case "answer": return res.payload.text;
  case "error": throw new Error(res.payload.reason);
}
```

### Progress streams, and the producer waits

Any correlated event that is **not** terminal is progress. Iterate the call to consume it:

```typescript
const call = store.call("job", "start", { id }, {
  reply: ["job", "done"],
  highWaterMark: 4,
});

for await (const step of call) await render(step.payload);
const { payload } = await call;
```

The backpressure is real, not a buffer with a limit. `emit` resolves only once its effects have
run, and the collector is an effect that does not return until the consumer has taken the item —
so a responder writing `await emit("job", "tick", chunk)` is **paced by the reader**:

```typescript
effect: async (_event, _get, emit) => {
  for (const chunk of chunks) {
    await emit("job", "tick", chunk); // waits here while the consumer is behind
  }
  await emit("job", "done", { ok: true });
}
```

Backpressure engages **once you begin iterating**. A call that is only awaited never pulls, so
blocking its producer would deadlock the call itself — progress nobody reads would stop the
terminal event from ever being sent. Un-iterated progress therefore buffers to `highWaterMark`
and is then counted on `call.dropped` rather than blocking.

### Giving up

| | |
|---|---|
| `timeoutMs` | **Idle**, not total — every correlated event resets it, progress included. A job that streams for two minutes will not fail a thirty-second call. Default 30s. |
| `signal` | An `AbortSignal`, for a real deadline or a cancelled action. |
| `call.cancel(reason)` | Stops listening and settles. Safe to call twice. |

However a call ends — resolved, timed out, aborted — the subscription is removed and any producer
parked on backpressure is released. A wedged responder is worse than the unbounded buffer this
replaced.

## Reading a value as you subscribe

`connect` starts at "from now on", so a subscriber's first read had to repeat the path elsewhere —
the same path in two places, free to drift:

```typescript
store.connect({ reducer: "todos", property: "items.0.title" }, render, { immediate: true });
```

The synthetic first change has `oldValue: undefined` and **no provenance**, because no event
caused it. For a wildcard pattern, which has no single current value, the slice root is delivered
with `path: ""`.

React does not need this: `useSyncExternalStore` already reads a snapshot on mount.

---

## Where a change came from

A `Change` names the event that caused it, so a subscriber no longer has to mirror the cause into
state and keep it in two places:

```typescript
store.connect({ reducer: "orders", property: "status" }, (change) => {
  audit.record(change.path, change.newValue, {
    causedBy: change.eventId,
    via: `${change.channel}/${change.type}`,
  });
});
```

Provenance is **absent** when no event caused the change — a DevTools time-travel jump, or the
`immediate` delivery above. Absence is the signal, rather than a fabricated id.

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
| **Bundle size**    | 9.2 KB for the store (minified + gzipped) |
| **Tree-shakeable** | Yes (ES modules)                          |
| **Dependencies**   | Zero                                      |
| **TypeScript**     | Full type definitions included            |

Bundle size is checked, not asserted: `rush size` bundles the package the way a consumer
would — tree-shaken, minified, gzipped — and fails when it exceeds the budget declared in
`package.json`.

The number that matters is what you import, not what the package exports:

| Import                              | Size    | Budget |
| ----------------------------------- | ------- | ------ |
| `{ createStore }`                   | 9.2 KB  | 14 KB  |
| `{ createStore, hydrate, persist }` | 10.7 KB | 16 KB  |
| everything                          | 12.1 KB | 18 KB  |

The **gap between rows** is the tree-shaking claim, and it is what to watch: persistence adds
1.5 KB to the people who import it and nothing to anyone else, and the whole barrel is 2.9 KB
past the store. The last row is a growth tripwire; `import * as all` is not something anybody
writes.

The first row moves only when the store itself grows, and it has: bounding cascades, staging
commits so they apply atomically, and `store.call()` are all store machinery rather than
opt-in modules, so they are paid by everyone. That is the honest trade for a default that
stops a runaway from hanging the tab.

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
