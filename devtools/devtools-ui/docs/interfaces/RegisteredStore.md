![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-ui**](../README.md)

***

[@yoltra/devtools-ui](../README.md) / RegisteredStore

# Interface: RegisteredStore

Defined in: [devtools-ui/src/types.ts:89](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L89)

Registered store entry tracked by the store registry.

## Remarks

Populated automatically by the [useStoreRegistry](../functions/useStoreRegistry.md) hook in response to
`STORE_REGISTRY`, `STORE_CONNECTED`, and `STORE_DISCONNECTED` hub messages.

## Properties

### capabilities

> **capabilities**: `StoreCapabilities`

Defined in: [devtools-ui/src/types.ts:97](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L97)

Capabilities advertised by the store during handshake.

***

### connectedAt

> **connectedAt**: `string`

Defined in: [devtools-ui/src/types.ts:99](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L99)

ISO-8601 timestamp of when the store first connected.

***

### id

> **id**: `string`

Defined in: [devtools-ui/src/types.ts:91](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L91)

Store identifier the agent presented (its `storeId`, or the store's name by default).

***

### name

> **name**: `string`

Defined in: [devtools-ui/src/types.ts:93](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L93)

Human-readable store name.

***

### status

> **status**: `"disconnected"` \| `"connecting"` \| `"connected"`

Defined in: [devtools-ui/src/types.ts:95](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L95)

Current connectivity status of the store.
