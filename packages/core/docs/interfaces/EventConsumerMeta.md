[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / EventConsumerMeta

# Interface: EventConsumerMeta\<T\>

Defined in: [types.ts:1064](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/types.ts#L1064)

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

Defined in: [types.ts:1072](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/types.ts#L1072)

Brief one-liner description of what this consumer does

***

### name

> **name**: `string`

Defined in: [types.ts:1069](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/types.ts#L1069)

Unique identifier for this consumer

***

### type

> **type**: `T`

Defined in: [types.ts:1066](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/types.ts#L1066)

Consumer type discriminator
