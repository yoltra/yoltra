[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / RequestSubscriptions

# Interface: RequestSubscriptions

Defined in: [messages.ts:198](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/messages.ts#L198)

Request subscription and consumer info from a store.

## Extends

- [`BaseMessage`](BaseMessage.md)

## Properties

### sourceId

> **sourceId**: `string`

Defined in: [wire.ts:23](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/wire.ts#L23)

UUID of the sender (store wrapper ID or extension ID).

#### Inherited from

[`BaseMessage`](BaseMessage.md).[`sourceId`](BaseMessage.md#sourceid)

***

### sourceRole

> **sourceRole**: [`DevtoolsRole`](../enumerations/DevtoolsRole.md)

Defined in: [wire.ts:25](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/wire.ts#L25)

Role of the sender.

#### Inherited from

[`BaseMessage`](BaseMessage.md).[`sourceRole`](BaseMessage.md#sourcerole)

***

### storeId

> **storeId**: `string`

Defined in: [messages.ts:200](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/messages.ts#L200)

***

### timestamp

> **timestamp**: `string`

Defined in: [wire.ts:21](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/wire.ts#L21)

ISO 8601 timestamp of when the message was created.

#### Inherited from

[`BaseMessage`](BaseMessage.md).[`timestamp`](BaseMessage.md#timestamp)

***

### type

> **type**: `"REQUEST_SUBSCRIPTIONS"`

Defined in: [messages.ts:199](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/messages.ts#L199)

Discriminant field identifying the message type.

#### Overrides

[`BaseMessage`](BaseMessage.md).[`type`](BaseMessage.md#type)
