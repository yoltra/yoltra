![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-ui**](../README.md)

***

[@yoltra/devtools-ui](../README.md) / createLoopbackHub

# Function: createLoopbackHub()

> **createLoopbackHub**(): [`LoopbackHub`](../interfaces/LoopbackHub.md)

Defined in: [devtools-ui/src/transport/loopback.ts:187](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/transport/loopback.ts#L187)

Creates a self-contained in-memory DevTools hub plus the two client transports
that connect to it — a `socketFactory` for the store agent and a
`WebSocket`-compatible class for the panel UI. No ports, no server, no
extension: everything runs in the current process.

## Returns

[`LoopbackHub`](../interfaces/LoopbackHub.md)

## Example

```ts
const hub = createLoopbackHub();
withDevtools(store, { port: 0, socketFactory: hub.agentSocketFactory });
// <DevtoolsApp config={{ port: 0, WebSocket: hub.WebSocket }} />
```
