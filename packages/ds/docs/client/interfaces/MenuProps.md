[**@yoltra/ds**](../../README.md)

***

[@yoltra/ds](../../README.md) / [client](../README.md) / MenuProps

# Interface: MenuProps

Defined in: [overlay/Popover.tsx:316](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L316)

Props shared by the anchored surfaces.

## Extends

- [`AnchoredSurfaceProps`](AnchoredSurfaceProps.md)

## Properties

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

### open

> **open**: `boolean`

Defined in: [overlay/Popover.tsx:39](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L39)

Whether the surface is on screen. Controlled, like the modal tier.

#### Inherited from

[`AnchoredSurfaceProps`](AnchoredSurfaceProps.md).[`open`](AnchoredSurfaceProps.md#open)

***

### placement?

> `optional` **placement**: [`Placement`](../type-aliases/Placement.md)

Defined in: [overlay/Popover.tsx:45](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L45)

Preferred side and alignment. Flipped only if that side does not fit.

#### Inherited from

[`AnchoredSurfaceProps`](AnchoredSurfaceProps.md).[`placement`](AnchoredSurfaceProps.md#placement)

***

### trigger()

> **trigger**: (`props`) => `ReactNode`

Defined in: [overlay/Popover.tsx:317](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/Popover.tsx#L317)

#### Parameters

##### props

[`AnchoredTriggerProps`](AnchoredTriggerProps.md)

#### Returns

`ReactNode`
