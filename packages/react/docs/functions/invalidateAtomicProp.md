[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / invalidateAtomicProp

# Function: invalidateAtomicProp()

> **invalidateAtomicProp**(`reducer`, `property`, `extraKey?`): `void`

Defined in: [react/src/hooks/suspense.ts:415](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/react/src/hooks/suspense.ts#L415)

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
