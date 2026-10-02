![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / persist

# Function: persist()

> **persist**(`store`, `options`): () => `Promise`\<`void`\>

Defined in: [persistence/persist.ts:298](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L298)

Writes state as it changes.

## Parameters

### store

[`PersistableStore`](../interfaces/PersistableStore.md)

### options

[`PersistOptions`](../interfaces/PersistOptions.md)

## Returns

A function that stops persisting, flushes anything pending, and returns a promise
  that resolves once the last write has settled. Await it before a process exits: with an
  asynchronous adapter the final write is otherwise still in flight. It never rejects; a
  failed write is reported through `onError`.

> (): `Promise`\<`void`\>

### Returns

`Promise`\<`void`\>

## Remarks

Driven by `instrument` rather than the coarse subscription, so a change confined to a slice
that is not persisted costs nothing at all. Writes are coalesced on the trailing edge.
