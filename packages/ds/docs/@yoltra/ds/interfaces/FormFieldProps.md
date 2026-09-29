![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / FormFieldProps

# Interface: FormFieldProps

Defined in: [primitives/Form/Form.tsx:55](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Form/Form.tsx#L55)

## Properties

### children()

> **children**: (`control`) => `ReactNode`

Defined in: [primitives/Form/Form.tsx:72](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Form/Form.tsx#L72)

#### Parameters

##### control

[`FieldControlProps`](FieldControlProps.md)

#### Returns

`ReactNode`

***

### error?

> `optional` **error**: `ReactNode`

Defined in: [primitives/Form/Form.tsx:69](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Form/Form.tsx#L69)

Validation message. Its presence is what marks the field invalid.

***

### hint?

> `optional` **hint**: `ReactNode`

Defined in: [primitives/Form/Form.tsx:67](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Form/Form.tsx#L67)

Guidance shown under the control, announced with it.

***

### id

> **id**: `string`

Defined in: [primitives/Form/Form.tsx:64](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Form/Form.tsx#L64)

Identifier for the control.

#### Remarks

Required rather than generated, because generating one needs `useId`, and a hook would
push this component behind the client entry for the sake of a string the caller almost
always has. On the client, pass `useId()`.

***

### label

> **label**: `ReactNode`

Defined in: [primitives/Form/Form.tsx:65](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Form/Form.tsx#L65)

***

### required?

> `optional` **required**: `boolean`

Defined in: [primitives/Form/Form.tsx:71](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Form/Form.tsx#L71)

Marks the control required, visually and to assistive technology.
