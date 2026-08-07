[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / FieldControlProps

# Interface: FieldControlProps

Defined in: [primitives/Form.tsx:13](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Form.tsx#L13)

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

Defined in: [primitives/Form.tsx:16](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Form.tsx#L16)

Points at the hint and error text, so both are announced with the control.

***

### aria-invalid

> **aria-invalid**: `undefined` \| `boolean`

Defined in: [primitives/Form.tsx:18](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Form.tsx#L18)

`true` while the field has an error.

***

### id

> **id**: `string`

Defined in: [primitives/Form.tsx:14](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Form.tsx#L14)
