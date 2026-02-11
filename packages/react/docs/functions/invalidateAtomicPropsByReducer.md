[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / invalidateAtomicPropsByReducer

# Function: invalidateAtomicPropsByReducer()

> **invalidateAtomicPropsByReducer**(`reducer`): `void`

Defined in: [react/src/hooks/suspense.ts:373](https://github.com/quojs/quojs/blob/7a847d68175722f00e52941458a1511185cf0a4e/packages/react/src/hooks/suspense.ts#L373)

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
