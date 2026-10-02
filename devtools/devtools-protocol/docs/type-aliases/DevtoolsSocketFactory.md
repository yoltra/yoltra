![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / DevtoolsSocketFactory

# Type Alias: DevtoolsSocketFactory()

> **DevtoolsSocketFactory** = (`url`, `callbacks`) => [`DevtoolsSocketHandle`](../interfaces/DevtoolsSocketHandle.md)

Defined in: [ws-transport.ts:63](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/ws-transport.ts#L63)

Opens a socket to `url`, wiring the given callbacks, and returns a handle.
The agent supplies one (the native `WebSocket`, a `postMessage` bridge or an
in-memory loopback), so the shared client never imports a specific transport.

## Parameters

### url

`string`

### callbacks

[`DevtoolsSocketCallbacks`](../interfaces/DevtoolsSocketCallbacks.md)

## Returns

[`DevtoolsSocketHandle`](../interfaces/DevtoolsSocketHandle.md)
