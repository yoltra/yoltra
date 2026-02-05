[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / EventConsumerMeta

# Interface: EventConsumerMeta\<T\>

Defined in: [types.ts:840](https://github.com/quojs/quojs/blob/3a7e48ef6dc2bf6db713ff04100a2a0e1ee72ff5/packages/core/src/types.ts#L840)

Metadata for event consumers (reducers, effects, middleware).
Useful for debugging tools, DevTools integration, and introspection.

## Example

```ts
const counterReducer: ReducerSpec<CounterState, AppEM> = {
  state: { value: 0 },
  when: { keys: eventKeys<AppEM>()([['ui', 'increment']]) },
  reducer: (s, e) => ({ value: s.value + e.payload }),
  meta: {
    type: 'reducer',
    name: 'counterReducer',
    description: 'Handles counter increment/decrement events',
  },
};
```

## Type Parameters

### T

`T` *extends* [`EventConsumerType`](../type-aliases/EventConsumerType.md) = [`EventConsumerType`](../type-aliases/EventConsumerType.md)

Consumer type discriminator.

## Properties

### description?

> `optional` **description**: `string`

Defined in: [types.ts:848](https://github.com/quojs/quojs/blob/3a7e48ef6dc2bf6db713ff04100a2a0e1ee72ff5/packages/core/src/types.ts#L848)

Brief one-liner description of what this consumer does

***

### name

> **name**: `string`

Defined in: [types.ts:845](https://github.com/quojs/quojs/blob/3a7e48ef6dc2bf6db713ff04100a2a0e1ee72ff5/packages/core/src/types.ts#L845)

Unique identifier for this consumer

***

### type

> **type**: `T`

Defined in: [types.ts:842](https://github.com/quojs/quojs/blob/3a7e48ef6dc2bf6db713ff04100a2a0e1ee72ff5/packages/core/src/types.ts#L842)

Consumer type discriminator
