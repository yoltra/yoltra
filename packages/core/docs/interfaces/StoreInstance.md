[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / StoreInstance

# Interface: StoreInstance\<R, S, EM\>

Defined in: [types.ts:203](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/core/src/types.ts#L203)

Public Store surface.

## Remarks

The concrete Store implements this as `StoreInstance<R, DeepReadonly<S>, EM>`.

## Type Parameters

### R

`R` *extends* `string` = `string`

Reducer name union.

### S

`S` *extends* `Record`\<`R`, `any`\> = `Record`\<`string`, `any`\>

State record (already readonly at the call site).

### EM

`EM` *extends* [`EventMapBase`](../type-aliases/EventMapBase.md) = [`EventMapBase`](../type-aliases/EventMapBase.md)

Event map.

## Properties

### emit

> **emit**: [`Emit`](../type-aliases/Emit.md)\<`EM`\>

Defined in: [types.ts:222](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/core/src/types.ts#L222)

Emit a typed event `(channel, type, payload)`.
Returns a promise that resolves when the event has been processed.

***

### name

> **name**: `string`

Defined in: [types.ts:211](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/core/src/types.ts#L211)

Store name (used by DevTools to identify the instance).

## Methods

### connect()

> **connect**(`spec`, `handler`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [types.ts:237](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/core/src/types.ts#L237)

Fine-grained subscription: listen to a specific `reducer.property` path.
Accepts a dotted path string (e.g., "data.123.title").
Fires when that path (or its ancestors) actually changes.

#### Parameters

##### spec

`{ reducer, property }` where `property` is a single dotted path string.

###### property

`string`

###### reducer

`R`

##### handler

(`change`) => `void`

Handler receiving a [Change](Change.md) with `{ oldValue, newValue, path }`.

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

***

### ~~dispatch()~~

> **dispatch**\<`C`, `T`\>(`channel`, `type`, `payload`): `Promise`\<`void`\>

Defined in: [types.ts:304](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/core/src/types.ts#L304)

#### Type Parameters

##### C

`C` *extends* `string` \| `number` \| `symbol`

##### T

`T` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### channel

`C`

##### type

`T`

##### payload

`EM`\[`C`\]\[`T`\]

#### Returns

`Promise`\<`void`\>

#### Deprecated

Use [\`emit\`](#emit) instead. Will be removed in v1.0.0.

Legacy alias for `emit`. Quo.js now uses event-bus terminology:
- "dispatch" → "emit"
- "action" → "event"

***

### dispose()

> **dispose**(): `void`

Defined in: [types.ts:258](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/core/src/types.ts#L258)

Cleanup resources (timers, etc.) when disposing the store.
Call this if you're dynamically creating/destroying stores.

#### Returns

`void`

***

### getState()

> **getState**(): [`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>

Defined in: [types.ts:216](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/core/src/types.ts#L216)

Read the full state (already readonly).

#### Returns

[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>

***

### hotReplace()

> **hotReplace**(`partial`): `void`

Defined in: [types.ts:290](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/core/src/types.ts#L290)

Convenience API to replace any subset of store parts (HMR patterns).

#### Parameters

##### partial

Partial replacement set.

###### effects?

[`EffectSpec`](EffectSpec.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `EM`\>[]

###### middleware?

[`MiddlewareFunction`](../type-aliases/MiddlewareFunction.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `EM`\>[]

###### preserveState?

`boolean`

###### reducer?

`Record`\<`R`, [`ReducerSpec`](ReducerSpec.md)\<`S`\[`R`\], `EM`\>\>

#### Returns

`void`

***

### registerEffect()

> **registerEffect**(`spec`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [types.ts:242](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/core/src/types.ts#L242)

Register a post-reducer effect (sees final state). Returns an unsubscribe.

#### Parameters

##### spec

[`EffectSpec`](EffectSpec.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `EM`\>

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

***

### registerMiddleware()

> **registerMiddleware**(`mw`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [types.ts:247](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/core/src/types.ts#L247)

Dynamically add middleware.

#### Parameters

##### mw

[`MiddlewareFunction`](../type-aliases/MiddlewareFunction.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `EM`\>

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

***

### registerReducer()

> **registerReducer**(`name`, `spec`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [types.ts:252](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/core/src/types.ts#L252)

Dynamically add/remove a namespaced reducer slice at runtime.

#### Parameters

##### name

`string`

##### spec

[`ReducerSpec`](ReducerSpec.md)\<`any`, `EM`\>

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

***

### replaceEffects()

> **replaceEffects**(`next`): `void`

Defined in: [types.ts:272](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/core/src/types.ts#L272)

Replaces all registered effects (HMR-friendly).

#### Parameters

##### next

[`EffectSpec`](EffectSpec.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `EM`\>[]

New effects array (as EffectSpecs).

#### Returns

`void`

***

### replaceMiddleware()

> **replaceMiddleware**(`next`): `void`

Defined in: [types.ts:265](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/core/src/types.ts#L265)

Replaces the entire middleware pipeline (HMR-friendly).

#### Parameters

##### next

[`MiddlewareFunction`](../type-aliases/MiddlewareFunction.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `EM`\>[]

New middleware array.

#### Returns

`void`

***

### replaceReducers()

> **replaceReducers**(`next`, `opts?`): `void`

Defined in: [types.ts:280](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/core/src/types.ts#L280)

Replaces the entire reducer set (HMR-friendly).

#### Parameters

##### next

`Record`\<`R`, [`ReducerSpec`](ReducerSpec.md)\<`S`\[`R`\], `EM`\>\>

Map of slice specs keyed by slice name.

##### opts?

`{ preserveState?: boolean }` (default `true`).

###### preserveState?

`boolean`

#### Returns

`void`

***

### subscribe()

> **subscribe**(`listener`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [types.ts:227](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/core/src/types.ts#L227)

Coarse subscription: runs after any state change (once per committed event).

#### Parameters

##### listener

() => `void`

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)
