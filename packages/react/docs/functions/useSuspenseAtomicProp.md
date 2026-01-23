[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useSuspenseAtomicProp

# Function: useSuspenseAtomicProp()

## Call Signature

> **useSuspenseAtomicProp**\<`R`, `S`, `T`\>(`storeSpec`, `options`): `T`

Defined in: [hooks/suspense.ts:129](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/react/src/hooks/suspense.ts#L129)

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

Defined in: [hooks/suspense.ts:133](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/react/src/hooks/suspense.ts#L133)

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
