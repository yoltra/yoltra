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

Defined in: [react/src/hooks/createHooks.ts:199](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L199)

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

> **store**: `StoreInstance`\<`R`, `S`, `EM`\>

Defined in: [react/src/createYoltra.tsx:35](https://github.com/yoltra/yoltra/blob/main/packages/react/src/createYoltra.tsx#L35)

The store created by this call; the hooks default to it (no Provider needed).

***

### StoreContext

> **StoreContext**: `Context`\<`null` \| `StoreInstance`\<`R`, `S`, `EM`\>\>

Defined in: [react/src/createYoltra.tsx:37](https://github.com/yoltra/yoltra/blob/main/packages/react/src/createYoltra.tsx#L37)

Raw context carrying the store — usually you only need `StoreProvider`.

***

### StoreProvider

> **StoreProvider**: `FC`\<\{ `children`: `ReactNode`; `store?`: `StoreInstance`\<`R`, `S`, `EM`\>; \}\>

Defined in: [react/src/createYoltra.tsx:39](https://github.com/yoltra/yoltra/blob/main/packages/react/src/createYoltra.tsx#L39)

Optional provider to scope a different store instance to a subtree.

***

### useAtomicProp

> **useAtomicProp**: [`UseAtomicProp`](../type-aliases/UseAtomicProp.md)\<`R`, `S`\>

Defined in: [react/src/hooks/createHooks.ts:189](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L189)

Subscribes to a single dotted path (or typed accessor).

#### Inherited from

[`YoltraHooks`](YoltraHooks.md).[`useAtomicProp`](YoltraHooks.md#useatomicprop)

***

### useAtomicProps

> **useAtomicProps**: [`UseAtomicProps`](../type-aliases/UseAtomicProps.md)\<`R`, `S`\>

Defined in: [react/src/hooks/createHooks.ts:191](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L191)

Subscribes to several paths and derives a value from the full state.

#### Inherited from

[`YoltraHooks`](YoltraHooks.md).[`useAtomicProps`](YoltraHooks.md#useatomicprops)

***

### useEmit()

> **useEmit**: () => `Emit`\<`EM`\>

Defined in: [react/src/hooks/createHooks.ts:185](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L185)

Returns the store's typed `emit`.

#### Returns

`Emit`\<`EM`\>

#### Inherited from

[`YoltraHooks`](YoltraHooks.md).[`useEmit`](YoltraHooks.md#useemit)

***

### useEvent

> **useEvent**: [`UseEvent`](../type-aliases/UseEvent.md)\<`EM`, `S`\>

Defined in: [react/src/hooks/createHooks.ts:193](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L193)

Runs a handler for a specific `(channel, type)` event.

#### Inherited from

[`YoltraHooks`](YoltraHooks.md).[`useEvent`](YoltraHooks.md#useevent)

***

### useSelector()

> **useSelector**: \<`T`\>(`selector`, `isEqual?`) => `T`

Defined in: [react/src/hooks/createHooks.ts:187](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L187)

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

> **useStore**: () => `StoreInstance`\<`R`, `S`, `EM`\>

Defined in: [react/src/hooks/createHooks.ts:183](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L183)

Reads the current store from context (falling back to the default store).

#### Returns

`StoreInstance`\<`R`, `S`, `EM`\>

#### Inherited from

[`YoltraHooks`](YoltraHooks.md).[`useStore`](YoltraHooks.md#usestore)

***

### useSuspenseAtomicProp

> **useSuspenseAtomicProp**: [`UseSuspenseAtomicProp`](../type-aliases/UseSuspenseAtomicProp.md)\<`R`, `S`\>

Defined in: [react/src/hooks/createHooks.ts:195](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L195)

Suspense-loading variant of `useAtomicProp`, bound to the same context.

#### Inherited from

[`YoltraHooks`](YoltraHooks.md).[`useSuspenseAtomicProp`](YoltraHooks.md#usesuspenseatomicprop)

***

### useSuspenseAtomicProps

> **useSuspenseAtomicProps**: [`UseSuspenseAtomicProps`](../type-aliases/UseSuspenseAtomicProps.md)\<`R`, `S`\>

Defined in: [react/src/hooks/createHooks.ts:197](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L197)

Suspense-loading variant of `useAtomicProps`, bound to the same context.

#### Inherited from

[`YoltraHooks`](YoltraHooks.md).[`useSuspenseAtomicProps`](YoltraHooks.md#usesuspenseatomicprops)
