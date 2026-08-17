![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-storeview**](../README.md)

***

[@yoltra/devtools-storeview](../README.md) / MetricsDashboard

# Function: MetricsDashboard()

> **MetricsDashboard**(`__namedParameters`): `Element`

Defined in: [devtools-storeview/src/components/panels/MetricsDashboard.tsx:35](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/panels/MetricsDashboard.tsx#L35)

Dashboard of store performance metrics and architecture.

## Sections
- **Live** — throughput and timing counters sampled on every dispatch:
  events/sec, total events, average processing time, queue depth, dedup
  hits, and middleware rejections.
- **Architecture** — registered-consumer counts (reducers, effects,
  middleware, subscribers, connectors).
- **Consumers** — the actual registered reducers/effects/middleware and the
  live fine-grained (atomic) subscriptions, folded in from the former
  Subscriptions view.

## Parameters

### \_\_namedParameters

#### loading

`boolean`

#### metrics

`null` \| \{ `avgProcessingTimeMs`: `number`; `connectorCount`: `number`; `dedupHits`: `number`; `effectCount`: `number`; `eventCount`: `number`; `eventsPerSecond`: `number`; `middlewareCount`: `number`; `middlewareRejections`: `number`; `queueDepth`: `number`; `reducerCount`: `number`; `subscriberCount`: `number`; \}

#### subscriptions?

`null` \| `SubscriptionData`

## Returns

`Element`
