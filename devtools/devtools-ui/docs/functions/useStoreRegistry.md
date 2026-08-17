![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-ui**](../README.md)

***

[@yoltra/devtools-ui](../README.md) / useStoreRegistry

# Function: useStoreRegistry()

> **useStoreRegistry**(): [`RegisteredStore`](../interfaces/RegisteredStore.md)[]

Defined in: [devtools-ui/src/hooks/useStoreRegistry.ts:48](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/hooks/useStoreRegistry.ts#L48)

Tracks connected stores from `STORE_REGISTRY` hub broadcasts.

## Returns

[`RegisteredStore`](../interfaces/RegisteredStore.md)[]

The current list of registered stores (see [RegisteredStore](../interfaces/RegisteredStore.md)).

## Remarks

The hook listens for three message types:
- `STORE_REGISTRY` -- replaces the full store list (sent on initial connect).
- `STORE_CONNECTED` -- adds or updates a single store entry.
- `STORE_DISCONNECTED` -- marks a store as `"disconnected"`.

The returned array is referentially stable unless the underlying data changes.

## Example

```tsx
import { useStoreRegistry } from "@yoltra/devtools-ui";

function StoreList() {
  const stores = useStoreRegistry();
  return (
    <ul>
      {stores.map((s) => (
        <li key={s.id}>{s.name} ({s.status})</li>
      ))}
    </ul>
  );
}
```
