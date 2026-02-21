[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / invalidateAtomicPropsByReducer

# Function: invalidateAtomicPropsByReducer()

> **invalidateAtomicPropsByReducer**(`reducer`): `void`

Defined in: [react/src/hooks/suspense.ts:373](https://github.com/yoltra/yoltra/blob/a987f4d35946c58f44d8b45d3fefadd911124683/packages/react/src/hooks/suspense.ts#L373)

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
