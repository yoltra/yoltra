[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / StoreEvent

# Interface: StoreEvent

Defined in: [messages.ts:58](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L58)

An event emitted by a store, forwarded to extensions.

## Remarks

This is the primary data-flow message. Each `StoreEvent` carries the
original event payload plus an array of [JsonPatch](JsonPatch.md) operations
describing the resulting state delta. Extensions can apply the patches
incrementally or request a full [StateSnapshot](StateSnapshot.md) when needed.

## Extends

- [`BaseMessage`](BaseMessage.md)

## Properties

### committed

> **committed**: `boolean`

Defined in: [messages.ts:72](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L72)

`true` if the event passed middleware; `false` if bounced.

***

### event

> **event**: `object`

Defined in: [messages.ts:61](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L61)

#### channel

> **channel**: `string`

#### id

> **id**: `string`

#### payload

> **payload**: `unknown`

#### type

> **type**: `string`

***

### patches

> **patches**: [`JsonPatch`](JsonPatch.md)[]

Defined in: [messages.ts:68](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L68)

RFC 6902 JSON Patch operations describing state changes.

***

### snapshotVersion

> **snapshotVersion**: `number`

Defined in: [messages.ts:70](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L70)

Monotonically increasing snapshot version counter.

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

Defined in: [messages.ts:60](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L60)

***

### timestamp

> **timestamp**: `string`

Defined in: [wire.ts:21](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/wire.ts#L21)

ISO 8601 timestamp of when the message was created.

#### Inherited from

[`BaseMessage`](BaseMessage.md).[`timestamp`](BaseMessage.md#timestamp)

***

### type

> **type**: `"STORE_EVENT"`

Defined in: [messages.ts:59](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L59)

Discriminant field identifying the message type.

#### Overrides

[`BaseMessage`](BaseMessage.md).[`type`](BaseMessage.md#type)
