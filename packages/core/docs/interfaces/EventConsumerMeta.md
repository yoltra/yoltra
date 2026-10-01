![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / EventConsumerMeta

# Interface: EventConsumerMeta\<T\>

Defined in: [types.ts:1667](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1667)

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

Defined in: [types.ts:1675](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1675)

Brief one-liner description of what this consumer does

***

### name

> **name**: `string`

Defined in: [types.ts:1672](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1672)

Unique identifier for this consumer

***

### type

> **type**: `T`

Defined in: [types.ts:1669](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1669)

Consumer type discriminator
