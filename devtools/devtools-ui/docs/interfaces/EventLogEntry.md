![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-ui**](../README.md)

***

[@yoltra/devtools-ui](../README.md) / EventLogEntry

# Interface: EventLogEntry

Defined in: [devtools-ui/src/types.ts:111](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L111)

A logged event entry in the event log.

## Remarks

Each entry captures a single `STORE_EVENT` message received from the hub,
including the event descriptor, resulting patches, and the snapshot version
after the event was applied. The [useEventLog](../functions/useEventLog.md) hook collects these
entries in chronological order.

## Properties

### committed

> **committed**: `boolean`

Defined in: [devtools-ui/src/types.ts:121](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L121)

Whether the event was committed to the store.

***

### event

> **event**: `object`

Defined in: [devtools-ui/src/types.ts:113](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L113)

The event descriptor (channel, type, payload).

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

> **patches**: `JsonPatch`[]

Defined in: [devtools-ui/src/types.ts:117](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L117)

JSON Patch operations produced by the event.

***

### snapshotVersion

> **snapshotVersion**: `number`

Defined in: [devtools-ui/src/types.ts:119](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L119)

Store snapshot version after this event was applied.

***

### storeId

> **storeId**: `string`

Defined in: [devtools-ui/src/types.ts:115](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L115)

Identifier of the store that emitted the event.

***

### timestamp

> **timestamp**: `string`

Defined in: [devtools-ui/src/types.ts:123](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L123)

ISO-8601 timestamp of the event.
