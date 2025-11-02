[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / invalidateSliceProp

# Function: invalidateSliceProp()

> **invalidateSliceProp**(`reducer`, `property`, `extraKey?`): `void`

Defined in: [hooks/suspense.ts:373](https://github.com/quojs/quojs/blob/2d6b527415c15d6d74080cf0fe76f6103c5ec172/packages/react/src/hooks/suspense.ts#L373)

Invalidates the cache entry for a particular `(reducer, property)` key.

## Parameters

### reducer

`string`

Slice name.

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
invalidateSliceProp('todos', 'items.**'); // force refetch for that key
```
