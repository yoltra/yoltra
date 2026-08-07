[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / EventReplay

# Interface: EventReplay

Defined in: [messages.ts:259](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L259)

Replay events from a snapshot through reducers only.

## Remarks

Unlike [TimeTravel](TimeTravel.md), this re-processes events through the
store's reducers without triggering effects or middleware. Useful
for debugging reducer logic in isolation. Requires
[replay](StoreCapabilities.md#replay) on the store and
[eventReplay](ExtensionCapabilities.md#eventreplay) on the extension.

## Extends

- [`BaseMessage`](BaseMessage.md)

## Properties

### events

> **events**: `object`[]

Defined in: [messages.ts:265](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L265)

Events to replay in order.

#### channel

> **channel**: `string`

#### id

> **id**: `string`

#### payload

> **payload**: `unknown`

#### type

> **type**: `string`

***

### snapshot

> **snapshot**: `unknown`

Defined in: [messages.ts:263](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L263)

Starting state to apply before replaying.

***

### sourceId

> **sourceId**: `string`

Defined in: [wire.ts:23](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/wire.ts#L23)

UUID of the sender (store wrapper ID or extension ID).

#### Inherited from

[`BaseMessage`](BaseMessage.md).[`sourceId`](BaseMessage.md#sourceid)

***

### sourceRole

> **sourceRole**: [`DevtoolsRole`](../enumerations/DevtoolsRole.md)

Defined in: [wire.ts:25](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/wire.ts#L25)

Role of the sender.

#### Inherited from

[`BaseMessage`](BaseMessage.md).[`sourceRole`](BaseMessage.md#sourcerole)

***

### storeId

> **storeId**: `string`

Defined in: [messages.ts:261](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L261)

***

### timestamp

> **timestamp**: `string`

Defined in: [wire.ts:21](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/wire.ts#L21)

ISO 8601 timestamp of when the message was created.

#### Inherited from

[`BaseMessage`](BaseMessage.md).[`timestamp`](BaseMessage.md#timestamp)

***

### type

> **type**: `"EVENT_REPLAY"`

Defined in: [messages.ts:260](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L260)

Discriminant field identifying the message type.

#### Overrides

[`BaseMessage`](BaseMessage.md).[`type`](BaseMessage.md#type)
