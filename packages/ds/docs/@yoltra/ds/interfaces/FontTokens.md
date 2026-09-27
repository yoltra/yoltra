![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / FontTokens

# Interface: FontTokens

Defined in: [tokens/tokens.ts:58](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/tokens.ts#L58)

## Properties

### family

> **family**: `object`

Defined in: [tokens/tokens.ts:59](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/tokens.ts#L59)

#### mono

> **mono**: `string`

#### sans

> **sans**: `string`

***

### text

> **text**: `object`

Defined in: [tokens/tokens.ts:70](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/tokens.ts#L70)

The type scale, one entry per role.

#### body

> **body**: [`FontStyleToken`](FontStyleToken.md)

#### bodyLg

> **bodyLg**: [`FontStyleToken`](FontStyleToken.md)

#### bodySm

> **bodySm**: [`FontStyleToken`](FontStyleToken.md)

#### button

> **button**: [`FontStyleToken`](FontStyleToken.md)

#### caption

> **caption**: [`FontStyleToken`](FontStyleToken.md)

#### code

> **code**: [`FontStyleToken`](FontStyleToken.md)

#### h1

> **h1**: [`FontStyleToken`](FontStyleToken.md)

#### h2

> **h2**: [`FontStyleToken`](FontStyleToken.md)

#### h3

> **h3**: [`FontStyleToken`](FontStyleToken.md)

#### h4

> **h4**: [`FontStyleToken`](FontStyleToken.md)

#### hero

> **hero**: [`FontStyleToken`](FontStyleToken.md)

#### label

> **label**: [`FontStyleToken`](FontStyleToken.md)

#### Remarks

Every axis is emitted separately (`--yl-text-h1-size`, `-weight`, `-leading`, `-tracking`)
rather than as a `font` shorthand. The shorthand resets properties it does not mention and
cannot be read one axis at a time, so a heading that wants this size at a different weight
would have to restate the whole thing, which is how the sizes came to be hardcoded in the
first place.
