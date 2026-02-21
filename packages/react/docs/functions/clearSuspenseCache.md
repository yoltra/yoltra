[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / clearSuspenseCache

# Function: clearSuspenseCache()

> **clearSuspenseCache**(): `void`

Defined in: [react/src/hooks/suspense.ts:388](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/react/src/hooks/suspense.ts#L388)

Clears the entire Suspense cache, forcing all `useSuspense*` hooks to re-load.

## Returns

`void`

## Example

```ts
// After a logout, clear all cached data
clearSuspenseCache();
```
