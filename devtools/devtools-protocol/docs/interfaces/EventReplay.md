![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / EventReplay

# Interface: EventReplay

Defined in: [messages.ts:271](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L271)

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

Defined in: [messages.ts:277](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L277)

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

Defined in: [messages.ts:275](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L275)

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

Defined in: [messages.ts:273](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L273)

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

Defined in: [messages.ts:272](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L272)

Discriminant field identifying the message type.

#### Overrides

[`BaseMessage`](BaseMessage.md).[`type`](BaseMessage.md#type)
