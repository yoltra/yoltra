[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / InstrumentedEvent

# Interface: InstrumentedEvent\<EM\>

Defined in: [types.ts:235](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L235)

A single observed event delivered to an [InstrumentationObserver](../type-aliases/InstrumentationObserver.md).

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](../type-aliases/EventMapBase.md) = [`EventMapBase`](../type-aliases/EventMapBase.md)

Event map.

## Properties

### changedPaths

> **changedPaths**: `string`[]

Defined in: [types.ts:248](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L248)

Dotted **leaf** paths that changed, prefixed with the slice name (e.g.
`"todos.items.0.title"`). Empty when nothing changed. These are the exact
paths the store computed while reducing — no re-diff required.

***

### committed

> **committed**: `boolean`

Defined in: [types.ts:242](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L242)

`true` if the event passed middleware and ran reducers; `false` if vetoed.

***

### event

> **event**: `object`

Defined in: [types.ts:240](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L240)

The processed event, including its `id` and any [EventMeta](../type-aliases/EventMeta.md) the emitter attached.
`meta` is absent unless it was supplied.

#### channel

> **channel**: `string`

#### id

> **id**: `string`

#### meta?

> `optional` **meta**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

#### payload

> **payload**: `unknown`

#### type

> **type**: `string`

***

### nextValues

> **nextValues**: `Record`\<`string`, `unknown`\>

Defined in: [types.ts:252](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L252)

New value at each changed path, keyed by path.

***

### prevValues

> **prevValues**: `Record`\<`string`, `unknown`\>

Defined in: [types.ts:250](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L250)

Old value at each changed path, keyed by path.

***

### reduceTimeMs

> **reduceTimeMs**: `number`

Defined in: [types.ts:254](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L254)

Wall-clock milliseconds spent in the synchronous reduce phase for this event.
