[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / StateFromReducers

# Type Alias: StateFromReducers\<R\>

> **StateFromReducers**\<`R`\> = `{ [K in keyof R]: R[K] extends ReducerSpec<infer S, any> ? S : never }`

Defined in: [types.ts:177](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/types.ts#L177)

## Type Parameters

### R

`R`
