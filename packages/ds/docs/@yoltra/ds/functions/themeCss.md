![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / themeCss

# Function: themeCss()

> **themeCss**(`options`): `string`

Defined in: [tokens/css.ts:187](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/css.ts#L187)

The design tokens, as CSS custom properties.

## Parameters

### options

#### rootFontSize?

`boolean`

Emit the 62.5% root declaration alongside the variables.
`false` leaves it out, for an application that sets its own root; every `--yl-*` length is
then relative to whatever that is.

#### scoped?

`boolean`

Wrap the variables under `.yl-root` instead of `:root`, for an
application embedding Yoltra components inside a page it does not own.

## Returns

`string`

## Remarks

The same values ship as `@yoltra/ds/styles/tokens.css`, generated from this function at build
time. Prefer the file; use this when the stylesheet has to be inlined, as in a server render.

Pair it with `@yoltra/ds/styles/base.css`, which sets the 10px root these lengths assume.

The palette is deliberately absent. It is a primitive, and a stylesheet that reaches for
`primary[500]` has bypassed the semantic layer that makes a theme switch work.

## Example

```tsx
// A server render, inlining the variables before first paint.
<style dangerouslySetInnerHTML={{ __html: themeCss() }} />
```
