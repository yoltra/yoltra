![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / ReconnectingWsConfig

# Interface: ReconnectingWsConfig

Defined in: [ws-transport.ts:71](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/ws-transport.ts#L71)

Reconnection/buffering configuration.

## Properties

### authToken?

> `optional` **authToken**: `string`

Defined in: [ws-transport.ts:85](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/ws-transport.ts#L85)

Shared secret the hub requires, when it was started with one.

#### Remarks

Presented on every handshake, including after a reconnect. Omit for a hub running without a
token — the usual case on a developer machine, where the hub says so at startup.

***

### autoReconnect

> **autoReconnect**: `boolean`

Defined in: [ws-transport.ts:72](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/ws-transport.ts#L72)

***

### baseDelay

> **baseDelay**: `number`

Defined in: [ws-transport.ts:74](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/ws-transport.ts#L74)

***

### maxBufferSize?

> `optional` **maxBufferSize**: `number`

Defined in: [ws-transport.ts:77](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/ws-transport.ts#L77)

Max buffered messages while disconnected before dropping the oldest. Default 100.

***

### maxDelay

> **maxDelay**: `number`

Defined in: [ws-transport.ts:75](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/ws-transport.ts#L75)

***

### maxReconnectAttempts

> **maxReconnectAttempts**: `number`

Defined in: [ws-transport.ts:73](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/ws-transport.ts#L73)
