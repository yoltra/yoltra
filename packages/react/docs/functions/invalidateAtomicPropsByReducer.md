[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / invalidateAtomicPropsByReducer

# Function: invalidateAtomicPropsByReducer()

> **invalidateAtomicPropsByReducer**(`reducer`): `void`

Defined in: [react/src/hooks/suspense.ts:431](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/react/src/hooks/suspense.ts#L431)

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
