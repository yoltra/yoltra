![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

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

Defined in: [messages.ts:84](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L84)

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

#### truncated?

> `optional` **truncated**: `boolean`

`true` when the payload exceeded the agent's per-event byte cap and was replaced by a
truncation marker.

##### Remarks

Snapshots have always been bounded; event payloads were not, so one oversized payload
produced a frame above the hub's own limit and the socket was closed rather than the
message dropped. A payload the panel cannot show is better than a session that ends.

#### type

> **type**: `string`

***

### patches

> **patches**: [`JsonPatch`](JsonPatch.md)[]

Defined in: [messages.ts:78](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L78)

RFC 6902 JSON Patch operations describing state changes.

***

### patchesTruncated?

> `optional` **patchesTruncated**: `boolean`

Defined in: [messages.ts:80](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L80)

`true` when at least one patch value was replaced by a truncation marker.

***

### snapshotVersion

> **snapshotVersion**: `number`

Defined in: [messages.ts:82](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L82)

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
