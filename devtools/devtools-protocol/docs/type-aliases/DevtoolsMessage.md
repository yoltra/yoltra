[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / DevtoolsMessage

# Type Alias: DevtoolsMessage

> **DevtoolsMessage** = [`StoreConnected`](../interfaces/StoreConnected.md) \| [`StoreDisconnected`](../interfaces/StoreDisconnected.md) \| [`StoreEvent`](../interfaces/StoreEvent.md) \| [`StateSnapshot`](../interfaces/StateSnapshot.md) \| [`StoreMetrics`](../interfaces/StoreMetrics.md) \| [`StoreSubscriptions`](../interfaces/StoreSubscriptions.md) \| [`RequestState`](../interfaces/RequestState.md) \| [`RequestSubscriptions`](../interfaces/RequestSubscriptions.md) \| [`RequestMetrics`](../interfaces/RequestMetrics.md) \| [`TimeTravel`](../interfaces/TimeTravel.md) \| [`EventReplay`](../interfaces/EventReplay.md) \| [`EmitToStore`](../interfaces/EmitToStore.md) \| [`StoreRegistry`](../interfaces/StoreRegistry.md)

Defined in: [messages.ts:333](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/messages.ts#L333)

Union of all DevTools protocol messages.
Discriminated on the `type` field for type-safe routing.

## Remarks

Use a `switch` statement on the `type` field for exhaustive handling:

## Example

```ts
import type { DevtoolsMessage } from "@yoltra/devtools-protocol";

function handle(msg: DevtoolsMessage) {
  switch (msg.type) {
    case "STORE_EVENT":
      console.log(msg.patches);
      break;
    case "STATE_SNAPSHOT":
      console.log(msg.state);
      break;
    // ... remaining cases
  }
}
```
