![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-ui**](../README.md)

***

[@yoltra/devtools-ui](../README.md) / useEventReplay

# Function: useEventReplay()

> **useEventReplay**(`storeId`): `object`

Defined in: [devtools-ui/src/hooks/useEventReplay.ts:51](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/hooks/useEventReplay.ts#L51)

Replays events through a store's reducers from a given snapshot.

## Parameters

### storeId

The store ID to replay events on, or `null` to disable.

`null` | `string`

## Returns

`object`

An object containing the `replay` function.

### replay()

> **replay**: (`snapshot`, `events`) => `void`

#### Parameters

##### snapshot

`unknown`

##### events

[`EventLogEntry`](../interfaces/EventLogEntry.md)[]

#### Returns

`void`

## Remarks

The `replay` function accepts a base state snapshot and an array of
[EventLogEntry](../interfaces/EventLogEntry.md) objects. It serialises the events into the protocol
format and sends a single `EVENT_REPLAY` message to the hub. The store
is expected to process each event sequentially through its reducer
pipeline and emit the resulting state.

## Example

```tsx
import { useEventLog, useStoreState, useEventReplay } from "@yoltra/devtools-ui";

function ReplayButton({ storeId }: { storeId: string }) {
  const { state } = useStoreState(storeId);
  const { entries } = useEventLog(storeId);
  const { replay } = useEventReplay(storeId);

  return (
    <button onClick={() => replay(state, entries)}>
      Replay All Events
    </button>
  );
}
```
