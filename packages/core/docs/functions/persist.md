![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / persist

# Function: persist()

> **persist**(`store`, `options`): () => `void`

Defined in: [persistence/persist.ts:204](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/persist.ts#L204)

Writes state as it changes.

## Parameters

### store

[`PersistableStore`](../interfaces/PersistableStore.md)

### options

[`PersistOptions`](../interfaces/PersistOptions.md)

## Returns

A function that stops persisting and flushes anything pending.

> (): `void`

### Returns

`void`

## Remarks

Driven by `instrument` rather than the coarse subscription, so a change confined to a slice
that is not persisted costs nothing at all. Writes are coalesced on the trailing edge.
