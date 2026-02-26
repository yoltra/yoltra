[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / StoreRegistry

# Interface: StoreRegistry

Defined in: [messages.ts:294](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/messages.ts#L294)

Registry of all connected stores, sent to extensions on connect
and whenever the registry changes.

## Remarks

This is a full replacement snapshot -- not a diff. Extensions should
replace their local store list entirely when they receive this message.
Each entry includes connection status and capabilities for UI rendering.

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

### stores

> **stores**: `object`[]

Defined in: [messages.ts:296](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/messages.ts#L296)

#### capabilities

> **capabilities**: [`StoreCapabilities`](StoreCapabilities.md)

#### connectedAt

> **connectedAt**: `string`

#### id

> **id**: `string`

#### name

> **name**: `string`

#### status

> **status**: `"connected"` \| `"connecting"` \| `"disconnected"`

***

### timestamp

> **timestamp**: `string`

Defined in: [wire.ts:21](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/wire.ts#L21)

ISO 8601 timestamp of when the message was created.

#### Inherited from

[`BaseMessage`](BaseMessage.md).[`timestamp`](BaseMessage.md#timestamp)

***

### type

> **type**: `"STORE_REGISTRY"`

Defined in: [messages.ts:295](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/messages.ts#L295)

Discriminant field identifying the message type.

#### Overrides

[`BaseMessage`](BaseMessage.md).[`type`](BaseMessage.md#type)
