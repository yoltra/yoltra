[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / ConnectionState

# Type Alias: ConnectionState

> **ConnectionState** = `"disconnected"` \| `"connecting"` \| `"connected"` \| `"reconnecting"`

Defined in: [ws-transport.ts:38](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/ws-transport.ts#L38)

Connection state for the devtools WS client.

## Remarks

`disconnected` -> `connecting` -> `connected`, or
`connected` -> `reconnecting` -> `connected`/`disconnected`.
