![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / FormFieldProps

# Interface: FormFieldProps

Defined in: [primitives/Form.tsx:21](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Form.tsx#L21)

## Properties

### children()

> **children**: (`control`) => `ReactNode`

Defined in: [primitives/Form.tsx:38](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Form.tsx#L38)

#### Parameters

##### control

[`FieldControlProps`](FieldControlProps.md)

#### Returns

`ReactNode`

***

### error?

> `optional` **error**: `ReactNode`

Defined in: [primitives/Form.tsx:35](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Form.tsx#L35)

Validation message. Its presence is what marks the field invalid.

***

### hint?

> `optional` **hint**: `ReactNode`

Defined in: [primitives/Form.tsx:33](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Form.tsx#L33)

Guidance shown under the control, announced with it.

***

### id

> **id**: `string`

Defined in: [primitives/Form.tsx:30](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Form.tsx#L30)

Identifier for the control.

#### Remarks

Required rather than generated, because generating one needs `useId`, and a hook would
push this component behind the client entry for the sake of a string the caller almost
always has. On the client, pass `useId()`.

***

### label

> **label**: `ReactNode`

Defined in: [primitives/Form.tsx:31](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Form.tsx#L31)

***

### required?

> `optional` **required**: `boolean`

Defined in: [primitives/Form.tsx:37](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Form.tsx#L37)

Marks the control required, visually and to assistive technology.
