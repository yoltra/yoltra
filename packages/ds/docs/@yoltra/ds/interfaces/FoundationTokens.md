![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / FoundationTokens

# Interface: FoundationTokens

Defined in: [tokens/tokens.ts:86](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/tokens.ts#L86)

## Properties

### borderWidth

> **borderWidth**: `object`

Defined in: [tokens/tokens.ts:124](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/tokens.ts#L124)

#### medium

> **medium**: `number`

#### none

> **none**: `number`

#### thick

> **thick**: `number`

#### thin

> **thin**: `number`

***

### breakpoints

> **breakpoints**: `object`

Defined in: [tokens/tokens.ts:101](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/tokens.ts#L101)

Mobile-first breakpoint scale (min-width, px). Layout is CSS-owned.

#### lg

> **lg**: `number`

#### md

> **md**: `number`

#### sm

> **sm**: `number`

#### xl

> **xl**: `number`

***

### container

> **container**: `object`

Defined in: [tokens/tokens.ts:110](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/tokens.ts#L110)

Content max-widths, stepping with the breakpoints.

#### lg

> **lg**: `number`

#### md

> **md**: `number`

#### xl

> **xl**: `number`

#### Remarks

Tokens because a measure is a design decision, not an implementation detail of one
container. Without them every application invents its own, and three of them disagreeing
about how wide a page is reads as three different products.

***

### elevation

> **elevation**: `Record`\<`"none"` \| `"xs"` \| `"sm"` \| `"md"` \| `"lg"` \| `"xl"`, `string`\>

Defined in: [tokens/tokens.ts:123](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/tokens.ts#L123)

Box-shadow values, keyed by height.

***

### font

> **font**: [`FontTokens`](FontTokens.md)

Defined in: [tokens/tokens.ts:87](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/tokens.ts#L87)

***

### fontNumeric

> **fontNumeric**: `string`

Defined in: [tokens/tokens.ts:98](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/tokens.ts#L98)

`font-variant-numeric` for figures that must not shift width between renders.

***

### fontWeight

> **fontWeight**: `object`

Defined in: [tokens/tokens.ts:96](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/tokens.ts#L96)

The weight ramp, independent of the type scale.

#### bold

> **bold**: `number`

#### extrabold

> **extrabold**: `number`

#### medium

> **medium**: `number`

#### regular

> **regular**: `number`

#### semibold

> **semibold**: `number`

#### Remarks

`font.text` fixes a weight per role, which is right for a heading and wrong for the case
where a caller wants body copy one step heavier. Naming the steps means that case does not
have to guess a number.

***

### motion

> **motion**: `object`

Defined in: [tokens/tokens.ts:137](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/tokens.ts#L137)

#### duration

> **duration**: `object`

##### duration.fast

> **fast**: `string`

##### duration.normal

> **normal**: `string`

##### duration.slow

> **slow**: `string`

#### easing

> **easing**: `object`

##### easing.decelerated

> **decelerated**: `string`

##### easing.emphasized

> **emphasized**: `string`

##### easing.standard

> **standard**: `string`

***

### palette

> **palette**: [`PaletteTokens`](PaletteTokens.md)

Defined in: [tokens/tokens.ts:99](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/tokens.ts#L99)

***

### radius

> **radius**: `object`

Defined in: [tokens/tokens.ts:112](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/tokens.ts#L112)

#### 2xl

> **2xl**: `number`

#### lg

> **lg**: `number`

#### md

> **md**: `number`

#### none

> **none**: `number`

#### round

> **round**: `number`

#### sm

> **sm**: `number`

#### xl

> **xl**: `number`

#### xs

> **xs**: `number`

***

### spacing

> **spacing**: `Record`\<`number`, `number`\>

Defined in: [tokens/tokens.ts:111](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/tokens.ts#L111)

***

### zIndex

> **zIndex**: `object`

Defined in: [tokens/tokens.ts:136](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/tokens.ts#L136)

Stacking order for portalled surfaces.

#### base

> **base**: `number`

#### overlay

> **overlay**: `number`

#### popover

> **popover**: `number`

#### sticky

> **sticky**: `number`

#### tooltip

> **tooltip**: `number`

#### Remarks

Overlays render into `document.body`, so they escape whatever stacking context they were
written inside and land in the document's. Their order then depends on nothing but these
numbers, which is why they are tokens rather than literals scattered across stylesheets.

The order encodes containment: a popover opened inside a dialog must sit above it, and a
tooltip describing that popover above them both.
