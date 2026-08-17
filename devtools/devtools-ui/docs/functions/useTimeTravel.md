![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-ui**](../README.md)

***

[@yoltra/devtools-ui](../README.md) / useTimeTravel

# Function: useTimeTravel()

> **useTimeTravel**(`storeId`, `entries`, `canReplay`): `object`

Defined in: [devtools-ui/src/hooks/useTimeTravel.ts:59](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/hooks/useTimeTravel.ts#L59)

Provides time-travel navigation through the event log.

## Parameters

### storeId

The store ID to time-travel, or `null` to disable.

`null` | `string`

### entries

[`EventLogEntry`](../interfaces/EventLogEntry.md)[]

The event log entries (typically from [useEventLog](useEventLog.md)).

### canReplay

`boolean` = `true`

Whether the selected store advertised the `replay` capability. Time-travel
commands are gated on it (DEV-4): the agent/core enforce it too, but the UI
should not send commands that will be dropped. Defaults to `true`.

## Returns

An object with `currentIndex`, `isTimeTraveling`, `jumpTo`,
  `stepBack`, `stepForward`, and `resume`.

### currentIndex

> **currentIndex**: `number`

### frameCount

> **frameCount**: `null` \| `number`

The event count the timeline is measured against: frozen at travel-start
so a live-emitting store cannot shift the scrubber, or `null` when live
(use `entries.length`). Consumers should size the slider/label off
`frameCount ?? entries.length`.

### isTimeTraveling

> **isTimeTraveling**: `boolean`

### jumpTo()

> **jumpTo**: (`index`) => `void`

#### Parameters

##### index

`number`

#### Returns

`void`

### previewState

> **previewState**: `unknown`

The store state reconstructed at the currently-viewed position (the
scrubbed index while traveling, otherwise the latest entry). `null` until
the baseline snapshot has been captured. Lets consumers render a live
preview of the state at any point in history.

### resume()

> **resume**: () => `void`

#### Returns

`void`

### stepBack()

> **stepBack**: () => `void`

#### Returns

`void`

### stepForward()

> **stepForward**: () => `void`

#### Returns

`void`

## Remarks

The hook tracks whether the user is actively time-traveling via
`isTimeTraveling`. While traveling, `currentIndex` indicates the position
within the `entries` array. The `stepBack` / `stepForward` helpers move
one entry at a time, while `jumpTo` allows arbitrary positioning. Calling
`resume()` exits time-travel mode, jumps to the latest entry, and resets
the index to `-1`.

## Example

```tsx
import { useEventLog, useTimeTravel } from "@yoltra/devtools-ui";

function TimeTravelControls({ storeId }: { storeId: string }) {
  const { entries } = useEventLog(storeId);
  const { currentIndex, isTimeTraveling, stepBack, stepForward, resume } =
    useTimeTravel(storeId, entries);

  return (
    <div>
      <button onClick={stepBack} disabled={currentIndex <= 0}>Back</button>
      <button onClick={stepForward}>Forward</button>
      {isTimeTraveling && <button onClick={resume}>Resume Live</button>}
      <span>Index: {currentIndex} / {entries.length - 1}</span>
    </div>
  );
}
```
