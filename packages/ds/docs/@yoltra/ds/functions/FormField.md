[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / FormField

# Function: FormField()

> **FormField**(`__namedParameters`): `Element`

Defined in: [primitives/Form.tsx:62](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Form.tsx#L62)

A labelled control, with its hint and error wired to it.

## Parameters

### \_\_namedParameters

[`FormFieldProps`](../interfaces/FormFieldProps.md)

## Returns

`Element`

## Remarks

The wiring is the point. A hint sitting next to an input is invisible to a screen reader
unless something points at it, and an error announced only in colour is not announced at
all. This connects `label`, `aria-describedby` and `aria-invalid` so that a field cannot be
built half-accessible by accident.

The error is announced through a live region, so a message appearing after a failed submit
reaches a reader who has already moved past the field.

## Example

```tsx
<FormField id="host" label="Hub host" hint="Usually 127.0.0.1" error={errors.host}>
  {(control) => <Input {...control} name="host" block />}
</FormField>
```
