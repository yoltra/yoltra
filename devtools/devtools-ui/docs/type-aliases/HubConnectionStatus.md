![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-ui**](../README.md)

***

[@yoltra/devtools-ui](../README.md) / HubConnectionStatus

# Type Alias: HubConnectionStatus

> **HubConnectionStatus** = `"disconnected"` \| `"connecting"` \| `"connected"`

Defined in: [devtools-ui/src/types.ts:76](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L76)

Connection status for the hub WebSocket.

## Remarks

- `"disconnected"` -- no active connection.
- `"connecting"` -- WebSocket handshake in progress.
- `"connected"` -- handshake complete, messages can be sent and received.
