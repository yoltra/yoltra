![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# Request and reply

> 👉 🇺🇸 English Version&nbsp; | &nbsp;[ 🇲🇽 Versión en Español](../es/REQUEST_REPLY_GUIDE.md)

An event bus is one-way by design: you emit, and whoever cares reacts. But some interactions are
genuinely a question and an answer — fetch this, validate that, run this job and tell me how it
went — and expressing those over a one-way bus means correlating a reply to a request by hand.

`store.call()` is that correlation, done once.

---

## The shape of the problem

Written by hand, request/reply looks like this every time:

```typescript
// Don't write this.
function ask(store, question) {
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    const timer = setTimeout(() => {
      off();
      reject(new Error("timeout"));
    }, 30_000);

    const off = store.onEvent("rpc", "answer", (event) => {
      if (event.meta?.correlationId !== id) return;
      clearTimeout(timer);
      off();
      resolve(event.payload);
    });

    void store.emit("rpc", "ask", question, { meta: { correlationId: id } });
  });
}
```

About eighty lines once you handle progress, cancellation and the several paths on which the
subscription has to be removed. It also carries two bugs almost every time:

- **The subscription outlives the call.** Miss one `off()` on one error path and the store grows a
  listener per request, forever.
- **The responder must echo the id, and one day it won't.** The symptom is a timeout: a reply that
  looks completely normal in the log, silently unmatched.

---

## The call

```typescript
const res = await store.call("rpc", "ask", { q: "who?" }, { reply: ["rpc", "answer"] });
res.payload.text;
```

The responder does nothing special. It replies through the `emit` it was handed:

```typescript
store.registerEffect({
  when: { keys: [["rpc", "ask"]] },
  effect: async (event, _get, emit) => {
    await emit("rpc", "answer", await lookup(event.payload.q));
  },
});
```

**There is no correlation id.** The store stamps `parentId` on anything emitted while an event is
being handled, so a reply sent through the injected `emit` is already correlated. Nothing to mint,
nothing to echo, nothing to forget.

### `payload` is the request

Worth stating because the signature reads ambiguously at a glance: `payload` is what you are
*sending*. What comes back is described by `reply`.

---

## Not knowing what will come back

A caller frequently cannot know which *kind* of reply it will get — an answer, a refusal, a
partial result. So a call resolves to the **event**, not the payload, because the event carries
the discriminant:

```typescript
const res = await store.call("rpc", "ask", { q }, { reply: ["rpc", ["answer", "error"]] });

switch (res.type) {
  case "answer":
    return res.payload.text;
  case "error":
    throw new Error(res.payload.reason);
}
```

`reply` names the types that **end** the call. Three forms:

| `reply` | Meaning |
|---|---|
| `["rpc", "answer"]` | one terminal type; the payload types exactly |
| `["rpc", ["answer", "error"]]` | either ends it; discriminate on `type` |
| `["rpc"]` | every event on the channel is terminal |

---

## Progress, and why the producer waits

Any correlated event that is **not** terminal is progress. Iterate the call to receive it:

```typescript
const call = store.call("job", "start", { id }, {
  reply: ["job", "done"],
  highWaterMark: 4,
});

for await (const step of call) {
  await renderProgress(step.payload);
}

const { payload } = await call; // the terminal reply
```

The responder streams by emitting non-terminal events, then one terminal:

```typescript
store.registerEffect({
  when: { keys: [["job", "start"]] },
  effect: async (event, _get, emit) => {
    for (const chunk of await plan(event.payload.id)) {
      await emit("job", "tick", chunk); // ← waits here while the consumer is behind
    }
    await emit("job", "done", { ok: true });
  },
});
```

### The backpressure is real

That `await emit(...)` genuinely blocks. It is not a queue with a limit that starts dropping — the
producer is paced by the reader, end to end:

```
responder                    store                      consumer
    │                          │                            │
    ├─ await emit("tick") ────►│                            │
    │                          ├─ effect: queue.put(item) ──┤ (buffer full)
    │        (parked)          │              ▲             │
    │                          │              └─────────────┤ for await … next()
    ◄──────── resolves ────────┤◄──────── item taken ───────┤
```

It works because of two things that already existed: `emit` resolves only once its effects have
run, and the collector *is* an effect. Nothing polls, nothing is dropped, and no buffer grows
without bound.

Pick `highWaterMark` for how far ahead the producer may run — `1` for lockstep, higher to absorb
jitter.

### Backpressure engages when you start iterating

A call that is only awaited never pulls. If its producer blocked, the call would deadlock itself:
progress nobody reads would stop the terminal event from ever being sent, so the `await` would
never return.

So un-iterated progress buffers to `highWaterMark`, and beyond that is counted:

```typescript
const call = store.call("job", "start", { id }, { reply: ["job", "done"] });
const res = await call;
call.dropped; // progress you chose not to read
```

`dropped > 0` is not an error. It is the honest count of what a caller skipped, and worth logging
rather than guessing at.

---

## Giving up

```typescript
const call = store.call("job", "start", { id }, {
  reply: ["job", "done"],
  timeoutMs: 5_000,
  signal: AbortSignal.timeout(60_000),
});
```

**`timeoutMs` is idle, not total.** Every correlated event resets it, progress included. A job
that streams for two minutes will not fail a five-second call — the timeout asks "is the responder
still alive?", not "is it finished yet?".

For a real deadline — *this must be done by then, however lively* — use `signal`. The two compose:
above, the responder may go quiet for at most five seconds, and the whole thing may take at most
sixty.

```typescript
call.cancel("user navigated away");
```

However a call ends — resolved, timed out, aborted, cancelled — the subscription is removed and
any producer parked on backpressure is released. A wedged responder would be worse than the
unbounded buffer this replaced.
---

## Testing a call

Nothing special is required — a responder is an ordinary effect:

```typescript
it("answers", async () => {
  const store = createStore<{}, EM>({ name: "test" });
  store.registerEffect({
    when: { keys: [["rpc", "ask"]] },
    effect: async (_e, _get, emit) => {
      await emit("rpc", "answer", { text: "hi" });
    },
  });

  const res = await store.call("rpc", "ask", { q: "?" }, { reply: ["rpc", "answer"] });
  expect(res.payload.text).toBe("hi");
});
```

To assert backpressure rather than assume it, record when the producer's `emit` *resolves* and
compare against how much the consumer has taken:

```typescript
for await (const step of call) {
  consumed.push(step.payload.n);
  expect(emitted.length).toBeLessThanOrEqual(consumed.length + 1); // hwm of 1
  await slowWork();
}
```

---

## See also

- [`@yoltra/core` README](../../packages/core/README.md) — the full store API
- [Event Pipeline Architecture](./design/event-queue-architecture.md) — why effects are awaited,
  which is what makes the backpressure possible
