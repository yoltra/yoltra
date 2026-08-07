[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / Textarea

# Function: Textarea()

> **Textarea**(`__namedParameters`): `Element`

Defined in: [primitives/Field.tsx:91](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Field.tsx#L91)

A multi-line text input. Resizes vertically only, so it cannot break a layout sideways.

## Parameters

### \_\_namedParameters

[`TextareaProps`](../interfaces/TextareaProps.md)

## Returns

`Element`

## Example

```tsx
<Textarea id="payload" rows={6} block defaultValue={JSON.stringify(event, null, 2)} />
```
