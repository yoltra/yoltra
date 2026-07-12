[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / invalidateAtomicProp

# Function: invalidateAtomicProp()

> **invalidateAtomicProp**(`reducer`, `property`, `extraKey?`): `void`

Defined in: [react/src/hooks/suspense.ts:418](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/react/src/hooks/suspense.ts#L418)

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
