![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / StatProps

# Interface: StatProps

Defined in: [primitives/Stat/Stat.tsx:6](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Stat/Stat.tsx#L6)

## Extends

- `HTMLAttributes`\<`HTMLDivElement`\>

## Properties

### hint?

> `optional` **hint**: `ReactNode`

Defined in: [primitives/Stat/Stat.tsx:23](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Stat/Stat.tsx#L23)

A qualifier under the figure: a period, a comparison, a unit.

***

### label

> **label**: `ReactNode`

Defined in: [primitives/Stat/Stat.tsx:8](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Stat/Stat.tsx#L8)

What the figure is.

***

### size?

> `optional` **size**: [`StatSize`](../type-aliases/StatSize.md)

Defined in: [primitives/Stat/Stat.tsx:24](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Stat/Stat.tsx#L24)

***

### value

> **value**: `ReactNode`

Defined in: [primitives/Stat/Stat.tsx:21](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Stat/Stat.tsx#L21)

The figure.

#### Remarks

A `ReactNode` rather than a number, and deliberately not formatted here: a count, a byte size
and a currency amount want different formatting, and a design system that picked one would be
wrong for the other two.

**Pass a real zero.** Rendering a dash for nought tells a reader the figure is *unavailable*
when it is simply none, and the two are different facts. A consuming project wrote that rule
down after getting it wrong.
