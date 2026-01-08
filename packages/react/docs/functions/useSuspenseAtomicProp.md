[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useSuspenseAtomicProp

# Function: useSuspenseAtomicProp()

## Call Signature

> **useSuspenseAtomicProp**\<`R`, `S`, `T`\>(`storeSpec`, `options`): `T`

Defined in: [hooks/suspense.ts:129](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/react/src/hooks/suspense.ts#L129)

Suspense version of a single-path selector.

### Type Parameters

#### R

`R` *extends* `string`

#### S

`S` *extends* `Record`\<`R`, `any`\>

#### T

`T`

### Parameters

#### storeSpec

##### property

`string`

##### reducer

`R`

#### options

[`SuspenseAtomicPropOptions`](../interfaces/SuspenseAtomicPropOptions.md)\<`T`, `S`\>

### Returns

`T`

## Call Signature

> **useSuspenseAtomicProp**\<`R`, `S`, `P`, `T`\>(`storeSpec`, `options`): `T`

Defined in: [hooks/suspense.ts:133](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/react/src/hooks/suspense.ts#L133)

Suspense version of a single-path selector.

### Type Parameters

#### R

`R` *extends* `string`

#### S

`S` *extends* `Record`\<`R`, `any`\>

#### P

`P` *extends* `string`

#### T

`T`

### Parameters

#### storeSpec

##### property

`P`

##### reducer

`R`

#### options

[`SuspenseAtomicPropOptions`](../interfaces/SuspenseAtomicPropOptions.md)\<`T`, `S`\>

### Returns

`T`
