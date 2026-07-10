[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / InstrumentationObserver

# Type Alias: InstrumentationObserver()\<EM\>

> **InstrumentationObserver**\<`EM`\> = (`info`) => `void`

Defined in: [types.ts:193](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/types.ts#L193)

Observer for [StoreInstance.instrument](../interfaces/StoreInstance.md#instrument). Called once per emitted event
(committed or vetoed), after the synchronous reduce phase.

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md) = [`EventMapBase`](EventMapBase.md)

Event map.

## Parameters

### info

[`InstrumentedEvent`](../interfaces/InstrumentedEvent.md)\<`EM`\>

## Returns

`void`
