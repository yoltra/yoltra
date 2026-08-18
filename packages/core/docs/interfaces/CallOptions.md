![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / CallOptions

# Interface: CallOptions\<EM\>

Defined in: [store/call.ts:31](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L31)

Options for [StoreInstance.call](StoreInstance.md#call).

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](../type-aliases/EventMapBase.md)

## Properties

### correlationId?

> `readonly` `optional` **correlationId**: `string`

Defined in: [store/call.ts:83](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L83)

Correlate on this id instead of on causality.

#### Remarks

Causal matching — a reply is correlated because the store stamped it as *caused by* the
request — is free and cannot be forged, but only holds in one process. A reply arriving from
another node, a worker, or any transport carries no causal link, so for those the responder
echoes an id and both sides agree on it here.

When set, the id is sent as `meta.correlationId` and a reply matches if it echoes the same
value **or** is causally descended. Causality still wins where it applies, so a local
responder needs no changes to be compatible with a remote one.

***

### highWaterMark?

> `readonly` `optional` **highWaterMark**: `number`

Defined in: [store/call.ts:68](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L68)

How many progress events may buffer before the producer is made to wait.

#### Remarks

Only meaningful once the caller is iterating. See [StoreInstance.call](StoreInstance.md#call) for what
backpressure means here and when it engages.

#### Default

```ts
16
```

***

### reply

> `readonly` **reply**: [`ReplySpec`](../type-aliases/ReplySpec.md)\<`EM`\>

Defined in: [store/call.ts:33](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L33)

Which reply events end the call. See [ReplySpec](../type-aliases/ReplySpec.md).

***

### signal?

> `readonly` `optional` **signal**: `AbortSignal`

Defined in: [store/call.ts:57](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L57)

Aborts the call. The returned promise rejects and the iterator ends.

#### Remarks

Unlike `timeoutMs` this is absolute, so it is the right tool for a request deadline, a
user-cancelled action, or a component unmounting.

***

### timeoutMs?

> `readonly` `optional` **timeoutMs**: `number`

Defined in: [store/call.ts:48](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/call.ts#L48)

How long the call may sit **idle** before it gives up, in milliseconds.

#### Remarks

Idle, not total: every correlated event resets it, progress included. A job that streams for
two minutes must not fail a thirty-second call, and a total deadline would make the timeout a
function of how much work the responder had to do rather than whether it is still alive.

For a genuine deadline — "this must be finished by then, however lively" — use
[CallOptions.signal](#signal) with an `AbortSignal.timeout()`.

#### Default

```ts
30000
```
