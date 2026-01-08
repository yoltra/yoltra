[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / typedActions

# ~~Variable: typedActions()~~

> `const` **typedActions**: \<`EM`\>(`_`) => \<`C`, `Evt`\>(`channel`, `events`) => readonly [`EventKey`](../type-aliases/EventKey.md)\<`EM`\>[] = `typedEvents`

Defined in: [store/Store.ts:1184](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/core/src/store/Store.ts#L1184)

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

## Deprecated

Use [typedEvents](../functions/typedEvents.md) instead. Will be removed in v1.0.0.

Legacy name for `typedEvents`. Quo.js now uses event-bus terminology.
