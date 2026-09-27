![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../README.md)

***

[@yoltra/ds](../../README.md) / [client](../README.md) / TooltipProps

# Interface: TooltipProps

Defined in: [overlay/Tooltip/Tooltip.tsx:38](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Tooltip/Tooltip.tsx#L38)

## Properties

### children()

> **children**: (`props`) => `ReactNode`

Defined in: [overlay/Tooltip/Tooltip.tsx:42](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Tooltip/Tooltip.tsx#L42)

Renders the described element, spreading the props that wire and open it.

#### Parameters

##### props

[`TooltipTriggerProps`](TooltipTriggerProps.md)

#### Returns

`ReactNode`

***

### className?

> `optional` **className**: `string`

Defined in: [overlay/Tooltip/Tooltip.tsx:48](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Tooltip/Tooltip.tsx#L48)

***

### container?

> `optional` **container**: `null` \| `HTMLElement`

Defined in: [overlay/Tooltip/Tooltip.tsx:47](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Tooltip/Tooltip.tsx#L47)

***

### content

> **content**: `ReactNode`

Defined in: [overlay/Tooltip/Tooltip.tsx:40](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Tooltip/Tooltip.tsx#L40)

The text shown. Kept to a phrase; a tooltip is not a place for interactive content.

***

### delayMs?

> `optional` **delayMs**: `number`

Defined in: [overlay/Tooltip/Tooltip.tsx:46](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Tooltip/Tooltip.tsx#L46)

How long the pointer must rest before it appears, in ms. Keyboard focus shows it at once.

***

### offset?

> `optional` **offset**: `number`

Defined in: [overlay/Tooltip/Tooltip.tsx:44](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Tooltip/Tooltip.tsx#L44)

***

### placement?

> `optional` **placement**: [`Placement`](../type-aliases/Placement.md)

Defined in: [overlay/Tooltip/Tooltip.tsx:43](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Tooltip/Tooltip.tsx#L43)
