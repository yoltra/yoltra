![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / CallHandle

# Interface: CallHandle\<TReply, TProgress\>

Defined in: [store/call.ts:112](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L112)

The result of [StoreInstance.call](StoreInstance.md#call): awaitable for the terminal reply, async-iterable for
progress.

## Remarks

One object serving both shapes, rather than two functions, because the caller's intent is not
known at the call site — the same request may be awaited in one place and streamed in another,
and the responder should not have to care which.

```ts
// Await the answer, ignore the running commentary.
const done = await store.call("rpc", "ask", { q }, { reply: ["rpc", "answer"] });

// Or consume the commentary, then take the answer.
const call = store.call("rpc", "ask", { q }, { reply: ["rpc", "answer"] });
for await (const step of call) render(step.payload);
const answer = await call;
```

Awaiting the same call twice is safe and yields the same reply; the terminal event is retained.

## Extends

- `Promise`\<`TReply`\>.`AsyncIterable`\<`TProgress`\>

## Type Parameters

### TReply

`TReply`

The terminal reply event.

### TProgress

`TProgress`

Non-terminal correlated events.

## Properties

### dropped

> `readonly` **dropped**: `number`

Defined in: [store/call.ts:121](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L121)

Progress events discarded because nothing was iterating.

#### Remarks

Zero unless the call was awaited without being iterated *and* the responder streamed more
than `highWaterMark` events. Non-zero is not an error — it is the honest count of what a
caller chose not to read, and is worth logging rather than guessing at.

## Methods

### cancel()

> **cancel**(`reason?`): `void`

Defined in: [store/call.ts:124](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L124)

Stops listening and settles the call. Safe to call more than once.

#### Parameters

##### reason?

`string`

#### Returns

`void`
