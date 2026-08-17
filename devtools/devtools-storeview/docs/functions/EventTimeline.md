![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-storeview**](../README.md)

***

[@yoltra/devtools-storeview](../README.md) / EventTimeline

# Function: EventTimeline()

> **EventTimeline**(`__namedParameters`): `Element`

Defined in: [devtools-storeview/src/components/panels/EventTimeline.tsx:46](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/panels/EventTimeline.tsx#L46)

Scrollable event timeline with filtering and detail inspection.

Lists all event log entries with committed/bounced status indicators,
channel, type, truncated payload preview, and timestamp. Supports
text filtering by `channel::type` and committed/bounced toggles via
the embedded [FilterBar](FilterBar.md). Selecting a row expands a
[JsonTree](JsonTree.md) detail view of the full entry.

## Parameters

### \_\_namedParameters

[`EventTimelineProps`](../interfaces/EventTimelineProps.md)

## Returns

`Element`
