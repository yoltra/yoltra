[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / SliderProps

# Interface: SliderProps

Defined in: [primitives/Form.tsx:299](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Form.tsx#L299)

## Extends

- `Omit`\<`InputHTMLAttributes`\<`HTMLInputElement`\>, `"type"`\>

## Properties

### valueText?

> `optional` **valueText**: `string`

Defined in: [primitives/Form.tsx:307](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Form.tsx#L307)

Spoken form of the current value.

#### Remarks

Set it whenever the number alone does not carry the meaning — "3 of 5", "250 ms", "high".
Without it a reader hears the bare number, which for a scale like `0–4` says nothing.
