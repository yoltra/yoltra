![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-ui**](../README.md)

***

[@yoltra/devtools-ui](../README.md) / RegisteredStore

# Interface: RegisteredStore

Defined in: [devtools-ui/src/types.ts:80](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L80)

Registered store entry tracked by the store registry.

## Remarks

Populated automatically by the [useStoreRegistry](../functions/useStoreRegistry.md) hook in response to
`STORE_REGISTRY`, `STORE_CONNECTED`, and `STORE_DISCONNECTED` hub messages.

## Properties

### capabilities

> **capabilities**: `StoreCapabilities`

Defined in: [devtools-ui/src/types.ts:88](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L88)

Capabilities advertised by the store during handshake.

***

### connectedAt

> **connectedAt**: `string`

Defined in: [devtools-ui/src/types.ts:90](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L90)

ISO-8601 timestamp of when the store first connected.

***

### id

> **id**: `string`

Defined in: [devtools-ui/src/types.ts:82](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L82)

Unique store identifier assigned by the hub.

***

### name

> **name**: `string`

Defined in: [devtools-ui/src/types.ts:84](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L84)

Human-readable store name.

***

### status

> **status**: `"disconnected"` \| `"connecting"` \| `"connected"`

Defined in: [devtools-ui/src/types.ts:86](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L86)

Current connectivity status of the store.
