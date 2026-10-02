![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / InstrumentedEffects

# Interface: InstrumentedEffects\<EM\>

Defined in: [types.ts:498](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L498)

What [StoreInstance.instrumentEffects](StoreInstance.md#instrumenteffects) reports once every effect for an event has settled.

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](../type-aliases/EventMapBase.md) = [`EventMapBase`](../type-aliases/EventMapBase.md)

Event map.

## Properties

### at

> `readonly` **at**: `number`

Defined in: [types.ts:502](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L502)

Clock time ([StoreSpec.clock](../type-aliases/StoreSpec.md#clock)) when the last effect settled.

***

### durationMs

> `readonly` **durationMs**: `number`

Defined in: [types.ts:504](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L504)

The whole effect phase, from the first effect's start to the last one's settlement.

***

### effects

> `readonly` **effects**: readonly [`InstrumentedEffect`](InstrumentedEffect.md)[]

Defined in: [types.ts:506](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L506)

One entry per effect, in the order they ran.

***

### event

> `readonly` **event**: `object`

Defined in: [types.ts:500](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L500)

The event, as [InstrumentedEvent.event](InstrumentedEvent.md#event) describes it.

#### channel

> **channel**: `string`

#### depth?

> `optional` **depth**: `number`

[Event.depth](Event.md#depth): how deep in a causal chain this event is. Absent on a root event.

#### id

> **id**: `string`

#### meta?

> `optional` **meta**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

#### parentId?

> `optional` **parentId**: `string`

[Event.parentId](Event.md#parentid): the event whose handling caused this one. Absent on a root event.

#### payload

> **payload**: `unknown`

#### type

> **type**: `string`
