![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-ui**](../README.md)

***

[@yoltra/devtools-ui](../README.md) / EventLogEntry

# Interface: EventLogEntry

Defined in: [devtools-ui/src/types.ts:104](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L104)

A logged event entry in the event log.

## Remarks

Each entry captures a single `STORE_EVENT` message received from the hub,
including the event descriptor, resulting patches, and the snapshot version
after the event was applied. The [useEventLog](../functions/useEventLog.md) hook collects these
entries in chronological order.

## Properties

### committed

> **committed**: `boolean`

Defined in: [devtools-ui/src/types.ts:114](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L114)

Whether the event was committed to the store.

***

### event

> **event**: `object`

Defined in: [devtools-ui/src/types.ts:106](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L106)

The event descriptor (channel, type, payload).

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

> **patches**: `JsonPatch`[]

Defined in: [devtools-ui/src/types.ts:110](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L110)

JSON Patch operations produced by the event.

***

### reason?

> `optional` **reason**: `"vetoed"` \| `"deduped"` \| `"cascade"`

Defined in: [devtools-ui/src/types.ts:122](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L122)

Why the event did not commit, when it did not.

#### Remarks

`committed: false` says an event vanished; this says what happened to it. Absent when the
event committed, and absent from an agent older than the field.

***

### snapshotVersion

> **snapshotVersion**: `number`

Defined in: [devtools-ui/src/types.ts:112](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L112)

Store snapshot version after this event was applied.

***

### storeId

> **storeId**: `string`

Defined in: [devtools-ui/src/types.ts:108](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L108)

Identifier of the store that emitted the event.

***

### timestamp

> **timestamp**: `string`

Defined in: [devtools-ui/src/types.ts:126](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L126)

ISO-8601 timestamp of the event.

***

### vetoedBy?

> `optional` **vetoedBy**: `string`

Defined in: [devtools-ui/src/types.ts:124](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L124)

Which middleware vetoed, when one did and it had a name.
