![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-storeview**](../README.md)

***

[@yoltra/devtools-storeview](../README.md) / FilterBar

# Function: FilterBar()

> **FilterBar**(`__namedParameters`): `Element`

Defined in: [devtools-storeview/src/components/shared/FilterBar.tsx:22](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/shared/FilterBar.tsx#L22)

Filter bar with text input and optional toggle buttons.

Provides a text field for `channel::type` filtering and optional
Committed / Bounced toggle buttons for event status filtering.

## Parameters

### \_\_namedParameters

#### onChange

(`value`) => `void`

#### onToggleBounced?

() => `void`

#### onToggleCommitted?

() => `void`

#### placeholder?

`string`

#### showBounced?

`boolean`

#### showCommitted?

`boolean`

#### value

`string`

## Returns

`Element`
