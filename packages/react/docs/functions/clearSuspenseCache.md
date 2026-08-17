![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / clearSuspenseCache

# Function: clearSuspenseCache()

> **clearSuspenseCache**(): `void`

Defined in: [react/src/hooks/suspense.ts:702](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/suspense.ts#L702)

Clears the entire Suspense cache, forcing all `useSuspense*` hooks to re-load.

## Returns

`void`

## Example

```ts
// After a logout, clear all cached data
clearSuspenseCache();
```
