![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-storeview**](../README.md)

***

[@yoltra/devtools-storeview](../README.md) / EventTimelineProps

# Interface: EventTimelineProps

Defined in: [devtools-storeview/src/components/panels/EventTimeline.tsx:28](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/panels/EventTimeline.tsx#L28)

Props for [EventTimeline](../functions/EventTimeline.md).

## Properties

### entries

> **entries**: `EventLogEntry`[]

Defined in: [devtools-storeview/src/components/panels/EventTimeline.tsx:30](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/panels/EventTimeline.tsx#L30)

Array of event log entries to display.

***

### onSelectEntry()?

> `optional` **onSelectEntry**: (`entry`, `index`) => `void`

Defined in: [devtools-storeview/src/components/panels/EventTimeline.tsx:32](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/panels/EventTimeline.tsx#L32)

Optional callback when an entry row is clicked.

#### Parameters

##### entry

`EventLogEntry`

##### index

`number`

#### Returns

`void`
