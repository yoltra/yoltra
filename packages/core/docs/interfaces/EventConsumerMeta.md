![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / EventConsumerMeta

# Interface: EventConsumerMeta\<T\>

Defined in: [types.ts:2069](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2069)

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

Defined in: [types.ts:2077](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2077)

Brief one-liner description of what this consumer does

***

### name

> **name**: `string`

Defined in: [types.ts:2074](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2074)

Unique identifier for this consumer

***

### type

> **type**: `T`

Defined in: [types.ts:2071](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2071)

Consumer type discriminator
