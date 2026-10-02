![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / StoreMetrics

# Interface: StoreMetrics

Defined in: [types.ts:477](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L477)

A store's current load, from [StoreInstance.metrics](StoreInstance.md#metrics).

## Properties

### dedupEntries

> `readonly` **dedupEntries**: `number`

Defined in: [types.ts:485](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L485)

Fingerprints held for deduplication, which is the cache's memory in entries.

***

### dedupHits

> `readonly` **dedupHits**: `number`

Defined in: [types.ts:483](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L483)

Emits dropped as duplicates since the store was created.

***

### inFlightEffects

> `readonly` **inFlightEffects**: `number`

Defined in: [types.ts:481](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L481)

Events whose effects are still running.

***

### queueDepth

> `readonly` **queueDepth**: `number`

Defined in: [types.ts:479](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L479)

Events emitted and waiting to be reduced. Non-zero only during a synchronous drain.
