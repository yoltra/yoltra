![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../README.md)

***

[@yoltra/ds](../../README.md) / [client](../README.md) / CodeBlockProps

# Interface: CodeBlockProps

Defined in: [primitives/CodeBlock.tsx:5](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/CodeBlock.tsx#L5)

## Properties

### children?

> `optional` **children**: `ReactNode`

Defined in: [primitives/CodeBlock.tsx:16](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/CodeBlock.tsx#L16)

Pre-highlighted markup (e.g. Shiki output) to render instead of `code`.
When set, `code` is still used as the copy source.

***

### code?

> `optional` **code**: `string`

Defined in: [primitives/CodeBlock.tsx:7](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/CodeBlock.tsx#L7)

Raw code as a string. When provided it is used verbatim for copying.

***

### language?

> `optional` **language**: `string`

Defined in: [primitives/CodeBlock.tsx:9](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/CodeBlock.tsx#L9)

Optional language label shown in the header.

***

### title?

> `optional` **title**: `string`

Defined in: [primitives/CodeBlock.tsx:11](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/CodeBlock.tsx#L11)

Optional filename/title shown in the header.
