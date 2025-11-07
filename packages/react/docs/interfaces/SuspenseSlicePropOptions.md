[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / SuspenseSlicePropOptions

# Interface: SuspenseSlicePropOptions\<T, S\>

Defined in: [hooks/suspense.ts:131](https://github.com/quojs/quojs/blob/4b080313e808fe306ce36b57ad9b04440da9effc/packages/react/src/hooks/suspense.ts#L131)

Options for [useSuspenseAtomicProp](../functions/useSuspenseAtomicProp.md).

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

Defined in: [hooks/suspense.ts:151](https://github.com/quojs/quojs/blob/4b080313e808fe306ce36b57ad9b04440da9effc/packages/react/src/hooks/suspense.ts#L151)

Optional extra key to distinguish different usages over the same path.
Useful when the same path has different `load` behaviors or parameters.

***

### load()

> **load**: (`valueAtPath`, `slice`) => `T` \| `Promise`\<`T`\>

Defined in: [hooks/suspense.ts:136](https://github.com/quojs/quojs/blob/4b080313e808fe306ce36b57ad9b04440da9effc/packages/react/src/hooks/suspense.ts#L136)

Loader that can be sync or async.
Called with the **value at the path** (or the whole reducer for glob paths) and the **reducer state** itself.

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

Defined in: [hooks/suspense.ts:145](https://github.com/quojs/quojs/blob/4b080313e808fe306ce36b57ad9b04440da9effc/packages/react/src/hooks/suspense.ts#L145)

Optional cache **stale time** in milliseconds.

- `null` → **no expiry** (cache until invalidated by path changes).
- `0`    → expires **immediately** (effectively no time-based caching).
- `>0`   → entry is fresh until `now + staleTime`.
