[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / ExtensionCapabilities

# Interface: ExtensionCapabilities

Defined in: [capabilities.ts:65](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/capabilities.ts#L65)

Capabilities advertised by an extension during handshake.

## Remarks

Included in the `extension` field of a [HandshakeRequest](HandshakeRequest.md). The hub
may use these flags to filter forwarded messages (e.g., skipping metrics
broadcasts to extensions that set `performanceMetrics: false`).

## Properties

### eventEmit

> **eventEmit**: `boolean`

Defined in: [capabilities.ts:73](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/capabilities.ts#L73)

Extension can emit events to stores.

***

### eventReplay

> **eventReplay**: `boolean`

Defined in: [capabilities.ts:69](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/capabilities.ts#L69)

Extension supports event replay (reducer-only replay).

***

### performanceMetrics

> **performanceMetrics**: `boolean`

Defined in: [capabilities.ts:75](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/capabilities.ts#L75)

Extension can display performance metrics.

***

### stateExplorer

> **stateExplorer**: `boolean`

Defined in: [capabilities.ts:71](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/capabilities.ts#L71)

Extension has a state tree explorer.

***

### timeTravel

> **timeTravel**: `boolean`

Defined in: [capabilities.ts:67](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/capabilities.ts#L67)

Extension supports time-travel (state-only replay).
