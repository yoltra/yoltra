[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / HandshakeResponse

# Interface: HandshakeResponse

Defined in: [handshake.ts:73](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/handshake.ts#L73)

Hub response to a [HandshakeRequest](HandshakeRequest.md).

## Remarks

When `success` is `false`, the `error` field contains a human-readable
reason (e.g., incompatible protocol version). The client should close
the WebSocket and report the error to the user.

## Properties

### error?

> `optional` **error**: `string`

Defined in: [handshake.ts:82](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/handshake.ts#L82)

Error message when `success` is `false`.

***

### hubCapabilities

> **hubCapabilities**: [`HubCapabilities`](HubCapabilities.md)

Defined in: [handshake.ts:80](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/handshake.ts#L80)

Hub-side capabilities.

***

### negotiatedVersion

> **negotiatedVersion**: `string`

Defined in: [handshake.ts:78](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/handshake.ts#L78)

The negotiated protocol version (may differ from requested).

***

### success

> **success**: `boolean`

Defined in: [handshake.ts:76](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/handshake.ts#L76)

Whether the handshake was successful.

***

### type

> **type**: `"HANDSHAKE_RESPONSE"`

Defined in: [handshake.ts:74](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/handshake.ts#L74)
