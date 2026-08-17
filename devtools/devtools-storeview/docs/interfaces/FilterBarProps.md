![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-storeview**](../README.md)

***

[@yoltra/devtools-storeview](../README.md) / FilterBarProps

# Interface: FilterBarProps

Defined in: [devtools-storeview/src/components/shared/FilterBar.tsx:12](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/shared/FilterBar.tsx#L12)

Props for [FilterBar](../functions/FilterBar.md).

## Properties

### onChange()

> **onChange**: (`value`) => `void`

Defined in: [devtools-storeview/src/components/shared/FilterBar.tsx:16](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/shared/FilterBar.tsx#L16)

Callback when the filter text changes.

#### Parameters

##### value

`string`

#### Returns

`void`

***

### onToggleBounced()?

> `optional` **onToggleBounced**: () => `void`

Defined in: [devtools-storeview/src/components/shared/FilterBar.tsx:26](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/shared/FilterBar.tsx#L26)

Callback to toggle bounced visibility.

#### Returns

`void`

***

### onToggleCommitted()?

> `optional` **onToggleCommitted**: () => `void`

Defined in: [devtools-storeview/src/components/shared/FilterBar.tsx:24](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/shared/FilterBar.tsx#L24)

Callback to toggle committed visibility.

#### Returns

`void`

***

### placeholder?

> `optional` **placeholder**: `string`

Defined in: [devtools-storeview/src/components/shared/FilterBar.tsx:18](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/shared/FilterBar.tsx#L18)

Placeholder string for the text input.

***

### showBounced?

> `optional` **showBounced**: `boolean`

Defined in: [devtools-storeview/src/components/shared/FilterBar.tsx:22](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/shared/FilterBar.tsx#L22)

Whether the Bounced toggle is active.

***

### showCommitted?

> `optional` **showCommitted**: `boolean`

Defined in: [devtools-storeview/src/components/shared/FilterBar.tsx:20](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/shared/FilterBar.tsx#L20)

Whether the Committed toggle is active.

***

### value

> **value**: `string`

Defined in: [devtools-storeview/src/components/shared/FilterBar.tsx:14](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/components/shared/FilterBar.tsx#L14)

Current filter text.
