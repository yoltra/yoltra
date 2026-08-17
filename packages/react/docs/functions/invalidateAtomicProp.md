![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / invalidateAtomicProp

# Function: invalidateAtomicProp()

> **invalidateAtomicProp**(`reducer`, `property`, `extraKey?`): `void`

Defined in: [react/src/hooks/suspense.ts:671](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/suspense.ts#L671)

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
