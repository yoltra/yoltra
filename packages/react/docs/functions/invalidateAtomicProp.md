[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / invalidateAtomicProp

# Function: invalidateAtomicProp()

> **invalidateAtomicProp**(`reducer`, `property`, `extraKey?`): `void`

Defined in: [hooks/suspense.ts:337](https://github.com/quojs/quojs/blob/4b080313e808fe306ce36b57ad9b04440da9effc/packages/react/src/hooks/suspense.ts#L337)

Invalidates the cache entry for a particular `(reducer, property)` key.

## Parameters

### reducer

`string`

Reducer name.

### property

`string`

Dotted path (or glob) string.

### extraKey?

`string`

Optional extra key used when loading.

## Returns

`void`

## Example

```ts
invalidateAtomicProp('todos', 'items.**'); // force refetch for that key
```
