[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / createQuoHooks

# Function: createQuoHooks()

> **createQuoHooks**\<`R`, `S`, `EM`\>(`StoreContext`): `object`

Defined in: [hooks/createQuoHooks.ts:87](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/react/src/hooks/createQuoHooks.ts#L87)

Factory that binds typed React hooks to a specific StoreInstance.

## Type Parameters

### R

`R` *extends* `string`

### S

`S` *extends* `Record`\<`R`, `any`\>

### EM

`EM` *extends* `EventMapBase`

## Parameters

### StoreContext

`Context`\<`null` \| `StoreInstance`\<`R`, `S`, `EM`\>\>

## Returns

### shallowEqual()

> **shallowEqual**: \<`T`\>(`a`, `b`) => `boolean`

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

### useAtomicProp

> **useAtomicProp**: [`UseAtomicProp`](../type-aliases/UseAtomicProp.md)\<`R`, `S`\>

### useAtomicProps

> **useAtomicProps**: [`UseAtomicProps`](../type-aliases/UseAtomicProps.md)\<`R`, `S`\>

### ~~useDispatch()~~

> **useDispatch**: () => `Emit`\<`EM`\>

#### Returns

`Emit`\<`EM`\>

#### Deprecated

Use [useEmit](#createquohooks)

### useEmit()

> **useEmit**: () => `Emit`\<`EM`\>

#### Returns

`Emit`\<`EM`\>

### useSelector()

> **useSelector**: \<`T`\>(`selector`, `isEqual`) => `T`

#### Type Parameters

##### T

`T`

#### Parameters

##### selector

(`state`) => `T`

##### isEqual

(`a`, `b`) => `boolean`

#### Returns

`T`

### useStore()

> **useStore**: () => `StoreInstance`\<`R`, `S`, `EM`\>

#### Returns

`StoreInstance`\<`R`, `S`, `EM`\>
