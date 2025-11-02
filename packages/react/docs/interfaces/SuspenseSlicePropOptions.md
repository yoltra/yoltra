[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / SuspenseSlicePropOptions

# Interface: SuspenseSlicePropOptions\<T, S\>

Defined in: [hooks/suspense.ts:147](https://github.com/quojs/quojs/blob/2d6b527415c15d6d74080cf0fe76f6103c5ec172/packages/react/src/hooks/suspense.ts#L147)

Options for [useSuspenseSliceProp](../functions/useSuspenseSliceProp.md).

## Type Parameters

### T

`T`

The value produced by `load`.

### S

`S`

The store state record keyed by reducer names.

## Properties

### key?

> `optional` **key**: `string`

Defined in: [hooks/suspense.ts:167](https://github.com/quojs/quojs/blob/2d6b527415c15d6d74080cf0fe76f6103c5ec172/packages/react/src/hooks/suspense.ts#L167)

Optional extra key to distinguish different usages over the same path.
Useful when the same path has different `load` behaviors or parameters.

***

### load()

> **load**: (`valueAtPath`, `slice`) => `T` \| `Promise`\<`T`\>

Defined in: [hooks/suspense.ts:152](https://github.com/quojs/quojs/blob/2d6b527415c15d6d74080cf0fe76f6103c5ec172/packages/react/src/hooks/suspense.ts#L152)

Loader that can be sync or async.
Called with the **value at the path** (or the whole slice for glob paths) and the **slice** itself.

#### Parameters

##### valueAtPath

`any`

##### slice

`S`\[keyof `S`\]

#### Returns

`T` \| `Promise`\<`T`\>

***

### staleTime?

> `optional` **staleTime**: `number`

Defined in: [hooks/suspense.ts:161](https://github.com/quojs/quojs/blob/2d6b527415c15d6d74080cf0fe76f6103c5ec172/packages/react/src/hooks/suspense.ts#L161)

Optional cache **stale time** in milliseconds.

- `null` → **no expiry** (cache until invalidated by path changes).
- `0`    → expires **immediately** (effectively no time-based caching).
- `>0`   → entry is fresh until `now + staleTime`.
