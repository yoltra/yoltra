![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / Yoltra

# Interface: Yoltra\<R, S, EM\>

Defined in: [react/src/createYoltra.tsx:32](https://github.com/yoltra/yoltra/blob/main/packages/react/src/createYoltra.tsx#L32)

The value returned by [createYoltra](../functions/createYoltra.md): the created `store`, an optional
`StoreProvider` (plus its raw `StoreContext`), and the full set of typed hooks
from [YoltraHooks](YoltraHooks.md).

## Extends

- [`YoltraHooks`](YoltraHooks.md)\<`R`, `S`, `EM`\>

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

Defined in: [react/src/hooks/createHooks.ts:200](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L200)

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

Defined in: [react/src/createYoltra.tsx:35](https://github.com/yoltra/yoltra/blob/main/packages/react/src/createYoltra.tsx#L35)

The store created by this call; the hooks default to it (no Provider needed).

***

### StoreContext

> **StoreContext**: `Context`\<`null` \| [`StoreInstance`](https://github.com/yoltra/yoltra/blob/main/packages/core/docs/interfaces/StoreInstance.md)\<`R`, `S`, `EM`\>\>

Defined in: [react/src/createYoltra.tsx:37](https://github.com/yoltra/yoltra/blob/main/packages/react/src/createYoltra.tsx#L37)

Raw context carrying the store — usually you only need `StoreProvider`.

***

### StoreProvider

> **StoreProvider**: `FC`\<\{ `children`: `ReactNode`; `store?`: [`StoreInstance`](https://github.com/yoltra/yoltra/blob/main/packages/core/docs/interfaces/StoreInstance.md)\<`R`, `S`, `EM`\>; \}\>

Defined in: [react/src/createYoltra.tsx:39](https://github.com/yoltra/yoltra/blob/main/packages/react/src/createYoltra.tsx#L39)

Optional provider to scope a different store instance to a subtree.

***

### useAtomicProp

> **useAtomicProp**: [`UseAtomicProp`](../type-aliases/UseAtomicProp.md)\<`R`, `S`\>

Defined in: [react/src/hooks/createHooks.ts:190](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L190)

Subscribes to a single dotted path (or typed accessor).

#### Inherited from

[`YoltraHooks`](YoltraHooks.md).[`useAtomicProp`](YoltraHooks.md#useatomicprop)

***

### useAtomicProps

> **useAtomicProps**: [`UseAtomicProps`](../type-aliases/UseAtomicProps.md)\<`R`, `S`\>

Defined in: [react/src/hooks/createHooks.ts:192](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L192)

Subscribes to several paths and derives a value from the full state.

#### Inherited from

[`YoltraHooks`](YoltraHooks.md).[`useAtomicProps`](YoltraHooks.md#useatomicprops)

***

### useEmit()

> **useEmit**: () => `Emit`\<`EM`\>

Defined in: [react/src/hooks/createHooks.ts:186](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L186)

Returns the store's typed `emit`.

#### Returns

`Emit`\<`EM`\>

#### Inherited from

[`YoltraHooks`](YoltraHooks.md).[`useEmit`](YoltraHooks.md#useemit)

***

### useEvent

> **useEvent**: [`UseEvent`](../type-aliases/UseEvent.md)\<`EM`, `S`\>

Defined in: [react/src/hooks/createHooks.ts:194](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L194)

Runs a handler for a specific `(channel, type)` event.

#### Inherited from

[`YoltraHooks`](YoltraHooks.md).[`useEvent`](YoltraHooks.md#useevent)

***

### useSelector()

> **useSelector**: \<`T`\>(`selector`, `isEqual?`) => `T`

Defined in: [react/src/hooks/createHooks.ts:188](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L188)

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

Defined in: [react/src/hooks/createHooks.ts:184](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L184)

Reads the current store from context (falling back to the default store).

#### Returns

[`StoreInstance`](https://github.com/yoltra/yoltra/blob/main/packages/core/docs/interfaces/StoreInstance.md)\<`R`, `S`, `EM`\>

#### Inherited from

[`YoltraHooks`](YoltraHooks.md).[`useStore`](YoltraHooks.md#usestore)

***

### useSuspenseAtomicProp

> **useSuspenseAtomicProp**: [`UseSuspenseAtomicProp`](../type-aliases/UseSuspenseAtomicProp.md)\<`R`, `S`\>

Defined in: [react/src/hooks/createHooks.ts:196](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L196)

Suspense-loading variant of `useAtomicProp`, bound to the same context.

#### Inherited from

[`YoltraHooks`](YoltraHooks.md).[`useSuspenseAtomicProp`](YoltraHooks.md#usesuspenseatomicprop)

***

### useSuspenseAtomicProps

> **useSuspenseAtomicProps**: [`UseSuspenseAtomicProps`](../type-aliases/UseSuspenseAtomicProps.md)\<`R`, `S`\>

Defined in: [react/src/hooks/createHooks.ts:198](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L198)

Suspense-loading variant of `useAtomicProps`, bound to the same context.

#### Inherited from

[`YoltraHooks`](YoltraHooks.md).[`useSuspenseAtomicProps`](YoltraHooks.md#usesuspenseatomicprops)
