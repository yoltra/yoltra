![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / InlineCode

# Function: InlineCode()

> **InlineCode**(`__namedParameters`): `Element`

Defined in: [primitives/Typography.tsx:139](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Typography.tsx#L139)

Code inside a line of prose.

## Parameters

### \_\_namedParameters

`HTMLAttributes`\<`HTMLElement`\> & `object`

## Returns

`Element`

## Remarks

For a whole block, use `CodeBlock` from `@yoltra/ds/client` — it has a copy button and needs
browser APIs.

## Example

```tsx
<Text>Call <InlineCode>createStore(spec)</InlineCode> once, at start-up.</Text>
```
