[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / StoreDisconnected

# Interface: StoreDisconnected

Defined in: [messages.ts:41](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L41)

Broadcast when a store disconnects from the hub.

## Remarks

The hub sends this to all extensions when a store's WebSocket closes
(gracefully or due to error). The optional `reason` field carries
a human-readable explanation when available.

## Extends

- [`BaseMessage`](BaseMessage.md)

## Properties

### reason?

> `optional` **reason**: `string`

Defined in: [messages.ts:44](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L44)

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

Defined in: [messages.ts:43](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L43)

***

### timestamp

> **timestamp**: `string`

Defined in: [wire.ts:21](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/wire.ts#L21)

ISO 8601 timestamp of when the message was created.

#### Inherited from

[`BaseMessage`](BaseMessage.md).[`timestamp`](BaseMessage.md#timestamp)

***

### type

> **type**: `"STORE_DISCONNECTED"`

Defined in: [messages.ts:42](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L42)

Discriminant field identifying the message type.

#### Overrides

[`BaseMessage`](BaseMessage.md).[`type`](BaseMessage.md#type)
