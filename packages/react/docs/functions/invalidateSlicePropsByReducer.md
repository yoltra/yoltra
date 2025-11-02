[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / invalidateSlicePropsByReducer

# Function: invalidateSlicePropsByReducer()

> **invalidateSlicePropsByReducer**(`reducer`): `void`

Defined in: [hooks/suspense.ts:387](https://github.com/quojs/quojs/blob/2d6b527415c15d6d74080cf0fe76f6103c5ec172/packages/react/src/hooks/suspense.ts#L387)

Invalidates **all** cache entries under a given reducer (slice).

## Parameters

### reducer

`string`

## Returns

`void`

## Example

```ts
invalidateSlicePropsByReducer('todos');
```
