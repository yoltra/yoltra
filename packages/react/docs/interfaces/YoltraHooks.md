[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / YoltraHooks

# Interface: YoltraHooks\<R, S, EM\>

Defined in: [react/src/hooks/createHooks.ts:177](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L177)

The bundle of fully-typed hooks returned by [createHooks](../functions/createHooks.md) (and, with the
store and provider added, by [createYoltra](../functions/createYoltra.md)).

Naming this return shape explicitly — rather than letting it be inferred —
keeps `createYoltra`'s emitted `.d.ts` portable: the inferred form would leak
a reference to a non-re-exported internal symbol and trip TS2742 in
`composite`/`declaration` consumers.

## Extended by

- [`Yoltra`](Yoltra.md)

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

***

### useAtomicProp

> **useAtomicProp**: [`UseAtomicProp`](../type-aliases/UseAtomicProp.md)\<`R`, `S`\>

Defined in: [react/src/hooks/createHooks.ts:189](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L189)

Subscribes to a single dotted path (or typed accessor).

***

### useAtomicProps

> **useAtomicProps**: [`UseAtomicProps`](../type-aliases/UseAtomicProps.md)\<`R`, `S`\>

Defined in: [react/src/hooks/createHooks.ts:191](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L191)

Subscribes to several paths and derives a value from the full state.

***

### useEmit()

> **useEmit**: () => `Emit`\<`EM`\>

Defined in: [react/src/hooks/createHooks.ts:185](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L185)

Returns the store's typed `emit`.

#### Returns

`Emit`\<`EM`\>

***

### useEvent

> **useEvent**: [`UseEvent`](../type-aliases/UseEvent.md)\<`EM`, `S`\>

Defined in: [react/src/hooks/createHooks.ts:193](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L193)

Runs a handler for a specific `(channel, type)` event.

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

***

### useStore()

> **useStore**: () => `StoreInstance`\<`R`, `S`, `EM`\>

Defined in: [react/src/hooks/createHooks.ts:183](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L183)

Reads the current store from context (falling back to the default store).

#### Returns

`StoreInstance`\<`R`, `S`, `EM`\>

***

### useSuspenseAtomicProp

> **useSuspenseAtomicProp**: [`UseSuspenseAtomicProp`](../type-aliases/UseSuspenseAtomicProp.md)\<`R`, `S`\>

Defined in: [react/src/hooks/createHooks.ts:195](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L195)

Suspense-loading variant of `useAtomicProp`, bound to the same context.

***

### useSuspenseAtomicProps

> **useSuspenseAtomicProps**: [`UseSuspenseAtomicProps`](../type-aliases/UseSuspenseAtomicProps.md)\<`R`, `S`\>

Defined in: [react/src/hooks/createHooks.ts:197](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L197)

Suspense-loading variant of `useAtomicProps`, bound to the same context.
