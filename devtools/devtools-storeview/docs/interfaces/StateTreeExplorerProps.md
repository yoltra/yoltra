![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-storeview**](../README.md)

***

[@yoltra/devtools-storeview](../README.md) / StateTreeExplorerProps

# Interface: StateTreeExplorerProps

Defined in: [devtools-storeview/src/components/panels/StateTreeExplorer.tsx:14](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/panels/StateTreeExplorer.tsx#L14)

Props for [StateTreeExplorer](../functions/StateTreeExplorer.md).

## Properties

### loading

> **loading**: `boolean`

Defined in: [devtools-storeview/src/components/panels/StateTreeExplorer.tsx:18](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/panels/StateTreeExplorer.tsx#L18)

Whether a state fetch is in progress.

***

### onRefresh()?

> `optional` **onRefresh**: () => `void`

Defined in: [devtools-storeview/src/components/panels/StateTreeExplorer.tsx:20](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/panels/StateTreeExplorer.tsx#L20)

Optional callback to manually refresh state.

#### Returns

`void`

***

### state

> **state**: `unknown`

Defined in: [devtools-storeview/src/components/panels/StateTreeExplorer.tsx:16](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/panels/StateTreeExplorer.tsx#L16)

The current store state snapshot.
