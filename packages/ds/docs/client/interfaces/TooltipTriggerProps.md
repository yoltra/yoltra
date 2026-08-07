[**@yoltra/ds**](../../README.md)

***

[@yoltra/ds](../../README.md) / [client](../README.md) / TooltipTriggerProps

# Interface: TooltipTriggerProps

Defined in: [overlay/Tooltip.tsx:19](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Tooltip.tsx#L19)

What the described element has to carry.

## Remarks

`aria-describedby` rather than `aria-label`: a tooltip supplements a control's name, it does
not replace it. Labelling with one leaves an icon button whose name disappears the moment the
tooltip is not showing.

## Properties

### aria-describedby

> **aria-describedby**: `undefined` \| `string`

Defined in: [overlay/Tooltip.tsx:21](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Tooltip.tsx#L21)

***

### onBlur()

> **onBlur**: () => `void`

Defined in: [overlay/Tooltip.tsx:25](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Tooltip.tsx#L25)

#### Returns

`void`

***

### onFocus()

> **onFocus**: () => `void`

Defined in: [overlay/Tooltip.tsx:24](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Tooltip.tsx#L24)

#### Returns

`void`

***

### onPointerEnter()

> **onPointerEnter**: () => `void`

Defined in: [overlay/Tooltip.tsx:22](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Tooltip.tsx#L22)

#### Returns

`void`

***

### onPointerLeave()

> **onPointerLeave**: () => `void`

Defined in: [overlay/Tooltip.tsx:23](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Tooltip.tsx#L23)

#### Returns

`void`

***

### ref()

> **ref**: (`node`) => `void`

Defined in: [overlay/Tooltip.tsx:20](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Tooltip.tsx#L20)

#### Parameters

##### node

`null` | `HTMLElement`

#### Returns

`void`
