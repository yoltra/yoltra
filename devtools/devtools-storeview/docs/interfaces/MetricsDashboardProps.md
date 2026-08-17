![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-storeview**](../README.md)

***

[@yoltra/devtools-storeview](../README.md) / MetricsDashboardProps

# Interface: MetricsDashboardProps

Defined in: [devtools-storeview/src/components/panels/MetricsDashboard.tsx:22](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/panels/MetricsDashboard.tsx#L22)

Props for [MetricsDashboard](../functions/MetricsDashboard.md).

## Properties

### loading

> **loading**: `boolean`

Defined in: [devtools-storeview/src/components/panels/MetricsDashboard.tsx:26](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/panels/MetricsDashboard.tsx#L26)

Whether metrics are being fetched.

***

### metrics

> **metrics**: `null` \| \{ `avgProcessingTimeMs`: `number`; `connectorCount`: `number`; `dedupHits`: `number`; `effectCount`: `number`; `eventCount`: `number`; `eventsPerSecond`: `number`; `middlewareCount`: `number`; `middlewareRejections`: `number`; `queueDepth`: `number`; `reducerCount`: `number`; `subscriberCount`: `number`; \}

Defined in: [devtools-storeview/src/components/panels/MetricsDashboard.tsx:24](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/panels/MetricsDashboard.tsx#L24)

The metrics payload, or `null` when unavailable.

***

### subscriptions?

> `optional` **subscriptions**: `null` \| [`SubscriptionData`](../type-aliases/SubscriptionData.md)

Defined in: [devtools-storeview/src/components/panels/MetricsDashboard.tsx:28](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/panels/MetricsDashboard.tsx#L28)

Subscription/consumer inventory, or `null`.
