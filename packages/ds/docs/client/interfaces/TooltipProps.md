[**@yoltra/ds**](../../README.md)

***

[@yoltra/ds](../../README.md) / [client](../README.md) / TooltipProps

# Interface: TooltipProps

Defined in: [overlay/Tooltip.tsx:28](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Tooltip.tsx#L28)

## Properties

### children()

> **children**: (`props`) => `ReactNode`

Defined in: [overlay/Tooltip.tsx:32](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Tooltip.tsx#L32)

Renders the described element, spreading the props that wire and open it.

#### Parameters

##### props

[`TooltipTriggerProps`](TooltipTriggerProps.md)

#### Returns

`ReactNode`

***

### className?

> `optional` **className**: `string`

Defined in: [overlay/Tooltip.tsx:38](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Tooltip.tsx#L38)

***

### container?

> `optional` **container**: `null` \| `HTMLElement`

Defined in: [overlay/Tooltip.tsx:37](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Tooltip.tsx#L37)

***

### content

> **content**: `ReactNode`

Defined in: [overlay/Tooltip.tsx:30](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Tooltip.tsx#L30)

The text shown. Kept to a phrase; a tooltip is not a place for interactive content.

***

### delayMs?

> `optional` **delayMs**: `number`

Defined in: [overlay/Tooltip.tsx:36](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Tooltip.tsx#L36)

How long the pointer must rest before it appears, in ms. Keyboard focus shows it at once.

***

### offset?

> `optional` **offset**: `number`

Defined in: [overlay/Tooltip.tsx:34](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Tooltip.tsx#L34)

***

### placement?

> `optional` **placement**: [`Placement`](../type-aliases/Placement.md)

Defined in: [overlay/Tooltip.tsx:33](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Tooltip.tsx#L33)
