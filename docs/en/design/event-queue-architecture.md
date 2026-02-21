![Yoltra logo](../../../assets/yoltra-logo.png)

# Event Queue Architecture

> [ 🇲🇽 Versión en Español](https://github.com/yoltra/yoltra/blob/main/docs/es/design/event-queue-architecture.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](https://github.com/yoltra/yoltra/blob/main/docs/pt/design/event-queue-architecture.md)&nbsp; |
> &nbsp; 👉 [ 🇺🇸 English Version](https://github.com/yoltra/yoltra/blob/main/docs/en/design/event-queue-architecture.md)&nbsp; |
> &nbsp;[ 🇫🇷 Version française](https://github.com/yoltra/yoltra/blob/main/docs/fr/design/event-queue-architecture.md)

**Version:** 0.7.0
**Last Updated:** January 2026
**Status:** Stable

## Overview

Yoltra employs an **asynchronous, serialized event queue** with a re-entrancy guard for backpressure control. This architecture ensures predictable event ordering and prevents race conditions while supporting async middleware and effects.

## Core Mechanism

### Queue Structure

```typescript
private readonly eventQueue: Array<{
  channel: string;
  type: string;
  payload: any;
  id: symbol;
}> = [];

private isProcessingQueue = false;
```

**Properties:**
- **Unbounded FIFO queue** - Events enqueued in order received
- **Single processing flag** - Prevents concurrent drain operations
- **Event deduplication** - Unique symbol IDs prevent double-processing (React Strict Mode safety)

### Emission Pipeline

```typescript
public async emit<C, T>(
  channel: C,
  type: T,
  payload: EM[C][T]
): Promise<void>
```

**Steps:**

1. **ID Generation** - Assign unique `Symbol` to event
2. **Enqueue** - Push to `eventQueue` (always happens)
3. **Backpressure Check** - If `isProcessingQueue === true`, return immediately
4. **Acquire Lock** - Set `isProcessingQueue = true`
5. **Drain Loop** - Process all queued events sequentially
6. **Release Lock** - Set `isProcessingQueue = false`

### Processing Flow

```
┌─────────────────────────────────────────────────────────────┐
│ emit(channel, type, payload)                                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │ Generate ID   │
         └───────┬───────┘
                 │
                 ▼
         ┌───────────────┐
         │ Enqueue Event │
         └───────┬───────┘
                 │
                 ▼
         ┌────────────────────┐
         │ isProcessingQueue? │
         └───────┬────────┬───┘
                 │        │
            YES  │        │ NO
                 │        │
                 ▼        ▼
         ┌────────┐  ┌──────────────┐
         │ Return │  │ Set Flag=true│
         └────────┘  └──────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ while(queue)  │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────────┐
                    │ Deduplication     │
                    └───────┬───────────┘
                            │
                            ▼
                    ┌───────────────────┐
                    │ Middleware        │──────────────────┐
                    │ (may cancel)      │                  │
                    └───────┬───────────┘                  │
                            │                              │
                            │ (allowed)                    │ (rejected)
                            │                              │
                            ▼                              ▼
                    ┌───────────────────┐      ┌─────────────────────────┐
                    │ Reducers (sync)   │      │ Uncommitted Event Subs  │
                    └───────┬───────────┘      │ + 'all' Subs (phase=    │
                            │                  │    'uncommitted')       │
                            ▼                  └─────────────┬───────────┘
                    ┌───────────────────┐                    │
                    │ Committed Event   │                    ▼
                    │ Subscribers +     │            ┌───────────────┐
                    │ 'all' Subs (phase │            │ DevTools      │
                    │   ='committed')   │            │ [CANCELLED]   │
                    └───────┬───────────┘            └───────┬───────┘
                            │                                │
                            ▼                                ▼
                    ┌───────────────────┐            ┌───────────────┐
                    │ Effects (async)   │            │ Continue Loop │
                    └───────┬───────────┘            └───────────────┘
                            │
                            ▼
                    ┌───────────────────┐
                    │ Coarse Subscribers│
                    │ (if state changed)│
                    └───────┬───────────┘
                            │
                            ▼
                    ┌───────────────────┐
                    │ DevTools          │
                    └───────┬───────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ Set Flag=false│
                    └───────────────┘
```

## Backpressure Model

### Re-entrancy Guard

The store uses a **boolean flag** (`isProcessingQueue`) to implement back-pressure:

```typescript
if (this.isProcessingQueue) return;  // Back-pressure applied here
```

**Mechanism:**

- **First `emit()` call** acquires the lock and begins draining
- **Subsequent `emit()` calls** (while draining) enqueue and return immediately
- **Nested `emit()` calls** (from middleware/effects) are queued for later processing

### Execution Model

Yoltra uses a **"baton passing"** model where the first unblocked `emit()` call consumes the entire queue:

```
Timeline:

T0: emit('event1') [Component A]
    → isProcessingQueue = false
    → Acquire lock
    → Begin drain loop
   
T1: emit('event2') [Middleware during event1]
    → isProcessingQueue = true (BLOCKED)
    → Enqueue only
    → Return immediately
   
T2: emit('event3') [Effect during event1]
    → isProcessingQueue = true (BLOCKED)
    → Enqueue only
    → Return immediately
   
T3: Drain loop continues [Original emit('event1')]
    → Process event1
    → Process event2 (picked up from queue)
    → Process event3 (picked up from queue)
    → Release lock
    → Return
```

**Key Property:** There is **no separate consumer thread or worker**. Queue consumption is driven entirely by `emit()` calls.

## Ordering Guarantees

### FIFO Ordering

Events are processed in strict enqueue order:

```typescript
await emit('ui', 'event1', p1);  // Enqueued at index 0
await emit('ui', 'event2', p2);  // Enqueued at index 1
await emit('ui', 'event3', p3);  // Enqueued at index 2

// Processing order: event1 → event2 → event3 (guaranteed)
```

### Serialization

Events **never** process concurrently:

```typescript
while (this.eventQueue.length) {
  const event = this.eventQueue.shift()!;
 
  // Deduplication
  if (this.processedEventIds.has(event.id)) continue;
  this.processedEventIds.add(event.id);
 
  // Middleware (async)
  for (const mw of this.middleware) {
    const ok = await mw(state, event, emit);  // ← Awaits each
    if (!ok) break;
  }
 
  // Reducers (sync)
  this.reducerBus.emit(event.channel, event.type, event.payload);
 
  // Effects (async)
  await this.notifyEffects(event);  // ← Awaits completion
 
  // Subscribers (sync)
  if (stateChanged) this.listeners.forEach(l => l());
 
  // DevTools (sync)
  this.devtools?.send(action, state);
}
```

**Property:** The next event in the queue does not begin processing until the current event completes its entire pipeline (including async effects).

### Re-entrancy Safety

Nested `emit()` calls during event processing are safe:

```typescript
// Middleware that emits
const middleware: MiddlewareFunction = async (state, event, emit) => {
  if (event.type === 'fetchData') {
    await emit('ui', 'loading', true);     // ← Nested emit
    const data = await fetch('/api');
    await emit('data', 'loaded', data);    // ← Nested emit
  }
  return true;
};

// User code
await emit('api', 'fetchData', { url: '/todos' });
// Result: 'fetchData' → 'loading' → 'loaded' (in order)
```

## Concurrency Model

### Single-Threaded JavaScript

JavaScript's event loop ensures only one `emit()` call executes at a time:

```typescript
// Component A (microtask 1)
emit('event1');

// Component B (microtask 2)
emit('event2');

// Actual execution:
// 1. emit('event1') runs to completion (or yields to await)
// 2. emit('event2') runs (may queue if event1 still draining)
```

### Microtask Scheduling

Async/await places continuations in the microtask queue:

```typescript
async function example() {
  await emit('event1');  // Yields here
  // Continuation scheduled as microtask
  console.log('after event1');
}
```

**Implication:** Multiple `emit()` calls from different components may interleave at await boundaries, but queue ordering is preserved.

## Event Deduplication

### React Strict Mode Protection

React 18+ Strict Mode executes effects twice in development:

```typescript
useEffect(() => {
  emit('analytics', 'pageView', { page });  // Fires 2x in dev!
}, [page]);
```

**Solution:** Event ID tracking prevents double-processing:

```typescript
private readonly processedEventIds = new Set<symbol>();

// In drain loop:
if (this.processedEventIds.has(event.id)) continue;  // Skip duplicate
this.processedEventIds.add(event.id);
```

### Cleanup Strategy

IDs are periodically cleared to prevent memory leaks:

```typescript
// Constructor
this.eventIdCleanupTimer = setInterval(() => {
  this.processedEventIds.clear();
}, cleanupInterval);  // 30s dev, 5min prod

// Disposal
public dispose(): void {
  if (this.eventIdCleanupTimer) {
    clearInterval(this.eventIdCleanupTimer);
    this.eventIdCleanupTimer = null;
  }
  this.processedEventIds.clear();
}
```

**Assumption:** Events older than the cleanup interval will never be re-emitted (safe for most apps).

## Performance Characteristics

### Time Complexity

| Operation | Complexity | Notes |
|-----------|------------|-------|
| `emit()` enqueue | O(1) | Array push |
| `emit()` drain (queue empty) | O(n×m) | n = events, m = middleware+effects |
| `emit()` drain (queue has events) | O(1) | Returns immediately |
| Event deduplication | O(1) | Set lookup |
| Middleware pipeline | O(k) | k = number of middleware |
| Reducer dispatch | O(1) | Direct EventBus emission |
| Effect dispatch | O(1) | Map lookup by key |

### Space Complexity

| Structure | Complexity | Notes |
|-----------|------------|-------|
| `eventQueue` | O(n) | n = queued events (unbounded) |
| `processedEventIds` | O(m) | m = events since last cleanup |
| `middleware` | O(k) | k = registered middleware |
| `effects` | O(e) | e = registered effects |

### Bottlenecks

1. **Slow Reducers** - Block entire queue (synchronous)
2. **Slow Middleware** - Block event processing (async but sequential)
3. **Slow Effects** - Block next event in queue (async but sequential)
4. **Queue Growth** - Unbounded memory usage if events enqueue faster than processing

## Failure Modes

### Queue Overflow (Unbounded Growth)

**Scenario:** Events enqueue faster than they can be processed.

```typescript
// Pathological case: Recursive emission
registerEffect({
  events: [['ui', 'tick']],
  effect: async (evt, getState, emit) => {
    await emit('ui', 'tick', evt.payload + 1);  // Infinite recursion!
  }
});

emit('ui', 'tick', 0);  // Queue grows without bound
```

**Symptoms:**
- Increasing memory usage
- Degraded performance
- Eventual OOM crash

**Mitigation:** Application must avoid infinite loops. Store has no built-in protection.

### Event Loop Starvation

**Scenario:** Long-running reducer blocks the event loop.

```typescript
reducer: (state, event) => {
  // Synchronous, expensive computation
  for (let i = 0; i < 1e9; i++) {
    // CPU-bound work
  }
  return { ...state, result: i };
}
```

**Symptoms:**
- UI freezes
- Other events stuck in queue
- Poor user experience

**Mitigation:** Keep reducers fast and pure. Move heavy computation to effects or Web Workers.

### Middleware Cancellation

**Scenario:** Middleware cancels event by returning `false`.

```typescript
const authMiddleware: MiddlewareFunction = (state, event) => {
  if (!state.auth.isAuthenticated) {
    console.warn('Unauthorized event:', event);
    return false;  // Cancel propagation
  }
  return true;
};
```

**Behavior:**
- Event is dequeued but not processed
- Reducers and effects never see the event
- Subscribers are not notified
- Event is lost (no retry mechanism)

**Consideration:** Ensure cancellation is intentional and logged appropriately.

### Effect Errors

**Scenario:** Effect throws an error.

```typescript
registerEffect({
  events: [['api', 'fetch']],
  effect: async (evt) => {
    const res = await fetch(evt.payload.url);
    const data = await res.json();  // May throw if not JSON
    // ...
  }
});
```

**Behavior:**
- Error is caught and logged: `console.error("Effect error:", err);`
- Other effects still execute
- Queue draining continues
- Application must handle error state via error events

**Best Practice:** Effects should catch errors and emit failure events:

```typescript
effect: async (evt, getState, emit) => {
  try {
    const data = await fetchData(evt.payload.url);
    await emit('api', 'fetchSuccess', data);
  } catch (error) {
    await emit('api', 'fetchFailure', { error: error.message });
  }
}
```

## Event Subscriptions (v0.7.0+)

### Overview

Event subscriptions provide a way to observe events without affecting the event flow. Unlike middleware (which can cancel events) and effects (which run after the event pipeline), event subscriptions are purely observational.

### Subscription Phases

| Phase | When Notified | Use Case |
|-------|---------------|----------|
| `'committed'` | After reducers, before effects | React to successful state changes |
| `'uncommitted'` | After middleware rejects | React to blocked events |
| `'all'` | Both phases (with phase parameter) | Logging, analytics, debugging |

### Processing Order

**For committed events:**
```
Middleware (allows) → Reducers → Committed Event Subs → Effects → Coarse Subs
```

**For uncommitted events:**
```
Middleware (rejects) → Uncommitted Event Subs → DevTools [CANCELLED]
```

### Handler Signature

```typescript
type EventSubscriptionHandler = (
  event: EventUnion<EM>,
  getState: () => S,
  emit: Emit<EM>,
  phase: 'committed' | 'uncommitted'
) => void | Promise<void>;
```

**Parameters:**
- `event` - The full event object `{ channel, type, payload, id }`
- `getState` - Returns current state (after reducers for committed, unchanged for uncommitted)
- `emit` - Allows emitting new events from the handler
- `phase` - The phase that triggered this notification

### Error Handling

Event subscription errors are caught and logged, allowing other subscriptions to continue:

```typescript
// If one subscription throws, others still execute
store.onEvent('ui', 'click', () => { throw new Error('boom'); });
store.onEvent('ui', 'click', () => { console.log('still runs'); }); // ✅
```

### Usage Example

```typescript
// Committed events (default)
store.onEvent('ui', 'save', (event, getState, emit, phase) => {
  console.log('Save committed, new state:', getState());
});

// Uncommitted events
store.onEvent('ui', 'delete', (event, getState, emit, phase) => {
  console.log('Delete was blocked by middleware');
}, 'uncommitted');

// All events
store.onEvent('ui', 'action', (event, getState, emit, phase) => {
  analytics.track(`event_${phase}`, { type: event.type });
}, 'all');
```

## Comparison to Other Libraries

### Redux (Synchronous)

```typescript
// Redux: Immediate, synchronous processing
dispatch({ type: 'ADD_TODO', payload: todo });
// ↑ Blocks until all reducers complete
// ↑ No queue, no async support

const state = store.getState();  // Immediately reflects change
```

**Properties:**
- ✅ Predictable timing
- ✅ Simple mental model
- ❌ No async middleware support (requires redux-thunk/saga)
- ❌ Blocks event loop if reducer is slow

### Zustand (Synchronous)

```typescript
// Zustand: Immediate, synchronous state updates
set({ todos: [...todos, newTodo] });
// ↑ Synchronous mutation + notification

get().todos;  // Immediately has new todo
```

**Properties:**
- ✅ Minimal overhead
- ✅ Simple API
- ❌ No built-in async patterns
- ❌ No event ordering guarantees with concurrent updates

### XState (Actor Model)

```typescript
// XState: Asynchronous actor mailbox
actor.send({ type: 'FETCH' });
actor.send({ type: 'UPDATE' });
// ↑ Events queued in actor's mailbox
// ↑ Processed asynchronously by state machine

// Multiple actors may process concurrently
```

**Properties:**
- ✅ True concurrent processing (multiple actors)
- ✅ Built-in async state machine semantics
- ❌ Complex mental model
- ❌ Higher memory overhead (one mailbox per actor)

### Yoltra (Async Queue)

```typescript
// Yoltra: Asynchronous, serialized queue
await emit('todo', 'add', todo);
// ↑ Returns promise when processing complete
// ↑ Queued if another event is processing

await emit('todo', 'delete', id);
// ↑ Guaranteed to process after 'add'
```

**Properties:**
- ✅ Async middleware/effects support
- ✅ Strict ordering guarantees
- ✅ Re-entrancy safe
- ❌ Unbounded queue (memory risk)
- ❌ No parallel processing (single queue)

## Design Rationale

### Why Async?

**Requirement:** Support async middleware and effects without blocking the application.

**Alternative Considered:** Synchronous model (like Redux)
- **Rejected:** Requires separate async orchestration layer (thunks, sagas)
- **Chosen:** Built-in async support via `Promise<void>` return type

### Why Single Queue?

**Requirement:** Guarantee event ordering for predictable state transitions.

**Alternative Considered:** Multiple queues (per channel or per reducer)
- **Rejected:** Complex ordering semantics, potential race conditions
- **Chosen:** Single queue ensures global ordering

### Why Re-entrancy Guard?

**Requirement:** Prevent queue corruption from nested `emit()` calls.

**Alternative Considered:** Disallow nested emits (throw error)
- **Rejected:** Breaks common patterns (middleware emitting events)
- **Chosen:** Queue and defer nested events

### Why No Queue Limit?

**Requirement:** Never drop events in production (data loss risk).

**Alternative Considered:** Fixed-size circular buffer with overflow policy
- **Considered:** Could drop events or throw errors on overflow
- **Chosen:** Unbounded queue prioritizes correctness over memory safety
- **Future:** May add optional limits with configurable policies


-------


## Appendix: Implementation Reference

### Core Event Loop

```typescript
public async emit<C extends keyof EM, T extends keyof EM[C]>(
  channel: C,
  type: T,
  payload: EM[C][T],
): Promise<void> {
  const id = Symbol("event");
 
  this.eventQueue.push({
    channel: channel as string,
    type: type as string,
    payload,
    id,
  });

  if (this.isProcessingQueue) return;

  this.isProcessingQueue = true;
  try {
    while (this.eventQueue.length) {
      const { channel, type, payload, id } = this.eventQueue.shift()!;

      if (this.processedEventIds.has(id)) {
        continue;
      }

      this.processedEventIds.add(id);

      const event = { channel, type, payload, id } as Event<EM, C, T>;
      let propagate = true;

      for (const mw of this.middleware) {
        try {
          const ok = await mw(this.state, event, this.emit);
          if (!ok) {
            propagate = false;
            break;
          }
        } catch (err) {
          console.error("Middleware error:", err);
          propagate = false;
          break;
        }
      }

      if (!propagate) {
        this.devtools?.send(
          { type: `Channel: ${channel} - Type: ${type} [CANCELLED]`, payload },
          this.state,
        );
        continue;
      }

      const stateBefore = this.state;
      this.reducerBus.emit(channel as C, type as T, payload);
      const stateAfter = this.state;
      const anySliceChanged = stateBefore !== stateAfter;

      await this.notifyEffects(event as any);

      if (anySliceChanged) {
        this.listeners.forEach((l) => l());
      }

      this.devtools?.send(
        { type: `Channel: ${channel} - Type: ${type}`, payload },
        this.state,
      );
    }
  } catch (err) {
    console.error("Emit queue error:", err);
  } finally {
    this.isProcessingQueue = false;
  }
}
```

### Event Deduplication

```typescript
private readonly processedEventIds = new Set<symbol>();
private eventIdCleanupTimer: ReturnType<typeof setInterval> | null = null;

constructor(spec: StoreSpec<R, S, EM>) {
  // ...
 
  const cleanupInterval =
    process.env.NODE_ENV === "production" ? 5 * 60 * 1000 : 30 * 1000;
   
  this.eventIdCleanupTimer = setInterval(() => {
    this.processedEventIds.clear();
  }, cleanupInterval);
}

public dispose(): void {
  if (this.eventIdCleanupTimer) {
    clearInterval(this.eventIdCleanupTimer);
    this.eventIdCleanupTimer = null;
  }
  this.processedEventIds.clear();
}
```

---

## Glossary

**Backpressure**: Mechanism to prevent queue overflow by slowing or blocking event production.

**Baton Passing**: Execution model where control transfers from one async operation to another.

**Drain Loop**: The `while` loop that processes all queued events sequentially.

**FIFO**: First-In-First-Out - events are processed in enqueue order.

**Re-entrancy**: Property allowing a function to be called while it's already executing.

**Serialization**: Processing events one-at-a-time, never concurrently.

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 0.7.0 | 2026-01 | Added Event Subscriptions feature (committed/uncommitted/all phases) |
| 0.5.0 | 2026-01 | Initial documentation of async queue architecture |

---

**Author**: Yoltra Team 
**License**: MIT 
**Repository**: https://github.com/yoltra/yoltra