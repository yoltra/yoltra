![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / StoreMetrics

# Interface: StoreMetrics

Defined in: [messages.ts:152](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L152)

Store performance metrics.

## Remarks

Sent by a store in response to [RequestMetrics](RequestMetrics.md). The counters
cover the lifetime of the store instance and reset on reload.
Extensions with `performanceMetrics: true` can poll these periodically
to render real-time dashboards.

## Extends

- [`BaseMessage`](BaseMessage.md)

## Properties

### metrics

> **metrics**: `object`

Defined in: [messages.ts:155](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L155)

#### avgProcessingTimeMs

> **avgProcessingTimeMs**: `number`

#### connectorCount

> **connectorCount**: `number`

#### dedupHits

> **dedupHits**: `number`

#### effectCount

> **effectCount**: `number`

#### eventCount

> **eventCount**: `number`

#### eventsPerSecond

> **eventsPerSecond**: `number`

#### middlewareCount

> **middlewareCount**: `number`

#### middlewareRejections

> **middlewareRejections**: `number`

#### queueDepth

> **queueDepth**: `number`

#### reducerCount

> **reducerCount**: `number`

#### subscriberCount

> **subscriberCount**: `number`

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

Defined in: [messages.ts:154](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L154)

***

### timestamp

> **timestamp**: `string`

Defined in: [wire.ts:21](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/wire.ts#L21)

ISO 8601 timestamp of when the message was created.

#### Inherited from

[`BaseMessage`](BaseMessage.md).[`timestamp`](BaseMessage.md#timestamp)

***

### type

> **type**: `"STORE_METRICS"`

Defined in: [messages.ts:153](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/messages.ts#L153)

Discriminant field identifying the message type.

#### Overrides

[`BaseMessage`](BaseMessage.md).[`type`](BaseMessage.md#type)
