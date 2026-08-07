[**@yoltra/ds**](../../README.md)

***

[@yoltra/ds](../../README.md) / [client](../README.md) / ContextMenuProps

# Interface: ContextMenuProps

Defined in: [overlay/Popover.tsx:383](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L383)

## Extends

- `Omit`\<[`AnchoredSurfaceProps`](AnchoredSurfaceProps.md), `"open"`\>

## Properties

### at

> **at**: `null` \| [`Point`](Point.md)

Defined in: [overlay/Popover.tsx:391](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L391)

Where the menu opens, in viewport coordinates, or `null` when it is closed.

#### Remarks

A point rather than an element, because a context menu belongs to the pointer rather than to
anything on the page. Take it from a `contextmenu` event's `clientX`/`clientY`.

***

### children

> **children**: `ReactNode`

Defined in: [overlay/Popover.tsx:43](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L43)

#### Inherited from

[`AnchoredSurfaceProps`](AnchoredSurfaceProps.md).[`children`](AnchoredSurfaceProps.md#children)

***

### className?

> `optional` **className**: `string`

Defined in: [overlay/Popover.tsx:49](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L49)

#### Inherited from

[`AnchoredSurfaceProps`](AnchoredSurfaceProps.md).[`className`](AnchoredSurfaceProps.md#classname)

***

### container?

> `optional` **container**: `null` \| `HTMLElement`

Defined in: [overlay/Popover.tsx:48](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L48)

#### Inherited from

[`AnchoredSurfaceProps`](AnchoredSurfaceProps.md).[`container`](AnchoredSurfaceProps.md#container)

***

### label

> **label**: `string`

Defined in: [overlay/Popover.tsx:42](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L42)

The accessible name of the surface. Not rendered; these have no header to name them.

#### Inherited from

[`AnchoredSurfaceProps`](AnchoredSurfaceProps.md).[`label`](AnchoredSurfaceProps.md#label)

***

### offset?

> `optional` **offset**: `number`

Defined in: [overlay/Popover.tsx:47](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L47)

Gap between anchor and surface, in px.

#### Inherited from

[`AnchoredSurfaceProps`](AnchoredSurfaceProps.md).[`offset`](AnchoredSurfaceProps.md#offset)

***

### onClose()

> **onClose**: () => `void`

Defined in: [overlay/Popover.tsx:40](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L40)

#### Returns

`void`

#### Inherited from

[`AnchoredSurfaceProps`](AnchoredSurfaceProps.md).[`onClose`](AnchoredSurfaceProps.md#onclose)

***

### placement?

> `optional` **placement**: [`Placement`](../type-aliases/Placement.md)

Defined in: [overlay/Popover.tsx:45](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L45)

Preferred side and alignment. Flipped only if that side does not fit.

#### Inherited from

[`AnchoredSurfaceProps`](AnchoredSurfaceProps.md).[`placement`](AnchoredSurfaceProps.md#placement)
