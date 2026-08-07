[**@yoltra/ds**](../../README.md)

***

[@yoltra/ds](../../README.md) / [client](../README.md) / PlacementInput

# Interface: PlacementInput

Defined in: [overlay/placement.ts:32](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/placement.ts#L32)

## Properties

### anchor

> **anchor**: [`Rect`](Rect.md)

Defined in: [overlay/placement.ts:34](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/placement.ts#L34)

The element (or point) being anchored to. A point is a zero-sized rect.

***

### floating

> **floating**: `object`

Defined in: [overlay/placement.ts:36](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/placement.ts#L36)

The overlay's own measured size.

#### height

> **height**: `number`

#### width

> **width**: `number`

***

### offset?

> `optional` **offset**: `number`

Defined in: [overlay/placement.ts:40](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/placement.ts#L40)

Gap between anchor and overlay, in px.

***

### padding?

> `optional` **padding**: `number`

Defined in: [overlay/placement.ts:42](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/placement.ts#L42)

Minimum distance kept from the viewport edge, in px.

***

### placement

> **placement**: [`Placement`](../type-aliases/Placement.md)

Defined in: [overlay/placement.ts:38](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/placement.ts#L38)

***

### viewport

> **viewport**: `object`

Defined in: [overlay/placement.ts:37](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/overlay/placement.ts#L37)

#### height

> **height**: `number`

#### width

> **width**: `number`
