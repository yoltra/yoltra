![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-storeview**](../README.md)

***

[@yoltra/devtools-storeview](../README.md) / StateTreeExplorer

# Function: StateTreeExplorer()

> **StateTreeExplorer**(`__namedParameters`): `Element`

Defined in: [devtools-storeview/src/components/panels/StateTreeExplorer.tsx:21](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/panels/StateTreeExplorer.tsx#L21)

Lazy-loaded, searchable state tree explorer.

Displays the current store state through a [JsonTree](JsonTree.md) with a
search bar that recursively filters keys and values. Shows a loading
indicator while state is being fetched.

## Parameters

### \_\_namedParameters

#### loading

`boolean`

#### onRefresh?

() => `void`

#### state

`unknown`

## Returns

`Element`
