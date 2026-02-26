[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / BaseMessage

# Interface: BaseMessage

Defined in: [wire.ts:17](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/wire.ts#L17)

Base structure shared by all DevTools protocol messages.

## Remarks

Every message sent over the DevTools WebSocket extends this interface.
The `type` field acts as a discriminant for the [DevtoolsMessage](../type-aliases/DevtoolsMessage.md)
union, enabling exhaustive `switch` routing on the receiving side.

## Extended by

- [`EmitToStore`](EmitToStore.md)
- [`EventReplay`](EventReplay.md)
- [`RequestMetrics`](RequestMetrics.md)
- [`RequestState`](RequestState.md)
- [`RequestSubscriptions`](RequestSubscriptions.md)
- [`StateSnapshot`](StateSnapshot.md)
- [`StoreConnected`](StoreConnected.md)
- [`StoreDisconnected`](StoreDisconnected.md)
- [`StoreEvent`](StoreEvent.md)
- [`StoreMetrics`](StoreMetrics.md)
- [`StoreRegistry`](StoreRegistry.md)
- [`StoreSubscriptions`](StoreSubscriptions.md)
- [`TimeTravel`](TimeTravel.md)

## Properties

### sourceId

> **sourceId**: `string`

Defined in: [wire.ts:23](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/wire.ts#L23)

UUID of the sender (store wrapper ID or extension ID).

***

### sourceRole

> **sourceRole**: [`DevtoolsRole`](../enumerations/DevtoolsRole.md)

Defined in: [wire.ts:25](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/wire.ts#L25)

Role of the sender.

***

### timestamp

> **timestamp**: `string`

Defined in: [wire.ts:21](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/wire.ts#L21)

ISO 8601 timestamp of when the message was created.

***

### type

> **type**: `string`

Defined in: [wire.ts:19](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/wire.ts#L19)

Discriminant field identifying the message type.
