![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / HandshakeResponse

# Interface: HandshakeResponse

Defined in: [handshake.ts:85](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/handshake.ts#L85)

Hub response to a [HandshakeRequest](HandshakeRequest.md).

## Remarks

When `success` is `false`, the `error` field contains a human-readable
reason (e.g., incompatible protocol version). The client should close
the WebSocket and report the error to the user.

## Properties

### error?

> `optional` **error**: `string`

Defined in: [handshake.ts:94](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/handshake.ts#L94)

Error message when `success` is `false`.

***

### hubCapabilities

> **hubCapabilities**: [`HubCapabilities`](HubCapabilities.md)

Defined in: [handshake.ts:92](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/handshake.ts#L92)

Hub-side capabilities.

***

### negotiatedVersion

> **negotiatedVersion**: `string`

Defined in: [handshake.ts:90](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/handshake.ts#L90)

The negotiated protocol version (may differ from requested).

***

### success

> **success**: `boolean`

Defined in: [handshake.ts:88](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/handshake.ts#L88)

Whether the handshake was successful.

***

### type

> **type**: `"HANDSHAKE_RESPONSE"`

Defined in: [handshake.ts:86](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/handshake.ts#L86)
