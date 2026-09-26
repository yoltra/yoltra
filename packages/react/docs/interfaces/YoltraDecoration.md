![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / YoltraDecoration

# Interface: YoltraDecoration\<R, S, EM\>

Defined in: [react/src/createYoltra.tsx:68](https://github.com/yoltra/yoltra/blob/main/packages/react/src/createYoltra.tsx#L68)

The chainable decoration surface on a [Yoltra](Yoltra.md).

## Remarks

`Yoltra` extends this, so every hook set is chainable.

Every method returns a **new hook set bound to the same context object**, re-typed. The
context is never recreated, so a `StoreProvider` from any view in the chain serves the
hooks of every other, and the Suspense cache is shared - it keys on store identity through
a `WeakMap`, and the widened store is the same object.

Call these at **module scope, once, before first render**. `createHooks` allocates fresh
function objects per call, so decorating inside a component would hand React a different
hook set on every render.

## Extended by

- [`Yoltra`](Yoltra.md)

## Type Parameters

### R

`R` *extends* `string`

### S

`S` *extends* `Record`\<`R`, `any`\>

### EM

`EM` *extends* `EventMapBase`

## Methods

### withEffect()

> **withEffect**\<`Spec`\>(`spec`): [`DecoratableYoltra`](../type-aliases/DecoratableYoltra.md)\<`R`, `S`, `Merge`\<`EM`, `EMAddOf`\<`Spec`\>\>\>

Defined in: [react/src/createYoltra.tsx:95](https://github.com/yoltra/yoltra/blob/main/packages/react/src/createYoltra.tsx#L95)

Registers an effect and returns a `Yoltra` widened by whatever event map it declares.

#### Type Parameters

##### Spec

`Spec` *extends* `EffectSpec`\<`any`, `any`\>

#### Parameters

##### spec

`Spec`

#### Returns

[`DecoratableYoltra`](../type-aliases/DecoratableYoltra.md)\<`R`, `S`, `Merge`\<`EM`, `EMAddOf`\<`Spec`\>\>\>

***

### withMiddleware()

> **withMiddleware**\<`M`\>(`mw`): [`DecoratableYoltra`](../type-aliases/DecoratableYoltra.md)\<`R`, `S`, `Merge`\<`EM`, `EMAddOf`\<`M`\>\>\>

Defined in: [react/src/createYoltra.tsx:90](https://github.com/yoltra/yoltra/blob/main/packages/react/src/createYoltra.tsx#L90)

Registers middleware and returns a `Yoltra` widened by whatever event map it declares.

Only the spec form can widen; a bare `MiddlewareFunction` contributes nothing, because
its event parameter is `EventUnion<EM>` and TypeScript cannot infer `EM` back out of it.

#### Type Parameters

##### M

`M` *extends* `MiddlewareInput`\<`any`, `any`\>

#### Parameters

##### mw

`M`

#### Returns

[`DecoratableYoltra`](../type-aliases/DecoratableYoltra.md)\<`R`, `S`, `Merge`\<`EM`, `EMAddOf`\<`M`\>\>\>

***

### withSlice()

> **withSlice**\<`N`, `Spec`\>(`name`, `spec`, `options?`): [`DecoratableYoltra`](../type-aliases/DecoratableYoltra.md)\<`WidenNames`\<`R`, `N`\>, \{ \[K in string \| number \| symbol\]: (WidenState\<S, N, StateOfSpec\<Spec\>\> & Record\<WidenNames\<R, N\>, unknown\>)\[K\] \}, `Merge`\<`EM`, `EMAddOf`\<`Spec`\>\>\>

Defined in: [react/src/createYoltra.tsx:74](https://github.com/yoltra/yoltra/blob/main/packages/react/src/createYoltra.tsx#L74)

Mounts a slice and returns a widened `Yoltra`: the same store, a new hook set.

#### Type Parameters

##### N

`N` *extends* `string`

##### Spec

`Spec` *extends* `ReducerSpec`\<`any`, `any`\>

#### Parameters

##### name

`N`

##### spec

`Spec`

##### options?

###### owner?

`string`

#### Returns

[`DecoratableYoltra`](../type-aliases/DecoratableYoltra.md)\<`WidenNames`\<`R`, `N`\>, \{ \[K in string \| number \| symbol\]: (WidenState\<S, N, StateOfSpec\<Spec\>\> & Record\<WidenNames\<R, N\>, unknown\>)\[K\] \}, `Merge`\<`EM`, `EMAddOf`\<`Spec`\>\>\>
