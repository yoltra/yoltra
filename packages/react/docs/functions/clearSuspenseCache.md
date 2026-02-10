[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / clearSuspenseCache

# Function: clearSuspenseCache()

> **clearSuspenseCache**(): `void`

Defined in: [react/src/hooks/suspense.ts:388](https://github.com/quojs/quojs/blob/7a847d68175722f00e52941458a1511185cf0a4e/packages/react/src/hooks/suspense.ts#L388)

Clears the entire Suspense cache, forcing all `useSuspense*` hooks to re-load.

## Returns

`void`

## Example

```ts
// After a logout, clear all cached data
clearSuspenseCache();
```
