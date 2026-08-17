![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-ui**](../README.md)

***

[@yoltra/devtools-ui](../README.md) / useStoreMetrics

# Function: useStoreMetrics()

> **useStoreMetrics**(`storeId`, `options?`): `object`

Defined in: [devtools-ui/src/hooks/useStoreMetrics.ts:71](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/hooks/useStoreMetrics.ts#L71)

Fetches and caches performance metrics for a store, with automatic
periodic refresh.

## Parameters

### storeId

The store ID to query, or `null` to disable.

`null` | `string`

### options?

[`UseStoreMetricsOptions`](../interfaces/UseStoreMetricsOptions.md)

Optional configuration (see [UseStoreMetricsOptions](../interfaces/UseStoreMetricsOptions.md)).

## Returns

`object`

An object with `metrics` (`MetricsData` or `null`),
  `loading`, and `refresh`.

### loading

> **loading**: `boolean`

### metrics

> **metrics**: `null` \| \{ `avgProcessingTimeMs`: `number`; `connectorCount`: `number`; `dedupHits`: `number`; `effectCount`: `number`; `eventCount`: `number`; `eventsPerSecond`: `number`; `middlewareCount`: `number`; `middlewareRejections`: `number`; `queueDepth`: `number`; `reducerCount`: `number`; `subscriberCount`: `number`; \}

### refresh()

> **refresh**: () => `void`

#### Returns

`void`

## Remarks

On mount the hook immediately requests metrics and starts an interval
timer that re-fetches every `refreshIntervalMs` milliseconds (default
2 000). The timer is cleaned up on unmount or when the `storeId` changes.

## Example

```tsx
import { useStoreMetrics } from "@yoltra/devtools-ui";

function MetricsPanel({ storeId }: { storeId: string }) {
  const { metrics, loading, refresh } = useStoreMetrics(storeId, {
    refreshIntervalMs: 5000,
  });
  if (loading || !metrics) return <p>Loading...</p>;
  return (
    <div>
      <pre>{JSON.stringify(metrics, null, 2)}</pre>
      <button onClick={refresh}>Refresh Now</button>
    </div>
  );
}
```
