[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / StoreSpec

# Type Alias: StoreSpec\<R, S, AM\>

> **StoreSpec**\<`R`, `S`, `AM`\> = `object`

Defined in: [types.ts:46](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/types.ts#L46)

Store spec - what you feed into the constructor / factory

## Type Parameters

### R

`R` *extends* `string`

### S

`S` *extends* `Record`\<`R`, `any`\>

### AM

`AM` *extends* [`ActionMapBase`](ActionMapBase.md)

## Properties

### effects?

> `optional` **effects**: [`EffectFunction`](EffectFunction.md)\<[`DeepReadonly`](DeepReadonly.md)\<`S`\>, `AM`\>[]

Defined in: [types.ts:68](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/types.ts#L68)

Optional side-effect handlers registered at construction time (runs after reducers for every propagated action).
Equivalent to calling store.registerEffect for each item

***

### middleware?

> `optional` **middleware**: [`MiddlewareFunction`](MiddlewareFunction.md)\<[`DeepReadonly`](DeepReadonly.md)\<`S`\>, `AM`\>[]

Defined in: [types.ts:62](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/types.ts#L62)

Middleware chain executed before reducers/effects.
If any middleware returns false (or resolves to false), the action will not propagate to reducers/effects

***

### name

> **name**: `string`

Defined in: [types.ts:51](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/types.ts#L51)

Store name.

This is mostly used by DevTools to identify the instance.

***

### reducer

> **reducer**: `Record`\<`R`, [`ReducerSpec`](../interfaces/ReducerSpec.md)\<`S`\[`R`\], `AM`\>\>

Defined in: [types.ts:56](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/types.ts#L56)

Map of slice name -> reducer spec.
Each entry declares initial state, the reducer function, and the list of (channel,event) pairs this slice responds to
