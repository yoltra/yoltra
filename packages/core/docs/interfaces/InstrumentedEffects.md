![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / InstrumentedEffects

# Interface: InstrumentedEffects\<EM\>

Defined in: [types.ts:514](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L514)

What [StoreInstance.instrumentEffects](StoreInstance.md#instrumenteffects) reports once every effect for an event has settled.

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](../type-aliases/EventMapBase.md) = [`EventMapBase`](../type-aliases/EventMapBase.md)

Event map.

## Properties

### at

> `readonly` **at**: `number`

Defined in: [types.ts:518](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L518)

Clock time ([StoreSpec.clock](../type-aliases/StoreSpec.md#clock)) when the last effect settled.

***

### durationMs

> `readonly` **durationMs**: `number`

Defined in: [types.ts:520](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L520)

The whole effect phase, from the first effect's start to the last one's settlement.

***

### effects

> `readonly` **effects**: readonly [`InstrumentedEffect`](InstrumentedEffect.md)[]

Defined in: [types.ts:522](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L522)

One entry per effect, in the order they ran.

***

### event

> `readonly` **event**: `object`

Defined in: [types.ts:516](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L516)

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
