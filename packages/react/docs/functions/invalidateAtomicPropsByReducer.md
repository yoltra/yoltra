![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / invalidateAtomicPropsByReducer

# Function: invalidateAtomicPropsByReducer()

> **invalidateAtomicPropsByReducer**(`reducer`): `void`

Defined in: [react/src/hooks/suspense.ts:757](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/suspense.ts#L757)

Invalidates all Suspense cache entries for a given reducer (slice).

## Parameters

### reducer

`string`

Reducer (slice) name whose cache entries should be cleared.

## Returns

`void`

## Example

```ts
invalidateAtomicPropsByReducer('users');
```
