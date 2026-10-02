![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / StoreDecoration

# Interface: StoreDecoration\<R, S, EM\>

Defined in: [types.ts:2538](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2538)

The registration surface whose return types carry the widening.

## Remarks

Every method returns the **same runtime object**, re-typed. Subscriptions, effects,
middleware, the dedup cache, both buses and any in-flight `call()` are untouched; the only
runtime effect is the registration itself.

Note there is no explicit type parameter for the added event map anywhere. It is inferred
from a single value position, so the partial-inference problem never arises and no call
site needs a type argument or a cast.

## Extended by

- [`StoreInstance`](StoreInstance.md)

## Type Parameters

### R

`R` *extends* `string`

### S

`S` *extends* `Record`\<`R`, `any`\>

### EM

`EM` *extends* [`EventMapBase`](../type-aliases/EventMapBase.md)

## Methods

### registerSlice()

> **registerSlice**\<`N`, `Spec`\>(`name`, `spec`, `options?`): [`Unsubscribe`](../type-aliases/Unsubscribe.md) & `object`

Defined in: [types.ts:2550](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2550)

Mounts a slice and hands back both the widened store and a disposer.

The disposer is **library-private**: after it runs, the widened type still promises a
slice that is gone. Application code should take [StoreDecoration.withSlice](#withslice)
instead, which returns no disposer at all.

#### Type Parameters

##### N

`N` *extends* `string`

##### Spec

`Spec` *extends* [`ReducerSpec`](ReducerSpec.md)\<`any`, `any`\>

#### Parameters

##### name

`N`

##### spec

`Spec`

##### options?

###### owner?

`string`

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md) & `object`

***

### withEffect()

> **withEffect**\<`Spec`\>(`spec`): [`DecoratableStore`](../type-aliases/DecoratableStore.md)\<`R`, `S`, [`Merge`](../type-aliases/Merge.md)\<`EM`, [`EMAddOf`](../type-aliases/EMAddOf.md)\<`Spec`\>\>\>

Defined in: [types.ts:2575](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2575)

Registers an effect and returns the store widened by whatever event map it declares.

#### Type Parameters

##### Spec

`Spec` *extends* [`EffectSpec`](EffectSpec.md)\<`any`, `any`\>

#### Parameters

##### spec

`Spec`

#### Returns

[`DecoratableStore`](../type-aliases/DecoratableStore.md)\<`R`, `S`, [`Merge`](../type-aliases/Merge.md)\<`EM`, [`EMAddOf`](../type-aliases/EMAddOf.md)\<`Spec`\>\>\>

***

### withMiddleware()

> **withMiddleware**\<`M`\>(`mw`): [`DecoratableStore`](../type-aliases/DecoratableStore.md)\<`R`, `S`, [`Merge`](../type-aliases/Merge.md)\<`EM`, [`EMAddOf`](../type-aliases/EMAddOf.md)\<`M`\>\>\>

Defined in: [types.ts:2570](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2570)

Registers middleware and returns the store widened by whatever event map it declares.

Only the **spec form** can widen: `MiddlewareFunction`'s event parameter is
`EventUnion<EM>`, a mapped type TypeScript cannot infer `EM` back out of. A bare function
therefore contributes `{}`.

#### Type Parameters

##### M

`M` *extends* [`MiddlewareInput`](../type-aliases/MiddlewareInput.md)\<`any`, `any`\>

#### Parameters

##### mw

`M`

#### Returns

[`DecoratableStore`](../type-aliases/DecoratableStore.md)\<`R`, `S`, [`Merge`](../type-aliases/Merge.md)\<`EM`, [`EMAddOf`](../type-aliases/EMAddOf.md)\<`M`\>\>\>

***

### withSlice()

> **withSlice**\<`N`, `Spec`\>(`name`, `spec`, `options?`): [`WidenedSlice`](../type-aliases/WidenedSlice.md)\<`R`, `S`, `EM`, `N`, `Spec`\>

Defined in: [types.ts:2557](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2557)

Mounts a slice and returns the widened store, for chaining.

#### Type Parameters

##### N

`N` *extends* `string`

##### Spec

`Spec` *extends* [`ReducerSpec`](ReducerSpec.md)\<`any`, `any`\>

#### Parameters

##### name

`N`

##### spec

`Spec`

##### options?

###### owner?

`string`

#### Returns

[`WidenedSlice`](../type-aliases/WidenedSlice.md)\<`R`, `S`, `EM`, `N`, `Spec`\>
