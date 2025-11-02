[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / createStore

# Function: createStore()

> **createStore**\<`RM`\>(`cfg`): [`StoreInstance`](../interfaces/StoreInstance.md)\<keyof `RM` & `string`, [`StateFromReducers`](../type-aliases/StateFromReducers.md)\<`RM`\>, [`AMFromReducersStrict`](../type-aliases/AMFromReducersStrict.md)\<`RM`\>\>

Defined in: [store/Store.ts:874](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/store/Store.ts#L874)

Factory helper to create a typed [Store](../classes/Store.md) from a reducers map.

## Type Parameters

### RM

`RM` *extends* [`ReducersMapAny`](../type-aliases/ReducersMapAny.md)

Reducers map object with each slice's `ReducerSpec`.

## Parameters

### cfg

Configuration with `name`, `reducer`, optional `middleware`, optional `effects`.

#### effects?

[`EffectFunction`](../type-aliases/EffectFunction.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<[`StateFromReducers`](../type-aliases/StateFromReducers.md)\<`RM`\>\>, [`AMFromReducersStrict`](../type-aliases/AMFromReducersStrict.md)\<`RM`\>\>[]

#### middleware?

[`MiddlewareFunction`](../type-aliases/MiddlewareFunction.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<[`StateFromReducers`](../type-aliases/StateFromReducers.md)\<`RM`\>\>, [`AMFromReducersStrict`](../type-aliases/AMFromReducersStrict.md)\<`RM`\>\>[]

#### name

`string`

#### reducer

`RM`

## Returns

[`StoreInstance`](../interfaces/StoreInstance.md)\<keyof `RM` & `string`, [`StateFromReducers`](../type-aliases/StateFromReducers.md)\<`RM`\>, [`AMFromReducersStrict`](../type-aliases/AMFromReducersStrict.md)\<`RM`\>\>

A typed [StoreInstance](../interfaces/StoreInstance.md).

## Example

```ts
const store = createStore({
  name: 'App',
  reducer: {
    counter: { state: { value: 0 }, actions: [['ui','increment']], reducer: counterFn }
  },
  middleware: [],
  effects: []
});
```
