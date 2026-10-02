![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# @yoltra/core

> [ 🇲🇽 Versión en Español](./README.es.md)&nbsp;
> | &nbsp; 👉 🇺🇸 English Version

[![npm version](https://img.shields.io/npm/v/@yoltra/core)](https://www.npmjs.com/package/@yoltra/core)
[![npm downloads](https://img.shields.io/npm/dm/@yoltra/core)](https://www.npmjs.com/package/@yoltra/core)
[![types](https://img.shields.io/npm/types/@yoltra/core)](https://www.npmjs.com/package/@yoltra/core)
[![License](https://img.shields.io/npm/l/@yoltra/core)](https://github.com/yoltra/yoltra/blob/main/LICENSE)

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
  │  ══ SYNCHRONOUS reduce phase: runs before emit() returns ══
  ├─ 1. Middleware ─── Synchronous pre-reducer hooks (return false to reject → "uncommitted" event)
  ├─ 2. Reducers ─── Every matching slice staged, then all committed under one root
  ├─ 3. Event subscribers ─── Committed/uncommitted event notifications
  ├─ 4. Coarse subscribers ─── External store listeners (useSyncExternalStore, etc.), if state changed
  │
  └─ 5. Effects ─── ASYNC side-effects, one independent task per event (keyed for O(1) lookup)
```

The reduce phase (1–4) is **synchronous**, so `getState()` is correct the instant `emit()` returns,
even with middleware. Effects (5) run afterward as an independent async task; the promise from
`emit()` resolves when that event's effects finish. Every stage is hook-able, and
`store.instrument()` exposes the whole flow (changed leaf paths, reduce timing, committed/rejected
phase) to the DevTools with no `as any`. An event that did not commit also carries `reason` and,
when a named middleware vetoed it, `vetoedBy`, the same attribution `emit` returns. In practice
`reason` reads `"vetoed"` there: a deduplicated or cascade-refused event never reaches
instrumentation. See the
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
// Exact path: fires when items[0].title changes
store.connect({ reducer: "todos", property: "items.0.title" }, (change) =>
  console.log("title:", change.oldValue, "→", change.newValue),
);

// Single-segment wildcard: fires when ANY item's title changes
store.connect({ reducer: "todos", property: "items.*.title" }, (change) =>
  console.log("some title changed at", change.path),
);

// Deep wildcard: fires when anything under items changes
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

Such a slice has no property beneath it, so its changes are reported at the **slice root**,
the empty path. Subscribe to it with `property: ""`:

```typescript
store.connect({ reducer: "token", property: "" }, (change) =>
  console.log("token:", change.oldValue, " --> ", change.newValue),
);
```

The types know the difference. `property` on a root-value slice accepts `""` and nothing else,
because there is no key to address, and the value comes back correctly typed:

```typescript
const token = useAtomicProp({ reducer: "token", property: "" }); // string | null
```

### `""` versus `"**"`: watching a whole slice

Two subscriptions sound alike and are not:

| Pattern | Fires when |
|---|---|
| `""` | the slice's **whole value** is replaced: a primitive changes, a `Map` is rebuilt, an object slice becomes `null` |
| `"**"` | **anything** in the slice changes, at any depth. Matches the root too, since `**` matches zero segments |
| `"*"` | one level down, exactly. Never matches the root |

**`"**"` is the whole-slice subscription, and it works for every slice regardless of shape.**
Reach for `""` only when you mean the root value itself; on an object slice it stays quiet,
because such a slice reports its changes at their leaves.

`Map` and `Set` are compared by reference, not by entry: a reducer returning a new `Map` is a
change, mutating one in place is not. That follows from the immutability contract rather than
being a special case. Build a new collection instead of mutating the stored one. It is also why
they have no paths beneath them: `"byId"` is subscribable, `"byId.get"` is not, and the types
say so.

### Immutability

State is deep-frozen before committing. Mutations throw in strict mode:

```typescript
const state = store.getState();
state.counter.value = 999; // TypeError: Cannot assign to read-only property
```

Binary values are the exception. A typed array, a `DataView` or an `ArrayBuffer` cannot be frozen,
so it is stored as it is and treated as one value at its own path, compared by reference, like a
`Map` or a `Set`. Replacing it notifies its path once; writing into it notifies nobody. To change
one, store a new view (`bytes.slice()`, or a fresh array), never write into the one in state.
Development builds warn when a reducer keeps a buffer from the event payload, including one held by
a field of the payload, because the emitter can still write into it.

---

## Event Targeting with `When` Matchers

> **Channel and type are joined into one key, `"channel::type"`.** Dispatch, deduplication and
> introspection all key on it, so two different pairs can collapse together: `("a::b", "c")` and
> `("a", "b::c")` both become `"a::b::c"`, and a subscriber for one is invoked for the other. A
> `::` in a channel is fine on its own (it is how a peer's channel is namespaced), so
> development builds warn on the **collision**, not on the separator, naming the store and both
> pairs, once per store.


Reducers, effects, and middleware use a unified `When` matcher to declare which events they
respond to:

```typescript
import { createStore, eventKeys } from "@yoltra/core";

type AppEM = {
  ui: { increment: number; decrement: number; reset: void };
  admin: { setCounter: number };
  system: { init: void; shutdown: void };
};

// Match specific event keys (recommended: preserves type correlation)
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

// Match channels by pattern (middleware only): `*` stands for zero or more characters
const rateGuard = {
  when: { channelPattern: "*::plan" }, // `bb::plan`, `peer::plan`, but not `plan`
  middleware: (state, event) => withinBudget(event.channel),
};
```

The first four forms compare exactly. `channelPattern` is for channels that cannot be named in
advance, such as a peer's namespaced `bb::plan`. `*` is the only metacharacter, and it
matches the usual glob way: `"*plan"` also matches `replan`, so a store that has both a local
`plan` and namespaced ones wants `"*::plan"` plus a separate rule for the local channel. The
[Decoration Guide](../../docs/en/DECORATION_GUIDE.md#targeting-a-channel-you-cannot-name-in-advance)
covers the trap of narrowing a hand-filtered guard to `{ channel }`.

`channelPattern` is for middleware only. Reducers and effects take the four exact forms
(`ExactWhen`), and registering one with a pattern throws, as does a `when` of none of the five
forms. Before 0.10.0 both were accepted and matched nothing.

---

## Middleware

Middleware runs **synchronously, before** reducers and can cancel event propagation (return
`false` to reject → "uncommitted" event; returning nothing allows it). Async work belongs in
effects, not middleware. When an event does not commit, `emit` says why: `reason` is
`"vetoed"`, `"deduped"` or `"cascade"`, and a veto names the middleware in `vetoedBy`, so a
guard refusing an action is distinguishable from a double-click being collapsed. Supports
both raw functions (legacy) and `MiddlewareSpec` objects with targeting:

```typescript
import type { MiddlewareSpec } from "@yoltra/core";

// Targeted middleware: only runs for admin channel events
const adminGuard: MiddlewareSpec<AppState, AppEM> = {
  when: { channel: "admin" },
  middleware: (state, event) => {
    if (!state.auth.isAdmin) return false; // Reject → creates "uncommitted" event
    return true;
  },
  meta: { type: "middleware", name: "adminGuard" },
};

// Global middleware: runs for all events. Synchronous, never a Promise: only an explicit
// `false` vetoes, so middleware that just observes can return nothing at all.
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

### Matching outside the store

`matchesWhen(when, event)` is the matcher every seam uses, and `describeWhenProblem(when, consumer)`
is the check that refuses a malformed one. Both are exported, so code that filters events by a
`When` (a capture filter, a router, a test helper) applies the store's rules exactly, `*` and `::`
included, instead of a copy that drifts:

```typescript
import { describeWhenProblem, matchesWhen } from "@yoltra/core";

const problem = describeWhenProblem(config.capture, "middleware");
if (problem !== undefined) throw new Error(`capture: ${problem}`);

store.instrument((info) => {
  if (matchesWhen(config.capture, info.event)) record(info);
});
```

`matchesWhen` reads only `channel` and `type`, so an instrumented event's `event` is accepted as is.

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

Effects for one event run **one after another**, and the promise `emit()` returns settles only
when the last of them has finished. A slow effect therefore delays the effects after it for the
same event, and anything awaiting that `emit()`, but not other events: each event's effects run
as a task of their own. For work that should start at once and run alongside, use
[`onEvent`](#event-subscriptions), whose handlers are called without being awaited.

An effect also receives a fourth argument, its context. `ctx.signal` aborts when the effect stops
being registered: its disposer runs, a hot reload replaces it, or the store is disposed. Hand it to
the work the effect starts:

```typescript
store.registerEffect({
  when: { keys: [["search", "query"]] },
  effect: async (event, getState, emit, ctx) => {
    const res = await fetch(`/api/search?q=${event.payload}`, { signal: ctx.signal });
    if (ctx.signal.aborted) return;
    await emit("search", "results", await res.json());
  },
});
```

An abort does not stop an effect that is already running, and its later emits are not dropped:
unregistering an effect is not the end of the store. Check `ctx.signal.aborted` before emitting a
result that only made sense while the effect was installed. Effects written with three parameters
are unchanged.

---

## Event Subscriptions

Subscribe to events (not state) from the view layer. Useful for notifications, animations, and
responding to rejected events:

```typescript
// Committed events (default): events that passed middleware
const off = store.onEvent("ui", "save", (event, getState, emit, phase) => {
  console.log("Save committed:", event.payload);
});

// Uncommitted events: events rejected by middleware
store.onEvent(
  "ui",
  "delete",
  (event, getState, emit, phase) => {
    console.log("Delete was rejected");
  },
  "uncommitted",
);

// Written events: state actually changed. Fires after the commit, so getState() is current.
store.onEvent(
  "plan",
  "patch",
  (event, getState) => {
    console.log("applied:", getState().plan);
  },
  "written",
);

// All events: both committed and uncommitted (not written; see below)
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
whether or not a reducer wrote anything, including every event in a store with no reducers at
all. `written` is the stricter fact, added rather than substituted, so toasts and analytics keep
working unchanged. `all` stays `committed | uncommitted`; folding `written` in would hand existing
subscribers a second notification per event.

### Event subscribers and time-travel

**Replay does not call your handlers.** Scrubbing a DevTools timeline reduces the events again,
so state follows the scrub, but `onEvent` handlers stay silent. They used to run exactly as they
do for a live event, which meant dragging a timeline re-published to peers, re-wrote to sockets
and re-fired analytics for events that were not happening again, with nothing available inside a
handler to tell the difference.

A handler that derives view state purely from the event stream, and performs no I/O, can opt in:

```ts
store.onEvent("ui", "save", handler, "committed", { duringReplay: true });
```

`store.isReplaying` is there for anything that has to branch rather than simply skip. Coarse
`subscribe` listeners and `connect` subscriptions keep firing throughout, because the state
genuinely did change and the UI has to follow the scrub.

---

## Commits are atomic across slices

An event that touches several slices writes all of them, then notifies. Nothing observes a
half-applied event. A subscriber to one slice reading `getState()` sees every other slice of the
same event already applied.

That matters most where a change is used as a signal to re-read, which is what the React hooks do.

---

## A reducer sees one slice, and writes one slice

This is a guarantee, not a convention. A reducer is handed its own slice as `state` and the
event, and nothing else: no `getState`, no store reference, no sibling. What it returns is written
back under the name it was mounted as, so it cannot write another slice even by returning a
whole-store-shaped object.

The consequence is worth stating because it is easy to build a mechanism you do not need: **inside
one slice there is no second writer, so there is no authorisation question** — only the ordinary
question of whether that reducer's own code is correct. Two reducers wanting to guard each other's
data is two slices, and core already keeps them apart for free.

The one cross-slice effect a reducer has is refusing the event outright, which is the next section.

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

result.committed; // true: middleware allowed it
result.written; // false: nothing was written
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

## Request and reply: `store.call()`

Every event-bus consumer eventually writes request/reply by hand: mint an id, subscribe, match,
time out, unsubscribe. It is about eighty lines and it has the same two bugs every time: the
subscription outlives the call, and a responder that forgets to echo the id produces a timeout
with nothing to point at.

```typescript
const res = await store.call("rpc", "ask", { q: "who?" }, { reply: ["rpc", "answer"] });
res.payload.text;
```

The responder does nothing special. It replies through the `emit` it was handed, the store's
parent stamp correlates the two, and **there is no id to mint, echo, or forget**:

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
run, and the collector is an effect that does not return until the consumer has taken the item,
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
blocking its producer would deadlock the call itself: progress nobody reads would stop the
terminal event from ever being sent. Un-iterated progress therefore buffers to `highWaterMark`
and is then counted on `call.dropped` rather than blocking.

### Giving up

| | |
|---|---|
| `timeoutMs` | **Idle**, not total: every correlated event resets it, progress included. A job that streams for two minutes will not fail a thirty-second call. Default 30s. |
| `signal` | An `AbortSignal`, for a real deadline or a cancelled action. |
| `call.cancel(reason)` | Stops listening and settles. Safe to call twice. |

However a call ends, whether resolved, timed out or aborted, the subscription is removed and any producer
parked on backpressure is released. A wedged responder is worse than the unbounded buffer this
replaced.

### Going further

The exported surface is `ReplySpec`, `CallOptions`, `CallHandle`, `CallCancellation`,
`CancelKey`, `CallTimeoutError` and `CallAbortedError`. Three things this section does not cover:

- **`correlationId`**, for a responder that cannot reply directly — because it answers on a later
  turn, or across a worker or a network. By default it widens the match to include an echoed id
  and the parent check still runs first; `correlation: "id"` matches on the echoed id alone.
- **`cancel`**, an event the call emits when it gives up (cancelled, aborted or timed out), so a
  responder doing long work can stop it.
- **Testing a call**, and the rest of the detail, in the
  [Request & Reply guide](https://github.com/yoltra/yoltra/blob/main/docs/en/REQUEST_REPLY_GUIDE.md).

---

## Reading a value as you subscribe

`connect` starts at "from now on", so a subscriber's first read had to repeat the path elsewhere:
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

Provenance is **absent** when no event caused the change: a DevTools time-travel jump, or the
`immediate` delivery above. Absence is the signal, rather than a fabricated id.

---

## Event Deduplication (opt-in)

Deduplication is **off by default**. Yoltra never silently drops legitimate rapid-fire identical
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

// Identity-based: dedupe by an explicit key, e.g. a React Strict Mode double-invoke in an effect.
await store.emit("analytics", "pageView", { page }, { dedupKey: `pageView:${page}` });
```

---

## Traffic that is not history

Some events are traffic: a presence ping, a pointer position, a progress tick, a typing indicator.
They are handled like any event, but recording them is waste. A devtools timeline of ten thousand
pointer moves hides the three events that mattered, and every observer pays for each one. Name
those channels `ephemeral`:

```typescript
const store = createStore({
  name: "app",
  reducer: { /* ... */ },
  ephemeral: ["presence"],
});
```

Reducers, subscribers and effects handle an ephemeral event exactly as before. What changes is
everything that records:

- **Instrumentation** delivers it only to observers registered with
  `store.instrument(observer, { ephemeral: true })`. While none is, the store does no
  instrumentation work for it at all. The devtools agents do not opt in; `persist` does, because
  storage must follow every change to state.
- **Replay** skips it, so a replayed history is the history of what mattered.
- **Writing state** from an ephemeral event is warned about once per event in development
  (`ephemeral-write`): replay skips the event, so a replayed history would not reproduce the write.

---

## Values that change many times a second

A store is a log of facts, and every fact is diffed, frozen in development, delivered to
subscribers and, unless its channel is ephemeral, recorded. That is the right cost for "the user
joined" and the wrong one for a value that changes sixty times a second. Split the two:

- **Keep per-frame values outside the store**, behind the producer's own subscribable handle: a
  pointer position, a scroll offset, a sensor reading, the latest sample of a live chart. React
  reads them with `useSyncExternalStore`, which needs only `subscribe` and `getSnapshot`.
- **Put only discrete facts in state**: started, paused, finished, selection changed, threshold
  crossed.
- **Throttle anything that does enter state in the producer**, by time **and** by how far the
  value moved, so a quiet value costs nothing and a busy one is bounded.
- **Mark such channels `ephemeral`**, so observability does not pay per event.

A producer that does all four:

```typescript
function createProgress(store: AppStore, scheduler: Scheduler) {
  let latest = 0;
  let reported = 0;
  let pending: TimerHandle | null = null;
  const readers = new Set<() => void>();

  return {
    set(value: number) {
      latest = value;
      for (const read of readers) read(); // per-frame readers, outside the store
      if (pending !== null || Math.abs(value - reported) < 0.01) return;
      pending = scheduler.setTimeout(() => {
        pending = null;
        reported = latest;
        void store.emit("job", "progress", latest); // at most every 100 ms, on an ephemeral channel
      }, 100);
    },
    get: () => latest,
    subscribe(read: () => void) {
      readers.add(read);
      return () => readers.delete(read);
    },
  };
}

// In a component: every frame, without the store.
const value = useSyncExternalStore(progress.subscribe, progress.get);
```

Pass the store's own `scheduler` and a test drives the throttle as it drives the store
([Time and timers](#time-and-timers)).

**Why `emit` does not coalesce for you.** By the time `emit()` returns, reducers have run and state
is updated; every subscriber, effect and caused event relies on that. Coalescing inside `emit` would
mean an event that returned without having happened yet, or one that silently replaced another, and
causality (`parentId`, `depth`, cascade bounds) would no longer describe what ran. The producer
knows which values are disposable; the store does not.

---

## Time and timers

A store reads the time through one port and arms timers through another, and both can be
replaced. With the defaults written out:

```typescript
const store = createStore({
  name: "app",
  reducer: { /* ... */ },
  clock: { now: () => Date.now() },
  scheduler: {
    setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
    clearTimeout: (handle) => clearTimeout(handle),
  },
});
```

`clock` decides deduplication windows and stamps `InstrumentedEvent.at`. `scheduler` arms the
deduplication cache prune and the idle timeout of `store.call()`; `persist` takes a `scheduler`
option of its own. Durations such as `reduceTimeMs` are measured with `performance.now()` either way.

The defaults look the globals up each time they are used, so `vi.useFakeTimers()` works even when
it is installed after the store was built. Inject your own to control time without faking globals,
or to hand every library a host configures the same clock and timers. Their methods are called as
methods, so a class instance works.

---

## Tying resources to the store

`store.signal` is an `AbortSignal` that aborts when the store is disposed. Hand it to anything
that should live exactly as long as the store:

```typescript
const store = createStore({ name: "session", reducer: { /* ... */ } });

const socket = new WebSocket(url);
store.signal.addEventListener("abort", () => socket.close());

await fetch("/api/profile", { signal: store.signal });
```

It is created on first read, so a store nobody asks carries no `AbortController`, and read after
disposal it is already aborted. It aborts last in `dispose()`, after every subscription and
registration is released.

**A disposed store is inert.** `emit()` resolves `{ committed: false }` without running anything.
`call()` rejects with `CallAbortedError("store disposed")`, and so does every call still waiting
for a reply. `register*`, `with*`, `replace*` and `hotReplace` throw, naming the store. In
development, a late `emit` or `call` is reported once per method as `use-after-dispose`, because
something still holding the store after its owner released it is a leak worth finding.
`dispose()` itself can be called again safely.

---

## Cascade protection (on by default)

Two consumers wired into each other, whether a subscriber that emits what its own reducer answers or
two slices that answer each other's events, produce an event chain with no end. The reduce queue
drains **synchronously**, so that is not a slow program: it is a frozen tab, or a pinned core,
with no error and no stack to point at.

Every event therefore carries its causal position, and the store refuses to extend a chain past a
ceiling:

```typescript
const store = createStore({
  name: "app",
  reducer: { ... },

  // Defaults to 64. Bounded whether or not you configure it. A failure mode this bad
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
`onCascade` (plus a console error) names it. A throw would surface in whichever subscriber or
effect happened to be emitting, which is the same unattributable failure the ceiling exists to
prevent.

**A wide burst is not a cascade.** One event whose subscriber fans out to five hundred siblings
is a legitimate shape; depth is what separates it from a cycle, and a plain loop of `store.emit`
never accumulates depth at all, because each call drains to completion before the next, so every one is
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

### Decorating a store, with its types

A slice added at runtime used to be invisible to the type system: `registerReducer` took a
plain `string` and returned a bare disposer, so nothing downstream knew the slice existed or
what shape it had. `withSlice` returns **the same store, re-typed**:

```typescript
type FlagsEM = { flag: { enabled: { id: string } } };

const flags = defineSlice<FlagsEM>()({
  state: { enabled: [] as string[] },
  when: { keys: [["flag", "enabled"]] },
  reducer: (s, e) => (e.type === "enabled" ? { enabled: [...s.enabled, e.payload.id] } : s),
});

const app = store.withSlice("flags", flags, { owner: "@scope/flags" });

app.getState().flags.enabled; // string[]
app.emit("flag", "enabled", { id: "a1" }); // the new channel is emittable
```

`withMiddleware` and `withEffect` do the same for the event map. Calls chain, and a library
publishes a decorator by taking a store and returning one:

```typescript
export function withFlags<R extends string, S extends Record<R, any>, EM extends EventMapBase>(
  store: StoreInstance<R, S, EM>,
  config: FlagsConfig,
) {
  return store.withSlice("flags", flags, { owner: "@scope/flags" });
}

// Decorators nest, in any order.
const decorated = withFlags(withDevtools(store, dtConfig), config);
```

**Why the builders.** A spec's `when` carries channel and type strings and no payload types,
so the event map a decoration contributes cannot be inferred from it, and TypeScript has no
partial type-argument inference. `defineSlice<EM>()` puts it in a value position, where
inference works, so no registration site needs a type argument or a cast. One consequence
worth knowing: **a bare middleware function can never widen the event map**, because
`MiddlewareFunction`'s event parameter is a mapped type nothing can be inferred back out of.
Only the spec form from `defineMiddleware` can.

**It is the same object.** Nothing re-subscribes, no state moves, and any in-flight
`store.call()` is unaffected. Only the type changes.

**Ordering.** Decorate at module scope, once, before the first render. Between `createStore`
and the decoration the slice genuinely does not exist, and a component reading it sees
`undefined` until it does.

**Disposal.** `withSlice` hands back no disposer on purpose: after one runs, the widened type
still promises a slice that is gone, and no type system can express "valid until that call".
Use `registerSlice` when you own the slice and need teardown, and keep that disposer private
to the library. Reading a disposed slice throws a named error in development rather than
returning `undefined` from a type that promised a value.

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

### `replace*` replaces what you authored, not what a library added

A reducer, middleware or effect registered **after** construction, with `registerReducer`,
`registerMiddleware` or `registerEffect`, survives a `replace*` call. Those registrations were
never part of the set you are replacing: nobody writing `replaceReducers(myReducers)` means "and
also delete the slice devtools mounted, along with its state".

This used to go the other way, which made the HMR line above delete a library's slice and its
state on the first file save, with no error and no warning. It is also why an in-flight
`store.call()` no longer dies mid-reload: its reply listener belongs to the store itself.

Pass `{ scope: "all" }` for the old wholesale behaviour, which a test harness resetting a store
between cases may genuinely want:

```typescript
store.replaceReducers(nextReducers, { scope: "all" });
store.hotReplace({ reducer: nextReducers, scope: "all" }); // forwards to all three
```

An application that authors a slice a library already mounted gets an error naming the slice,
rather than a silent takeover that leaves the library holding a disposer for something no longer
its own. In development, `replace*` logs at debug level when it preserved anything, so "why is
that effect still firing after a reload" has an answer.

---

## Best Practices

### State is synchronous; `await` only for effects

The reduce phase is synchronous, so state reflects your event the moment `emit()` returns, with no
`await` needed to read it back. Await `emit()` when you also want _this event's_ effects to have
finished:

```typescript
emit("todo", "add", todo);
store.getState(); // Already reflects the new todo. No await required

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

## Errors and diagnostics

A store contains every failure in the code it runs: a reducer, effect, subscriber or middleware
that throws is reported, and the rest of the event goes on. It also refuses things (a cascade, a
reducer declining a write) and, in development, warns about mistakes it can see. All of it is one
`Diagnostic`:

```typescript
type Diagnostic = {
  level: "info" | "warn" | "error";
  code: DiagnosticCode;          // stable: "effect-error", "reducer-error", "cascade", ...
  message: string;               // for a person; may be reworded
  detail?: Record<string, unknown>; // the event, the error, the slice
};
```

**The store's owner sets where they go**, once:

```typescript
const store = createStore({
  name: "app",
  reducer: { /* ... */ },
  diagnostics: (d) => logger[d.level](d.code, d.message, d.detail),
});
```

Without `diagnostics`, the store writes to the console exactly as it always has. With it, the sink
replaces that output. The `onEffectError`, `onReducerError`, `onSubscriberError`, `onCascade` and
`onRejected` hooks are still called either way.

**Anyone else observes**, at any time, without silencing anything:

```typescript
const off = store.onDiagnostic((d) => {
  if (d.level === "error") metrics.count(d.code);
});
```

This is the seam for code attached to a store it did not create, which cannot set the hooks.
Development warnings are never sent in production, and a sink or observer that throws is ignored.

### Values that grew too large

Nothing in the store refuses a large value. But every event is copied to devtools and may be
fingerprinted for deduplication, and every slice is diffed, frozen in development and persisted.
`warnOnLargeValues` finds the payload or slice that grew past what anyone intended, in development
only:

```typescript
import { warnOnLargeValues } from "@yoltra/core";

if (import.meta.env.DEV) {
  warnOnLargeValues(store, { maxPayloadNodes: 5_000, maxSliceNodes: 50_000 });
}
```

It warns once per event key and once per slice, naming the store, the value and the limit. Values
are counted as the codec counts them, bytes are estimated (a typed array by its `byteLength`), and
each measurement stops as soon as a limit is passed, so checking an enormous slice costs no more
than its limit. The defaults are 5 000 values or 256 KB for a payload, and 50 000 values or 4 MB
for a slice, half of what `persist` accepts. It is a separate import: an application that does not
use it ships none of it, and in production it watches nothing.

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
| `store.onEvent(channel, type, handler, phase?, options?)` | Event subscription (committed/uncommitted/written/all). Silent during replay unless `{ duringReplay: true }` |
| `store.onRegistrationChange(observer, opts?)` | Fires when the store gains or loses a reducer, middleware or effect. Each change carries `when`, the normalized matcher: `{ keys }` for a keyed slice, `{ any: true }` for unfiltered middleware |
| `store.onEffect(channel, type, handler)`        | Single-event effect shorthand                  |
| `store.onDiagnostic(observer)`                  | Observe failures, refusals and development warnings. See [Errors and diagnostics](#errors-and-diagnostics) |
| `store.dispose()`                               | Release the store; it is inert afterwards. See [Tying resources to the store](#tying-resources-to-the-store) |
| `store.signal`                                  | An `AbortSignal` aborted by `dispose()`        |

### Dynamic Registration

| API                                 | Description               |
| ----------------------------------- | ------------------------- |
| `store.registerSlice(name, spec, opts?)` | Add a slice at runtime; returns the widened store plus a disposer |
| `store.withSlice(name, spec, opts?)` | Same, returning the widened store for chaining |
| `store.withMiddleware(mw)`, `store.withEffect(spec)` | Register and widen the event map |
| `defineSlice<EM>()`, `defineMiddleware<EM>()`, `defineEffect<EM>()` | Declare the event map a spec contributes |
| `store.registerReducer(name, spec)` | Add a slice at runtime. Generic over its spec, so a decoration can mount a slice on a channel the app's event map lacks without a cast |
| `store.registerMiddleware(fn)`      | Add middleware at runtime |
| `store.registerEffect(spec)`        | Add an effect at runtime  |

### HMR

| API                                     | Description                |
| --------------------------------------- | -------------------------- |
| `store.replaceReducers(reducers, opts)`   | Replace spec reducers; runtime ones survive unless `{ scope: "all" }` |
| `store.replaceMiddleware(middleware, opts)` | Replace spec middleware; same rule |
| `store.replaceEffects(effects, opts)`       | Replace spec effects; same rule    |
| `store.hotReplace(partial)`                 | Replace any subset at once; forwards `scope` |

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
holds stale JSON is worse than one that starts fresh, and a full disk should not take down a
page, so write failures are reported the same way rather than raised.

**Version mismatches are refused, not trusted.** Reducers change, and a snapshot written
against an older shape may not be valid state for this build at all. Supply `migrate` to
upgrade it, or it is discarded.

Writes are driven by instrumentation, so a change confined to a slice you are not persisting
costs nothing, an event that changed nothing (vetoed, refused, or a reducer returning its input)
writes nothing, and a burst is coalesced into one write. `Map`, `Set`, `Date`, `BigInt`,
`undefined` and circular references all survive the round trip: `JSON.stringify` does not fail
on those, it silently destroys them.

**A partial snapshot is never written.** Encoding stops at `maxNodes` values (100 000 by
default). State past that is not written at all: storage keeps its previous, complete value, and
`onError` receives a `PersistEncodeError` with `truncated: true` and `written: false` under the
`"encode"` phase. Writing what fit would have replaced a good snapshot with one that hydrates into
state no reducer produced. A value with no faithful representation, such as a class instance, is
different: the rest of the state is intact, so it is written, with the error's `unsupported`
naming each path and `written: true`.

For a server render, `dehydrate(store, { version })` produces the payload and
`hydrate({ source, version })` consumes it. A state past `maxNodes` dehydrates to `""`, which
hydrates as nothing to restore.

---

## Lists that reorder

Path notification is positional for arrays. `items.0.title` names a *slot*, not a thing, so
`unshift`, `splice(0, 1)` and `sort` move nearly every element into a different slot, and the
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

`ids` is still an array, so a reorder still reports `ids.0`, `ids.1` and so on. That cost is
confined, not removed. What you get is cost proportional to what actually changed.

For a small list that only ever grows at the end, `items.0.title` is fine and simpler. The
adapter is for collections that reorder, or that are large enough for the difference to show.

### What it costs, measured

At 1000 rows, diffing after an insert at the front costs about 890 µs for an array and 77 µs
normalised, and the array reports roughly a thousand changed paths against two. That is the
case the adapter is for.

A single-field update runs the other way: about 2 µs for the array against 83 µs normalised.
`detectChangedProps` reaches an array's changed row by index, but for an object it has to read
both key lists and confirm the shape is unchanged before it can skip the entities that did not
move, so a wide entity map costs in proportion to its width even when one field changed. The
figures come from `benchmarks/detect-changed-props.bench.ts` on one machine: compare them with
each other, not with your hardware.

So: normalise collections that reorder or churn. A large collection that only ever has
individual fields edited is better off as an array today.

---

## Performance

| Metric             | Value                                  |
| ------------------ | -------------------------------------- |
| **Bundle size**    | Measured every build, see table below |
| **Tree-shakeable** | Yes (ES modules)                       |
| **Dependencies**   | Zero                                   |
| **TypeScript**     | Full type definitions included         |

Bundle size is checked, not asserted: `rush size` bundles the package the way a consumer
would (tree-shaken, minified, gzipped) and fails when it exceeds the budget declared in
`package.json`. The table below is written by that same check, so it cannot drift from what
was measured; editing it by hand fails CI.

The number that matters is what you import, not what the package exports:

<!-- size-table:start -->
| Import | Size | Budget |
| --- | --- | --- |
| `{ createStore }` | 13.9 KB | 16 KB |
| `{ createStore, hydrate, persist }` | 15.3 KB | 17 KB |
| everything | 17.1 KB | 20 KB |
<!-- size-table:end -->

These are **production** figures: what you ship once your bundler defines
`NODE_ENV=production` and the development-only guards drop out. The budget column is the
ceiling `rush size` enforces, and it is checked against a development build instead, which is
the larger of the two: dev-only code cannot grow unnoticed just because it never reaches a
user. So the headroom implied here is deliberately conservative.

The **gap between rows** is the tree-shaking claim, and it is what to watch: persistence adds
1.4 KB to the people who import it and nothing to anyone else, and the whole barrel is 3.2 KB
past the store. The last row is a growth tripwire; `import * as all` is not something anybody
writes.

The first row moves only when the store itself grows, and it has: bounding cascades, staging
commits so they apply atomically, and `store.call()` are all store machinery rather than
opt-in modules, so they are paid by everyone. That is the honest trade for a default that
stops a runaway from hanging the tab.

A budget moves only by what was measured, and says why. In 0.10.0 the `createStore` budget went
from 14 KB to 16 KB: the diagnostics seam ([Errors and diagnostics](#errors-and-diagnostics))
measured 0.6 KB, one routing helper and a sentence for every failure the store contains; an inert
disposed store with `store.signal` measured 0.4 KB; and `ctx.signal` for effects 0.1 KB. The
persistence row, which includes the store, went from 16 KB to 17 KB for the diagnostics seam plus
0.2 KB of its own: `PersistEncodeError`, and refusing a partial write. The barrel went from 18 KB
to 20 KB: 1 KB with the store, and 0.6 KB for `warnOnLargeValues`, which only the barrel and its
own importers carry.

---

## Documentation

- **[yoltra Root README](../../README.md)**: Overview and
  quick start
- **[@yoltra/react](../react/README.md)**:
  React hooks and Suspense
- **[Quick Start Guide](https://github.com/yoltra/yoltra/blob/main/docs/en/QUICK_START_GUIDE.md)**:
  Five steps to a working app
- **[Upgrading to 0.10.0](https://github.com/yoltra/yoltra/blob/main/docs/en/UPGRADE_0.10.md)**:
  A matcher that could never match now throws, and four smaller fixes
- **[Upgrading to 0.8.0](https://github.com/yoltra/yoltra/blob/main/docs/en/UPGRADE_0.8.md)**:
  Five behaviour changes, and one hazard if you roll back
- **[Decoration Guide](https://github.com/yoltra/yoltra/blob/main/docs/en/DECORATION_GUIDE.md)**:
  Adding a slice, middleware or effect to somebody else's store, with the types
- **[Event Queue Architecture](https://github.com/yoltra/yoltra/blob/main/docs/en/design/event-queue-architecture.md)**:
  Technical deep-dive
- **[Library Comparison](https://github.com/yoltra/yoltra/blob/main/docs/en/design/state-management-library-comparison.md)**:
  Architectural comparison

---

## Examples

- **[Todo App](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-in-react)**: Full
  CRUD with performance profiling · [▶ Open the live demo](https://yoltra.dev/en/demos/in-react)
- **[Kinetic Logo](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-kinetic-logo)**:
  3000 circles with physics simulation · [▶ Open the live demo](https://yoltra.dev/en/demos/kinetic-logo)
- **[Next.js Integration](https://github.com/yoltra/yoltra/blob/main/examples/v0/yoltra-in-nextjs)**:
  Pages Router, client-side state + theme switcher · [▶ Open the live demo](https://yoltra.dev/en/demos/in-nextjs)

---

## Contributing

- [Monorepo Root](../../README.md)
- [Contributing Guide](https://github.com/yoltra/yoltra/blob/main/CONTRIBUTING.md)

---

## Status

**Release Candidate**. APIs are stable, used in production, minor changes possible before v1.0.0.

---

## License

**MIT**. Free to use in commercial and open-source projects.
