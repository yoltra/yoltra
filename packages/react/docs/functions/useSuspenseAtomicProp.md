[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useSuspenseAtomicProp

# Function: useSuspenseAtomicProp()

> **useSuspenseAtomicProp**\<`R`, `S`, `P`, `T`\>(`storeSpec`, `options`): `T`

Defined in: [hooks/suspense.ts:174](https://github.com/quojs/quojs/blob/4b080313e808fe306ce36b57ad9b04440da9effc/packages/react/src/hooks/suspense.ts#L174)

Suspense version of a single-path selector (atomic subscription).

Subscribes to an **exact** `reducer.property` path, invalidates the cache on changes,
and reads through a Suspense cache—**throwing a promise** while the `load` function resolves.

## Type Parameters

### R

`R` *extends* `string`

Reducer name union.

### S

`S` *extends* `Record`\<`R`, `any`\>

State record keyed by `R`.

### P

`P` *extends* `string`

Dotted path type inside `S[R]` (exact path).

### T

`T`

Value type returned by `options.load`.

## Parameters

### storeSpec

`{ reducer, property }` pointing at a single path.

#### property

`P`

#### reducer

`R`

### options

[`SuspenseSlicePropOptions`](../interfaces/SuspenseSlicePropOptions.md)\<`T`, `S`\>

Loader/staleTime/key options.

## Returns

`T`

The loaded value `T`. Will **suspend** while loading and rethrow errors in the error boundary.
