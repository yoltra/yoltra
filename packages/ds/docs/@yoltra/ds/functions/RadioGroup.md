[**@yoltra/ds**](../../../README.md)

***

[@yoltra/ds](../../../README.md) / [@yoltra/ds](../README.md) / RadioGroup

# Function: RadioGroup()

> **RadioGroup**(`__namedParameters`): `Element`

Defined in: [primitives/Form.tsx:242](https://github.com/yoltra/yoltra/blob/main/packages/ds/src/primitives/Form.tsx#L242)

A set of mutually exclusive options.

## Parameters

### \_\_namedParameters

[`RadioGroupProps`](../interfaces/RadioGroupProps.md)

## Returns

`Element`

## Remarks

A `<fieldset>` carrying `role="radiogroup"`, so the group is announced by name and the
options are understood as alternatives. Give every [Radio](Radio.md) inside it the same `name`.

## Example

```tsx
<RadioGroup legend="Theme">
  <Radio name="theme" value="light" label="Light" defaultChecked />
  <Radio name="theme" value="dark" label="Dark" />
</RadioGroup>
```
