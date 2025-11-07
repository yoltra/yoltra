[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useSuspenseSliceProp

# ~~Function: useSuspenseSliceProp()~~

> **useSuspenseSliceProp**\<`R`, `S`, `P`, `T`\>(`storeSpec`, `options`): `T`

Defined in: [hooks/suspense.ts:216](https://github.com/quojs/quojs/blob/4b080313e808fe306ce36b57ad9b04440da9effc/packages/react/src/hooks/suspense.ts#L216)

## Type Parameters

### R

`R` *extends* `string`

### S

`S` *extends* `Record`\<`R`, `any`\>

### P

`P` *extends* `string`

### T

`T`

## Parameters

### storeSpec

#### property

`P`

#### reducer

`R`

### options

[`SuspenseSlicePropOptions`](../interfaces/SuspenseSlicePropOptions.md)\<`T`, `S`\>

## Returns

`T`

## Deprecated

Use [useSuspenseAtomicProp](useSuspenseAtomicProp.md) instead. Will be removed in `0.5.0`.
Suspense version of a single-path selector (legacy name).
