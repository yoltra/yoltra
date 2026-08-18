![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-storeview**](../README.md)

***

[@yoltra/devtools-storeview](../README.md) / TopBarProps

# Interface: TopBarProps

Defined in: [devtools-storeview/src/components/layout/TopBar.tsx:16](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/layout/TopBar.tsx#L16)

Props for [TopBar](../functions/TopBar.md).

## Properties

### onSelectStore()

> **onSelectStore**: (`id`) => `void`

Defined in: [devtools-storeview/src/components/layout/TopBar.tsx:22](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/layout/TopBar.tsx#L22)

Callback invoked when a store is chosen.

#### Parameters

##### id

`string`

#### Returns

`void`

***

### selectedStoreId

> **selectedStoreId**: `null` \| `string`

Defined in: [devtools-storeview/src/components/layout/TopBar.tsx:20](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/layout/TopBar.tsx#L20)

The currently selected store ID, or `null`.

***

### stores

> **stores**: `RegisteredStore`[]

Defined in: [devtools-storeview/src/components/layout/TopBar.tsx:18](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/layout/TopBar.tsx#L18)

Array of registered stores to display.
