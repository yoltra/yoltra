[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / Action

# ~~Type Alias: Action\<EM, C, T, P\>~~

> **Action**\<`EM`, `C`, `T`, `P`\> = [`Event`](../interfaces/Event.md)\<`EM`, `C`, `T`, `P`\>

Defined in: [types.ts:570](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/core/src/types.ts#L570)

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md) = [`EventMapBase`](EventMapBase.md)

### C

`C` *extends* keyof `EM` = keyof `EM`

### T

`T` *extends* keyof `EM`\[`C`\] = keyof `EM`\[`C`\]

### P

`P` = `EM`\[`C`\]\[`T`\]

## Deprecated

Use [Event](../interfaces/Event.md) instead. Will be removed in v1.0.0.

Legacy type alias. Quo.js now uses event-bus terminology.
Note: The new Event type includes an `id` field for deduplication.
