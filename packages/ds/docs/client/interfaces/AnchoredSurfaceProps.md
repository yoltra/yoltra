![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../README.md)

***

[@yoltra/ds](../../README.md) / [client](../README.md) / AnchoredSurfaceProps

# Interface: AnchoredSurfaceProps

Defined in: [overlay/Popover.tsx:37](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L37)

Props shared by the anchored surfaces.

## Extended by

- [`MenuProps`](MenuProps.md)
- [`PopoverProps`](PopoverProps.md)

## Properties

### children

> **children**: `ReactNode`

Defined in: [overlay/Popover.tsx:43](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L43)

***

### className?

> `optional` **className**: `string`

Defined in: [overlay/Popover.tsx:49](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L49)

***

### container?

> `optional` **container**: `null` \| `HTMLElement`

Defined in: [overlay/Popover.tsx:48](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L48)

***

### label

> **label**: `string`

Defined in: [overlay/Popover.tsx:42](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L42)

The accessible name of the surface. Not rendered; these have no header to name them.

***

### offset?

> `optional` **offset**: `number`

Defined in: [overlay/Popover.tsx:47](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L47)

Gap between anchor and surface, in px.

***

### onClose()

> **onClose**: () => `void`

Defined in: [overlay/Popover.tsx:40](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L40)

#### Returns

`void`

***

### open

> **open**: `boolean`

Defined in: [overlay/Popover.tsx:39](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L39)

Whether the surface is on screen. Controlled, like the modal tier.

***

### placement?

> `optional` **placement**: [`Placement`](../type-aliases/Placement.md)

Defined in: [overlay/Popover.tsx:45](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L45)

Preferred side and alignment. Flipped only if that side does not fit.
