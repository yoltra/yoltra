[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / HubCapabilities

# Interface: HubCapabilities

Defined in: [capabilities.ts:88](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/capabilities.ts#L88)

Capabilities advertised by the hub during handshake response.

## Remarks

Returned inside the [HandshakeResponse](HandshakeResponse.md). Extensions and stores can
use these values to adapt their behaviour (e.g., limiting local history
buffers to `maxHistorySize`).

## Properties

### maxHistorySize

> **maxHistorySize**: `number`

Defined in: [capabilities.ts:90](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/capabilities.ts#L90)

Maximum number of events kept in the ring buffer.

***

### supportedFeatures

> **supportedFeatures**: `string`[]

Defined in: [capabilities.ts:92](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/capabilities.ts#L92)

Feature flags supported by this hub version.
