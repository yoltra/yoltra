[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / createWebStorageAdapter

# Function: createWebStorageAdapter()

> **createWebStorageAdapter**(`storage`): [`PersistenceAdapter`](../interfaces/PersistenceAdapter.md)

Defined in: [persistence/adapters.ts:35](https://github.com/yoltra/yoltra/blob/main/packages/core/src/persistence/adapters.ts#L35)

Wraps a Web Storage object.

## Parameters

### storage

[`WebStorageLike`](../interfaces/WebStorageLike.md)

## Returns

[`PersistenceAdapter`](../interfaces/PersistenceAdapter.md)

## Remarks

Pass `localStorage` or `sessionStorage` explicitly. Reading the global here would make this
module unusable anywhere one does not exist, which includes a server render — exactly where
hydration payloads are produced.

## Example

```ts
const adapter = createWebStorageAdapter(localStorage);
```
