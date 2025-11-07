[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useSuspenseSliceProps

# ~~Function: useSuspenseSliceProps()~~

> **useSuspenseSliceProps**\<`R`, `S`, `T`\>(`specs`, `options`): `T`

Defined in: [hooks/suspense.ts:312](https://github.com/quojs/quojs/blob/4b080313e808fe306ce36b57ad9b04440da9effc/packages/react/src/hooks/suspense.ts#L312)

## Type Parameters

### R

`R` *extends* `string`

### S

`S` *extends* `Record`\<`R`, `any`\>

### T

`T`

## Parameters

### specs

`object`[]

### options

[`SuspenseSlicePropsOptions`](../interfaces/SuspenseSlicePropsOptions.md)\<`T`, `S`\>

## Returns

`T`

## Deprecated

Use [useSuspenseAtomicProps](useSuspenseAtomicProps.md) instead. Will be removed in `0.5.0`.
Suspense version of a multi-path selector (legacy name).
