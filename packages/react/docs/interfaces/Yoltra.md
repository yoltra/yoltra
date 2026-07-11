[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / Yoltra

# Interface: Yoltra\<R, S, EM\>

Defined in: [react/src/createYoltra.tsx:32](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/react/src/createYoltra.tsx#L32)

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

Defined in: [react/src/hooks/createHooks.ts:190](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/react/src/hooks/createHooks.ts#L190)

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

Defined in: [react/src/createYoltra.tsx:35](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/react/src/createYoltra.tsx#L35)

The store created by this call; the hooks default to it (no Provider needed).

***

### StoreContext

> **StoreContext**: `Context`\<`StoreInstance`\<`R`, `S`, `EM`\>\>

Defined in: [react/src/createYoltra.tsx:37](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/react/src/createYoltra.tsx#L37)

Raw context carrying the store — usually you only need `StoreProvider`.

***

### StoreProvider

> **StoreProvider**: `FC`\<\{ `children`: `ReactNode`; `store?`: `StoreInstance`\<`R`, `S`, `EM`\>; \}\>

Defined in: [react/src/createYoltra.tsx:39](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/react/src/createYoltra.tsx#L39)

Optional provider to scope a different store instance to a subtree.

***

### useAtomicProp

> **useAtomicProp**: [`UseAtomicProp`](../type-aliases/UseAtomicProp.md)\<`R`, `S`\>

Defined in: [react/src/hooks/createHooks.ts:184](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/react/src/hooks/createHooks.ts#L184)

Subscribes to a single dotted path (or typed accessor).

#### Inherited from

[`YoltraHooks`](YoltraHooks.md).[`useAtomicProp`](YoltraHooks.md#useatomicprop)

***

### useAtomicProps

> **useAtomicProps**: [`UseAtomicProps`](../type-aliases/UseAtomicProps.md)\<`R`, `S`\>

Defined in: [react/src/hooks/createHooks.ts:186](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/react/src/hooks/createHooks.ts#L186)

Subscribes to several paths and derives a value from the full state.

#### Inherited from

[`YoltraHooks`](YoltraHooks.md).[`useAtomicProps`](YoltraHooks.md#useatomicprops)

***

### useEmit()

> **useEmit**: () => `Emit`\<`EM`\>

Defined in: [react/src/hooks/createHooks.ts:180](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/react/src/hooks/createHooks.ts#L180)

Returns the store's typed `emit`.

#### Returns

`Emit`\<`EM`\>

#### Inherited from

[`YoltraHooks`](YoltraHooks.md).[`useEmit`](YoltraHooks.md#useemit)

***

### useEvent

> **useEvent**: [`UseEvent`](../type-aliases/UseEvent.md)\<`EM`, `S`\>

Defined in: [react/src/hooks/createHooks.ts:188](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/react/src/hooks/createHooks.ts#L188)

Runs a handler for a specific `(channel, type)` event.

#### Inherited from

[`YoltraHooks`](YoltraHooks.md).[`useEvent`](YoltraHooks.md#useevent)

***

### useSelector()

> **useSelector**: \<`T`\>(`selector`, `isEqual?`) => `T`

Defined in: [react/src/hooks/createHooks.ts:182](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/react/src/hooks/createHooks.ts#L182)

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

Defined in: [react/src/hooks/createHooks.ts:178](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/react/src/hooks/createHooks.ts#L178)

Reads the current store from context (falling back to the default store).

#### Returns

`StoreInstance`\<`R`, `S`, `EM`\>

#### Inherited from

[`YoltraHooks`](YoltraHooks.md).[`useStore`](YoltraHooks.md#usestore)
