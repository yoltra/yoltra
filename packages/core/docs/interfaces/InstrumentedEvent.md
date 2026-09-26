![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / InstrumentedEvent

# Interface: InstrumentedEvent\<EM\>

Defined in: [types.ts:364](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L364)

A single observed event delivered to an [InstrumentationObserver](../type-aliases/InstrumentationObserver.md).

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](../type-aliases/EventMapBase.md) = [`EventMapBase`](../type-aliases/EventMapBase.md)

Event map.

## Properties

### changedPaths

> **changedPaths**: `string`[]

Defined in: [types.ts:377](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L377)

Dotted **leaf** paths that changed, prefixed with the slice name (e.g.
`"todos.items.0.title"`). Empty when nothing changed. These are the exact
paths the store computed while reducing — no re-diff required.

***

### committed

> **committed**: `boolean`

Defined in: [types.ts:371](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L371)

`true` if the event passed middleware and ran reducers; `false` if vetoed.

***

### event

> **event**: `object`

Defined in: [types.ts:369](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L369)

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

Defined in: [types.ts:381](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L381)

New value at each changed path, keyed by path.

***

### prevValues

> **prevValues**: `Record`\<`string`, `unknown`\>

Defined in: [types.ts:379](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L379)

Old value at each changed path, keyed by path.

***

### reduceTimeMs

> **reduceTimeMs**: `number`

Defined in: [types.ts:383](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L383)

Wall-clock milliseconds spent in the synchronous reduce phase for this event.

***

### rejected?

> `optional` **rejected**: [`Rejection`](Rejection.md)

Defined in: [types.ts:392](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L392)

Present when a reducer refused the write, carrying its reason.

#### Remarks

Distinct from `committed: false`, which means middleware vetoed the event before any reducer
saw it. This is a reducer having considered the write and declined it — the two look
identical in state and are entirely different in cause.
