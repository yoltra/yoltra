![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / DevtoolsSocketFactory

# Type Alias: DevtoolsSocketFactory()

> **DevtoolsSocketFactory** = (`url`, `callbacks`) => [`DevtoolsSocketHandle`](../interfaces/DevtoolsSocketHandle.md)

Defined in: [ws-transport.ts:65](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/ws-transport.ts#L65)

Opens a socket to `url`, wiring the given callbacks, and returns a handle.
Each agent supplies one (native `WebSocket` for browsers, the `ws` package for
Node), so the shared client never imports a specific transport.

## Parameters

### url

`string`

### callbacks

[`DevtoolsSocketCallbacks`](../interfaces/DevtoolsSocketCallbacks.md)

## Returns

[`DevtoolsSocketHandle`](../interfaces/DevtoolsSocketHandle.md)
