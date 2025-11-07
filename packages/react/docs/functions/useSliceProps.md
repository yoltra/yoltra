[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useSliceProps

# ~~Function: useSliceProps()~~

> **useSliceProps**\<`R`, `S`, `T`\>(`specs`, `selector`, `isEqual`): `T`

Defined in: [hooks/hooks.ts:418](https://github.com/quojs/quojs/blob/4b080313e808fe306ce36b57ad9b04440da9effc/packages/react/src/hooks/hooks.ts#L418)

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

### selector

(`state`) => `T`

### isEqual

(`a`, `b`) => `boolean`

## Returns

`T`

## Deprecated

Use [useAtomicProps](useAtomicProps.md) instead. Will be removed in `0.5.0`.
Multi-path fine-grained selector.
