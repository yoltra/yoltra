[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / EmitToStore

# Interface: EmitToStore

Defined in: [messages.ts:284](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L284)

Emit an event to a store from an extension.

## Remarks

Allows extensions to inject synthetic events into a store's pipeline.
The event goes through the full middleware and reducer chain.
Requires [emit](StoreCapabilities.md#emit) on the target store
and [eventEmit](ExtensionCapabilities.md#eventemit) on the extension.

## Extends

- [`BaseMessage`](BaseMessage.md)

## Properties

### event

> **event**: `object`

Defined in: [messages.ts:287](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L287)

#### channel

> **channel**: `string`

#### payload

> **payload**: `unknown`

#### type

> **type**: `string`

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

Defined in: [messages.ts:286](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L286)

***

### timestamp

> **timestamp**: `string`

Defined in: [wire.ts:21](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/wire.ts#L21)

ISO 8601 timestamp of when the message was created.

#### Inherited from

[`BaseMessage`](BaseMessage.md).[`timestamp`](BaseMessage.md#timestamp)

***

### type

> **type**: `"EMIT_TO_STORE"`

Defined in: [messages.ts:285](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L285)

Discriminant field identifying the message type.

#### Overrides

[`BaseMessage`](BaseMessage.md).[`type`](BaseMessage.md#type)
