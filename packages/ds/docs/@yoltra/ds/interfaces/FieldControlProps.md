![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / FieldControlProps

# Interface: FieldControlProps

Defined in: [primitives/Form/Form.tsx:47](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Form/Form.tsx#L47)

What a field hands back for wiring a control.

## Remarks

Passed to [FormField](../functions/FormField.md)'s render function rather than injected by cloning the child.
Cloning looks tidier at the call site and breaks the moment a caller wraps their control in
anything — a fragment, a styled div, a component of their own — because the props land on
the wrapper instead of the input, and nothing reports it. Handing them over explicitly makes
the wiring visible and type-checked.

## Properties

### aria-describedby

> **aria-describedby**: `undefined` \| `string`

Defined in: [primitives/Form/Form.tsx:50](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Form/Form.tsx#L50)

Points at the hint and error text, so both are announced with the control.

***

### aria-invalid

> **aria-invalid**: `undefined` \| `boolean`

Defined in: [primitives/Form/Form.tsx:52](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Form/Form.tsx#L52)

`true` while the field has an error.

***

### id

> **id**: `string`

Defined in: [primitives/Form/Form.tsx:48](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Form/Form.tsx#L48)
