![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-ui**](../README.md)

***

[@yoltra/devtools-ui](../README.md) / useEventLog

# Function: useEventLog()

> **useEventLog**(`storeId`, `options?`): `object`

Defined in: [devtools-ui/src/hooks/useEventLog.ts:70](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/hooks/useEventLog.ts#L70)

Maintains a chronological event log for a given store.

## Parameters

### storeId

The store ID whose events to return, or `null` to get an
  empty slice (collection still runs for all stores).

`null` | `string`

### options?

[`UseEventLogOptions`](../interfaces/UseEventLogOptions.md)

Optional configuration (see [UseEventLogOptions](../interfaces/UseEventLogOptions.md)).

## Returns

`object`

An object containing the `entries` array and a `clear` function.

### clear()

> **clear**: () => `void`

#### Returns

`void`

### entries

> **entries**: [`EventLogEntry`](../interfaces/EventLogEntry.md)[]

## Remarks

Events are accumulated for **all** stores simultaneously in a `Map` keyed
by store ID, so switching between store tabs does not discard existing
history. Passing `null` as `storeId` returns an empty array but collection
continues in the background.

When the log for a given store exceeds `maxEntries` the oldest entries for
that store are discarded.

## Example

```tsx
import { useEventLog } from "@yoltra/devtools-ui";

function EventTimeline({ storeId }: { storeId: string }) {
  const { entries, clear } = useEventLog(storeId, { maxEntries: 500 });
  return (
    <div>
      <button onClick={clear}>Clear</button>
      <ul>
        {entries.map((e, i) => (
          <li key={i}>{e.event.type} @ {e.timestamp}</li>
        ))}
      </ul>
    </div>
  );
}
```
