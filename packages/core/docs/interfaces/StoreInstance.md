[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / StoreInstance

# Interface: StoreInstance\<R, S, AM\>

Defined in: [types.ts:76](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/types.ts#L76)

Public Store surface.

NOTE: `S` is the *exposed* state type (already readonly at the call site).
Your concrete Store implements this as StoreInstance<R, DeepReadonly<S>, AM>

## Type Parameters

### R

`R` *extends* `string` = `string`

### S

`S` *extends* `Record`\<`R`, `any`\> = `Record`\<`string`, `any`\>

### AM

`AM` *extends* [`ActionMapBase`](../type-aliases/ActionMapBase.md) = [`ActionMapBase`](../type-aliases/ActionMapBase.md)

## Properties

### dispatch

> **dispatch**: [`Dispatch`](../type-aliases/Dispatch.md)\<`AM`\>

Defined in: [types.ts:93](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/types.ts#L93)

Dispatch a typed action (channel, event, payload)

***

### name

> **name**: `string`

Defined in: [types.ts:85](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/types.ts#L85)

Store name.

This is mostly used by DevTools to identify the instance.

## Methods

### connect()

> **connect**(`spec`, `handler`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [types.ts:103](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/types.ts#L103)

Fine-grained subscription: listen to specific reducer.property path(s).
Accepts a string or string[] of dotted paths (e.g., "data.123.title").
Fires only when those path(s) actually change

#### Parameters

##### spec

[`Connect`](../type-aliases/Connect.md)\<`R`, `S`\>

##### handler

(`change`) => `void`

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

***

### getState()

> **getState**(): [`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>

Defined in: [types.ts:89](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/types.ts#L89)

Read the full state (already readonly by the time you supply `S`)

#### Returns

[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>

***

### onEffect()

> **onEffect**\<`C`, `E`\>(`channel`, `event`, `handler`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [types.ts:115](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/types.ts#L115)

Convenience effect filter by channel & event. Returns an unsubscribe

#### Type Parameters

##### C

`C` *extends* `string`

##### E

`E` *extends* `string`

#### Parameters

##### channel

`C`

##### event

`E`

##### handler

(`payload`, `getState`, `dispatch`, `action`) => `void` \| `Promise`\<`void`\>

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

***

### registerEffect()

> **registerEffect**(`handler`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [types.ts:111](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/types.ts#L111)

Register a post-reducer effect (sees final state). Returns an unsubscribe.
`S` here is the same exposed type returned by `getState()`

#### Parameters

##### handler

[`EffectFunction`](../type-aliases/EffectFunction.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `AM`\>

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

***

### registerMiddleware()

> **registerMiddleware**(`mw`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [types.ts:128](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/types.ts#L128)

Dynamically add middleware

#### Parameters

##### mw

[`MiddlewareFunction`](../type-aliases/MiddlewareFunction.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `AM`\>

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

***

### registerReducer()

> **registerReducer**(`name`, `spec`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [types.ts:132](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/types.ts#L132)

Dynamically add/remove a namespaced reducer slice at runtime

#### Parameters

##### name

`string`

##### spec

[`ReducerSpec`](ReducerSpec.md)\<`any`, `AM`\>

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

***

### subscribe()

> **subscribe**(`listener`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [types.ts:97](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/types.ts#L97)

Coarse subscription: runs after any state change

#### Parameters

##### listener

() => `void`

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)
