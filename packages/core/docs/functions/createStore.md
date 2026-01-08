[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / createStore

# Function: createStore()

> **createStore**\<`RM`\>(`cfg`): [`StoreInstance`](../interfaces/StoreInstance.md)\<keyof `RM` & `string`, `StateFromReducers`\<`RM`\>, `EMFromReducersStrict`\<`RM`\>\>

Defined in: [store/Store.ts:1134](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/core/src/store/Store.ts#L1134)

Factory helper to create a typed [Store](../classes/Store.md) from a reducers map.

## Type Parameters

### RM

`RM` *extends* `ReducersMapAny`

Reducers map object with each slice's `ReducerSpec`.

## Parameters

### cfg

Configuration with `name`, `reducer`, optional `middleware`, optional `effects`.

#### effects?

[`EffectSpec`](../interfaces/EffectSpec.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`StateFromReducers`\<`RM`\>\>, `EMFromReducersStrict`\<`RM`\>\>[]

#### middleware?

[`MiddlewareFunction`](../type-aliases/MiddlewareFunction.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`StateFromReducers`\<`RM`\>\>, `EMFromReducersStrict`\<`RM`\>\>[]

#### name

`string`

#### reducer

`RM`

## Returns

[`StoreInstance`](../interfaces/StoreInstance.md)\<keyof `RM` & `string`, `StateFromReducers`\<`RM`\>, `EMFromReducersStrict`\<`RM`\>\>

A typed [StoreInstance](../interfaces/StoreInstance.md).

## Example

```ts
const store = createStore({
  name: 'App',
  reducer: {
    counter: {
      state: { value: 0 },
      events: [['ui','increment']],
      reducer: (s, evt) => evt.type === 'increment' ? { value: s.value + evt.payload } : s
    }
  },
  middleware: [],
  effects: []
});
```
