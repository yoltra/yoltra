![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / StateSnapshot

# Interface: StateSnapshot

Defined in: [messages.ts:86](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L86)

Full state snapshot, sent in response to [RequestState](RequestState.md).

## Remarks

Contains the complete serialized state tree at a specific version.
Extensions use this to hydrate their local state representation or
to re-sync after reconnection. The `reducerNames` array lists all
registered reducer slices for UI display.

## Extends

- [`BaseMessage`](BaseMessage.md)

## Properties

### reducerNames

> **reducerNames**: `string`[]

Defined in: [messages.ts:94](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L94)

List of reducer slice names.

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

Defined in: [messages.ts:90](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L90)

Serialized state tree — complete unless [StateSnapshot.truncated](#truncated) says otherwise.

***

### storeId

> **storeId**: `string`

Defined in: [messages.ts:88](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L88)

***

### timestamp

> **timestamp**: `string`

Defined in: [wire.ts:21](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/wire.ts#L21)

ISO 8601 timestamp of when the message was created.

#### Inherited from

[`BaseMessage`](BaseMessage.md).[`timestamp`](BaseMessage.md#timestamp)

***

### truncated?

> `optional` **truncated**: `boolean`

Defined in: [messages.ts:104](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L104)

`true` when the state was too large to send whole and parts were replaced by markers.

#### Remarks

A frame over the hub's cap is rejected and the connection dropped, so the agent bounds the
snapshot itself rather than sending one that will be refused. Without this flag the panel
would render a partial tree as though it were the state — worse than showing nothing,
because a debugger that quietly lies about state is not a debugger.

***

### truncationNote?

> `optional` **truncationNote**: `string`

Defined in: [messages.ts:106](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L106)

Explains what was dropped and why, for display alongside a truncated tree.

***

### type

> **type**: `"STATE_SNAPSHOT"`

Defined in: [messages.ts:87](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L87)

Discriminant field identifying the message type.

#### Overrides

[`BaseMessage`](BaseMessage.md).[`type`](BaseMessage.md#type)

***

### version

> **version**: `number`

Defined in: [messages.ts:92](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L92)

Snapshot version matching the latest event's `snapshotVersion`.
