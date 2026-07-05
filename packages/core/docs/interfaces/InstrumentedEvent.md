[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / InstrumentedEvent

# Interface: InstrumentedEvent\<EM\>

Defined in: [types.ts:166](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/types.ts#L166)

A single observed event delivered to an [InstrumentationObserver](../type-aliases/InstrumentationObserver.md).

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](../type-aliases/EventMapBase.md) = [`EventMapBase`](../type-aliases/EventMapBase.md)

Event map.

## Properties

### changedPaths

> **changedPaths**: `string`[]

Defined in: [types.ts:176](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/types.ts#L176)

Dotted **leaf** paths that changed, prefixed with the slice name (e.g.
`"todos.items.0.title"`). Empty when nothing changed. These are the exact
paths the store computed while reducing — no re-diff required.

***

### committed

> **committed**: `boolean`

Defined in: [types.ts:170](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/types.ts#L170)

`true` if the event passed middleware and ran reducers; `false` if vetoed.

***

### event

> **event**: `object`

Defined in: [types.ts:168](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/types.ts#L168)

The processed event, including its generated `id`.

#### channel

> **channel**: `string`

#### id

> **id**: `string`

#### payload

> **payload**: `unknown`

#### type

> **type**: `string`

***

### nextValues

> **nextValues**: `Record`\<`string`, `unknown`\>

Defined in: [types.ts:180](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/types.ts#L180)

New value at each changed path, keyed by path.

***

### prevValues

> **prevValues**: `Record`\<`string`, `unknown`\>

Defined in: [types.ts:178](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/types.ts#L178)

Old value at each changed path, keyed by path.

***

### reduceTimeMs

> **reduceTimeMs**: `number`

Defined in: [types.ts:182](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/types.ts#L182)

Wall-clock milliseconds spent in the synchronous reduce phase for this event.
