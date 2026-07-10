[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / StoreSubscriptions

# Interface: StoreSubscriptions

Defined in: [messages.ts:136](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/messages.ts#L136)

Store subscription and consumer info.

## Remarks

Sent by a store in response to [RequestSubscriptions](RequestSubscriptions.md). Provides a
complete inventory of all registered reducers, effects, middleware, and
active subscriptions (atomic, event, and coarse). Extensions use this
data to render dependency graphs and subscription explorers.

## Extends

- [`BaseMessage`](BaseMessage.md)

## Properties

### atomic

> **atomic**: `object`[]

Defined in: [messages.ts:140](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/messages.ts#L140)

Fine-grained (connect) subscriptions.

#### property

> **property**: `string`

#### reducer

> **reducer**: `string`

***

### coarse

> **coarse**: `number`

Defined in: [messages.ts:151](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/messages.ts#L151)

Count of coarse subscribers.

***

### effects

> **effects**: `object`[]

Defined in: [messages.ts:153](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/messages.ts#L153)

Registered effects.

#### channel

> **channel**: `string`

#### description?

> `optional` **description**: `string`

#### name?

> `optional` **name**: `string`

#### type

> **type**: `string`

***

### event

> **event**: `object`[]

Defined in: [messages.ts:145](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/messages.ts#L145)

Event subscriptions (onEvent).

#### channel

> **channel**: `string`

#### phase

> **phase**: `string`

#### type

> **type**: `string`

***

### middleware

> **middleware**: `object`[]

Defined in: [messages.ts:160](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/messages.ts#L160)

Registered middleware.

#### description?

> `optional` **description**: `string`

#### name?

> `optional` **name**: `string`

#### when?

> `optional` **when**: `unknown`

***

### reducers

> **reducers**: `object`[]

Defined in: [messages.ts:166](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/messages.ts#L166)

Registered reducers.

#### meta?

> `optional` **meta**: `unknown`

#### name

> **name**: `string`

#### when?

> `optional` **when**: `unknown`

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

### storeId

> **storeId**: `string`

Defined in: [messages.ts:138](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/messages.ts#L138)

***

### timestamp

> **timestamp**: `string`

Defined in: [wire.ts:21](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/wire.ts#L21)

ISO 8601 timestamp of when the message was created.

#### Inherited from

[`BaseMessage`](BaseMessage.md).[`timestamp`](BaseMessage.md#timestamp)

***

### type

> **type**: `"STORE_SUBSCRIPTIONS"`

Defined in: [messages.ts:137](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/messages.ts#L137)

Discriminant field identifying the message type.

#### Overrides

[`BaseMessage`](BaseMessage.md).[`type`](BaseMessage.md#type)
