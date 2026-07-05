[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / StoreCapabilities

# Interface: StoreCapabilities

Defined in: [capabilities.ts:34](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/capabilities.ts#L34)

Capabilities advertised by a store during handshake.

## Remarks

Included in the `store` field of a [HandshakeRequest](HandshakeRequest.md). Extensions
inspect these flags to determine which features they can offer for a
given store (e.g., disabling the time-travel UI when `replay` is `false`).

## Properties

### emit

> **emit**: `boolean`

Defined in: [capabilities.ts:50](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/capabilities.ts#L50)

Whether extensions can emit events to this store.

***

### pipelineMeta

> **pipelineMeta**: `boolean`

Defined in: [capabilities.ts:48](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/capabilities.ts#L48)

Extension offers metadata.

 Metadata shared:
 - middleware
 - reducer
 - effects
 - event subs

***

### replay

> **replay**: `boolean`

Defined in: [capabilities.ts:36](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/capabilities.ts#L36)

Whether the store supports `__replayEvents`.

***

### sampling?

> `optional` **sampling**: [`SamplingConfig`](SamplingConfig.md)

Defined in: [capabilities.ts:52](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/capabilities.ts#L52)

Sampling configuration (protocol v1 design, implementation deferred).

***

### stateSnapshot

> **stateSnapshot**: `boolean`

Defined in: [capabilities.ts:38](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/capabilities.ts#L38)

Whether the store can provide full state snapshots on demand.

***

### subscriptionMeta

> **subscriptionMeta**: `boolean`

Defined in: [capabilities.ts:40](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/capabilities.ts#L40)

Extension shares Subscription metadata
