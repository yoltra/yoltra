[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / SuspenseSlicePropsOptions

# Interface: SuspenseSlicePropsOptions\<T, S\>

Defined in: [hooks/suspense.ts:254](https://github.com/quojs/quojs/blob/2d6b527415c15d6d74080cf0fe76f6103c5ec172/packages/react/src/hooks/suspense.ts#L254)

Options for [useSuspenseSliceProps](../functions/useSuspenseSliceProps.md).

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

Defined in: [hooks/suspense.ts:268](https://github.com/quojs/quojs/blob/2d6b527415c15d6d74080cf0fe76f6103c5ec172/packages/react/src/hooks/suspense.ts#L268)

Extra cache key segment to distinguish different derived computations.

***

### load()

> **load**: (`state`) => `T` \| `Promise`\<`T`\>

Defined in: [hooks/suspense.ts:258](https://github.com/quojs/quojs/blob/2d6b527415c15d6d74080cf0fe76f6103c5ec172/packages/react/src/hooks/suspense.ts#L258)

Loader given the **full state** to produce `T` (may be async).

#### Parameters

##### state

`S`

#### Returns

`T` \| `Promise`\<`T`\>

***

### staleTime?

> `optional` **staleTime**: `number`

Defined in: [hooks/suspense.ts:263](https://github.com/quojs/quojs/blob/2d6b527415c15d6d74080cf0fe76f6103c5ec172/packages/react/src/hooks/suspense.ts#L263)

Stale time in ms (see [SuspenseSlicePropOptions.staleTime](SuspenseSlicePropOptions.md#staletime) for semantics).
