[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / TimeTravel

# Interface: TimeTravel

Defined in: [messages.ts:238](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L238)

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

Defined in: [messages.ts:244](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L244)

Snapshot version being jumped to.

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

### state

> **state**: `unknown`

Defined in: [messages.ts:242](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L242)

Full state to apply via `__applyExternalState`.

***

### storeId

> **storeId**: `string`

Defined in: [messages.ts:240](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L240)

***

### timestamp

> **timestamp**: `string`

Defined in: [wire.ts:21](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/wire.ts#L21)

ISO 8601 timestamp of when the message was created.

#### Inherited from

[`BaseMessage`](BaseMessage.md).[`timestamp`](BaseMessage.md#timestamp)

***

### type

> **type**: `"TIME_TRAVEL"`

Defined in: [messages.ts:239](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L239)

Discriminant field identifying the message type.

#### Overrides

[`BaseMessage`](BaseMessage.md).[`type`](BaseMessage.md#type)
