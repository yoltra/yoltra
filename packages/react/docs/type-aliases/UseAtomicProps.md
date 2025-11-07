[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / UseAtomicProps

# Type Alias: UseAtomicProps()\<R, S\>

> **UseAtomicProps**\<`R`, `S`\> = \<`R1`, `T`\>(`specs`, `selector`, `isEqual?`) => `T`

Defined in: [hooks/createQuoHooks.ts:53](https://github.com/quojs/quojs/blob/4b080313e808fe306ce36b57ad9b04440da9effc/packages/react/src/hooks/createQuoHooks.ts#L53)

Overload shape for the `useAtomicProps` hook returned by [createQuoHooks](../functions/createQuoHooks.md).
Exported so TypeDoc can include and cross-link it from factory docs.

## Type Parameters

### R

`R` *extends* `string`

Slice name union.

### S

`S` *extends* `Record`\<`R`, `any`\>

State record keyed by `R`.

## Type Parameters

### R1

`R1` *extends* `string`

### T

`T`

## Parameters

### specs

`object`[]

### selector

(`state`) => `T`

### isEqual?

(`a`, `b`) => `boolean`

## Returns

`T`
