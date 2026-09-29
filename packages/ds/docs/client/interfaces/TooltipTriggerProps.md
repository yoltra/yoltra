![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../README.md)

***

[@yoltra/ds](../../README.md) / [client](../README.md) / TooltipTriggerProps

# Interface: TooltipTriggerProps

Defined in: [overlay/Tooltip/Tooltip.tsx:19](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Tooltip/Tooltip.tsx#L19)

What the described element has to carry.

## Remarks

`aria-describedby` rather than `aria-label`: a tooltip supplements a control's name, it does
not replace it. Labelling with one leaves an icon button whose name disappears the moment the
tooltip is not showing.

## Properties

### aria-describedby

> **aria-describedby**: `undefined` \| `string`

Defined in: [overlay/Tooltip/Tooltip.tsx:31](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Tooltip/Tooltip.tsx#L31)

***

### onBlur()

> **onBlur**: () => `void`

Defined in: [overlay/Tooltip/Tooltip.tsx:35](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Tooltip/Tooltip.tsx#L35)

#### Returns

`void`

***

### onFocus()

> **onFocus**: () => `void`

Defined in: [overlay/Tooltip/Tooltip.tsx:34](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Tooltip/Tooltip.tsx#L34)

#### Returns

`void`

***

### onPointerEnter()

> **onPointerEnter**: () => `void`

Defined in: [overlay/Tooltip/Tooltip.tsx:32](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Tooltip/Tooltip.tsx#L32)

#### Returns

`void`

***

### onPointerLeave()

> **onPointerLeave**: () => `void`

Defined in: [overlay/Tooltip/Tooltip.tsx:33](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Tooltip/Tooltip.tsx#L33)

#### Returns

`void`

***

### ref()

> **ref**: (`node`) => `void`

Defined in: [overlay/Tooltip/Tooltip.tsx:20](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Tooltip/Tooltip.tsx#L20)

#### Parameters

##### node

`null` | `HTMLElement`

#### Returns

`void`

***

### tabIndex

> **tabIndex**: `0`

Defined in: [overlay/Tooltip/Tooltip.tsx:30](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Tooltip/Tooltip.tsx#L30)

Makes the trigger reachable by keyboard.

#### Remarks

Supplied because a tooltip that only opens on hover is a tooltip half the readers of a page
cannot see. A `<button>` is already focusable and setting this changes nothing for it; a `<span>`
or an `<svg>` is not, and without this its tooltip would never open. A consuming project added
`tabIndex={0}` at three separate call sites before noticing it was the same omission each time.
