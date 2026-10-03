![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / duplicateStoreIdError

# Function: duplicateStoreIdError()

> **duplicateStoreIdError**(`storeId`): `string`

Defined in: [handshake.ts:114](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/handshake.ts#L114)

The `error` of a [HandshakeResponse](../interfaces/HandshakeResponse.md) refusing a store whose id is already connected.

## Parameters

### storeId

`string`

The id that is already connected.

## Returns

`string`

The human-readable refusal.

## Remarks

A hub holds one connection per store id. Every hub implementation refuses a second store
presenting a connected id with this text, so a refusal reads the same whether the store
reached a hub over a socket or a panel's in-memory broker. Agents default the id to the
store's name, which is how two stores usually come to share one.
