![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-ui**](../README.md)

***

[@yoltra/devtools-ui](../README.md) / useStoreSubscriptions

# Function: useStoreSubscriptions()

> **useStoreSubscriptions**(`storeId`): `object`

Defined in: [devtools-ui/src/hooks/useStoreSubscriptions.ts:64](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/hooks/useStoreSubscriptions.ts#L64)

Fetches and caches subscription/consumer info for a store.

## Parameters

### storeId

The store ID to query, or `null` to disable.

`null` | `string`

## Returns

`object`

An object with `data` (SubscriptionData or `null`),
  `loading`, and `refresh`.

### data

> **data**: `null` \| `SubscriptionData`

### loading

> **loading**: `boolean`

### refresh()

> **refresh**: () => `void`

#### Returns

`void`

## Remarks

On mount (or when `storeId` changes) the hook sends a
`REQUEST_SUBSCRIPTIONS` message and sets `loading` to `true`. When the
matching `STORE_SUBSCRIPTIONS` response arrives the data is cached and
`loading` flips to `false`.

## Example

```tsx
import { useStoreSubscriptions } from "@yoltra/devtools-ui";

function SubscriptionPanel({ storeId }: { storeId: string }) {
  const { data, loading, refresh } = useStoreSubscriptions(storeId);
  if (loading || !data) return <p>Loading...</p>;
  return (
    <div>
      <p>Atomic: {data.atomic.length}</p>
      <p>Event: {data.event.length}</p>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```
