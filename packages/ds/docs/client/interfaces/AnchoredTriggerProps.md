![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../README.md)

***

[@yoltra/ds](../../README.md) / [client](../README.md) / AnchoredTriggerProps

# Interface: AnchoredTriggerProps

Defined in: [overlay/Popover.tsx:29](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L29)

What a trigger has to carry for the overlay to be announced correctly.

## Remarks

Handed to the caller's `trigger` render prop rather than left to them to remember. Wiring
`aria-expanded` and `aria-controls` by hand is the step that gets skipped, and a screen reader
then describes a button that does nothing observable.

## Properties

### aria-controls

> **aria-controls**: `undefined` \| `string`

Defined in: [overlay/Popover.tsx:33](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L33)

***

### aria-expanded

> **aria-expanded**: `boolean`

Defined in: [overlay/Popover.tsx:31](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L31)

***

### aria-haspopup

> **aria-haspopup**: `"dialog"` \| `"menu"`

Defined in: [overlay/Popover.tsx:32](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L32)

***

### ref()

> **ref**: (`node`) => `void`

Defined in: [overlay/Popover.tsx:30](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L30)

#### Parameters

##### node

`null` | `HTMLElement`

#### Returns

`void`
