[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / invalidateAtomicProp

# Function: invalidateAtomicProp()

> **invalidateAtomicProp**(`reducer`, `property`, `extraKey?`): `void`

Defined in: [react/src/hooks/suspense.ts:357](https://github.com/quojs/quojs/blob/7a847d68175722f00e52941458a1511185cf0a4e/packages/react/src/hooks/suspense.ts#L357)

Invalidates the Suspense cache entry for a specific `reducer.property` path.

## Parameters

### reducer

`string`

Reducer (slice) name.

### property

`string`

Dotted property path.

### extraKey?

`string`

Optional extra key if the hook was created with `options.key`.

## Returns

`void`

## Example

```ts
invalidateAtomicProp('users', 'byId.123.name');
```
