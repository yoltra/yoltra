![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / RequestState

# Interface: RequestState

Defined in: [messages.ts:199](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L199)

Request a full state snapshot from a store.

## Remarks

Sent by an extension to the hub, which forwards it to the targeted
store. The store responds with a [StateSnapshot](StateSnapshot.md). An optional
`version` field can request a specific historical snapshot when
the store supports it.

## Extends

- [`BaseMessage`](BaseMessage.md)

## Properties

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

Defined in: [messages.ts:201](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L201)

***

### timestamp

> **timestamp**: `string`

Defined in: [wire.ts:21](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/wire.ts#L21)

ISO 8601 timestamp of when the message was created.

#### Inherited from

[`BaseMessage`](BaseMessage.md).[`timestamp`](BaseMessage.md#timestamp)

***

### type

> **type**: `"REQUEST_STATE"`

Defined in: [messages.ts:200](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L200)

Discriminant field identifying the message type.

#### Overrides

[`BaseMessage`](BaseMessage.md).[`type`](BaseMessage.md#type)

***

### version?

> `optional` **version**: `number`

Defined in: [messages.ts:203](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L203)

Optional: request a specific snapshot version.
