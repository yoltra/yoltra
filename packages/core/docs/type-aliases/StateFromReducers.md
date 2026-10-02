![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / StateFromReducers

# Type Alias: StateFromReducers\<R\>

> **StateFromReducers**\<`R`\> = `{ [K in keyof R]: R[K] extends ReducerSpec<infer S, any> ? S : never }`

Defined in: [types.ts:1670](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1670)

The state a reducers map produces: each slice name mapped to its spec's state type.

## Type Parameters

### R

`R`

## Remarks

This is the state `createStore` infers when it is given only `reducer`. Use it to name that
state without writing it out a second time.

## Example

```ts
const reducer = { counter: counterSpec, todos: todosSpec };
type AppState = StateFromReducers<typeof reducer>;
// { counter: CounterState; todos: TodosState }
```
