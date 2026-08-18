![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# Event Pipeline Architecture

> 👉 English &nbsp;|&nbsp; [🇲🇽 Español](../../es/design/event-queue-architecture.md)

**Applies to:** `@yoltra/core` 0.6.0
**Last Updated:** August 2026
**Status:** Stable

## Overview

Yoltra processes every event in **two phases**:

1. **A synchronous reduce phase** - middleware, reducers, event subscribers, and coarse listeners
   all run **in the same tick, before `emit()` returns**. So `getState()` is correct the instant
   `emit()` returns - with or without middleware. Reducers **stage** their results; every slice is
   written under one new root before anything is notified, so no subscriber can observe an event
   half-applied.
2. **An asynchronous effect phase** - each committed event's effects run afterward as an
   **independent task**. The promise returned by `emit()` resolves when _that event's_ effects
   finish.

This split is the core of the design: **state transitions are synchronous and predictable**
(Redux-like), while **side effects are async and non-blocking** (thunk/saga-like), without a
separate orchestration layer. Reducers stay pure and synchronous; anything async belongs in an
effect.

> This replaces the earlier fully-async serialized queue (before 0.2.0). Middleware is now synchronous,
> reducers commit before `emit()` returns, and the completion promise is per-event and honest.

## Core Mechanism

### Structures

```typescript
// FIFO queue of events awaiting the synchronous reduce phase.
private readonly reduceQueue: Array<{
  channel: string;
  type: string;
  payload: unknown;
  id: string;
  resolve: (result: EmitResult) => void; // completion deferred for this event
  parentId?: string;   // present only on a caused event
  depth?: number;      // 0 for a root emit, one greater than its cause below that
}> = [];

private isReducing = false;   // re-entrancy guard for the synchronous drain
private inFlightEffects = 0;   // number of effect tasks currently running
```

**Properties:**

- **FIFO reduce queue** - events reduced in the order emitted; re-entrant emits preserve order.
- **`isReducing` guard** - ensures one synchronous drain is in flight; re-entrant emits append to
  the queue and are drained by the same pass (no reducer interleaving).
- **Per-event completion deferred** - each event carries its own `resolve`, so `await emit(...)`
  settles when that event's effects complete - not before, and not for an unrelated event.
- **Opt-in deduplication** - off by default; enabled per-store (`dedupWindowMs`) or per-emit
  (`dedupKey`). See [Deduplication](#deduplication-opt-in).

### The `emit()` entry point

```typescript
public async emit<C, T>(channel: C, type: T, payload: EM[C][T], opts?: EmitOptions): Promise<EmitResult>
```

**Steps:**

1. **Deduplication (opt-in)** - if content dedup is enabled (`dedupWindowMs > 0`) or an explicit
   `dedupKey` is supplied, skip the event when it matches a recent one. Off by default.
2. **Assign id + completion deferred** - a unique id and a `Promise` whose `resolve` fires after
   this event's effects run.
3. **Enqueue** - push the event onto `reduceQueue`.
4. **Drain synchronously** - call `drainReduce()`, which reduces every queued event in this tick.
5. **Return the completion promise** - resolves once this event's effects settle.

### Processing flow

```
emit(channel, type, payload)
        │
        ▼
  ┌───────────────────────┐   duplicate
  │ opt-in dedup check?   │ ───────────► return (skipped)
  └───────────┬───────────┘
              │ not a duplicate
              ▼
  assign id + completion deferred
              │
              ▼
  push onto reduceQueue
              │
              ▼
  drainReduce()  ── SYNCHRONOUS, in this tick ─────────────────────┐
              │   while reduceQueue is non-empty:                  │
              ▼                                                    │
     ┌────────────────────────────┐   veto    ┌───────────────────┐│
     │ middleware (sync, vetoes)  │ ────────► │ uncommitted event ││
     └────────────┬───────────────┘           │ subscribers       ││
                  │ committed                 └───────────────────┘│
                  ▼                                                │
     ┌────────────────────────────┐  refusal  ┌───────────────────┐│
     │ STAGE reducers - nothing   │ ────────► │ nothing written;  ││
     │ is written yet             │           │ onRejected fires  ││
     └────────────┬───────────────┘           └───────────────────┘│
                  │ no refusal                                     │
                  ▼                                                │
     ┌────────────────────────────┐                                │
     │ COMMIT all slices, 1 root  │                                │
     └────────────┬───────────────┘                                │
                  ▼                                                │
     ┌────────────────────────────┐                                │
     │ committed subscribers      │  (fire-and-forget)             │
     └────────────┬───────────────┘                                │
                  ▼                                                │
     ┌────────────────────────────┐                                │
     │ written subs + coarse      │  (only if state changed)       │
     │ listeners, instrumentation │                                │
     └────────────┬───────────────┘                                │
                  ▼                                                │
     void runEventEffects(event) ── async, independent task ───────┘
                  │
                  ▼
  return `done` promise  ── resolves when THIS event's effects finish
```

## Phase 1 - Synchronous reduce

`drainReduce()` runs the whole reduce phase for every queued event in one synchronous pass, guarded
by `isReducing`:

```typescript
private drainReduce(): void {
  if (this.isReducing) return;        // a drain is already in progress
  this.isReducing = true;
  try {
    while (this.reduceQueue.length > 0) {
      const { channel, type, payload, id, resolve } = this.reduceQueue.shift()!;
      const event = { channel, type, payload, id };

      // (instrumentation captures prev state, changed paths, and timing here —
      //  skipped entirely when no observers are attached)

      this.currentEvent = event;                      // so a re-entrant emit knows its cause
      const result = this.applyEventSync(event);      // ← synchronous

      // Effects run as an independent task; the loop does NOT await them.
      void this.runEventEffects(event, result, resolve);
    }
  } finally {
    this.isReducing = false;
  }
}
```

`applyEventSync()` is the synchronous core - middleware, reducers, subscribers, coarse listeners.
It stages every matching slice before writing any of them, so a refusal arriving from the last
reducer can still stop the first one's write:

```typescript
private applyEventSync(event): EmitResult {
  // Middleware (synchronous). Return false to veto; async work belongs in effects.
  for (const mw of this.matchingMiddleware(event)) {
    let ok: boolean;
    try {
      ok = mw(this.state, event, this.emit);   // ← boolean, not a Promise
    } catch (err) {
      console.error("Middleware error:", err);
      ok = false;
    }
    if (!ok) {
      this.notifyEventSubscribers(event, "uncommitted"); // vetoed → uncommitted subs
      return NOT_COMMITTED;                              // do not commit
    }
  }

  // STAGE - key-based + pattern-based reducers compute their next slice. Nothing is written.
  const staged = [];
  let rejection = null;
  for (const [slice, when] of this.matchingReducers(event)) {
    const refused = this.stageSlice(slice, event, staged);
    if (refused) { rejection = refused; break; }   // a refusal stops staging
  }

  // A refusal discards EVERY staged slice, not just the refusing one: authorising a write to one
  // slice while a sibling records it as accepted is not authorisation.
  if (rejection) {
    this.onRejected?.(rejection, event, rejectedBy);
    this.notifyEventSubscribers(event, "committed");   // not vetoed - it reached reducers
    return { committed: true, written: false, rejected: rejection };
  }

  // COMMIT - one new root for the whole event, then notify. Every notification happens after
  // every write, so a handler reading getState() sees the event complete.
  const written = this.commitStaged(staged, event);

  this.notifyEventSubscribers(event, "committed");
  if (written) {
    this.notifyEventSubscribers(event, "written");
    this.listeners.forEach((l) => l());
  }
  return written ? WRITTEN : COMMITTED_UNWRITTEN;
}
```

**Because this all runs before `emit()` returns:**

```typescript
store.emit("counter", "increment", 1);
store.getState().counter.value; // ← already updated, even with middleware present
```

## Phase 2 - Asynchronous effects

Each committed event's effects run in their **own async task**, not in a shared serialized loop:

```typescript
private async runEventEffects(event, result, resolve): Promise<void> {
  this.inFlightEffects++;
  try {
    if (result.committed) await this.notifyEffects(event);
  } catch (err) {
    console.error("Effect error:", err);   // one effect failing never breaks the pipeline
  } finally {
    this.inFlightEffects--;
    resolve(result);                        // settles the emit() promise for THIS event
  }
}
```

Independent per-event tasks (rather than one shared serialized loop) let an effect `await` a
re-entrant `emit()` **without deadlocking** - the re-entrant event reduces synchronously on its own
and its effects schedule independently.

## Re-entrancy and ordering

Nested emits are safe and ordered:

- **A `emit()` inside middleware or a subscriber** (i.e. during the synchronous reduce) appends to
  `reduceQueue`; the active `drainReduce()` pass picks it up and reduces it after the current event
  - FIFO, with no reducer interleaving.
- **A `emit()` inside an effect** (async) enqueues and calls `drainReduce()` again, which starts a
  fresh synchronous pass (the previous one already finished).

```typescript
await emit("ui", "event1", p1); // reduced first
await emit("ui", "event2", p2); // reduced after event1
// Reduce order: event1 → event2 (guaranteed, synchronous)
```

> **Effect concurrency:** because effects are independent tasks, event1's effects and event2's
> effects may be in flight at the same time. If an effect must run strictly after another effect's
> completion, model that ordering explicitly (e.g. emit the follow-up from inside the first
> effect). Reducer order is always strict; effect completion order is not.

## Deduplication (opt-in)

Deduplication is **off by default** - Yoltra never silently drops legitimate rapid-fire identical
events (double-clicks, a slider emitting the same value, two `+1`s). You opt in two ways:

| Mode               | How                                                     | When it fires                                                                  |
| ------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Content-based**  | `createStore({ dedupWindowMs: N })` (or `createYoltra`) | Skips an event whose `channel::type::payload` fingerprint recurs within `N` ms |
| **Identity-based** | `emit(c, t, p, { dedupKey })`                           | Skips an event whose explicit `dedupKey` recurs within the key window          |

```typescript
// Off by default - both of these dispatch:
await emit("counter", "increment", 1);
await emit("counter", "increment", 1);

// Identity-based dedup for a React Strict Mode double-invoke in an effect:
useEffect(() => {
  emit("analytics", "pageView", { page }, { dedupKey: `pageView:${page}` });
}, [page]);
```

Identity-based dedup is the correct tool for Strict Mode's development-only double-invocation of
effects: the same logical emit reuses the key, while two genuine user actions do not.

## The `emit()` promise contract

`emit()` returns a `Promise<EmitResult>` that resolves **when that specific event's effects
complete**:

```typescript
const { committed, written, rejected } = await emit("api", "save", payload);
// ← resolves after save's effects have finished (state was already updated synchronously)
```

| Field      | Meaning                                                                     |
| ---------- | --------------------------------------------------------------------------- |
| `committed`| Middleware allowed it - it reached the reducers                              |
| `written`  | State actually changed. `false` for an event no reducer answered, and for a store with no reducers at all |
| `rejected` | The `Rejection` a reducer returned, when one refused                         |

The two are distinct on purpose. `committed` is `true` for every event middleware allows, which is
what a notification or analytics bus depends on; `written` is the stricter fact a caller needs when
a lost update matters. Widening the old `Promise<void>` is source-compatible - nothing could depend
on the absence of a value.

This is honest under concurrency: each event has its own completion deferred, so `await emit(b)`
never resolves early because some other event `a` happened to be mid-flight. If you only care about
the state change (not the effects), you don't need to await at all - the change is already visible.

## Event subscriptions

Event subscriptions observe events without affecting flow. They fire during the **synchronous**
phase.

| Phase           | When notified                                        | Use case                                   |
| --------------- | ---------------------------------------------------- | ------------------------------------------ |
| `'committed'`   | After reducers, before this event's effects - whether or not anything was written | Toasts, analytics, any "this happened" signal |
| `'written'`     | After the commit, only when state actually changed   | Reacting to a real state change; `getState()` already shows it |
| `'uncommitted'` | After middleware vetoes                              | React to blocked events (auth, validation) |
| `'all'`         | `committed` **and** `uncommitted` (handler receives the phase) | Logging, analytics, debugging     |

`'all'` deliberately does **not** include `'written'`. If it did, every existing `all` subscriber
would receive a second notification per written event and double-count; `written` is opt-in only.

```typescript
// Committed (default)
store.onEvent("ui", "save", (event, getState) => {
  console.log("Save committed, new state:", getState());
});

// Uncommitted - middleware blocked it
store.onEvent("ui", "delete", () => console.log("Delete blocked by middleware"), "uncommitted");

// All - with the phase parameter
store.onEvent("ui", "action", (event, _get, _emit, phase) => {
  analytics.track(`event_${phase}`, { type: event.type });
}, "all");
```

Subscriber errors are caught and logged so one throwing subscriber never stops the others.

## Failure modes

### Middleware veto

A middleware returning `false` vetoes the event: reducers and effects never see it, uncommitted
subscribers fire, and the event does not commit. Middleware is synchronous - do authorization and
validation here, not I/O.

```typescript
const auth: MiddlewareFunction = (state, event) => {
  if (!state.auth.isAuthenticated) return false; // veto → uncommitted
  return true;
};
```

### Effect errors

An effect that throws is caught and logged (`Effect error:`); other effects and the pipeline
continue. Effects should catch their own errors and emit failure events:

```typescript
effect: async (evt, getState, emit) => {
  try {
    await emit("api", "fetchSuccess", await fetchData(evt.payload.url));
  } catch (error) {
    await emit("api", "fetchFailure", { error: String(error) });
  }
};
```

### Long, synchronous reducers

Reducers run on the main thread during the synchronous phase. A CPU-heavy reducer blocks that tick
and the UI. Keep reducers fast and pure; move heavy or async work to effects (or a Web Worker).

### Reducer refusal

A reducer may return `Rejected(reason)` instead of state. The **whole event** yields: no slice is
written, no change notification fires, and the caller is told why through `EmitResult.rejected`.
This is deliberately distinct from the two things it sits between - returning state unchanged,
which is indistinguishable from "this event did not concern me", and throwing, which is a bug.
A reducer that throws is isolated and its siblings still commit; a reducer that refuses has made a
decision the event as a whole respects. Refusals also reach `onRejected` for logging and
`InstrumentedEvent.rejected` for DevTools.

### Runaway re-emission

Two consumers wired into each other - a subscriber emitting what its own reducer answers, or two
slices answering each other's events - produce a chain with no end. Because the reduce queue drains
synchronously, that is not a slow program but a frozen tab or a pinned core, with no error and no
stack to attribute it to.

Every event therefore carries its causal position: `parentId` names the cause and `depth` is one
greater than it, or absent entirely on an event emitted by application code. **`maxReduceDepth`
defaults to 64** and refuses to extend a chain past it - a failure mode this severe should not
require configuration to avoid. Breaching reports through `onCascade` and the console rather than
throwing, because the throw would land in whichever subscriber or effect happened to be emitting.

Causality is tracked two ways, because the drain is synchronous and effects are not: within a drain
the store knows which event it is processing, so even an emit made through a captured `store`
reference is attributed correctly; across drains, the `emit` handed to effects carries the cause
through the `await`. An effect that reaches for `store.emit` *after* awaiting starts a fresh chain —
a documented limit rather than a papered-over one.

`maxTransitionsPerDrain` bounds burst width and stays **opt-in**: a fan-out is legitimately wide
where a cascade is narrow and deep, so depth separates them and a count cannot. It never refuses
the event that starts a drain - that is the caller's own emit, and refusing it would be a fault
rather than a protection.

> Note that a synchronous loop of emits is **not** one drain. `emit()` drains to completion before
> it returns, so `for (const x of xs) store.emit(...)` is N drains of one event, every one a root
> at depth 0. The queue only accumulates for re-entrant emits.

## Comparison to other libraries

### Redux (synchronous)

Synchronous reducers; `getState()` reflects the change immediately. Async needs thunks/sagas.
**Yoltra matches Redux's synchronous state timing** while providing a built-in async effect phase.

### Zustand (synchronous)

Synchronous `set()`; minimal overhead, no built-in async orchestration or event ordering. Yoltra
adds an event log, ordering, and the effect phase.

### XState (actor mailbox)

Asynchronous, per-actor mailboxes; powerful but a heavier mental model. Yoltra keeps a single
ordered reduce path with lightweight async effects.

### Yoltra (synchronous reduce + async effects)

```typescript
emit("todo", "add", todo);        // state updated synchronously, before this returns
await emit("todo", "add", todo);  // await to also wait for add's effects
```

- ✅ Synchronous, predictable state transitions (correct `getState()` after `emit`)
- ✅ Built-in async effects without a separate orchestration layer
- ✅ Strict reducer ordering; re-entrancy-safe
- ✅ Honest per-event completion promise
- ⚠️ Effect completion order across events is not serialized (by design)

## Design rationale

### Why synchronous reduce + async effects?

An earlier version made the entire pipeline async, including middleware. That made `getState()`
after `emit()` depend on whether middleware existed, and the completion promise resolved early for
queued events. Splitting the phases fixes both: reducers commit synchronously (predictable state),
effects stay async (non-blocking), and each `emit()` gets a truthful completion promise.

### Why synchronous middleware?

Middleware gates commits (authorization, validation, veto). Making it synchronous keeps the commit
decision in the same tick as the state change; genuinely async work (I/O) is an effect, matching
the Redux reducer/thunk split.

### Why a single reduce queue?

One FIFO queue guarantees global reducer ordering and simple, race-free semantics. Re-entrant emits
join the same pass rather than interleaving.

### Why opt-in dedup?

Silent content-dedup traded a correctness guarantee for a development-only Strict Mode artifact.
Making it opt-in (and adding identity-based `dedupKey`) restores "every emit dispatches" as the
default while still solving Strict Mode at its source.

---

## Appendix: implementation reference

The synchronous drain and the async effect task, condensed:

```typescript
public async emit(channel, type, payload, opts?): Promise<EmitResult> {
  // 1. Opt-in dedup (content window or explicit dedupKey); off by default.
  if (this.dedupConfig.windowMs > 0 || opts?.dedupKey !== undefined) {
    if (this.shouldDedupe(/* fingerprint or #dedupKey */)) return NOT_COMMITTED;
  }

  // 2. Causal position. A root event has neither field, so it stays byte-identical to one
  //    built before they existed - the same precedent `meta` set.
  const cause = this.currentEvent;               // non-null while a drain is in progress
  const depth = cause ? cause.depth + 1 : 0;
  if (cause && depth > this.maxReduceDepth) {
    this.reportCascade("maxReduceDepth", /* … */);  // veto this emit; do not throw
    return NOT_COMMITTED;
  }

  // 3. id + per-event completion deferred.
  const id = crypto.randomUUID();
  let resolve!: (r: EmitResult) => void;
  const done = new Promise<EmitResult>((r) => (resolve = r));

  // 4. Enqueue, then 5. drain synchronously.
  this.reduceQueue.push({ channel, type, payload, id, resolve, ...(cause && { parentId: cause.id, depth }) });
  this.drainReduce();

  // 6. Resolves when THIS event's effects finish.
  return done;
}

private drainReduce(): void {
  if (this.isReducing) return;
  this.isReducing = true;
  try {
    while (this.reduceQueue.length > 0) {
      const { resolve, ...ev } = this.reduceQueue.shift()!;
      this.currentEvent = ev;                      // so a re-entrant emit knows its cause
      const result = this.applyEventSync(ev);      // sync: middleware → stage → commit → subs
      void this.runEventEffects(ev, result, resolve); // async, independent per-event task
    }
  } finally {
    this.isReducing = false;
  }
}
```

---

## Glossary

**Reduce phase** - the synchronous part of `emit()`: middleware, reducers, subscribers, coarse
listeners. Completes before `emit()` returns.

**Effect phase** - the asynchronous part: each committed event's effects, run as an independent
task.

**Completion deferred** - the per-event `resolve` that settles the promise `emit()` returns, once
that event's effects finish.

**`isReducing`** - re-entrancy guard ensuring a single synchronous drain; re-entrant emits append to
the queue and are drained by the same pass.

**FIFO** - First-In-First-Out; reducers run in emit order.

**Veto** - a middleware returning `false`, producing an uncommitted event.

**Staging** - computing a slice's next value without writing it. Every matching slice is staged
first, then all of them are assigned under one new root, so no subscriber observes a partial event.

**Refusal** - a reducer returning `Rejected(reason)`. Distinct from a veto (middleware, before
reducers) and from a throw (a bug, isolated to its slice).

**Causal depth** - `depth` on an event: 0 for one emitted by application code, one greater than its
cause below that, with `parentId` naming the cause. Both are absent on a root event. Bounding it is
what stops a cascade from becoming a hung process.

---

## Revision History

| `@yoltra/core` | Date | Changes                                                                                                                                                                                                                 |
| ------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.6.0   | 2026-08 | Cascades bounded by causal depth (`maxReduceDepth`, on by default; `parentId`/`depth` on every caused event); commits staged and applied atomically across slices; `Rejected(reason)` from a reducer; `emit()` resolves to an `EmitResult`; new `written` event phase |
| 0.2.0   | 2026-07 | Two-phase pipeline: synchronous reduce (sync middleware, reducers commit before `emit()` returns) + independent async effects; honest per-event completion promise; opt-in deduplication (`dedupWindowMs` / `dedupKey`) |
| pre-rename | 2026-01 | Event subscriptions (committed/uncommitted/all phases)                                                                                                                                                                  |
| pre-rename | 2026-01 | Initial documentation of the event pipeline                                                                                                                                                                             |

---

**License:** MIT
**Repository:** https://github.com/yoltra/yoltra
