[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / createQuoHooks

# Function: createQuoHooks()

> **createQuoHooks**\<`R`, `S`, `EM`\>(`StoreContext`): `object`

Defined in: [hooks/createQuoHooks.ts:103](https://github.com/quojs/quojs/blob/3a7e48ef6dc2bf6db713ff04100a2a0e1ee72ff5/packages/react/src/hooks/createQuoHooks.ts#L103)

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

`object`

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

### useEmit()

> **useEmit**: () => `Emit`\<`EM`\>

#### Returns

`Emit`\<`EM`\>

### useEvent

> **useEvent**: [`UseEvent`](../type-aliases/UseEvent.md)\<`EM`, `S`\>

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
