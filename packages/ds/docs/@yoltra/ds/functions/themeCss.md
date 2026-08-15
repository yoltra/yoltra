![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / themeCss

# Function: themeCss()

> **themeCss**(`options`): `string`

Defined in: [tokens/css.ts:136](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/tokens/css.ts#L136)

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

Variables only. Component styles are SASS, compiled to one stylesheet per component and
imported by the consumers that use them — a single sheet carrying every component's rules
is a cost every application pays regardless of what it imports, and unlike the JavaScript
it cannot be tree-shaken.

The same values ship as `@yoltra/ds/styles/tokens.css`, generated from this function at
build time. Prefer the file; use this when the stylesheet has to be inlined, as in a server
render.

Pair it with `@yoltra/ds/styles/base.css`, which sets the 10px root these lengths assume.

## Example

```tsx
// A server render, inlining the variables before first paint.
<style dangerouslySetInnerHTML={{ __html: themeCss() }} />
```
