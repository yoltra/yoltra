[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / clearSuspenseCache

# Function: clearSuspenseCache()

> **clearSuspenseCache**(): `void`

Defined in: [react/src/hooks/suspense.ts:446](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/react/src/hooks/suspense.ts#L446)

Clears the entire Suspense cache, forcing all `useSuspense*` hooks to re-load.

## Returns

`void`

## Example

```ts
// After a logout, clear all cached data
clearSuspenseCache();
```
