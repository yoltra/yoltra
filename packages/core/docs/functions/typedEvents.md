[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / typedEvents

# Function: typedEvents()

> **typedEvents**\<`EM`\>(`_`): \<`C`, `Evt`\>(`channel`, `events`) => readonly [`EventKey`](../type-aliases/EventKey.md)\<`EM`\>[]

Defined in: [store/Store.ts:1714](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/core/src/store/Store.ts#L1714)

Utility to define **typed** `(channel, events[])` definitions for reducer specs.

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](../type-aliases/EventMapBase.md)

Event map for the store.

## Parameters

### \_

`string`[][]

Internal marker parameter (usually `events` array placeholder). Not used at runtime.

## Returns

A helper that, given a `channel` and a readonly `events` array, returns typed event keys.

> \<`C`, `Evt`\>(`channel`, `events`): readonly [`EventKey`](../type-aliases/EventKey.md)\<`EM`\>[]

### Type Parameters

#### C

`C` *extends* `string`

#### Evt

`Evt` *extends* readonly keyof `EM`\[`C`\] & `string`[]

### Parameters

#### channel

`C`

#### events

`Evt`

### Returns

readonly [`EventKey`](../type-aliases/EventKey.md)\<`EM`\>[]

## Example

```ts
// In a ReducerSpec:
const events = typedEvents<EM>([])('ui', ['increment', 'decrement'] as const);
// events: ReadonlyArray<EventKey<EM>>
```
