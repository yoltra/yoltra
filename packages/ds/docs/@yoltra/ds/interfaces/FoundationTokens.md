[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / FoundationTokens

# Interface: FoundationTokens

Defined in: [tokens/tokens.ts:66](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/tokens.ts#L66)

## Properties

### border

> **border**: `object`

Defined in: [tokens/tokens.ts:83](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/tokens.ts#L83)

#### width

> **width**: `object`

##### width.medium

> **medium**: `number`

##### width.none

> **none**: `0`

##### width.thick

> **thick**: `number`

##### width.thin

> **thin**: `number`

***

### breakpoints

> **breakpoints**: `object`

Defined in: [tokens/tokens.ts:70](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/tokens.ts#L70)

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

### elevation

> **elevation**: `Record`\<`"none"` \| `"xs"` \| `"sm"` \| `"md"` \| `"lg"` \| `"xl"`, \{ `boxShadow`: `string`; \}\>

Defined in: [tokens/tokens.ts:82](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/tokens.ts#L82)

***

### font

> **font**: [`FontTokens`](FontTokens.md)

Defined in: [tokens/tokens.ts:67](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/tokens.ts#L67)

***

### motion

> **motion**: `object`

Defined in: [tokens/tokens.ts:96](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/tokens.ts#L96)

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

Defined in: [tokens/tokens.ts:68](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/tokens.ts#L68)

***

### radius

> **radius**: `object`

Defined in: [tokens/tokens.ts:72](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/tokens.ts#L72)

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

Defined in: [tokens/tokens.ts:71](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/tokens.ts#L71)

***

### zIndex

> **zIndex**: `object`

Defined in: [tokens/tokens.ts:95](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/tokens.ts#L95)

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
numbers — which is why they are tokens rather than literals scattered across stylesheets.

The order encodes containment: a popover opened inside a dialog must sit above it, and a
tooltip describing that popover above them both.
