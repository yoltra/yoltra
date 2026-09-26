![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / Yoltra

# Interface: Yoltra\<R, S, EM\>

Defined in: [react/src/createYoltra.tsx:40](https://github.com/yoltra/yoltra/blob/main/packages/react/src/createYoltra.tsx#L40)

The value returned by [createYoltra](../functions/createYoltra.md): the created `store`, an optional
`StoreProvider` (plus its raw `StoreContext`), and the full set of typed hooks
from [YoltraHooks](YoltraHooks.md).

## Extends

- [`YoltraHooks`](YoltraHooks.md)\<`R`, `S`, `EM`\>.[`YoltraDecoration`](YoltraDecoration.md)\<`R`, `S`, `EM`\>

## Type Parameters

### R

`R` *extends* `string`

Reducer name union.

### S

`S` *extends* `Record`\<`R`, `any`\>

State record keyed by `R`.

### EM

`EM` *extends* `EventMapBase`

Event map.

## Properties

### shallowEqual()

> **shallowEqual**: \<`T`\>(`a`, `b`) => `boolean`

Defined in: [react/src/hooks/createHooks.ts:212](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L212)

Shallow object equality using `Object.is` per-key.

#### Type Parameters

##### T

`T` *extends* `Record`\<`string`, `unknown`\>

#### Parameters

##### a

`T`

##### b

`T`

#### Returns

`boolean`

#### Inherited from

[`YoltraHooks`](YoltraHooks.md).[`shallowEqual`](YoltraHooks.md#shallowequal)

***

### store

> **store**: [`StoreInstance`](https://github.com/yoltra/yoltra/blob/main/packages/core/docs/interfaces/StoreInstance.md)\<`R`, `S`, `EM`\>

Defined in: [react/src/createYoltra.tsx:44](https://github.com/yoltra/yoltra/blob/main/packages/react/src/createYoltra.tsx#L44)

The store created by this call; the hooks default to it (no Provider needed).

***

### StoreContext

> **StoreContext**: `Context`\<`null` \| [`StoreInstance`](https://github.com/yoltra/yoltra/blob/main/packages/core/docs/interfaces/StoreInstance.md)\<`R`, `S`, `EM`\>\>

Defined in: [react/src/createYoltra.tsx:46](https://github.com/yoltra/yoltra/blob/main/packages/react/src/createYoltra.tsx#L46)

Raw context carrying the store — usually you only need `StoreProvider`.

***

### StoreProvider

> **StoreProvider**: `FC`\<\{ `children`: `ReactNode`; `store?`: [`StoreInstance`](https://github.com/yoltra/yoltra/blob/main/packages/core/docs/interfaces/StoreInstance.md)\<`R`, `S`, `EM`\>; \}\>

Defined in: [react/src/createYoltra.tsx:48](https://github.com/yoltra/yoltra/blob/main/packages/react/src/createYoltra.tsx#L48)

Optional provider to scope a different store instance to a subtree.

***

### useAtomicProp

> **useAtomicProp**: [`UseAtomicProp`](../type-aliases/UseAtomicProp.md)\<`R`, `S`\>

Defined in: [react/src/hooks/createHooks.ts:202](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L202)

Subscribes to a single dotted path (or typed accessor).

#### Inherited from

[`YoltraHooks`](YoltraHooks.md).[`useAtomicProp`](YoltraHooks.md#useatomicprop)

***

### useAtomicProps

> **useAtomicProps**: [`UseAtomicProps`](../type-aliases/UseAtomicProps.md)\<`R`, `S`\>

Defined in: [react/src/hooks/createHooks.ts:204](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L204)

Subscribes to several paths and derives a value from the full state.

#### Inherited from

[`YoltraHooks`](YoltraHooks.md).[`useAtomicProps`](YoltraHooks.md#useatomicprops)

***

### useEmit()

> **useEmit**: () => `Emit`\<`EM`\>

Defined in: [react/src/hooks/createHooks.ts:198](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L198)

Returns the store's typed `emit`.

#### Returns

`Emit`\<`EM`\>

#### Inherited from

[`YoltraHooks`](YoltraHooks.md).[`useEmit`](YoltraHooks.md#useemit)

***

### useEvent

> **useEvent**: [`UseEvent`](../type-aliases/UseEvent.md)\<`EM`, `S`\>

Defined in: [react/src/hooks/createHooks.ts:206](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L206)

Runs a handler for a specific `(channel, type)` event.

#### Inherited from

[`YoltraHooks`](YoltraHooks.md).[`useEvent`](YoltraHooks.md#useevent)

***

### useSelector()

> **useSelector**: \<`T`\>(`selector`, `isEqual?`) => `T`

Defined in: [react/src/hooks/createHooks.ts:200](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L200)

Subscribes to a derived value with an optional equality comparator.

#### Type Parameters

##### T

`T`

#### Parameters

##### selector

(`state`) => `T`

##### isEqual?

(`a`, `b`) => `boolean`

#### Returns

`T`

#### Inherited from

[`YoltraHooks`](YoltraHooks.md).[`useSelector`](YoltraHooks.md#useselector)

***

### useStore()

> **useStore**: () => [`StoreInstance`](https://github.com/yoltra/yoltra/blob/main/packages/core/docs/interfaces/StoreInstance.md)\<`R`, `S`, `EM`\>

Defined in: [react/src/hooks/createHooks.ts:196](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L196)

Reads the current store from context (falling back to the default store).

#### Returns

[`StoreInstance`](https://github.com/yoltra/yoltra/blob/main/packages/core/docs/interfaces/StoreInstance.md)\<`R`, `S`, `EM`\>

#### Inherited from

[`YoltraHooks`](YoltraHooks.md).[`useStore`](YoltraHooks.md#usestore)

***

### useSuspenseAtomicProp

> **useSuspenseAtomicProp**: [`UseSuspenseAtomicProp`](../type-aliases/UseSuspenseAtomicProp.md)\<`R`, `S`\>

Defined in: [react/src/hooks/createHooks.ts:208](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L208)

Suspense-loading variant of `useAtomicProp`, bound to the same context.

#### Inherited from

[`YoltraHooks`](YoltraHooks.md).[`useSuspenseAtomicProp`](YoltraHooks.md#usesuspenseatomicprop)

***

### useSuspenseAtomicProps

> **useSuspenseAtomicProps**: [`UseSuspenseAtomicProps`](../type-aliases/UseSuspenseAtomicProps.md)\<`R`, `S`\>

Defined in: [react/src/hooks/createHooks.ts:210](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L210)

Suspense-loading variant of `useAtomicProps`, bound to the same context.

#### Inherited from

[`YoltraHooks`](YoltraHooks.md).[`useSuspenseAtomicProps`](YoltraHooks.md#usesuspenseatomicprops)

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

#### Inherited from

[`YoltraDecoration`](YoltraDecoration.md).[`withEffect`](YoltraDecoration.md#witheffect)

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

#### Inherited from

[`YoltraDecoration`](YoltraDecoration.md).[`withMiddleware`](YoltraDecoration.md#withmiddleware)

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

#### Inherited from

[`YoltraDecoration`](YoltraDecoration.md).[`withSlice`](YoltraDecoration.md#withslice)
