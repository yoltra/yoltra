[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / YoltraHooks

# Interface: YoltraHooks\<R, S, EM\>

Defined in: [react/src/hooks/createHooks.ts:172](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/react/src/hooks/createHooks.ts#L172)

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

***

### useAtomicProp

> **useAtomicProp**: [`UseAtomicProp`](../type-aliases/UseAtomicProp.md)\<`R`, `S`\>

Defined in: [react/src/hooks/createHooks.ts:184](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/react/src/hooks/createHooks.ts#L184)

Subscribes to a single dotted path (or typed accessor).

***

### useAtomicProps

> **useAtomicProps**: [`UseAtomicProps`](../type-aliases/UseAtomicProps.md)\<`R`, `S`\>

Defined in: [react/src/hooks/createHooks.ts:186](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/react/src/hooks/createHooks.ts#L186)

Subscribes to several paths and derives a value from the full state.

***

### useEmit()

> **useEmit**: () => `Emit`\<`EM`\>

Defined in: [react/src/hooks/createHooks.ts:180](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/react/src/hooks/createHooks.ts#L180)

Returns the store's typed `emit`.

#### Returns

`Emit`\<`EM`\>

***

### useEvent

> **useEvent**: [`UseEvent`](../type-aliases/UseEvent.md)\<`EM`, `S`\>

Defined in: [react/src/hooks/createHooks.ts:188](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/react/src/hooks/createHooks.ts#L188)

Runs a handler for a specific `(channel, type)` event.

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

***

### useStore()

> **useStore**: () => `StoreInstance`\<`R`, `S`, `EM`\>

Defined in: [react/src/hooks/createHooks.ts:178](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/react/src/hooks/createHooks.ts#L178)

Reads the current store from context (falling back to the default store).

#### Returns

`StoreInstance`\<`R`, `S`, `EM`\>
