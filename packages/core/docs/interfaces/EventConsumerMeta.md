![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / EventConsumerMeta

# Interface: EventConsumerMeta\<T\>

Defined in: [types.ts:1815](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1815)

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

Defined in: [types.ts:1823](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1823)

Brief one-liner description of what this consumer does

***

### name

> **name**: `string`

Defined in: [types.ts:1820](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1820)

Unique identifier for this consumer

***

### type

> **type**: `T`

Defined in: [types.ts:1817](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1817)

Consumer type discriminator
