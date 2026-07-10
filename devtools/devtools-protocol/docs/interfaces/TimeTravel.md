[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / TimeTravel

# Interface: TimeTravel

Defined in: [messages.ts:225](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/messages.ts#L225)

Time travel: jump a store to a specific state.

## Remarks

Sent by an extension to restore a store to a previously captured state.
The store calls its internal `__applyExternalState` method, which replaces
the entire state tree and notifies all subscribers. This requires
[replay](StoreCapabilities.md#replay) capability on the store and
[timeTravel](ExtensionCapabilities.md#timetravel) on the extension.

## Extends

- [`BaseMessage`](BaseMessage.md)

## Properties

### snapshotVersion

> **snapshotVersion**: `number`

Defined in: [messages.ts:231](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/messages.ts#L231)

Snapshot version being jumped to.

***

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

### state

> **state**: `unknown`

Defined in: [messages.ts:229](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/messages.ts#L229)

Full state to apply via `__applyExternalState`.

***

### storeId

> **storeId**: `string`

Defined in: [messages.ts:227](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/messages.ts#L227)

***

### timestamp

> **timestamp**: `string`

Defined in: [wire.ts:21](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/wire.ts#L21)

ISO 8601 timestamp of when the message was created.

#### Inherited from

[`BaseMessage`](BaseMessage.md).[`timestamp`](BaseMessage.md#timestamp)

***

### type

> **type**: `"TIME_TRAVEL"`

Defined in: [messages.ts:226](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/messages.ts#L226)

Discriminant field identifying the message type.

#### Overrides

[`BaseMessage`](BaseMessage.md).[`type`](BaseMessage.md#type)
