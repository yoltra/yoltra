[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / SuspenseSlicePropsOptions

# Interface: SuspenseSlicePropsOptions\<T, S\>

Defined in: [hooks/suspense.ts:235](https://github.com/quojs/quojs/blob/4b080313e808fe306ce36b57ad9b04440da9effc/packages/react/src/hooks/suspense.ts#L235)

Options for [useSuspenseAtomicProps](../functions/useSuspenseAtomicProps.md).

## Type Parameters

### T

`T`

Value produced by `load`.

### S

`S`

State record keyed by reducer names.

## Properties

### key?

> `optional` **key**: `string`

Defined in: [hooks/suspense.ts:241](https://github.com/quojs/quojs/blob/4b080313e808fe306ce36b57ad9b04440da9effc/packages/react/src/hooks/suspense.ts#L241)

Extra cache key segment to distinguish different derived computations.

***

### load()

> **load**: (`state`) => `T` \| `Promise`\<`T`\>

Defined in: [hooks/suspense.ts:237](https://github.com/quojs/quojs/blob/4b080313e808fe306ce36b57ad9b04440da9effc/packages/react/src/hooks/suspense.ts#L237)

Loader given the **full state** to produce `T` (may be async).

#### Parameters

##### state

`S`

#### Returns

`T` \| `Promise`\<`T`\>

***

### staleTime?

> `optional` **staleTime**: `number`

Defined in: [hooks/suspense.ts:239](https://github.com/quojs/quojs/blob/4b080313e808fe306ce36b57ad9b04440da9effc/packages/react/src/hooks/suspense.ts#L239)

Stale time in ms (see [SuspenseSlicePropOptions.staleTime](SuspenseSlicePropOptions.md#staletime)).
