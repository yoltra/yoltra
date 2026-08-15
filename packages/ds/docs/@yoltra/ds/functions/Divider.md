![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / Divider

# Function: Divider()

> **Divider**(`__namedParameters`): `Element`

Defined in: [primitives/Layout.tsx:286](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Layout.tsx#L286)

A rule between sections.

## Parameters

### \_\_namedParameters

[`DividerProps`](../interfaces/DividerProps.md)

## Returns

`Element`

## Remarks

Renders an `<hr>` when horizontal, which carries the separator semantics for free. A
vertical one is a `<div role="separator">` with `aria-orientation`, because `<hr>` is
defined as a thematic break in the flow of content and turning it on its side does not make
that true.

## Example

```tsx
<Divider />
<Inline gap={3}>
  <Text>Left</Text>
  <Divider orientation="vertical" />
  <Text>Right</Text>
</Inline>
```
