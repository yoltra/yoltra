![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / LinkProps

# Interface: LinkProps

Defined in: [primitives/Typography.tsx:91](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Typography.tsx#L91)

## Extends

- `AnchorHTMLAttributes`\<`HTMLAnchorElement`\>

## Properties

### children?

> `optional` **children**: `ReactNode`

Defined in: [primitives/Typography.tsx:101](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Typography.tsx#L101)

#### Overrides

`AnchorHTMLAttributes.children`

***

### external?

> `optional` **external**: `boolean`

Defined in: [primitives/Typography.tsx:100](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Typography.tsx#L100)

Marks the link as leaving the site.

#### Remarks

Adds `rel="noopener noreferrer"` alongside `target="_blank"`. Without `noopener` the opened
page can reach back through `window.opener`, which is a real hole rather than a lint
preference — so it is applied here instead of being left to each call site to remember.
