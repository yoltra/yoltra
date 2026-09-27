![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / SliderProps

# Interface: SliderProps

Defined in: [primitives/Form/Form.tsx:333](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Form/Form.tsx#L333)

## Extends

- `Omit`\<`InputHTMLAttributes`\<`HTMLInputElement`\>, `"type"`\>

## Properties

### valueText?

> `optional` **valueText**: `string`

Defined in: [primitives/Form/Form.tsx:341](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Form/Form.tsx#L341)

Spoken form of the current value.

#### Remarks

Set it whenever the number alone does not carry the meaning — "3 of 5", "250 ms", "high".
Without it a reader hears the bare number, which for a scale like `0–4` says nothing.
