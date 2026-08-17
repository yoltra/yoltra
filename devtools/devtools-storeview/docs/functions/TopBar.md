![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-storeview**](../README.md)

***

[@yoltra/devtools-storeview](../README.md) / TopBar

# Function: TopBar()

> **TopBar**(`__namedParameters`): `Element`

Defined in: [devtools-storeview/src/components/layout/TopBar.tsx:23](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/layout/TopBar.tsx#L23)

Top bar with the Yoltra brand and a store selector.

Shows the DevTools wordmark on the left and each registered store as a
selectable pill on the right, alongside a [ConnectionDot](ConnectionDot.md) reflecting
its live connection status.

## Parameters

### \_\_namedParameters

#### onSelectStore

(`id`) => `void`

#### selectedStoreId

`null` \| `string`

#### stores

`RegisteredStore`[]

## Returns

`Element`
