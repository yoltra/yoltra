![Yoltra logo](../../../assets/yoltra-logo.png)

# Event Pipeline Architecture

> [ 🇲🇽 Versión en Español](https://github.com/yoltra/yoltra/blob/main/docs/es/design/event-queue-architecture.md)&nbsp; | &nbsp; 👉 🇺🇸 English Version

**Version:** 0.8.0
**Last Updated:** July 2026
**Status:** Stable

## Overview

Yoltra processes every event in **two phases**:

1. **A synchronous reduce phase** — middleware, reducers, committed/uncommitted event
   subscribers, and coarse listeners all run **in the same tick, before `emit()` returns**. So
   `getState()` is correct the instant `emit()` returns — with or without middleware.
2. **An asynchronous effect phase** — each committed event's effects run afterward as an
   **independent task**. The promise returned by `emit()` resolves when _that event's_ effects
   finish.

This split is the core of the design: **state transitions are synchronous and predictable**
(Redux-like), while **side effects are async and non-blocking** (thunk/saga-like), without a
separate orchestration layer. Reducers stay pure and synchronous; anything async belongs in an
effect.

> This replaces the earlier fully-async serialized queue (≤ v0.7). Middleware is now synchronous,
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
  resolve: () => void; // completion deferred for this specific event
}> = [];

private isReducing = false;   // re-entrancy guard for the synchronous drain
private inFlightEffects = 0;   // number of effect tasks currently running
```

**Properties:**

- **FIFO reduce queue** — events reduced in the order emitted; re-entrant emits preserve order.
- **`isReducing` guard** — ensures one synchronous drain is in flight; re-entrant emits append to
  the queue and are drained by the same pass (no reducer interleaving).
- **Per-event completion deferred** — each event carries its own `resolve`, so `await emit(...)`
  settles when that event's effects complete — not before, and not for an unrelated event.
- **Opt-in deduplication** — off by default; enabled per-store (`dedupWindowMs`) or per-emit
  (`dedupKey`). See [Deduplication](#deduplication-opt-in).

### The `emit()` entry point

```typescript
public async emit<C, T>(channel: C, type: T, payload: EM[C][T], opts?: EmitOptions): Promise<void>
```

**Steps:**

1. **Deduplication (opt-in)** — if content dedup is enabled (`dedupWindowMs > 0`) or an explicit
   `dedupKey` is supplied, skip the event when it matches a recent one. Off by default.
2. **Assign id + completion deferred** — a unique id and a `Promise` whose `resolve` fires after
   this event's effects run.
3. **Enqueue** — push the event onto `reduceQueue`.
4. **Drain synchronously** — call `drainReduce()`, which reduces every queued event in this tick.
5. **Return the completion promise** — resolves once this event's effects settle.

### Processing flow

```
emit(channel, type, payload)
        │
        ▼
  ┌───────────────────────┐   duplicate
  │ opt-in dedup check?    │ ───────────► return (skipped)
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
              │   while reduceQueue is non-empty:                   │
              ▼                                                     │
     ┌────────────────────────────┐   veto    ┌───────────────────┐│
     │ middleware (sync, may veto) │ ────────► │ uncommitted event ││
     └────────────┬───────────────┘           │ subscribers       ││
                  │ committed                  └───────────────────┘│
                  ▼                                                 │
     ┌────────────────────────────┐                                │
     │ reducers (key + pattern)    │                                │
     └────────────┬───────────────┘                                │
                  ▼                                                 │
     ┌────────────────────────────┐                                │
     │ committed event subscribers │  (fire-and-forget)             │
     └────────────┬───────────────┘                                │
                  ▼                                                 │
     ┌────────────────────────────┐                                │
     │ coarse listeners (if state  │                                │
     │ changed) + instrumentation  │                                │
     └────────────┬───────────────┘                                │
                  ▼                                                 │
     void runEventEffects(event) ── async, independent task ────────┘
                  │
                  ▼
  return `done` promise  ── resolves when THIS event's effects finish
```

## Phase 1 — Synchronous reduce

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

      const committed = this.applyEventSync(event);   // ← synchronous

      // Effects run as an independent task; the loop does NOT await them.
      void this.runEventEffects(event, committed, resolve);
    }
  } finally {
    this.isReducing = false;
  }
}
```

`applyEventSync()` is the synchronous core — middleware, reducers, subscribers, coarse listeners:

```typescript
private applyEventSync(event): boolean {
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
      this.notifyEventSubscribers(event, "uncommitted"); // rejected → uncommitted subs
      return false;                                       // do not commit
    }
  }

  // Reducers — key-based + pattern-based; track slice change by reference equality.
  const stateBefore = this.state;
  this.reducerBus.emit(event.channel, event.type, event.payload);
  for (const [slice, when] of this.patternReducers) {
    if (this.matchesWhen(when, event)) this.forwardEvent(slice, event);
  }
  const changed = stateBefore !== this.state;

  // Committed subscribers (fire-and-forget), then coarse listeners if state changed.
  this.notifyEventSubscribers(event, "committed");
  if (changed) this.listeners.forEach((l) => l());
  return true;
}
```

**Because this all runs before `emit()` returns:**

```typescript
store.emit("counter", "increment", 1);
store.getState().counter.value; // ← already updated, even with middleware present
```

## Phase 2 — Asynchronous effects

Each committed event's effects run in their **own async task**, not in a shared serialized loop:

```typescript
private async runEventEffects(event, committed, resolve): Promise<void> {
  this.inFlightEffects++;
  try {
    if (committed) await this.notifyEffects(event);
  } catch (err) {
    console.error("Effect error:", err);   // one effect failing never breaks the pipeline
  } finally {
    this.inFlightEffects--;
    resolve();                              // settles the emit() promise for THIS event
  }
}
```

Independent per-event tasks (rather than one shared serialized loop) let an effect `await` a
re-entrant `emit()` **without deadlocking** — the re-entrant event reduces synchronously on its own
and its effects schedule independently.

## Re-entrancy and ordering

Nested emits are safe and ordered:

- **A `emit()` inside middleware or a subscriber** (i.e. during the synchronous reduce) appends to
  `reduceQueue`; the active `drainReduce()` pass picks it up and reduces it after the current event
  — FIFO, with no reducer interleaving.
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

Deduplication is **off by default** — Yoltra never silently drops legitimate rapid-fire identical
events (double-clicks, a slider emitting the same value, two `+1`s). You opt in two ways:

| Mode | How | When it fires |
| --- | --- | --- |
| **Content-based** | `createStore({ dedupWindowMs: N })` (or `createYoltra`) | Skips an event whose `channel::type::payload` fingerprint recurs within `N` ms |
| **Identity-based** | `emit(c, t, p, { dedupKey })` | Skips an event whose explicit `dedupKey` recurs within the key window |

```typescript
// Off by default — both of these dispatch:
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

`emit()` returns a `Promise<void>` that resolves **when that specific event's effects complete**:

```typescript
await emit("api", "save", payload);
// ← resolves after save's effects have finished (state was already updated synchronously)
```

This is honest under concurrency: each event has its own completion deferred, so `await emit(b)`
never resolves early because some other event `a` happened to be mid-flight. If you only care about
the state change (not the effects), you don't need to await at all — the change is already visible.

## Event subscriptions

Event subscriptions observe events without affecting flow. They fire during the **synchronous**
phase.

| Phase | When notified | Use case |
| --- | --- | --- |
| `'committed'` | After reducers, before this event's effects | React to successful state changes |
| `'uncommitted'` | After middleware vetoes | React to blocked events (auth, validation) |
| `'all'` | Both phases (handler receives the phase) | Logging, analytics, debugging |

```typescript
// Committed (default)
store.onEvent("ui", "save", (event, getState) => {
  console.log("Save committed, new state:", getState());
});

// Uncommitted — middleware blocked it
store.onEvent("ui", "delete", () => console.log("Delete blocked by middleware"), "uncommitted");

// All — with the phase parameter
store.onEvent("ui", "action", (event, _get, _emit, phase) => {
  analytics.track(`event_${phase}`, { type: event.type });
}, "all");
```

Subscriber errors are caught and logged so one throwing subscriber never stops the others.

## Failure modes

### Middleware veto

A middleware returning `false` vetoes the event: reducers and effects never see it, uncommitted
subscribers fire, and the event does not commit. Middleware is synchronous — do authorization and
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

### Runaway re-emission

An effect that unconditionally re-emits its own trigger recurses without bound. Yoltra does not
police this — guard recursive emit chains in application code.

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
public async emit(channel, type, payload, opts?): Promise<void> {
  // 1. Opt-in dedup (content window or explicit dedupKey); off by default.
  if (this.dedupConfig.windowMs > 0 || opts?.dedupKey !== undefined) {
    if (this.shouldDedupe(/* fingerprint or #dedupKey */)) return;
  }

  // 2. id + per-event completion deferred.
  const id = crypto.randomUUID();
  let resolve!: () => void;
  const done = new Promise<void>((r) => (resolve = r));

  // 3. Enqueue, then 4. drain synchronously.
  this.reduceQueue.push({ channel, type, payload, id, resolve });
  this.drainReduce();

  // 5. Resolves when THIS event's effects finish.
  return done;
}

private drainReduce(): void {
  if (this.isReducing) return;
  this.isReducing = true;
  try {
    while (this.reduceQueue.length > 0) {
      const { resolve, ...ev } = this.reduceQueue.shift()!;
      const committed = this.applyEventSync(ev);   // sync: middleware → reducers → subs → coarse
      void this.runEventEffects(ev, committed, resolve); // async, independent per-event task
    }
  } finally {
    this.isReducing = false;
  }
}
```

---

## Glossary

**Reduce phase** — the synchronous part of `emit()`: middleware, reducers, subscribers, coarse
listeners. Completes before `emit()` returns.

**Effect phase** — the asynchronous part: each committed event's effects, run as an independent
task.

**Completion deferred** — the per-event `resolve` that settles the promise `emit()` returns, once
that event's effects finish.

**`isReducing`** — re-entrancy guard ensuring a single synchronous drain; re-entrant emits append to
the queue and are drained by the same pass.

**FIFO** — First-In-First-Out; reducers run in emit order.

**Veto** — a middleware returning `false`, producing an uncommitted event.

---

## Revision History

| Version | Date | Changes |
| --- | --- | --- |
| 0.8.0 | 2026-07 | Two-phase pipeline: synchronous reduce (sync middleware, reducers commit before `emit()` returns) + independent async effects; honest per-event completion promise; opt-in deduplication (`dedupWindowMs` / `dedupKey`) |
| 0.7.0 | 2026-01 | Event subscriptions (committed/uncommitted/all phases) |
| 0.5.0 | 2026-01 | Initial documentation of the event pipeline |

---

**License:** MIT
**Repository:** https://github.com/yoltra/yoltra
